
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMessages, useCreateMessage, useEmployees } from "@/hooks/useRRHHData";
import { 
  Mail, Plus, Send, Search, Filter, User, 
  Clock, Reply, Archive, Star
} from "lucide-react";

export default function Inbox() {
  const { toast } = useToast();
  const { data: messages = [], isLoading } = useMessages();
  const { data: employees = [] } = useEmployees();
  const createMessage = useCreateMessage();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    content: '',
    messageType: 'general'
  });
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Por ahora usamos un senderId ficticio - en producción esto vendría del usuario autenticado
      const senderId = employees[0]?.id || '';
      
      await createMessage.mutateAsync({
        senderId,
        recipientId: newMessage.recipientId,
        subject: newMessage.subject,
        content: newMessage.content,
        messageType: newMessage.messageType
      });

      toast({
        title: "Éxito",
        description: "Mensaje enviado correctamente"
      });

      setNewMessage({
        recipientId: '',
        subject: '',
        content: '',
        messageType: 'general'
      });
      setIsNewMessageOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  const filteredMessages = messages.filter(message =>
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'important': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <Star className="h-4 w-4 text-red-500" />;
    if (priority === 'urgent') return <Star className="h-4 w-4 text-red-600 fill-current" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Bandeja de Entrada
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona la comunicación interna del equipo
          </p>
        </div>
        
        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Mensaje
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Redactar Mensaje</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Destinatario</Label>
                <Select 
                  value={newMessage.recipientId} 
                  onValueChange={(value) => setNewMessage({...newMessage, recipientId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tipo de Mensaje</Label>
                <Select 
                  value={newMessage.messageType} 
                  onValueChange={(value) => setNewMessage({...newMessage, messageType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="important">Importante</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="announcement">Anuncio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Asunto</Label>
                <Input
                  placeholder="Asunto del mensaje"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Mensaje</Label>
                <Textarea
                  placeholder="Escribe tu mensaje aquí..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  rows={5}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={createMessage.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar mensajes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <Card key={message.id} className={`hover:shadow-md transition-shadow ${
              message.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${message.status === 'unread' ? 'font-bold' : ''}`}>
                        {message.sender?.first_name} {message.sender?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(message.priority)}
                    <Badge className={getMessageTypeColor(message.message_type)}>
                      {message.message_type === 'general' ? 'General' :
                       message.message_type === 'important' ? 'Importante' :
                       message.message_type === 'urgent' ? 'Urgente' :
                       message.message_type}
                    </Badge>
                    {message.status === 'unread' && (
                      <Badge className="bg-blue-600 text-white">Nuevo</Badge>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className={`text-lg mb-2 ${message.status === 'unread' ? 'font-semibold' : ''}`}>
                    {message.subject}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {message.content}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>
                      {message.status === 'read' && message.read_at 
                        ? `Leído el ${new Date(message.read_at).toLocaleString()}`
                        : 'No leído'
                      }
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Reply className="h-4 w-4" />
                      Responder
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Archive className="h-4 w-4" />
                      Archivar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No hay mensajes</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No se encontraron mensajes que coincidan con la búsqueda' : 'Tu bandeja de entrada está vacía'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
