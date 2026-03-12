commit 4234170a593872c37179282103ec24d43f9844d7
Author: proyectsconvert <proyectosconvert@gmail.com>
Date:   Wed Feb 18 16:20:02 2026 -0500

    creaci├│n de reuniones, arreglo de la barra de navegaci├│n

diff --git a/src/components/layout/Sidebar.tsx b/src/components/layout/Sidebar.tsx
index 575a013..ebcc492 100644
--- a/src/components/layout/Sidebar.tsx
+++ b/src/components/layout/Sidebar.tsx
@@ -2,7 +2,7 @@ import React from 'react';
 import { NavLink, Link, useNavigate } from 'react-router-dom';
 import { Calendar, Database, File, Home, LogOut, MessageCircle, MessageSquare, Search, Settings, Users, Code, History, UserCheck } from 'lucide-react';
 import { cn } from '@/lib/utils';
-import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader,SidebarMenuItem,SidebarMenu,SidebarMenuButton, } from '@/components/ui/sidebar';
+import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuItem, SidebarMenu, SidebarMenuButton, } from '@/components/ui/sidebar';
 import ConvertIALogo from '@/assets/convert-ia-logo';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
@@ -28,6 +28,11 @@ const mainNavItems = [{
   label: 'Vacantes',
   href: '/admin/jobs',
   module: 'jobs'
+}, {
+  icon: Calendar,
+  label: 'Reuniones',
+  href: '/admin/reuniones',
+  module: 'candidates'
 }, {
   icon: Calendar,
   label: 'Campa├▒as',
@@ -89,8 +94,8 @@ const AdminSidebar = () => {
   return (
     <Sidebar collapsible="icon" className="border-r border-hrm-dark-cyan bg-hrm-dark-primary">
       <SidebarHeader className="h-14 border-b border-hrm-dark-cyan/40 bg-hrm-background2">
-      <div className="flex items-center h-full px-4 justify-center group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:justify-center">
-          <ConvertIALogo className="h-10" />
+        <div className="flex items-center h-full px-4 group-data-[state=collapsed]:px-0 justify-center">
+          <ConvertIALogo className="h-10 group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:overflow-hidden" />
         </div>
       </SidebarHeader>
       <SidebarContent className="bg-hrm-background2">
@@ -111,12 +116,13 @@ const AdminSidebar = () => {
                         tooltip={item.label}
                         className={cn(
                           isActive
-                            ? "!bg-hrm-teal !text-white active:!bg-hrm-teal active:!text-white" 
-                            : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white"
+                            ? "!bg-hrm-teal !text-white active:!bg-hrm-teal active:!text-white"
+                            : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white",
+                          "group-data-[state=collapsed]:!w-full group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:!p-0"
                         )}
                       >
                         <item.icon className="h-5 w-5" aria-hidden="true" />
-                        <span>{item.label}</span>
+                        <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                       </SidebarMenuButton>
                     )}
                   </NavLink>
@@ -124,14 +130,14 @@ const AdminSidebar = () => {
               ))
           )}
           {mainNavItems.filter(item => hasRole('admin') || hasModuleAccess(item.module)).length === 0 && !loading && (
-             <div className="px-4 py-2 text-sm text-red-400">No tienes permisos...</div>
+            <div className="px-4 py-2 text-sm text-red-400">No tienes permisos...</div>
           )}
         </SidebarMenu>
       </SidebarContent>
-      <SidebarFooter className="border-t border-hrm-dark-cyan/40 p-4 bg-hrm-background2">
-        <div className="flex items-center justify-between">
-          <div className="flex items-center">
-            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan">
+      <SidebarFooter className="border-t border-hrm-dark-cyan/40 p-4 bg-hrm-background2 group-data-[state=collapsed]:p-2">
+        <div className="flex items-center justify-between group-data-[state=collapsed]:justify-center">
+          <div className="flex items-center group-data-[state=collapsed]:justify-center">
+            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan shrink-0">
               <span className="text-sm font-medium">
                 {userProfile?.first_name && userProfile?.last_name
                   ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`
@@ -141,8 +147,8 @@ const AdminSidebar = () => {
                 }
               </span>
             </div>
-            <div className="ml-3">
-              <p className="text-sm font-medium text-white">
+            <div className="ml-3 group-data-[state=collapsed]:hidden">
+              <p className="text-sm font-medium text-white truncate max-w-[120px]">
                 {userProfile?.first_name && userProfile?.last_name
                   ? `${userProfile.first_name} ${userProfile.last_name}`
                   : userProfile?.first_name || userProfile?.last_name
@@ -150,12 +156,12 @@ const AdminSidebar = () => {
                     : 'Usuario'
                 }
               </p>
-              <p className="text-xs text-gray-200">
+              <p className="text-xs text-gray-200 truncate max-w-[120px]">
                 {userProfile?.email || 'Sin email'}
               </p>
             </div>
           </div>
-          <button onClick={handleLogout} className="flex items-center text-white hover:text-red-300 transition-colors" title="Cerrar sesi├│n">
+          <button onClick={handleLogout} className="flex items-center text-white hover:text-red-300 transition-colors group-data-[state=collapsed]:hidden" title="Cerrar sesi├│n">
             <LogOut className="h-5 w-5" />
           </button>
         </div>

commit cd3f571b4d0c8abdf954aa658e4940b212676c8e
Author: proyectosconvert <proyectosconvert@gmail.com>
Date:   Mon Sep 29 15:17:28 2025 +0000

    a├▒adi barra de busqueda en ws, y pesta├▒a contratados

diff --git a/src/components/layout/Sidebar.tsx b/src/components/layout/Sidebar.tsx
index 9de7633..575a013 100644
--- a/src/components/layout/Sidebar.tsx
+++ b/src/components/layout/Sidebar.tsx
@@ -2,7 +2,7 @@ import React from 'react';
 import { NavLink, Link, useNavigate } from 'react-router-dom';
 import { Calendar, Database, File, Home, LogOut, MessageCircle, MessageSquare, Search, Settings, Users, Code, History, UserCheck } from 'lucide-react';
 import { cn } from '@/lib/utils';
-import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
+import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader,SidebarMenuItem,SidebarMenu,SidebarMenuButton, } from '@/components/ui/sidebar';
 import ConvertIALogo from '@/assets/convert-ia-logo';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
@@ -87,53 +87,46 @@ const AdminSidebar = () => {
     }
   };
   return (
-    <Sidebar className="border-r border-hrm-dark-cyan bg-hrm-dark-primary">
+    <Sidebar collapsible="icon" className="border-r border-hrm-dark-cyan bg-hrm-dark-primary">
       <SidebarHeader className="h-14 border-b border-hrm-dark-cyan/40 bg-hrm-background2">
-        <div className="flex items-center justify-center h-full px-4">
+      <div className="flex items-center h-full px-4 justify-center group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:justify-center">
           <ConvertIALogo className="h-10" />
         </div>
       </SidebarHeader>
       <SidebarContent className="bg-hrm-background2">
-        <nav className="space-y-1 py-4">
+        {/* ­ƒæç 2. Envuelve tu navegaci├│n en los componentes SidebarMenu y SidebarMenuItem */}
+        <SidebarMenu className="py-4">
           {loading ? (
             <div className="px-4 py-2 text-sm text-gray-400">Cargando permisos...</div>
           ) : (
             mainNavItems
-              .filter(item => {
-                const hasAdminRole = hasRole('admin');
-
-                // Si es admin, mostrar todo
-                if (hasAdminRole) {
-                  return true;
-                }
-
-                // Si no es admin, verificar permisos espec├¡ficos del m├│dulo
-                return hasModuleAccess(item.module);
-              })
+              .filter(item => hasRole('admin') || hasModuleAccess(item.module))
               .map(item => (
-                <NavLink
-                  key={item.href}
-                  to={item.href}
-                  className={({ isActive }) =>
-                    cn(
-                      "flex items-center px-4 py-2 text-sm font-medium rounded-md",
-                      isActive
-                        ? "bg-opacity-20 bg-white text-white"
-                        : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white"
-                    )
-                  }
-                >
-                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
-                  {item.label}
-                </NavLink>
+                <SidebarMenuItem key={item.href}>
+                  <NavLink to={item.href}>
+                    {({ isActive }) => (
+                      <SidebarMenuButton
+                        isActive={isActive}
+                        // ­ƒæç 3. A├▒ade el tooltip aqu├¡
+                        tooltip={item.label}
+                        className={cn(
+                          isActive
+                            ? "!bg-hrm-teal !text-white active:!bg-hrm-teal active:!text-white" 
+                            : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white"
+                        )}
+                      >
+                        <item.icon className="h-5 w-5" aria-hidden="true" />
+                        <span>{item.label}</span>
+                      </SidebarMenuButton>
+                    )}
+                  </NavLink>
+                </SidebarMenuItem>
               ))
           )}
           {mainNavItems.filter(item => hasRole('admin') || hasModuleAccess(item.module)).length === 0 && !loading && (
-            <div className="px-4 py-2 text-sm text-red-400">
-              No tienes permisos para ver ning├║n m├│dulo
-            </div>
+             <div className="px-4 py-2 text-sm text-red-400">No tienes permisos...</div>
           )}
-        </nav>
+        </SidebarMenu>
       </SidebarContent>
       <SidebarFooter className="border-t border-hrm-dark-cyan/40 p-4 bg-hrm-background2">
         <div className="flex items-center justify-between">

commit 3db7109e9d5f9ae3a11ea30c5c6519f7da2a6c28
Merge: 22e8f77 3af0adb
Author: proyectsconvert <proyectosconvert@gmail.com>
Date:   Thu Sep 18 15:00:16 2025 -0500

    Merge branch 'frontend' into backend-vo1

commit 22e8f7772dc97c6d08c84f95f2e03705f152c4db
Author: proyectsconvert <proyectosconvert@gmail.com>
Date:   Thu Sep 18 14:51:41 2025 -0500

    Back para apartado de whatsapp y creaci├│n de usuarios con seguridad JWT, roles y modulos seleccionables

diff --git a/src/components/layout/Sidebar.tsx b/src/components/layout/Sidebar.tsx
index e28bdab..9e4c3e3 100644
--- a/src/components/layout/Sidebar.tsx
+++ b/src/components/layout/Sidebar.tsx
@@ -1,55 +1,75 @@
 import React from 'react';
 import { NavLink, Link, useNavigate } from 'react-router-dom';
-import { Calendar, Database, File, Home, LogOut, MessageCircle, Search, Settings, Users, Code, History } from 'lucide-react';
+import { Calendar, Database, File, Home, LogOut, MessageCircle, MessageSquare, Search, Settings, Users, Code, History, UserCheck } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
 import ConvertIALogo from '@/assets/convert-ia-logo';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
+import { usePermissions } from '@/hooks/usePermissions';
 
 const mainNavItems = [{
   icon: Home,
   label: 'Dashboard',
-  href: '/admin/dashboard'
+  href: '/admin/dashboard',
+  module: 'dashboard'
+}, {
+  icon: UserCheck,
+  label: 'Usuarios',
+  href: '/admin/users',
+  module: 'users'
 }, {
   icon: Users,
   label: 'Candidatos',
-  href: '/admin/candidates'
+  href: '/admin/candidates',
+  module: 'candidates'
 }, {
   icon: File,
   label: 'Vacantes',
-  href: '/admin/jobs'
+  href: '/admin/jobs',
+  module: 'jobs'
 }, {
   icon: Calendar,
   label: 'Campa├▒as',
-  href: '/admin/campaigns'
+  href: '/admin/campaigns',
+  module: 'campaigns'
 }, {
   icon: MessageCircle,
   label: 'Chatbot',
-  href: '/admin/chatbot'
+  href: '/admin/chatbot',
+  module: 'chatbot'
+}, {
+  icon: MessageSquare,
+  label: 'WhatsApp',
+  href: '/admin/whatsapp',
+  module: 'whatsapp'
 }, {
   icon: Code,
   label: 'C├│digos Entrenamiento',
-  href: '/admin/training-codes'
+  href: '/admin/training-codes',
+  module: 'training'
 }, {
   icon: Database,
   label: 'Reportes',
-  href: '/admin/reports'
+  href: '/admin/reports',
+  module: 'reports'
 }, {
   icon: History,
   label: 'Historial Entrenamientos',
-  href: '/admin/training-history'
+  href: '/admin/training-history',
+  module: 'training'
 }, {
   icon: Settings,
   label: 'Configuraci├│n',
-  href: '/admin/settings'
+  href: '/admin/settings',
+  module: 'settings'
 }];
 
 const AdminSidebar = () => {
   const navigate = useNavigate();
-  const {
-    toast
-  } = useToast();
+  const { toast } = useToast();
+  const { hasModuleAccess, hasRole, userRoles, loading, userProfile } = usePermissions();
+
   const handleLogout = async () => {
     try {
       await supabase.auth.signOut();
@@ -59,7 +79,6 @@ const AdminSidebar = () => {
       });
       window.location.href = "/admin/login";
     } catch (error) {
-      console.error('Error al cerrar sesi├│n:', error);
       toast({
         title: "Error",
         description: "No se pudo cerrar la sesi├│n",
@@ -76,23 +95,71 @@ const AdminSidebar = () => {
       </SidebarHeader>
       <SidebarContent className="bg-teal-950">
         <nav className="space-y-1 py-4">
-          {mainNavItems.map(item => <NavLink key={item.href} to={item.href} className={({
-          isActive
-        }) => cn("flex items-center px-4 py-2 text-sm font-medium rounded-md", isActive ? "bg-opacity-20 bg-white text-white" : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white")}>
-              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
-              {item.label}
-            </NavLink>)}
+          {loading ? (
+            <div className="px-4 py-2 text-sm text-gray-400">Cargando permisos...</div>
+          ) : (
+            mainNavItems
+              .filter(item => {
+                const hasAdminRole = hasRole('admin');
+
+                // Si es admin, mostrar todo
+                if (hasAdminRole) {
+                  return true;
+                }
+
+                // Si no es admin, verificar permisos espec├¡ficos del m├│dulo
+                return hasModuleAccess(item.module);
+              })
+              .map(item => (
+                <NavLink
+                  key={item.href}
+                  to={item.href}
+                  className={({ isActive }) =>
+                    cn(
+                      "flex items-center px-4 py-2 text-sm font-medium rounded-md",
+                      isActive
+                        ? "bg-opacity-20 bg-white text-white"
+                        : "text-gray-100 hover:bg-opacity-10 hover:bg-white hover:text-white"
+                    )
+                  }
+                >
+                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
+                  {item.label}
+                </NavLink>
+              ))
+          )}
+          {mainNavItems.filter(item => hasRole('admin') || hasModuleAccess(item.module)).length === 0 && !loading && (
+            <div className="px-4 py-2 text-sm text-red-400">
+              No tienes permisos para ver ning├║n m├│dulo
+            </div>
+          )}
         </nav>
       </SidebarContent>
       <SidebarFooter className="border-t border-hrm-light-gray/20 p-4 bg-teal-950">
         <div className="flex items-center justify-between">
           <div className="flex items-center">
             <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan">
-              <span className="text-sm font-medium">A</span>
+              <span className="text-sm font-medium">
+                {userProfile?.first_name && userProfile?.last_name
+                  ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`
+                  : userProfile?.email
+                    ? userProfile.email.charAt(0).toUpperCase()
+                    : 'U'
+                }
+              </span>
             </div>
             <div className="ml-3">
-              <p className="text-sm font-medium text-white">Admin</p>
-              <p className="text-xs text-gray-200">Administrador</p>
+              <p className="text-sm font-medium text-white">
+                {userProfile?.first_name && userProfile?.last_name
+                  ? `${userProfile.first_name} ${userProfile.last_name}`
+                  : userProfile?.first_name || userProfile?.last_name
+                    ? (userProfile.first_name || userProfile.last_name)
+                    : 'Usuario'
+                }
+              </p>
+              <p className="text-xs text-gray-200">
+                {userProfile?.email || 'Sin email'}
+              </p>
             </div>
           </div>
           <button onClick={handleLogout} className="flex items-center text-white hover:text-red-300 transition-colors" title="Cerrar sesi├│n">

commit 3af0adb62db76560718d20fabecaf10873f7dd19
Author: proyectosconvert <proyectosconvert@gmail.com>
Date:   Thu Sep 18 13:39:09 2025 +0000

    a├▒adi columna vacante, pesta├▒as de sin revisar - en proceso - en formacion - descartados, botones aparecen al usar las checkboxes, filtros funcionales

diff --git a/src/components/layout/Sidebar.tsx b/src/components/layout/Sidebar.tsx
index e28bdab..496e16b 100644
--- a/src/components/layout/Sidebar.tsx
+++ b/src/components/layout/Sidebar.tsx
@@ -68,13 +68,13 @@ const AdminSidebar = () => {
     }
   };
   return (
-    <Sidebar className="border-r border-hrm-light-gray bg-hrm-dark-cyan">
-      <SidebarHeader className="h-14 border-b border-hrm-light-gray/20 bg-teal-950">
+    <Sidebar className="border-r border-hrm-dark-cyan bg-hrm-dark-primary">
+      <SidebarHeader className="h-14 border-b border-hrm-dark-cyan/40 bg-hrm-background2">
         <div className="flex items-center justify-center h-full px-4">
           <ConvertIALogo className="h-10" />
         </div>
       </SidebarHeader>
-      <SidebarContent className="bg-teal-950">
+      <SidebarContent className="bg-hrm-background2">
         <nav className="space-y-1 py-4">
           {mainNavItems.map(item => <NavLink key={item.href} to={item.href} className={({
           isActive
@@ -84,7 +84,7 @@ const AdminSidebar = () => {
             </NavLink>)}
         </nav>
       </SidebarContent>
-      <SidebarFooter className="border-t border-hrm-light-gray/20 p-4 bg-teal-950">
+      <SidebarFooter className="border-t border-hrm-dark-cyan/40 p-4 bg-hrm-background2">
         <div className="flex items-center justify-between">
           <div className="flex items-center">
             <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-hrm-dark-cyan">
