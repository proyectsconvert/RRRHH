import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import NotificationCenter from './NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import ConvertIALogo from '@/assets/convert-ia-logo';

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
    <header className="h-16 lg:h-20 bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10 mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300">
      {/* Contenedor para elementos a la izquierda */}
      <div className="flex items-center gap-4">
        {/* Logo placed here since sidebar is permanently collapsed */}
        <div className="flex items-center h-full">
          <ConvertIALogo className="h-8 drop-shadow-sm" />
        </div>
        
        {/*
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Buscar en la plataforma..." 
            className="pl-9 h-10 bg-slate-50/50 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl transition-all shadow-sm" 
          />
        </div>
        */}

      </div>

      {/* Contenedor para elementos a la derecha */}
      <div className="flex items-center gap-4 ml-auto">
        <ThemeToggle />
        <NotificationCenter
          currentUserId={currentUserId || undefined}
          currentUserRole={currentUserRole || undefined}
        />
      </div>
    </header>
  );

};



export default AdminHeader;