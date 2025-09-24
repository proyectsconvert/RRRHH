import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX, Shield, Mail, Phone, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermissions } from '@/hooks/usePermissions';

// Types
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  modules?: { [key: string]: boolean };
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    position: '',
    department: '',
    selectedModules: {} as { [key: string]: boolean }
  });
  const { toast } = useToast();
  const { availableModules, updateUserModulePermissions } = usePermissions();

  // Load users with module permissions
  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false });

      if (usersError) {
        toast({
          title: "Error",
          description: `Error al cargar usuarios: ${usersError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Load module permissions for each user
      const usersWithModules = await Promise.all(
        (usersData || []).map(async (user) => {
          try {
            const { data: modulePerms, error: permsError } = await supabase
              .from('user_module_permissions')
              .select('module_name, has_access')
              .eq('user_id', user.id.toString());

            if (permsError) {
              console.warn('Error loading permissions for user', user.id, ':', permsError);
              return { ...user, modules: {} };
            }

            const modules: { [key: string]: boolean } = {};
            (modulePerms || []).forEach(perm => {
              modules[perm.module_name] = perm.has_access;
            });

            return { ...user, modules };
          } catch (error) {
            console.warn('Error processing user permissions for', user.id, ':', error);
            return { ...user, modules: {} };
          }
        })
      );

      setUsers(usersWithModules);

    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive"
      });
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      await loadUsers();
    } finally {
      setLoading(false);
    }
  };

  // Create new user with module permissions
  const createUser = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Email y contraseña son obligatorios",
        variant: "destructive"
      });
      return;
    }

    let createdUserId: string | null = null;

    try {
      setLoading(true);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario de autenticación');
      }

      createdUserId = authData.user.id;

      // Create or update profile - lógica simplificada
      console.log('Creating/updating profile for user:', authData.user.id);

      // Verificar si ya existe un perfil
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (checkError) {
        console.warn('Error checking existing profile:', checkError);
      }

      let profileData, profileError;

      if (existingProfile) {
        console.log('Profile already exists, updating it');

        // Actualizar perfil existente
        const updateResult = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            phone: formData.phone || null,
            position: formData.position || null,
            department: formData.department || null,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id)
          .select()
          .single();

        profileData = updateResult.data;
        profileError = updateResult.error;

        if (profileError) {
          console.error('Error updating existing profile:', profileError);
        } else {
          console.log('Existing profile updated successfully');
        }

      } else {
        console.log('Profile does not exist, creating new one');

        // Crear perfil nuevo
        const insertResult = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            phone: formData.phone || null,
            position: formData.position || null,
            department: formData.department || null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        profileData = insertResult.data;
        profileError = insertResult.error;

        if (profileError) {
          console.error('Error creating new profile:', profileError);
        } else {
          console.log('New profile created successfully');
        }
      }

      // Si aún hay error después de intentar crear/actualizar
      if (profileError) {
        console.error('Final profile error:', profileError);
        console.error('Profile error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });

        // Intentar limpiar el usuario auth si falló el perfil
        try {
          console.log('Attempting to clean up auth user after profile failure');
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn('Error signing out after profile creation failure:', signOutError);
        }
        throw new Error(`Error al crear/actualizar perfil: ${profileError.message}`);
      }

      console.log('Profile operation completed successfully:', profileData);

      // Assign module permissions (solo si hay módulos seleccionados)
      const hasSelectedModules = Object.values(formData.selectedModules).some(value => value === true);

      if (hasSelectedModules) {
        console.log('Assigning module permissions:', formData.selectedModules);
        const result = await updateUserModulePermissions(authData.user.id, formData.selectedModules);
        if (!result.success) {
          console.warn('Error assigning module permissions:', result.error);
          // No lanzamos error aquí para no detener la creación del usuario
          toast({
            title: "Advertencia",
            description: "Usuario creado pero hubo un problema con los permisos",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Usuario creado",
        description: `Usuario ${formData.email} creado exitosamente`,
      });

      setShowCreateDialog(false);
      resetForm();
      loadData();

    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      // Limpiar usuario creado si hubo error
      if (createdUserId) {
        try {
          console.log('Cleaning up failed user creation for ID:', createdUserId);
          await supabase.from('profiles').delete().eq('id', createdUserId);
          await supabase.from('user_module_permissions').delete().eq('user_id', createdUserId);
          console.log('Cleanup completed');
        } catch (cleanupError) {
          console.warn('Error cleaning up after failed user creation:', cleanupError);
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario';

      // Mostrar error pero NO cerrar el diálogo
      toast({
        title: "Error al crear usuario",
        description: errorMessage,
        variant: "destructive"
      });

      // Mantener el diálogo abierto para que el usuario pueda intentar de nuevo
      // No hacer setShowCreateDialog(false) aquí
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un usuario para actualizar",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          phone: formData.phone || null,
          position: formData.position || null,
          department: formData.department || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id.toString());

      if (profileError) {
        throw new Error(`Error al actualizar perfil: ${profileError.message}`);
      }

      // Update module permissions (solo si hay cambios)
      const hasSelectedModules = Object.values(formData.selectedModules).some(value => value === true);
      const hasAnyModules = Object.keys(formData.selectedModules).length > 0;

      if (hasAnyModules) {
        console.log('Updating module permissions:', formData.selectedModules);
        const result = await updateUserModulePermissions(selectedUser.id, formData.selectedModules);
        if (!result.success) {
          console.warn('Error updating module permissions:', result.error);
          toast({
            title: "Advertencia",
            description: "Perfil actualizado pero hubo un problema con los permisos",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });

      setShowEditDialog(false);
      resetForm();
      loadData();

    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar usuario';
      toast({
        title: "Error al actualizar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: isActive ? "Usuario desactivado" : "Usuario activado",
        description: `El usuario ha sido ${!isActive ? 'activado' : 'desactivado'} exitosamente`,
      });

      loadData();

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
        variant: "destructive"
      });
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

    try {
      setLoading(true);

      // Delete user module permissions first
      await supabase.from('user_module_permissions').delete().eq('user_id', userId);

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Error al eliminar perfil: ${profileError.message}`);
      }

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });

      loadData();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    // Initialize selectedModules with all available modules set to false
    const initialModules: { [key: string]: boolean } = {};
    availableModules.forEach(module => {
      initialModules[module.name] = false;
    });

    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      position: '',
      department: '',
      selectedModules: initialModules
    });
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);

    // Initialize selectedModules with all available modules
    const initialModules: { [key: string]: boolean } = {};
    availableModules.forEach(module => {
      initialModules[module.name] = user.modules?.[module.name] || false;
    });

    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      position: user.position || '',
      department: user.department || '',
      selectedModules: initialModules
    });
    setShowEditDialog(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize form when availableModules changes
  useEffect(() => {
    if (availableModules.length > 0 && !showCreateDialog && !showEditDialog) {
      resetForm();
    }
  }, [availableModules]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios y sus permisos de acceso a módulos</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? 'Cargando...' : 'Recargar'}
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Contraseña segura"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Juan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="Reclutador Senior"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="Recursos Humanos"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Permisos de Módulos</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                    {availableModules.map(module => (
                      <div key={module.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`module-${module.name}`}
                          checked={formData.selectedModules[module.name] || false}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              selectedModules: {
                                ...formData.selectedModules,
                                [module.name]: checked as boolean
                              }
                            });
                          }}
                        />
                        <Label htmlFor={`module-${module.name}`} className="text-sm">
                          {module.display_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={createUser} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios registrados en el sistema
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {user.first_name && user.last_name
                          ? `${user.first_name[0]}${user.last_name[0]}`
                          : user.email[0].toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : 'Sin nombre'
                          }
                        </h3>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {!user.is_active && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <Shield className="h-3 w-3" />
                            <span className="font-medium">Cuenta inactiva</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Creado: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>

                      {/* Show module permissions */}
                      {user.modules && Object.keys(user.modules).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(user.modules)
                            .filter(([_, hasAccess]) => hasAccess)
                            .map(([moduleName, _]) => {
                              const module = availableModules.find(m => m.name === moduleName);
                              return module ? (
                                <Badge key={moduleName} variant="outline" className="text-xs">
                                  {module.display_name}
                                </Badge>
                              ) : null;
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-first_name">Nombre</Label>
              <Input
                id="edit-first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-last_name">Apellido</Label>
              <Input
                id="edit-last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-position">Cargo</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-department">Departamento</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Permisos de Módulos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                {availableModules.map(module => (
                  <div key={module.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-module-${module.name}`}
                      checked={formData.selectedModules[module.name] || false}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          selectedModules: {
                            ...formData.selectedModules,
                            [module.name]: checked as boolean
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`edit-module-${module.name}`} className="text-sm">
                      {module.display_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={updateUser} disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Usuario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;