
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileSignature, Send, Plus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DigitalSignature {
  id: string;
  template_name: string;
  content: string;
  recipient_email: string;
  recipient_name: string;
  status: string;
  signed_at: string;
  created_at: string;
}

export default function FirmaDigital() {
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    content: '',
    recipient_email: '',
    recipient_name: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_digital_signatures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error('Error loading signatures:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const signatureLink = `${window.location.origin}/firma/${crypto.randomUUID()}`;
      
      const { error } = await supabase
        .from('rrhh_digital_signatures')
        .insert({
          ...formData,
          signature_link: signatureLink,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Documento enviado para firma digital"
      });

      setFormData({
        template_name: '',
        content: '',
        recipient_email: '',
        recipient_name: ''
      });
      setShowForm(false);
      loadSignatures();
    } catch (error) {
      console.error('Error creating signature:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el documento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      sent: 'default',
      signed: 'secondary',
      expired: 'destructive'
    };

    const labels: Record<string, string> = {
      pending: 'Pendiente',
      sent: 'Enviado',
      signed: 'Firmado',
      expired: 'Expirado'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Firma Digital</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Documento para Firma</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Nombre de la plantilla</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Nombre del destinatario</Label>
                  <Input
                    id="recipient_name"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient_email">Email del destinatario</Label>
                <Input
                  id="recipient_email"
                  type="email"
                  value={formData.recipient_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido del documento</Label>
                <Textarea
                  id="content"
                  rows={10}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Escriba aquí el contenido del documento que requiere firma..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Enviando...' : 'Enviar para Firma'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documentos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signatures.map((signature) => (
              <div key={signature.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <FileSignature className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">{signature.template_name}</h4>
                    <p className="text-sm text-gray-500">
                      Para: {signature.recipient_name} ({signature.recipient_email})
                    </p>
                    <p className="text-xs text-gray-400">
                      Creado: {new Date(signature.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(signature.status)}
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {signatures.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay documentos para firma digital
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
