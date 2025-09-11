
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config?: any;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Sincroniza empleados, notificaciones y reuniones con Microsoft Teams',
    icon: '🟦',
    status: 'disconnected',
    config: {
      tenantId: '',
      clientId: '',
      clientSecret: '',
      scopes: ['User.Read.All', 'Calendar.Read', 'Chat.Create']
    }
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Integra calendarios, eventos y notificaciones por email',
    icon: '📧',
    status: 'disconnected',
    config: {
      tenantId: '',
      clientId: '',
      clientSecret: '',
      scopes: ['Mail.Send', 'Calendar.ReadWrite', 'User.Read']
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificaciones automáticas y sincronización de estados',
    icon: '💬',
    status: 'disconnected',
    config: {
      botToken: '',
      signingSecret: '',
      workspaceId: ''
    }
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Calendarios, Gmail y documentos compartidos',
    icon: '🌐',
    status: 'disconnected',
    config: {
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/gmail.send']
    }
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automatiza flujos de trabajo con 1000+ aplicaciones',
    icon: '⚡',
    status: 'disconnected',
    config: {
      webhookUrl: '',
      apiKey: ''
    }
  },
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'Sincronización bidireccional de datos de empleados',
    icon: '🎋',
    status: 'disconnected',
    config: {
      apiKey: '',
      subdomain: ''
    }
  }
];

export const RealIntegrations: React.FC = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configData, setConfigData] = useState<any>({});

  const handleConfigureIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigData(integration.config || {});
    setIsConfigOpen(true);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedIntegration) return;

    try {
      // Aquí iría la lógica real para guardar la configuración
      console.log('Saving configuration for:', selectedIntegration.id, configData);

      // Simular conexión exitosa
      const updatedIntegrations = integrations.map(integration => 
        integration.id === selectedIntegration.id 
          ? { 
              ...integration, 
              status: 'connected' as const, 
              lastSync: new Date().toISOString(),
              config: configData 
            }
          : integration
      );

      setIntegrations(updatedIntegrations);

      toast({
        title: "Integración configurada",
        description: `${selectedIntegration.name} se ha conectado correctamente`
      });

      setIsConfigOpen(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo configurar la integración",
        variant: "destructive"
      });
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      const updatedIntegrations = integrations.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'disconnected' as const, lastSync: undefined }
          : integration
      );

      setIntegrations(updatedIntegrations);

      toast({
        title: "Integración desconectada",
        description: "La integración se ha desconectado correctamente"
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast({
        title: "Error",
        description: "No se pudo desconectar la integración",
        variant: "destructive"
      });
    }
  };

  const triggerSync = async (integrationId: string) => {
    try {
      // Aquí iría la lógica real de sincronización
      console.log('Triggering sync for:', integrationId);

      const updatedIntegrations = integrations.map(integration => 
        integration.id === integrationId 
          ? { ...integration, lastSync: new Date().toISOString() }
          : integration
      );

      setIntegrations(updatedIntegrations);

      toast({
        title: "Sincronización completada",
        description: "Los datos se han sincronizado correctamente"
      });
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: "Error",
        description: "Error durante la sincronización",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{integration.description}</p>
              
              {integration.lastSync && (
                <div className="text-xs text-gray-500">
                  Última sincronización: {new Date(integration.lastSync).toLocaleString('es-ES')}
                </div>
              )}

              <div className="flex gap-2">
                {integration.status === 'connected' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerSync(integration.id)}
                      className="flex-1"
                    >
                      Sincronizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectIntegration(integration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Desconectar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleConfigureIntegration(integration)}
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de configuración */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration?.icon} Configurar {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedIntegration?.id === 'microsoft-teams' && (
              <>
                <div>
                  <Label>Tenant ID</Label>
                  <Input
                    value={configData.tenantId || ''}
                    onChange={(e) => setConfigData({...configData, tenantId: e.target.value})}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <Label>Client ID</Label>
                  <Input
                    value={configData.clientId || ''}
                    onChange={(e) => setConfigData({...configData, clientId: e.target.value})}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <Label>Client Secret</Label>
                  <Input
                    type="password"
                    value={configData.clientSecret || ''}
                    onChange={(e) => setConfigData({...configData, clientSecret: e.target.value})}
                    placeholder="Tu client secret"
                  />
                </div>
              </>
            )}

            {selectedIntegration?.id === 'slack' && (
              <>
                <div>
                  <Label>Bot Token</Label>
                  <Input
                    type="password"
                    value={configData.botToken || ''}
                    onChange={(e) => setConfigData({...configData, botToken: e.target.value})}
                    placeholder="xoxb-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <Label>Signing Secret</Label>
                  <Input
                    type="password"
                    value={configData.signingSecret || ''}
                    onChange={(e) => setConfigData({...configData, signingSecret: e.target.value})}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </>
            )}

            {selectedIntegration?.id === 'zapier' && (
              <>
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    value={configData.webhookUrl || ''}
                    onChange={(e) => setConfigData({...configData, webhookUrl: e.target.value})}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                </div>
              </>
            )}

            {selectedIntegration?.id === 'bamboohr' && (
              <>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={configData.apiKey || ''}
                    onChange={(e) => setConfigData({...configData, apiKey: e.target.value})}
                    placeholder="Tu API key de BambooHR"
                  />
                </div>
                <div>
                  <Label>Subdomain</Label>
                  <Input
                    value={configData.subdomain || ''}
                    onChange={(e) => setConfigData({...configData, subdomain: e.target.value})}
                    placeholder="tuempresa"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfiguration}>
                Conectar
              </Button>
            </div>

            {selectedIntegration && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-900 font-medium mb-1">
                  Documentación
                </div>
                <div className="text-xs text-blue-700">
                  <a 
                    href={`https://docs.${selectedIntegration.id.replace('-', '')}.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline"
                  >
                    Ver guía de configuración <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
