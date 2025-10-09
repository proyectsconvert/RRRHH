import React,{useState, useRef, useEffect} from 'react';
import { Bell, Search, ArrowLeftToLine, ArrowRightToLine  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

const NotificationsPanel = () => {
    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Notificaciones</h3>
        </div>
        <div className="p-4 text-center text-gray-500">
          {/* Aquí iría el listado de notificaciones */}
          <p>No tienes notificaciones nuevas.</p>
        </div>
        <div className="p-2 bg-gray-50 border-t text-center">
          <a href="#" className="text-sm font-medium text-gray-600 hover:underline">
            Ver todas
          </a>
        </div>
      </div>
    );
  };

const AdminHeader = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);
    const { open, toggleSidebar } = useSidebar();

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Si el ref existe y el clic no fue dentro de su área
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setShowNotifications(false);
            }
        };

        // Agregar el listener al documento
        document.addEventListener('mousedown', handleClickOutside);

        // Limpiar el listener cuando el componente se desmonte
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
        }, []); 

    

  return (
    <header className="h-14 border-b border-hrm-light-gray bg-white flex items-center justify-between ">
      {/* Contenedor para elementos a la izquierda */}
      <div className="flex items-center">
        
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleSidebar}
                    className="-ml-16"
                >
                    {open ? (
                        <ArrowLeftToLine className="h-5 w-5" />
                    ) : (
                        <ArrowRightToLine className="h-5 w-5" />
                    )}
                </Button>
        {/*

        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-8 rounded-md border-hrm-light-gray focus:border-hrm-steel-blue" />
        </div>
        */}

      </div>

      <div ref={notificationRef} className="flex items-center ml-auto relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotifications(!showNotifications)} // Toggle para mostrar/ocultar
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* Renderizado condicional del panel de notificaciones */}
        {showNotifications && <NotificationsPanel />}
      </div>
    </header>
  );

};



export default AdminHeader;