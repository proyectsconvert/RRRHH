import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Calendar, Database, File, Home, LogOut, MessageCircle, MessageSquare, Search, Settings, Users, Code, History, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuItem, SidebarMenu, SidebarMenuButton, } from '@/components/ui/sidebar';
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
  label: 'Reuniones',
  href: '/admin/reuniones',
  module: 'candidates'
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
    <Sidebar collapsible="icon" className="border-r border-border/60 bg-background/80 backdrop-blur-xl z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <SidebarContent className="bg-transparent px-2 mt-4">
        {/* 👇 2. Envuelve tu navegación en los componentes SidebarMenu y SidebarMenuItem */}
        <SidebarMenu className="py-2">
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
                        tooltip={item.label}
                        className={cn(
                          "transition-all duration-200 rounded-lg my-[2px] group/menu-btn h-9",
                          isActive
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow shadow-blue-500/20 active:bg-cyan-700 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-primary",
                          "group-data-[state=collapsed]:!w-10 group-data-[state=collapsed]:mx-auto group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:!p-0"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 transition-transform duration-200",
                          isActive ? "scale-110" : "group-hover/menu-btn:scale-110"
                        )} aria-hidden="true" />
                        <span className="group-data-[state=collapsed]:hidden tracking-wide">{item.label}</span>
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
      <SidebarFooter className="border-t border-border/50 p-3 bg-muted/20 group-data-[state=collapsed]:p-2 mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between group-data-[state=collapsed]:justify-center bg-background p-2 rounded-xl shadow-sm border border-border/50 group-data-[state=collapsed]:bg-transparent group-data-[state=collapsed]:shadow-none group-data-[state=collapsed]:border-0 h-12">
          <div className="flex items-center group-data-[state=collapsed]:justify-center w-full">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-sm font-bold tracking-wider">
                {userProfile?.first_name && userProfile?.last_name
                  ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`
                  : userProfile?.email
                    ? userProfile.email.charAt(0).toUpperCase()
                    : 'U'
                }
              </span>
            </div>
            <div className="ml-3 group-data-[state=collapsed]:hidden overflow-hidden flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {userProfile?.first_name && userProfile?.last_name
                  ? `${userProfile.first_name} ${userProfile.last_name}`
                  : userProfile?.first_name || userProfile?.last_name
                    ? (userProfile.first_name || userProfile.last_name)
                    : 'Usuario'
                }
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userProfile?.email || 'Sin email'}
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors group-data-[state=collapsed]:hidden ml-1 shrink-0" 
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-center text-[10px] text-muted-foreground/60 group-data-[state=collapsed]:hidden">
          v1.1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
