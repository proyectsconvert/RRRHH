
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from './Sidebar';
import AdminHeader from './Header';
import Chatbot from '../chatbot/Chatbot';

const AdminLayout = () => {
  // Get current location to help with preserving state
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false); 
  const esModuloWhatsapp = location.pathname.startsWith('/admin/whatsapp');
  
  const containerClasses = esModuloWhatsapp
  ? "p-6 pl-0 pr-20" 
  : "p-6";           

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        <div className="flex-1">
        <AdminHeader/>
          <main className={containerClasses}>
            <Outlet />
          </main>
        </div>
      </div>
      <Chatbot userType="admin" />
    </SidebarProvider>
  );
};

export default AdminLayout;
