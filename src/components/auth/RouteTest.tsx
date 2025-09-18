import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RouteTest = () => {
  const {
    userProfile,
    userRoles,
    userModules,
    availableModules,
    hasModuleAccess,
    hasRole,
    loading
  } = usePermissions();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Test de Permisos y Rutas</h1>

      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {userProfile ? (
            <div>
              <p><strong>Nombre:</strong> {userProfile.first_name} {userProfile.last_name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>ID:</strong> {userProfile.id}</p>
            </div>
          ) : (
            <p>No hay información de perfil</p>
          )}
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {userRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userRoles.map(role => (
                <Badge key={role.id} variant="secondary">
                  {role.display_name} ({role.name})
                </Badge>
              ))}
            </div>
          ) : (
            <p>No hay roles asignados</p>
          )}
        </CardContent>
      </Card>

      {/* Módulos Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {availableModules.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {availableModules.map(module => (
                <div key={module.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{module.display_name}</span>
                  <Badge variant={hasModuleAccess(module.name) ? "default" : "secondary"}>
                    {hasModuleAccess(module.name) ? "Acceso" : "Sin Acceso"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay módulos disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* Permisos de Usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos Específicos</CardTitle>
        </CardHeader>
        <CardContent>
          {userModules.length > 0 ? (
            <div className="space-y-2">
              {userModules.map(perm => (
                <div key={perm.module_name} className="flex items-center justify-between">
                  <span>{perm.module_name}</span>
                  <Badge variant={perm.has_access ? "default" : "destructive"}>
                    {perm.has_access ? "Habilitado" : "Deshabilitado"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay permisos específicos</p>
          )}
        </CardContent>
      </Card>

      {/* Test de Acceso a Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Test de Acceso a Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Módulos con Acceso:</h3>
              <ul className="space-y-1">
                {['dashboard', 'users', 'candidates', 'jobs', 'campaigns', 'chatbot', 'whatsapp', 'training', 'reports', 'settings']
                  .filter(module => hasModuleAccess(module))
                  .map(module => (
                    <li key={module} className="text-green-600">✅ {module}</li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Módulos Sin Acceso:</h3>
              <ul className="space-y-1">
                {['dashboard', 'users', 'candidates', 'jobs', 'campaigns', 'chatbot', 'whatsapp', 'training', 'reports', 'settings']
                  .filter(module => !hasModuleAccess(module))
                  .map(module => (
                    <li key={module} className="text-red-600">❌ {module}</li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteTest;