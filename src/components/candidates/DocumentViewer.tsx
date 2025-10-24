import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText, Image, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  onTextExtracted?: (text: string) => void;
  onAnalyze?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentName,
  documentType,
  onTextExtracted,
  onAnalyze
}) => {
  const getFileType = (url?: string, type?: string) => {
    if (!url) return 'unknown';

    // Check by document type first
    if (type) {
      if (type.includes('pdf')) return 'pdf';
      if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return 'image';
      if (type.includes('word') || type.includes('document') || type.includes('doc') || type.includes('docx')) return 'document';
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
  const [extractingText, setExtractingText] = useState(false);
  const [wordTextExtracted, setWordTextExtracted] = useState(false);

  // Extract text from Word documents when viewer opens
  useEffect(() => {
    if (isOpen && documentUrl && fileType === 'document' && onTextExtracted && !wordTextExtracted) {
      extractTextFromWordDocument();
    }
  }, [isOpen, documentUrl, fileType, onTextExtracted, wordTextExtracted]);

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

  const extractTextFromWordDocument = async () => {
    if (!documentUrl || !onTextExtracted) return;

    try {
      setExtractingText(true);
      console.log('Extrayendo texto del documento Word desde:', documentUrl);

      // Use the same approach as PDF extraction - call the Edge function
      const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/extract-pdf-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
        },
        body: JSON.stringify({
          documentUrl: documentUrl,
          isWordDocument: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error al procesar documento Word: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.text) {
        console.log('Texto extraído exitosamente del documento Word:', data.text.substring(0, 200) + '...');
        onTextExtracted(data.text);
        setWordTextExtracted(true);
      } else {
        throw new Error(data.error || 'No se pudo extraer texto del documento Word');
      }

    } catch (error) {
      console.error('Error extrayendo texto del documento Word:', error);
      // For Word documents, if extraction fails, we should still allow the user to proceed
      // but inform them that text extraction failed
      console.warn('Extracción de texto falló, pero el documento se puede visualizar normalmente');
    } finally {
      setExtractingText(false);
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
            <div className="w-full h-[70vh] overflow-auto flex justify-center items-start">
              <img
                src={documentUrl}
                alt={documentName || 'Documento'}
                className="max-w-full max-h-full object-contain rounded border"
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
            <div className="w-full h-[70vh]">
              {(extractingText || wordTextExtracted) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-hrm-dark-cyan" />
                    <span className="text-sm">
                      {extractingText ? 'Extrayendo texto del documento...' : 'Texto extraído correctamente'}
                    </span>
                  </div>
                </div>
              )}
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(documentUrl || '')}&embedded=true`}
                className="w-full h-full border rounded"
                title={documentName || 'Documento Word'}
                onError={(e) => {
                  // Fallback to download message if Google Docs viewer fails
                  const iframe = e.currentTarget;
                  const parent = iframe.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex flex-col items-center justify-center h-64 text-gray-500">
                        <svg class="h-16 w-16 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p class="text-lg font-medium mb-2">Documento de Word</p>
                        <p class="text-sm text-center mb-4">
                          ${wordTextExtracted ? 'Texto extraído correctamente. ' : ''}No se pudo cargar la vista previa. Haz clic en "Descargar" para ver el documento.
                        </p>
                        <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                          <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar para ver
                        </button>
                      </div>
                    `;
                    // Add download functionality to the button
                    const downloadBtn = parent.querySelector('button');
                    if (downloadBtn) {
                      downloadBtn.addEventListener('click', handleDownload);
                    }
                  }
                }}
              />
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