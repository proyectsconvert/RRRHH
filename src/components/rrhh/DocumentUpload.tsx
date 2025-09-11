
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  employeeId: string;
  employeeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const documentTypes = [
  { value: 'contract', label: 'Contrato' },
  { value: 'id', label: 'Identificación' },
  { value: 'cv', label: 'Currículum' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'evaluation', label: 'Evaluación' },
  { value: 'training', label: 'Capacitación' },
  { value: 'medical', label: 'Certificado Médico' },
  { value: 'reference', label: 'Referencias' },
  { value: 'other', label: 'Otro' }
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  employeeId,
  employeeName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    documentName: '',
    documentType: 'contract',
    isRequired: false,
    visibility: 'private'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.documentName) {
        setFormData(prev => ({ ...prev, documentName: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.documentName.trim()) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo y proporciona un nombre",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Simular subida de archivo (en producción se usaría Supabase Storage)
      const mockFilePath = `/documents/${employeeId}/${Date.now()}-${selectedFile.name}`;
      
      // Aquí iría la lógica real de subida con Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Éxito",
        description: "Documento subido correctamente"
      });

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        documentName: '',
        documentType: 'contract',
        isRequired: false,
        visibility: 'private'
      });
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Documento - {employeeName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Archivo</Label>
            <div className="mt-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              />
              {selectedFile && (
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <File className="w-4 h-4 mr-2" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="documentName">Nombre del Documento</Label>
            <Input
              id="documentName"
              value={formData.documentName}
              onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
              placeholder="Ej: Contrato de trabajo 2024"
            />
          </div>

          <div>
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <Select value={formData.documentType} onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isRequired">Documento requerido</Label>
          </div>

          <div>
            <Label htmlFor="visibility">Visibilidad</Label>
            <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="public">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !selectedFile}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
