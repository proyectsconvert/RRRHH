import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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

interface PermissionData {
  userRoles: any[];
  userModules: UserModulePermission[];
  availableModules: Module[];
  userProfile: UserProfile | null;
  currentUser: any;
}

/**
 * Hook centralizado para gestionar permisos y perfiles de usuario.
 * Utiliza React Query para cachear los datos y evitar múltiples cargas
 * que causen parpadeos en la interfaz (spinners).
 */
export const usePermissions = () => {
  const fetchPermissions = async (): Promise<PermissionData> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        userRoles: [],
        userModules: [],
        availableModules: [],
        userProfile: null,
        currentUser: null,
      };
    }

    // Carga de perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Carga de módulos disponibles
    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    // Carga de roles del usuario
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    let userRoles: any[] = [];
    const roleIds = rolesData?.map(item => item.role_id) || [];

    if (roleIds.length > 0) {
      const { data: rolesDetails } = await supabase
        .from('roles')
        .select('id, name, display_name, description')
        .in('id', roleIds)
        .eq('is_active', true);

      userRoles = rolesDetails || [];
    }

    // Carga de permisos de módulos específicos
    const { data: modulePermsData } = await supabase
      .from('user_module_permissions')
      .select('module_name, has_access')
      .eq('user_id', user.id.toString());

    return {
      userRoles,
      userModules: modulePermsData || [],
      availableModules: modulesData || [],
      userProfile: profileData as UserProfile,
      currentUser: user,
    };
  };

  // Usamos React Query para cachear globalmente estos datos.
  // staleTime: Infinity asegura que no se re-intenten cargar automáticamente al cambiar de pestaña.
  // refetchOnWindowFocus: false (configurado en App.tsx) refuerza esto.
  const { data, isLoading: loading, refetch: refreshPermissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: fetchPermissions,
    staleTime: 1000 * 60 * 60, // 1 hora de validez
  });

  const permissionData = data || {
    userRoles: [],
    userModules: [],
    availableModules: [],
    userProfile: null,
    currentUser: null,
  };

  const { userRoles, userModules, availableModules, userProfile, currentUser } = permissionData;

  const hasPermission = (permissionName: string): boolean => {
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
    if (hasRole('admin')) return true;
    const modulePerm = userModules.find(m => m.module_name === moduleName);
    return modulePerm?.has_access || false;
  };

  const hasRole = (roleName: string): boolean => {
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
    return hasModuleAccess(moduleName);
  };

  const updateUserModulePermissions = async (userId: string, modulePermissions: { [key: string]: boolean }) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_module_permissions')
        .delete()
        .eq('user_id', userId.toString());

      if (deleteError) throw deleteError;

      const permissionsToInsert = Object.entries(modulePermissions).map(([moduleName, hasAccess]) => ({
        user_id: userId.toString(),
        module_name: moduleName,
        has_access: hasAccess
      }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_module_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      // Invalidamos la query para que se recarguen los datos
      await refreshPermissions();
      return { success: true };
    } catch (error) {
      console.error('Error updating module permissions:', error);
      return { success: false, error };
    }
  };

  // Escuchar cambios de autenticación para invalidar el cache
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        refreshPermissions();
      }
    });

    return () => subscription?.unsubscribe();
  }, [refreshPermissions]);

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
    refreshPermissions
  };
};