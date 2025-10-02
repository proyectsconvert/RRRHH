import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText, Image, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentName,
  documentType
}) => {
  const getFileType = (url?: string, type?: string) => {
    if (!url) return 'unknown';

    // Check by document type first
    if (type) {
      if (type.includes('pdf')) return 'pdf';
      if (type.includes('image')) return 'image';
      if (type.includes('word') || type.includes('document')) return 'document';
    }

    // Fallback to URL extension
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'doc':
      case 'docx':
        return 'document';
      default:
        return 'unknown';
    }
  };

  const fileType = getFileType(documentUrl, documentType);

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName || 'documento';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            {fileType === 'pdf' && <FileText className="h-5 w-5 text-red-500" />}
            {fileType === 'image' && <Image className="h-5 w-5 text-blue-500" />}
            {fileType === 'document' && <FileText className="h-5 w-5 text-blue-600" />}
            {documentName || 'Documento'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!documentUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!documentUrl ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se pudo cargar el documento. La URL no está disponible.
              </AlertDescription>
            </Alert>
          ) : fileType === 'pdf' ? (
            <div className="w-full h-[70vh]">
              <iframe
                src={documentUrl}
                className="w-full h-full border rounded"
                title={documentName || 'Documento PDF'}
              />
            </div>
          ) : fileType === 'image' ? (
            <div className="flex justify-center">
              <img
                src={documentUrl}
                alt={documentName || 'Documento'}
                className="max-w-full max-h-[70vh] object-contain rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex items-center justify-center h-64 text-gray-500">
                        <div class="text-center">
                          <svg class="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p>No se pudo cargar la imagen</p>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          ) : fileType === 'document' ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="h-16 w-16 mb-4 text-blue-500" />
              <p className="text-lg font-medium mb-2">Documento de Word</p>
              <p className="text-sm text-center mb-4">
                Los documentos de Word no se pueden previsualizar en el navegador.
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar para ver
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tipo de archivo no soportado para vista previa. Haz clic en "Descargar" para ver el documento.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;