
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, Users, Shield, Bell, 
  Globe, Palette, Database, Key
} from "lucide-react";

interface SystemConfig {
  company_name: string;
  language: string;
  theme: string;
  email_notifications: boolean;
  settings: any;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  permissions: string[];
}

export default function Configuracion() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sistema');
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    company_name: 'CONVERT-IA Reclutamiento',
    language: 'es',
    theme: 'system',
    email_notifications: true,
    settings: {}
  });

  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  useEffect(() => {
    loadSystemConfig();
    loadUserRoles();
  }, []);

  const loadSystemConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSystemConfig(data);
      }
    } catch (error) {
      console.error('Error loading system config:', error);
    }
  };

  const loadUserRoles = async () => {
    try {
      // Esta función necesitaría una tabla de roles de usuario
      // Por ahora simulamos datos
      setUserRoles([
        { id: '1', user_id: 'user1', role: 'admin', permissions: ['all'] },
        { id: '2', user_id: 'user2', role: 'manager', permissions: ['read', 'write'] },
        { id: '3', user_id: 'user3', role: 'user', permissions: ['read'] }
      ]);
    } catch (error) {
      console.error('Error loading user roles:', error);
    }
  };

  const saveSystemConfig = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('system_settings')
        .upsert(systemConfig);

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente"
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Aquí se crearía el usuario y se asignaría el rol
      // Por ahora simulamos la acción
      
      toast({
        title: "Usuario creado",
        description: `Usuario ${newUserEmail} creado con rol ${newUserRole}`
      });

      setNewUserEmail('');
      setNewUserRole('user');
      loadUserRoles();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Actualizar rol del usuario
      toast({
        title: "Rol actualizado",
        description: `Rol del usuario actualizado a ${newRole}`
      });
      loadUserRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive"
      });
    }
  };

  const tabs = [
    { id: 'sistema', title: 'Sistema General', icon: Settings },
    { id: 'usuarios', title: 'Usuarios y Roles', icon: Users },
    { id: 'permisos', title: 'Permisos', icon: Shield },
    { id: 'notificaciones', title: 'Notificaciones', icon: Bell }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8 text-gray-600" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 mt-1">
            Administración general, usuarios, roles y preferencias del sistema
          </p>
        </div>
        <Button onClick={saveSystemConfig} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-gray-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sistema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa</Label>
                <Input
                  id="company-name"
                  value={systemConfig.company_name}
                  onChange={(e) => setSystemConfig(prev => ({
                    ...prev,
                    company_name: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma del Sistema</Label>
                <Select
                  value={systemConfig.language}
                  onValueChange={(value) => setSystemConfig(prev => ({
                    ...prev,
                    language: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Tema de la Interfaz</Label>
                <Select
                  value={systemConfig.theme}
                  onValueChange={(value) => setSystemConfig(prev => ({
                    ...prev,
                    theme: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                  <p className="text-sm text-gray-600">Recibir alertas importantes por correo</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={systemConfig.email_notifications}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({
                    ...prev,
                    email_notifications: checked
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalización de UI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color Principal</Label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded cursor-pointer border-2 border-gray-300"></div>
                  <div className="w-8 h-8 bg-green-600 rounded cursor-pointer"></div>
                  <div className="w-8 h-8 bg-purple-600 rounded cursor-pointer"></div>
                  <div className="w-8 h-8 bg-red-600 rounded cursor-pointer"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo de la Empresa</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Arrastra tu logo aquí o haz clic para seleccionar
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Configuración de Dashboard</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mostrar métricas en tiempo real</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dashboard compacto</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Widgets personalizables</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crear Nuevo Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email del Usuario</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-user-role">Rol Inicial</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={createUser} disabled={loading} className="w-full">
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRoles.map((userRole) => (
                  <div key={userRole.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Usuario {userRole.user_id}</p>
                      <p className="text-sm text-gray-600">Rol: {userRole.role}</p>
                    </div>
                    <Select
                      value={userRole.role}
                      onValueChange={(value) => updateUserRole(userRole.user_id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">Usuario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'permisos' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuración de Permisos por Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Administrador', 'Manager', 'Usuario'].map((role) => (
                <Card key={role} className="p-4">
                  <h3 className="font-semibold mb-4">{role}</h3>
                  <div className="space-y-3">
                    {[
                      'Ver empleados',
                      'Editar empleados',
                      'Gestionar nómina',
                      'Acceso a reportes',
                      'Configurar sistema',
                      'Gestionar usuarios'
                    ].map((permission) => (
                      <div key={permission} className="flex items-center justify-between">
                        <span className="text-sm">{permission}</span>
                        <Switch 
                          defaultChecked={role === 'Administrador' || 
                            (role === 'Manager' && !['Configurar sistema', 'Gestionar usuarios'].includes(permission))}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notificaciones' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuración de Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Notificaciones del Sistema</h3>
                {[
                  'Nuevos empleados',
                  'Ausencias pendientes',
                  'Evaluaciones vencidas',
                  'Cumpleaños',
                  'Aniversarios',
                  'Documentos por vencer'
                ].map((notification) => (
                  <div key={notification} className="flex items-center justify-between">
                    <span className="text-sm">{notification}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Canales de Notificación</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Email de Notificaciones</Label>
                    <Input placeholder="admin@empresa.com" />
                  </div>
                  <div>
                    <Label>Frecuencia de Resúmenes</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real-time">Tiempo real</SelectItem>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
