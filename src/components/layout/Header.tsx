import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationCenter from './NotificationCenter';
import { supabase } from '@/integrations/supabase/client';

const AdminHeader = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);

        // Get current user's role
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!userError && userProfile) {
          setCurrentUserRole(userProfile.role);
        }
      }
    };

    getCurrentUser();
  }, []);

  return (
    <header className="h-14 border-b border-hrm-light-gray bg-white flex items-center justify-between px-4">
      {/* Contenedor para elementos a la izquierda */}
      <div className="flex items-center gap-4">
        {/*

        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-8 rounded-md border-hrm-light-gray focus:border-hrm-steel-blue" />
        </div>
        */}

      </div>

      {/* Contenedor para elementos a la derecha */}
      <div className="flex items-center gap-4 ml-auto">
        <NotificationCenter
          currentUserId={currentUserId || undefined}
          currentUserRole={currentUserRole || undefined}
        />
      </div>
    </header>
  );

};



export default AdminHeader;