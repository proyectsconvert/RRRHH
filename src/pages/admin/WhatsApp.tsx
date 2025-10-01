import React, { useState, useEffect } from 'react';
// 1. Importar el ícono de búsqueda
import { Send, MessageSquare, Bot, Webhook, Power, PowerOff, Search } from 'lucide-react'; 
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// Define types for historychat table
interface HistoryChatMessage {
  hicnumerouser: string;
  hicusername: string;
  hicsendnumbot: string | null;
  hicmessagebot: string | null;
  hicmessageuser: string | null;
  created_at?: string;
}

interface UserChat {
  hicnumerouser: string;
  hicusername: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

const WhatsApp = () => {
  const [users, setUsers] = useState<UserChat[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserChat | null>(null);
  const [messages, setMessages] = useState<HistoryChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [botEnabled, setBotEnabled] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  // 2. Añadir estado para la consulta de búsqueda (MECANISMO 1)
  const [searchQuery, setSearchQuery] = useState(''); 
  const { toast } = useToast();

  // Load users
  const loadUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('historychat')
        .select('hicnumerouser, hicusername')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user and get unique users
      const uniqueUsers = data?.reduce((acc: UserChat[], curr: any) => {
        const existing = acc.find(u => u.hicnumerouser === curr.hicnumerouser);
        if (!existing) {
          acc.push({
            hicnumerouser: curr.hicnumerouser,
            hicusername: curr.hicusername,
          });
        }
        return acc;
      }, []) || [];

      setUsers(uniqueUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    }
  };

  // Load messages for selected user
  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('historychat')
        .select('*')
        .eq('hicnumerouser', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setLoading(true);
    try {
      // Get bot number from environment or use a default
      const botNumber = import.meta.env.VITE_BOT_NUMBER || '3192463493';
      const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiToken = import.meta.env.VITE_EVOLUTION_API_TOKEN;
      const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE || 'TestWPP';

      if (!apiUrl || !apiToken) {
        throw new Error('Evolution-API configuration missing. Please check VITE_EVOLUTION_API_URL and VITE_EVOLUTION_API_TOKEN environment variables.');
      }

      // Send to Evolution-API using bot number as sender and user number as recipient
      const requestBody = {
        number: selectedUser.hicnumerouser, // Recipient (user number)
        text: newMessage.trim(), // Evolution-API typically uses 'text' instead of 'message'
      };

      const evolutionResponse = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
          'apikey': apiToken, // Some Evolution-API versions require apikey header
        },
        body: JSON.stringify(requestBody),
      });

      if (!evolutionResponse.ok) {
        let errorMessage = `HTTP ${evolutionResponse.status}: ${evolutionResponse.statusText}`;
        try {
          const errorData = await evolutionResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Silent error parsing
        }
        throw new Error(`Error sending message to Evolution-API: ${errorMessage}`);
      }

      const responseData = await evolutionResponse.json();

      // Save to Supabase
      const { error } = await (supabase as any)
        .from('historychat')
        .insert({
          hicnumerouser: selectedUser.hicnumerouser,
          hicusername: selectedUser.hicusername,
          hicsendnumbot: botNumber, // Bot number that sent the message
          hicmessagebot: newMessage.trim(),
          hicmessageuser: null,
        });

      if (error) {
        throw new Error(`Error saving message to database: ${error.message}`);
      }

      setNewMessage('');
      toast({
        title: "Mensaje enviado",
        description: "El mensaje se envió correctamente",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: UserChat) => {
    setSelectedUser(user);
    loadMessages(user.hicnumerouser);
  };

  // Test N8N Workflow using Supabase proxy
  const testN8NWorkflow = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const proxyUrl = `${supabaseUrl}/functions/v1/n8n-proxy`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: 'test',
          data: {
            message: 'Test message from WhatsApp interface'
          }
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // Silent error parsing
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      toast({
        title: "Test exitoso",
        description: "El workflow de n8n respondió correctamente al test",
      });
    } catch (error) {
      console.error('Error testing N8N workflow:', error);
      toast({
        title: "Error en test",
        description: `No se pudo probar el workflow: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  // Test Evolution-API connection
  const testEvolutionAPI = async () => {
    try {
      const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiToken = import.meta.env.VITE_EVOLUTION_API_TOKEN;
      const botNumber = import.meta.env.VITE_BOT_NUMBER;
      const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE || 'TestWPP';

      if (!apiUrl || !apiToken) {
        toast({
          title: "Configuración faltante",
          description: "Variables de entorno VITE_EVOLUTION_API_URL y VITE_EVOLUTION_API_TOKEN no están configuradas",
          variant: "destructive"
        });
        return;
      }

      // Try different endpoints and auth methods for Evolution-API
      let response;
      let success = false;

      // Try different endpoints
      const endpoints = [
        `${apiUrl}/instance/connectionState/${instanceName}`,
        `${apiUrl}/instance/info/${instanceName}`,
        `${apiUrl}/instance/fetchInstances`,
        `${apiUrl}/instance/me`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);

          // Try with Bearer token
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'apikey': apiToken,
            },
          });

          if (response.ok) {
            success = true;
            break;
          }

          // Try with just apikey header
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'apikey': apiToken,
            },
          });

          if (response.ok) {
            success = true;
            break;
          }

          // Try with apikey as query parameter
          const urlWithKey = `${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${apiToken}`;
          response = await fetch(urlWithKey, {
            method: 'GET',
          });

          if (response.ok) {
            success = true;
            break;
          }

        } catch (endpointError) {
          continue;
        }
      }

      if (success && response) {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Conexión exitosa",
          description: `Evolution-API conectado. Instancia: ${instanceName}`,
        });
      } else {
        throw new Error('No se pudo conectar a Evolution-API. Verifica el token y la URL.');
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    }
  };

  // Toggle N8N Bot using Supabase proxy to avoid CORS
  const toggleN8NBot = async () => {
    setBotLoading(true);
    try {
      // Use Supabase function as proxy to avoid CORS issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const proxyUrl = `${supabaseUrl}/functions/v1/n8n-proxy`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: botEnabled ? 'deactivate' : 'activate',
          data: {
            user: 'admin',
            service: 'whatsapp-bot'
          }
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // Silent error parsing
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setBotEnabled(!botEnabled);

      toast({
        title: botEnabled ? "Bot detenido" : "Bot activado",
        description: `El workflow de n8n ha sido ${botEnabled ? 'detenido' : 'activado'} correctamente`,
      });

      // Workflow toggled successfully
    } catch (error) {
      console.error('Error toggling N8N workflow:', error);
      toast({
        title: "Error",
        description: `No se pudo ${botEnabled ? 'detener' : 'activar'} el workflow: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setBotLoading(false);
    }
  };

  // Toggle Webhook
  const toggleWebhook = async () => {
    setWebhookLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiToken = import.meta.env.VITE_EVOLUTION_API_TOKEN;
      const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE || 'TestWPP';

      if (!apiUrl || !apiToken) {
        throw new Error('Evolution-API configuration missing');
      }

      const webhookUrl = webhookEnabled
        ? null // Disable webhook
        : 'https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/whatsapp-webhook'; // Enable webhook

      const response = await fetch(`${apiUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
          'apikey': apiToken,
        },
        body: JSON.stringify({
          enabled: !webhookEnabled,
          url: webhookUrl,
          events: webhookUrl ? ['messages', 'message_create'] : [],
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Silent error parsing
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setWebhookEnabled(!webhookEnabled);

      toast({
        title: webhookEnabled ? "Webhook detenido" : "Webhook activado",
        description: `El webhook ha sido ${webhookEnabled ? 'detenido' : 'activado'} correctamente`,
      });

      console.log('Webhook toggle result:', result);
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast({
        title: "Error",
        description: `No se pudo ${webhookEnabled ? 'detener' : 'activar'} el webhook: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  // Check initial status of bot and webhook
  const checkInitialStatus = async () => {
    try {
      // Check webhook status from Evolution API
      const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiToken = import.meta.env.VITE_EVOLUTION_API_TOKEN;
      const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE || 'TestWPP';

      if (apiUrl && apiToken) {
        try {
          const response = await fetch(`${apiUrl}/webhook/find/${instanceName}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'apikey': apiToken,
            },
          });

          if (response.ok) {
            const webhookData = await response.json();
            setWebhookEnabled(webhookData?.enabled || false);
          }
        } catch (error) {
          // Silent webhook status check
        }
      }

      // Check N8N workflow status using proxy
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const proxyUrl = `${supabaseUrl}/functions/v1/n8n-proxy`;

          const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              action: 'status',
              data: {}
            }),
          });

          if (response.ok) {
            const workflowData = await response.json();
            setBotEnabled(workflowData?.active || false);
          }
        }
      } catch (error) {
        // Silent workflow status check
      }
    } catch (error) {
      // Silent initial status check
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    loadUsers();
    checkInitialStatus();

    const channel = supabase
      .channel('historychat-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'historychat' },
        (payload: any) => {
          if (selectedUser && payload.new?.hicnumerouser === selectedUser.hicnumerouser) {
            loadMessages(selectedUser.hicnumerouser);
          }
          loadUsers(); // Refresh user list in case of new users
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]);

  // 3. Crear la lista filtrada de usuarios (MECANISMO 3)
  const filteredUsers = users.filter(user =>
    user.hicusername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.hicnumerouser.includes(searchQuery)
  );

  return (
    <div className="h-full flex gap-4">
      {/* Debug Panel */}
      {showDebug && (
        <Card className="w-1/4">
          <CardHeader>
            <CardTitle className="text-sm">Debug Evolution-API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs space-y-1">
              <p><strong>URL:</strong> {import.meta.env.VITE_EVOLUTION_API_URL || 'NOT SET'}</p>
              <p><strong>Token:</strong> {import.meta.env.VITE_EVOLUTION_API_TOKEN ? '***' + import.meta.env.VITE_EVOLUTION_API_TOKEN.slice(-4) : 'NOT SET'}</p>
              <p><strong>Instance:</strong> {import.meta.env.VITE_EVOLUTION_INSTANCE || 'NOT SET'}</p>
              <p><strong>Bot Number:</strong> {import.meta.env.VITE_BOT_NUMBER || 'NOT SET'}</p>
              <div className="border-t pt-2 mt-2">
                <p><strong>Workflow N8N (qpBj0IpMs21Q7zha):</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${botEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {botEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
                  </span>
                </p>
                <p><strong>Webhook Evolution API:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${webhookEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {webhookEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  URL Workflow: https://n8n.testbot.click/webhook/qpBj0IpMs21Q7zha
                </p>
                <p className="text-xs text-gray-500">
                  Nombre: Workflow RRHH Reclutamiento - Santiago
                </p>
              </div>
            </div>
            <Button onClick={testEvolutionAPI} size="sm" className="w-full">
            	Test Evolution API
          	</Button>
          	<Button onClick={testN8NWorkflow} size="sm" className="w-full">
          	  Test N8N Workflow
          	</Button>
          	<Button onClick={() => setShowDebug(false)} size="sm" variant="outline" className="w-full">
          	  Hide Debug
          	</Button>
        	</CardContent>
      	</Card>
    	)}

    	{/* Users List */}
    	<Card className={`${showDebug ? "w-1/4" : "w-1/3"} flex flex-col`}>

        {/* El encabezado ahora contiene TODOS los controles */}
        <CardHeader className="p-4 space-y-4">
          {/* Fila 1: Título y Botones */}
          <CardTitle className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chats
            </div>
            <div className="flex items-center gap-2">
              {/* Botones */}
              <Button
                onClick={toggleN8NBot}
                size="sm"
                variant={botEnabled ? "default" : "outline"}
                disabled={botLoading}
                className="flex items-center gap-1"
              >
                {botLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bot className="h-4 w-4" />}
                {botEnabled ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                <span className="hidden sm:inline">{botEnabled ? 'Detener Bot' : 'Iniciar Bot'}</span>
              </Button>

              <Button
                onClick={toggleWebhook}
                size="sm"
                variant={webhookEnabled ? "default" : "outline"}
                disabled={webhookLoading}
                className="flex items-center gap-1"
              >
                {webhookLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Webhook className="h-4 w-4" />}
                {webhookEnabled ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                <span className="hidden sm:inline">{webhookEnabled ? 'Detener Webhook' : 'Iniciar Webhook'}</span>
              </Button>

              <Button onClick={() => setShowDebug(!showDebug)} size="sm" variant="outline">
                Debug
              </Button>
            </div>
          </CardTitle>

          {/* Fila 2: Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>

        {/* El contenido ahora solo se encarga de la lista */}
        <CardContent className="flex-1 p-4 pt-0">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.hicnumerouser}
                    onClick={() => handleUserSelect(user)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.hicnumerouser === user.hicnumerouser
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.hicusername.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.hicusername}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.hicnumerouser}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">
                  No se encontraron chats.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>


    	{/* Chat Area */}
    	<Card className={showDebug ? "flex-1" : "flex-1"}>
    	  <CardHeader>
    	    <CardTitle>
    	      {selectedUser ? `${selectedUser.hicusername} (${selectedUser.hicnumerouser})` : 'Selecciona un chat'}
    	    </CardTitle>
    	  </CardHeader>
    	  <CardContent className="flex flex-col h-[600px]">
    	    {/* Messages */}
    	    <ScrollArea className="flex-1 mb-4">
    	      <div className="space-y-4">
    	        {messages.map((message, index) => (
    	          <div key={index} className="flex">
    	            {message.hicmessagebot && (
    	              <div className="flex justify-end w-full">
    	                <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
    	                  <p>{message.hicmessagebot}</p>
    	                </div>
    	              </div>
    	            )}
    	            {message.hicmessageuser && (
    	              <div className="flex justify-start w-full">
    	                <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs">
    	                  <p>{message.hicmessageuser}</p>
    	                </div>
    	              </div>
    	            )}
    	          </div>
    	        ))}
    	      </div>
    	    </ScrollArea>

    	    {/* Send Message Form */}
    	    {selectedUser && (
    	      <div className="flex gap-2">
    	        <Input
    	          value={newMessage}
    	          onChange={(e) => setNewMessage(e.target.value)}
    	          placeholder="Escribe un mensaje..."
    	          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
    	          disabled={loading}
    	        />
    	        <Button
    	          onClick={sendMessage}
    	          disabled={loading || !newMessage.trim()}
    	          className="px-4"
    	        >
    	          <Send className="h-4 w-4" />
    	        </Button>
    	      </div>
    	    )}
    	  </CardContent>
    	</Card>
    </div>
  );
};

export default WhatsApp;