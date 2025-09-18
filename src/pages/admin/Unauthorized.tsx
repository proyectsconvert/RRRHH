import React from 'react';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { userProfile, hasModuleAccess } = usePermissions();

  // Encontrar el primer módulo al que tiene acceso
  const availableModules = [
    'dashboard', 'users', 'candidates', 'jobs', 'campaigns',
    'chatbot', 'whatsapp', 'training', 'reports', 'settings'
  ];

  const accessibleModule = availableModules.find(module => hasModuleAccess(module));
  const redirectPath = accessibleModule ? `/admin/${accessibleModule === 'dashboard' ? 'dashboard' : accessibleModule}` : '/admin/dashboard';

  const handleGoToAllowedModule = () => {
    navigate(redirectPath);
  };

  const handleGoHome = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Acceso Denegado
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No tienes permisos para acceder a esta sección del sistema.
          </p>

          {userProfile && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Usuario:</strong> {userProfile.first_name && userProfile.last_name
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : userProfile.email}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {userProfile.email}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Contacta al administrador si crees que esto es un error.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            {accessibleModule && (
              <Button onClick={handleGoToAllowedModule} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir a {accessibleModule === 'dashboard' ? 'Dashboard' : accessibleModule}
              </Button>
            )}

            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;