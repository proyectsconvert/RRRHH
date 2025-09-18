import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
}

interface UserModulePermission {
  module_name: string;
  has_access: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  department?: string;
  is_active: boolean;
}

export const usePermissions = () => {
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [userModules, setUserModules] = useState<UserModulePermission[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setCurrentUser(null);
        setUserRoles([]);
        setUserModules([]);
        return;
      }

      if (!user) {
        setCurrentUser(null);
        setUserRoles([]);
        setUserModules([]);
        setUserProfile(null);
        return;
      }

      setCurrentUser(user);

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Error loading user profile:', profileError);
        setUserProfile(null);
      } else {
        setUserProfile(profileData);
      }

      // Load available modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (modulesError) {
        // If table doesn't exist yet, continue without error
        setAvailableModules([]);
      } else {
        setAvailableModules(modulesData || []);
      }

      // Load user roles (for backward compatibility and admin check)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rolesError) {
        // If roles table doesn't exist yet, continue without error
        setUserRoles([]);
      } else {
        const roleIds = rolesData?.map(item => item.role_id) || [];
        if (roleIds.length > 0) {
          const { data: rolesDetails, error: rolesDetailsError } = await supabase
            .from('roles')
            .select('id, name, display_name, description')
            .in('id', roleIds)
            .eq('is_active', true);

          if (rolesDetailsError) {
            setUserRoles([]);
          } else {
            setUserRoles(rolesDetails || []);
          }
        } else {
          setUserRoles([]);
        }
      }

      // Load user module permissions
      const { data: modulePermsData, error: modulePermsError } = await supabase
        .from('user_module_permissions')
        .select('module_name, has_access')
        .eq('user_id', user.id.toString());

      if (modulePermsError) {
        // If table doesn't exist yet, set empty permissions
        setUserModules([]);
      } else {
        setUserModules(modulePermsData || []);
      }

    } catch (error) {
      setUserRoles([]);
      setUserModules([]);
      setAvailableModules([]);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionName: string): boolean => {
    // For backward compatibility, map old permission names to module names
    const moduleMapping: { [key: string]: string } = {
      'dashboard.view': 'dashboard',
      'users.view': 'users',
      'candidates.view': 'candidates',
      'jobs.view': 'jobs',
      'campaigns.view': 'campaigns',
      'chatbot.view': 'chatbot',
      'whatsapp.view': 'whatsapp',
      'training.view': 'training',
      'reports.view': 'reports',
      'settings.view': 'settings'
    };

    const moduleName = moduleMapping[permissionName];
    if (!moduleName) return false;

    return hasModuleAccess(moduleName);
  };

  const hasModuleAccess = (moduleName: string): boolean => {
    // If user is admin, always has access
    if (hasRole('admin')) {
      return true;
    }

    // Check specific module permission
    const modulePerm = userModules.find(m => m.module_name === moduleName);
    return modulePerm?.has_access || false;
  };

  const hasRole = (roleName: string): boolean => {
    // TEMPORAL: Si es el usuario admin@empresa.com, forzar rol admin
    if (currentUser?.email === 'admin@empresa.com') {
      return roleName === 'admin';
    }

    return userRoles.some(role => role.name === roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(permissionName => hasPermission(permissionName));
  };

  const canAccessModule = (moduleName: string): boolean => {
    return hasModuleAccess(moduleName);
  };

  const canPerformAction = (moduleName: string, action: string): boolean => {
    // For now, if user has access to module, they can perform all actions
    return hasModuleAccess(moduleName);
  };

  const updateUserModulePermissions = async (userId: string, modulePermissions: { [key: string]: boolean }) => {
    try {
      // Delete existing permissions for this user
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId.toString());

      if (deleteError) {
        console.error('Error deleting existing permissions:', deleteError);
        throw deleteError;
      }

      // Insert new permissions
      const permissionsToInsert = Object.entries(modulePermissions).map(([moduleName, hasAccess]) => ({
        user_id: userId.toString(),
        module_name: moduleName,
        has_access: hasAccess
      }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          console.error('Error inserting new permissions:', insertError);
          throw insertError;
        }
      }

      // Reload permissions if updating current user
      if (currentUser?.id === userId) {
        await loadUserPermissions();
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating module permissions:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    loadUserPermissions();

    // Listen for auth changes but only when user actually changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        loadUserPermissions();
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return {
    userRoles,
    userModules,
    availableModules,
    loading,
    userProfile,
    hasPermission,
    hasModuleAccess,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    canAccessModule,
    canPerformAction,
    updateUserModulePermissions,
    refreshPermissions: loadUserPermissions
  };
};