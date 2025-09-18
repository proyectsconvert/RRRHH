import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  requiredModule: string;
  fallbackPath?: string;
}

const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({
  children,
  requiredModule,
  fallbackPath = '/admin/dashboard'
}) => {
  const { hasModuleAccess, hasRole, loading, userProfile } = usePermissions();
  const location = useLocation();

  // Mostrar loading mientras se cargan los permisos
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hrm-dark-cyan"></div>
      </div>
    );
  }

  // Verificar si es admin (tiene acceso a todo)
  if (hasRole('admin')) {
    return <>{children}</>;
  }

  // Verificar si tiene acceso al módulo requerido
  if (!hasModuleAccess(requiredModule)) {
    console.warn(`Acceso denegado al módulo '${requiredModule}' para usuario:`, userProfile?.email);

    // Redirigir al módulo que sí tiene acceso, o al fallback
    const availableModules = [
      'dashboard', 'users', 'candidates', 'jobs', 'campaigns',
      'chatbot', 'whatsapp', 'training', 'reports', 'settings'
    ];

    // Buscar el primer módulo al que tenga acceso
    const accessibleModule = availableModules.find(module => hasModuleAccess(module));

    if (accessibleModule) {
      const redirectPath = `/admin/${accessibleModule === 'dashboard' ? 'dashboard' : accessibleModule}`;
      console.log(`Redirigiendo a módulo accesible: ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }

    // Si no tiene acceso a ningún módulo, redirigir al fallback
    return <Navigate to={fallbackPath} replace />;
  }

  // Tiene acceso, mostrar el componente
  return <>{children}</>;
};

export default ModuleProtectedRoute;