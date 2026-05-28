import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';
import Chatbot from '../chatbot/Chatbot';

const AdminLayout = () => {
  const location = useLocation();
  const esModuloWhatsapp = location.pathname.startsWith('/admin/whatsapp');
  
  const containerClasses = esModuloWhatsapp
  ? "p-4 md:p-6 lg:p-8 pl-0 pr-20" 
  : "p-4 md:p-6 lg:p-8";           

  return (
    <SidebarProvider open={false}>
      <AdminSidebar />
      <SidebarInset className="bg-background h-screen flex flex-col overflow-hidden">
        <AdminHeader/>
        <main className={cn(
          containerClasses,
          "flex-1 w-full animate-in fade-in duration-500 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar"
        )}>
          <div className="w-full mx-auto flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      <Chatbot userType="admin" />
    </SidebarProvider>
  );
};

export default AdminLayout;
