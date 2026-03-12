import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Bot, Webhook, Power, PowerOff, Search, SquareMousePointer, Ban, MoreVertical, Paperclip, Smile, Check, CheckCheck, Phone, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  botDisabled?: boolean;
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
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Load users
  const loadUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('historychat')
        .select('hicnumerouser, hicusername, hicmessagebot, hicmessageuser, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user and get unique users with latest message info
      const uniqueUsers = (data || []).reduce((acc: UserChat[], curr: any) => {
        const existing = acc.find(u => u.hicnumerouser === curr.hicnumerouser);
        if (!existing) {
          acc.push({
            hicnumerouser: curr.hicnumerouser,
            hicusername: curr.hicusername,
            lastMessage: curr.hicmessagebot || curr.hicmessageuser || '',
            lastMessageTime: curr.created_at
          });
        }
        return acc;
      }, []);

      // Check bot status for each user
      const usersWithBotStatus = await Promise.all(
        uniqueUsers.map(async (user) => {
          try {
            const { data: candidateData, error: candidateError } = await supabase
              .from('candidates')
              .select('activeWP')
              .eq('phone', user.hicnumerouser)
              .single();

            if (!candidateError && candidateData) {
              return {
                ...user,
                botDisabled: candidateData.activeWP === true
              };
            }
          } catch (error) {
            // Silent error
          }
          return { ...user, botDisabled: false };
        })
      );

      setUsers(usersWithBotStatus);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los chats",
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
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
  };

  // Update messages in real-time
  const updateMessagesRealtime = (newMessage: HistoryChatMessage) => {
    setMessages(prevMessages => {
      const messageExists = prevMessages.some(msg => 
        msg.hicnumerouser === newMessage.hicnumerouser && 
        (msg.hicmessagebot === newMessage.hicmessagebot || msg.hicmessageuser === newMessage.hicmessageuser) &&
        msg.created_at === newMessage.created_at
      );

      if (messageExists) return prevMessages;

      return [...prevMessages, newMessage].sort((a, b) =>
        new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      );
    });
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setLoading(true);

    try {
      const botNumber = import.meta.env.VITE_BOT_NUMBER || '3192463493';
      const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      const apiToken = import.meta.env.VITE_EVOLUTION_API_TOKEN;
      const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE || 'TestWPP';

      if (!apiUrl || !apiToken) {
        throw new Error('Configuración de Evolution-API faltante.');
      }

      // Optimistic update
      const optimisticMessage: HistoryChatMessage = {
        hicnumerouser: selectedUser.hicnumerouser,
        hicusername: selectedUser.hicusername,
        hicsendnumbot: botNumber,
        hicmessagebot: messageToSend,
        hicmessageuser: null,
        created_at: new Date().toISOString()
      };

      updateMessagesRealtime(optimisticMessage);
      setNewMessage('');

      const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
          'apikey': apiToken,
        },
        body: JSON.stringify({
          number: selectedUser.hicnumerouser,
          text: messageToSend,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje vía API');
      }

      const { error } = await (supabase as any)
        .from('historychat')
        .insert({
          hicnumerouser: selectedUser.hicnumerouser,
          hicusername: selectedUser.hicusername,
          hicsendnumbot: botNumber,
          hicmessagebot: messageToSend,
          hicmessageuser: null,
        });

      if (error) throw error;
      
      // Force refresh user list to update last message
      loadUsers();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
      // Optionally remove optimistic message here
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: UserChat) => {
    setSelectedUser(user);
    loadMessages(user.hicnumerouser);
  };

  const toggleUserBot = async (user: UserChat) => {
    try {
      const newBotDisabled = !user.botDisabled;
      const { error } = await supabase
        .from('candidates')
        .update({ activeWP: newBotDisabled })
        .eq('phone', user.hicnumerouser);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.hicnumerouser === user.hicnumerouser ? { ...u, botDisabled: newBotDisabled } : u
      ));

      if (selectedUser?.hicnumerouser === user.hicnumerouser) {
        setSelectedUser(prev => prev ? { ...prev, botDisabled: newBotDisabled } : null);
      }

      toast({
        title: newBotDisabled ? "Bot deshabilitado" : "Bot habilitado",
        description: `El bot para ${user.hicusername} ha sido ${newBotDisabled ? 'desactivado' : 'activado'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del bot",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUsers();
    
    const channel = supabase
      .channel('historychat-whatsapp')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'historychat' },
        (payload: any) => {
          if (payload.new) {
            const msg = payload.new as HistoryChatMessage;
            if (selectedUser && msg.hicnumerouser === selectedUser.hicnumerouser) {
              updateMessagesRealtime(msg);
            }
            loadUsers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]);

  const filteredUsers = users.filter(user =>
    user.hicusername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.hicnumerouser.includes(searchQuery)
  );

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-2xl border bg-background shadow-2xl relative">
      
      {/* Sidebar - Chat List */}
      <div className="flex w-[350px] flex-col border-r bg-muted/20 z-10">
        <div className="p-4 bg-white/50 backdrop-blur-sm border-b shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-hrm-teal/20">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-hrm-teal text-white">AD</AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold text-hrm-dark-cyan">Chats</h2>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-hrm-teal">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Nuevo Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" onClick={() => setShowDebug(!showDebug)}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-3 bg-white/30 backdrop-blur-sm shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar o empezar un nuevo chat" 
              className="pl-10 bg-white border-transparent focus-visible:ring-hrm-teal/30 focus-visible:border-hrm-teal/30 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 pb-4">
          <div className="space-y-1 mt-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.hicnumerouser}
                  onClick={() => handleUserSelect(user)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
                    selectedUser?.hicnumerouser === user.hicnumerouser
                      ? "bg-white shadow-md ring-1 ring-hrm-teal/10"
                      : "hover:bg-white/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-hrm-steel-blue/10 text-hrm-steel-blue font-bold">
                        {user.hicusername.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!user.botDisabled && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate pr-2 group-hover:text-hrm-teal transition-colors">
                        {user.hicusername}
                      </h3>
                      {user.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                          {format(new Date(user.lastMessageTime), 'HH:mm', { locale: es })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground truncate italic">
                        {user.lastMessage || 'Empieza a chatear...'}
                      </p>
                    </div>
                  </div>
                  {selectedUser?.hicnumerouser === user.hicnumerouser && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-hrm-teal rounded-l-full" />
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground px-4 text-center">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No se encontraron chats</p>
                <p className="text-xs opacity-60">Intenta con otro nombre o número</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col bg-slate-50 relative">
        {/* WhatsApp Web pattern background overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#002f34 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b z-20 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border shadow-sm">
                  <AvatarFallback className="bg-hrm-steel-blue text-white font-bold">
                    {selectedUser.hicusername.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">{selectedUser.hicusername}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="block h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{selectedUser.hicnumerouser}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => toggleUserBot(selectedUser)}
                        variant={selectedUser.botDisabled ? "outline" : "outline"}
                        size="sm"
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-4 border transition-all duration-300",
                          selectedUser.botDisabled 
                            ? "border-destructive/20 text-destructive hover:bg-destructive/10" 
                            : "border-green-600/20 text-green-700 hover:bg-green-50 font-medium"
                        )}
                      >
                        {selectedUser.botDisabled ? <PowerOff className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 animate-bounce" />}
                        <span className="text-xs">{selectedUser.botDisabled ? 'Bot OFF' : 'Bot ON'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {selectedUser.botDisabled ? "Activar respuesta automática" : "Desactivar respuesta automática"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Separator orientation="vertical" className="h-8 py-2" />
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-hrm-teal">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-hrm-teal">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6 lg:p-10 relative z-10 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-4 pb-4">
                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isBot = !!message.hicmessagebot;
                    const content = message.hicmessagebot || message.hicmessageuser;
                    const time = message.created_at ? format(new Date(message.created_at), 'HH:mm', { locale: es }) : format(new Date(), 'HH:mm');

                    return (
                      <div 
                        key={index} 
                        className={cn(
                          "flex w-full mb-1 animate-fade-in-up",
                          isBot ? "justify-end" : "justify-start"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div 
                          className={cn(
                            "relative max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] p-3 rounded-2xl shadow-sm group",
                            isBot 
                              ? "bg-hrm-teal text-white rounded-tr-none ml-12" 
                              : "bg-white text-gray-800 rounded-tl-none border mr-12"
                          )}
                        >
                          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{content}</p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 mt-1 opacity-70",
                            isBot ? "text-white/80" : "text-gray-400"
                          )}>
                            <span className="text-[9px] font-medium">{time}</span>
                            {isBot && <CheckCheck className="h-3 w-3" />}
                          </div>
                          
                          {/* Bubble tail simulation */}
                          <div className={cn(
                            "absolute top-0 w-3 h-3 transition-all",
                            isBot 
                              ? "-right-1.5 bg-hrm-teal rounded-br-full" 
                              : "-left-1.5 bg-white border-l border-t rounded-bl-full"
                          )} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center pt-20 text-muted-foreground/30">
                    <div className="p-4 bg-white rounded-full shadow-inner mb-4">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold tracking-tight">No hay mensajes aún</p>
                    <p className="text-xs">Envía el primer mensaje para iniciar la conversación</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input Bar */}
            <div className="p-4 bg-white/90 backdrop-blur-md border-t z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-slate-100 hover:text-hrm-teal transition-colors">
                    <Smile className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-slate-100 hover:text-hrm-teal transition-colors">
                    <Paperclip className="h-6 w-6 rotate-45" />
                  </Button>
                </div>
                <div className="flex-1 relative group">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="w-full bg-slate-50 border-transparent focus-visible:ring-hrm-teal/20 focus-visible:border-hrm-teal/20 rounded-xl pr-12 transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !loading && newMessage.trim()) {
                        sendMessage();
                      }
                    }}
                    disabled={loading}
                  />
                  {newMessage.trim() && (
                    <Button 
                      onClick={sendMessage}
                      disabled={loading}
                      size="sm"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-hrm-teal hover:bg-hrm-dark-cyan text-white p-0 shadow-lg shadow-hrm-teal/20"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!newMessage.trim() && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-slate-100 text-hrm-teal hover:bg-hrm-teal hover:text-white transition-all transform active:scale-95 shadow-sm shrink-0"
                    disabled={loading}
                  >
                    <Webhook className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-center mt-2 text-muted-foreground opacity-60 flex items-center justify-center gap-1 uppercase tracking-tighter font-semibold">
                <Check className="h-3 w-3" /> Mensajes encriptados y gestionados vía Evolution-API
              </p>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center relative z-20">
            <div className="max-w-md space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-hrm-teal/10 rounded-full blur-2xl transform scale-150 animate-pulse" />
                <div className="relative h-40 w-40 rounded-full bg-white shadow-xl border flex items-center justify-center mx-auto">
                   <MessageSquare className="h-16 w-16 text-hrm-teal/30" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-14 w-14 rounded-full bg-white shadow-lg border flex items-center justify-center">
                   <Bot className="h-6 w-6 text-hrm-teal" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-extrabold text-hrm-dark-cyan tracking-tight mb-2">RRHH WhatsApp Web</h1>
                <p className="text-gray-500 leading-relaxed text-sm lg:text-base">
                  Envía y recibe mensajes en tiempo real con tus candidatos. Gestiona la automatización del bot y mantén el historial centralizado.
                </p>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm text-xs font-medium text-gray-600">
                  <CheckCheck className="h-4 w-4 text-green-500" /> Historial Seguro
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm text-xs font-medium text-gray-600">
                  <Bot className="h-4 w-4 text-blue-500" /> Bot Inteligente
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm text-xs font-medium text-gray-600">
                  <Webhook className="h-4 w-4 text-purple-500" /> Integración API
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground pt-10">
                Selecciona un chat del panel lateral para comenzar a escribir.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Side Panel (Optional overlay) */}
      {showDebug && (
        <div className="absolute right-4 top-20 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-hrm-dark-cyan">
              <Webhook className="h-4 w-4" /> Diagnóstico
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)} className="h-8 w-8 p-0 rounded-full">
              ×
            </Button>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-auto text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground uppercase text-[10px] font-bold">Estado del Bot N8N</p>
              <div className={cn(
                "p-2 rounded-lg border flex items-center justify-between",
                botEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                <span className="font-medium">{botEnabled ? 'Activo' : 'Inactivo'}</span>
                <span className={cn("h-2 w-2 rounded-full", botEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-muted-foreground uppercase text-[10px] font-bold">Instancia WhatsApp</p>
              <div className="p-2 rounded-lg border bg-slate-50 font-mono">
                {import.meta.env.VITE_EVOLUTION_INSTANCE || 'No configurada'}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => toast({ title: "Test", description: "Enviando ping a n8n..." })}>
                Ping N8N Workflow
              </Button>
              <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={() => toast({ title: "API", description: "Verificando instancia Evolution..." })}>
                Fetch API Info
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;