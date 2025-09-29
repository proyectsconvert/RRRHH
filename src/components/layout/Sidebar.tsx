import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Calendar, Database, File, Home, LogOut, MessageCircle, MessageSquare, Search, Settings, Users, Code, History, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader,SidebarMenuItem,SidebarMenu,SidebarMenuButton, } from '@/components/ui/sidebar';
import ConvertIALogo from '@/assets/convert-ia-logo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

const mainNavItems = [{
  icon: Home,
  label: 'Dashboard',
  href: '/admin/dashboard',
  module: 'dashboard'
}, {
  icon: UserCheck,
  label: 'Usuarios',
  href: '/admin/users',
  module: 'users'
}, {
  icon: Users,
  label: 'Candidatos',
  href: '/admin/candidates',
  module: 'candidates'
}, {
  icon: File,
  label: 'Vacantes',
  href: '/admin/jobs',
  module: 'jobs'
}, {
  icon: Calendar,
  label: 'Campañas',
  href: '/admin/campaigns',
  module: 'campaigns'
}, {
  icon: MessageCircle,
  label: 'Chatbot',
  href: '/admin/chatbot',
  module: 'chatbot'
}, {
  icon: MessageSquare,
  label: 'WhatsApp',
  href: '/admin/whatsapp',
  module: 'whatsapp'
}, {
  icon: Code,
  label: 'Códigos Entrenamiento',
  href: '/admin/training-codes',
  module: 'training'
}, {
  icon: Database,
  label: 'Reportes',
  href: '/admin/reports',
  module: 'reports'
}, {
  icon: History,
  label: 'Historial Entrenamientos',
  href: '/admin/training-history',
  module: 'training'
}, {
  icon: Settings,
  label: 'Configuración',
  href: '/admin/settings',
  module: 'settings'
}];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasModuleAccess, hasRole, userRoles, loading, userProfile } = usePermissions();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
      window.location.href = "/admin/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    }
  };
  return (
    <Sidebar collapsible="icon" className="border-r border-hrm-dark-cyan bg-hrm-dark-primary">
      <SidebarHeader className="h-14 border-b border-hrm-dark-cyan/40 bg-hrm-background2">
      <div className="flex items-center h-full px-4 justify-center group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:justify-center">
          <ConvertIALogo className="h-10" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-hrm-background2">
        {/* 👇 2. Envuelve tu navegación en los componentes SidebarMenu y SidebarMenuItem */}
        <SidebarMenu className="py-4">
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-400">Cargando permisos...</div>
          ) : (
            mainNavItems
              .filter(item => hasRole('admin') || hasModuleAccess(item.module))
              .map(item => (
                <SidebarMenuItem key={item.href}>
                  <NavLink to={item.href}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        isActive={isActive}
                        // 👇 3. Añade el tooltip aquí
                        tooltip={item.label}
                        className={cn(
                          isActive
                            ? "!bg-hrm-teal !text-white active:!bg-hrm-teal active:!text-white" 
                            : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white"
                        )}
                      >
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))
          )}
          {mainNavItems.filter(item => hasRole('admin') || hasModuleAccess(item.module)).length === 0 && !loading && (
             <div className="px-4 py-2 text-sm text-red-400">No tienes permisos...</div>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-hrm-dark-cyan/40 p-4 bg-hrm-background2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan">
              <span className="text-sm font-medium">
                {userProfile?.first_name && userProfile?.last_name
                  ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`
                  : userProfile?.email
                    ? userProfile.email.charAt(0).toUpperCase()
                    : 'U'
                }
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {userProfile?.first_name && userProfile?.last_name
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : userProfile?.first_name || userProfile?.last_name
                    ? (userProfile.first_name || userProfile.last_name)
                    : 'Usuario'
                }
              </p>
              <p className="text-xs text-gray-200">
                {userProfile?.email || 'Sin email'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center text-white hover:text-red-300 transition-colors" title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
