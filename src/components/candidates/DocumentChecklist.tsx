import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Image, CheckCircle, XCircle, AlertCircle, Download, Eye, Trash2, RotateCcw, Check, X, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DocumentViewer from './DocumentViewer';

interface DocumentItem {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  category?: string;
  uploaded?: boolean;
  fileUrl?: string;
  uploadedAt?: string;
  fileName?: string;
  needsReupload?: boolean;
  reuploadRequestedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

interface DocumentCategory {
  title: string;
  subtitle: string;
  description?: string;
  items: DocumentItem[];
}

interface DocumentChecklistProps {
  candidateId: string;
  candidateName: string;
  onDocumentUploaded?: () => void;
  isAdmin?: boolean; // New prop to differentiate admin vs public view
  isReadOnly?: boolean; // New prop to indicate read-only mode for hired candidates
}

export const DOCUMENT_CATEGORIES: Record<string, DocumentCategory> = {
  basic: {
    title: "DOCUMENTACIÓN BÁSICA",
    subtitle: "SI NO N/A",
    items: [
      {
        id: "hoja-vida",
        name: "HOJA DE VIDA",
        description: "",
        required: true
      },
      {
        id: "cedula-ampliada",
        name: "1 FOTOCOPIA DE CÉDULA DE CIUDADANIA Y/O EXTRANJERÍA AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: true
      },
      {
        id: "certificacion-bancaria",
        name: "CERTIFICACIÓN BANCARIA (No mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "certificado-sisben",
        name: "CERTIFICADO DE SISBEN (No mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "antecedentes-policia",
        name: "ANTECEDENTES POLICIA",
        description: "",
        required: true
      },
      {
        id: "antecedentes-contraloria",
        name: "ANTECEDENTES CONTRALORÍA",
        description: "",
        required: true
      },
      {
        id: "antecedentes-procuraduria",
        name: "ANTECEDENTES PROCURADURÍA",
        description: "",
        required: true
      },
      {
        id: "referencias-personales-1",
        name: "1. REFERENCIAS PERSONALES (Firmadas, no mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "referencias-personales-2",
        name: "2. REFERENCIAS PERSONALES (Firmadas, no mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "certificaciones-laborales-1",
        name: "1. CERTIFICACIONES LABORALES (Los últimos tres trabajos)",
        description: "",
        required: true
      },
      {
        id: "certificaciones-laborales-2",
        name: "2. CERTIFICACIONES LABORALES (Los últimos tres trabajos)",
        description: "",
        required: true
      },
      {
        id: "diplomas-estudios",
        name: "FOTOCOPIA DIPLOMAS Y/O ESTUDIOS CERTIFICADOS DE TODOS LOS ESTUDIOS REALIZADOS",
        description: "",
        required: true
      },
      {
        id: "afiliacion-eps",
        name: "CERTIFICACIÓN DE AFILIACIÓN A EPS (No mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "afiliacion-pension",
        name: "CERTIFICACIÓN DE AFILIACIÓN A FONDO DE PENSIÓN (No mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "afiliacion-cesantias",
        name: "CERTIFICACIÓN DE AFILIACIÓN A FONDO DE CESANTÍAS (No mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "examenes-medicos",
        name: "RESULTADOS DE EXAMENES MÉDICOS",
        description: "",
        required: true
      }
    ]
  },
  epsFamily: {
    title: "DOCUMENTOS PARA AFILIAR AL GRUPO FAMILIAR A LA EPS",
    subtitle: "SI NO N/A",
    items: [
      {
        id: "eps-cedula-empleado",
        name: "FOTOCOPIA CEDULA DE CIUDADANIA DEL EMPLEADO AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "eps-cedula-conyuge",
        name: "FOTOCOPIA CEDULA DE CIUDADANIA DEL CONYUGUE O COMPAÑERO (A) PERMANENTE AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "eps-registro-matrimonio",
        name: "FOTOCOPIA REGISTRO CIVIL DE MATRIMONIO O EXTRAJUICIO DE CONVIVENCIA",
        description: "",
        required: false
      },
      {
        id: "eps-registro-hijos",
        name: "FOTOCOPIA DE REGISTRO CIVIL DE LOS HIJOS LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "eps-tarjeta-hijos",
        name: "FOTOCOPIA TARJETA DE IDENTIDAD (PARA HIJOS MAYORES DE 7 AÑOS) AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "eps-certificado-escolaridad",
        name: "PARA HIJOS MAYORES DE 18 HASTA 23 AÑOS CERTIFICADO DE ESCOLARIDAD EXPEDIDO POR EL ESTABLECIMIENTO EDUCATIVO DEL AÑO ESCOLAR VIGENTE",
        description: "",
        required: false
      },
      {
        id: "eps-registro-empleado-padres",
        name: "SI LOS BENEFICIARIOS SON PADRES FOTOCOPIA DEL REGISTRO CIVIL DEL EMPLEADO LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "eps-cedula-padres",
        name: "FOTOCOPIA DE LA CEDULA DE LOS PADRES AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      }
    ]
  },
  cajaCompensacion: {
    title: "DOCUMENTOS PARA AFILIAR AL GRUPO FAMILIAR A LA CAJA DE COMPENSACIÓN",
    subtitle: "SI NO N/A",
    items: [
      {
        id: "caja-cedula-empleado",
        name: "FOTOCOPIA CEDULA DE CIUDADANÍA DEL EMPLEADO AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "caja-cedula-conyuge",
        name: "FOTOCOPIA CEDULA DE CIUDADANIA DEL CONYUGUE O COMPAÑERO (A) PERMANENTE AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "caja-registro-matrimonio",
        name: "FOTOCOPIA REGISTRO CIVIL DE MATRIMONIO O EXTRAJUICIO DE CONVIVENCIA",
        description: "",
        required: false
      },
      {
        id: "caja-certificacion-laboral-conyuge",
        name: "CERTIFICACIÓN LABORAL DEL CONYUGUE QUE ESPECIFIQUE CARGO, SUELDO Y SI RECIBE O NO SUBSIDIO FAMILIAR (CASOS EN LOS QUE APLIQUE)",
        description: "",
        required: false
      },
      {
        id: "caja-registro-hijos",
        name: "FOTOCOPIA DE REGISTRO CIVIL DE LOS HIJOS LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "caja-tarjeta-hijos",
        name: "FOTOCOPIA TARJETA DE IDENTIDAD (PARA HIJOS MAYORES DE 7 AÑOS) AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "caja-certificado-escolaridad",
        name: "PARA HIJOS MAYORES DE 12 HASTA 23 AÑOS CERTIFICADO DE ESCOLARIDAD EXPEDIDO POR EL ESTABLECIMIENTO EDUCATIVO DEL AÑO ESCOLAR VIGENTE",
        description: "",
        required: false
      },
      {
        id: "caja-registro-empleado-padres",
        name: "SI LOS BENEFICIARIOS SON PADRES FOTOCOPIA DEL REGISTRO CIVIL DEL EMPLEADO LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "caja-cedula-padres",
        name: "FOTOCOPIA DE LA CEDULA DE LOS PADRES AMPLIADA AL 150% LEGIBLE",
        description: "",
        required: false
      },
      {
        id: "caja-certificado-eps-padres",
        name: "CERTIFICADO DE EPS DE LOS PADRES DONDE CONSTE EL TIPO DE AFILIACIÓN",
        description: "",
        required: false
      }
    ]
  },
  retencionFuente: {
    title: "DOCUMENTOS PARA DISMINUCIÓN BASE MENSUAL DE RETENCIÓN EN LA FUENTE",
    subtitle: "SI APLICA) SALARIOS SUPERIORES A $3.500.000 SI NO N/A",
    description: "EL EMPLEADO PODRÁ DISMINUIR LA BASE MENSUAL DE RETENCIÓN EN LA FUENTE CON EL VALOR PAGADO EN EL AÑO ANTERIOR POR CONCEPTO DE INTERESES Y CORRECCIÓN MONETARIA ORIGINADOS POR PRÉSTAMOS DE VIVIENDA O CON LOS PAGOS EFECTUADOS POR CONCEPTO DE SALUD EL EMPLEADO, SU CONYUGUE Y HASTA DOS HIJOS.",
    items: [
      {
        id: "retencion-certificado-ingresos",
        name: "CERTIFICADO DE INGRESOS Y RETENCIONES DEL AÑO INMEDIATAMENTE ANTERIOR",
        description: "",
        required: false
      },
      {
        id: "retencion-certificado-hipotecarios",
        name: "CERTIFICADO DE PAGO DE CRÉDITOS HIPOTECARIOS DEL AÑO INMEDIATAMENTE ANTERIOR",
        description: "",
        required: false
      },
      {
        id: "retencion-certificado-salud",
        name: "CERTIFICADO DE PAGOS DE MEDICINA PREPAGADA, SEGURO DE SALUD DEL TRABAJADOR Y/O PLANES COMPLEMENTARIOS DE SALUD, CONYUGUE O HIJOS EFECTUADOS EL AÑO INMEDIATAMENTE ANTERIOR",
        description: "",
        required: false
      },
      {
        id: "retencion-formato-dependientes",
        name: "FORMATO DE DEPENDIENTES",
        description: "",
        required: false
      },
      {
        id: "retencion-formato-declarante",
        name: "FORMATO DECLARANTE DE RENTA",
        description: "",
        required: false
      },
      {
        id: "retencion-certificado-aportes",
        name: "CERTIFICADO DE APORTES VOLUNTARIOS A PENSIÓN Y CUENTAS AFC",
        description: "",
        required: false
      }
    ]
  }
};

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  candidateId,
  candidateName,
  onDocumentUploaded,
  isAdmin = false, // Default to public view
  isReadOnly = false // Default to editable
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<{ [key: string]: DocumentItem }>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<{
    url?: string;
    name?: string;
    type?: string;
  }>({});
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  useEffect(() => {
    loadDocumentStatus();
  }, [candidateId, isAdmin]);

  const loadDocumentStatus = async () => {
    try {
      setLoading(true);

      // Load existing documents from database
      const { data, error } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('candidate_id', candidateId);

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      // Initialize documents with all checklist items
      const allDocuments: { [key: string]: DocumentItem } = {};

      // Process each document and generate fresh signed URLs
      for (const category of Object.entries(DOCUMENT_CATEGORIES)) {
        const [categoryKey, categoryData] = category;
        for (const item of categoryData.items.filter((item) => isAdmin || item.id !== 'examenes-medicos')) {
          const existingDoc = data?.find(doc => doc.document_type === item.id);

          let fileUrl = existingDoc?.file_url;
          if (existingDoc) {
            // Generate fresh signed URL for existing documents
            try {
              // Extract file path from stored URL or reconstruct it
              const urlParts = existingDoc.file_url.split('/');
              const fileName = urlParts[urlParts.length - 1];

              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('candidate-documents')
                .createSignedUrl(`${candidateId}/${fileName}`, 3600); // 1 hour

              if (!signedUrlError && signedUrlData?.signedUrl) {
                fileUrl = signedUrlData.signedUrl;
              }
            } catch (signedUrlError) {
              console.warn(`Could not generate signed URL for ${item.id}:`, signedUrlError);
              // Keep the existing URL as fallback
            }
          }

          allDocuments[item.id] = {
            ...item,
            category: categoryKey,
            uploaded: !!existingDoc,
            fileUrl,
            uploadedAt: existingDoc?.uploaded_at,
            fileName: existingDoc?.file_name,
            needsReupload: existingDoc?.needs_reupload || false,
            reuploadRequestedAt: existingDoc?.reupload_requested_at,
            status: existingDoc?.status || 'pending',
            feedback: existingDoc?.feedback
          };
        }
      }

      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading document status:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el estado de los documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (documentId: string, file: File) => {
    try {
      setUploading(prev => ({ ...prev, [documentId]: true }));

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos PDF, imágenes (JPG, PNG, GIF) y documentos Word",
          variant: "destructive"
        });
        return;
      }

      // Upload file to Supabase storage
      const fileName = `${candidateId}/${documentId}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(fileName, file);

      if (uploadError) {
        // Handle bucket not found error
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('El bucket de almacenamiento no existe. Por favor, contacte al administrador para crear el bucket "candidate-documents" en Supabase Storage.');
        }
        throw uploadError;
      }

      // Get signed URL (since bucket is private)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('candidate-documents')
        .createSignedUrl(fileName, 3600); // 1 hour expiration

      if (urlError || !urlData?.signedUrl) {
        console.error('Error creating signed URL:', urlError);
        throw new Error('No se pudo generar la URL de acceso al archivo');
      }

      // Save document record in database
      const { error: dbError } = await supabase
        .from('candidate_documents')
        .upsert({
          candidate_id: candidateId,
          document_type: documentId,
          file_url: urlData.signedUrl,
          file_name: file.name,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          status: 'pending', // Reset status to pending on new upload
          needs_reupload: false, // Clear re-upload flag
          reupload_requested_at: null,
          feedback: null
        }, {
          onConflict: 'candidate_id, document_type'
        });

      if (dbError) {
        throw dbError;
      }

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          uploaded: true,
          fileUrl: urlData.signedUrl,
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
          status: 'pending',
          needsReupload: false,
          reuploadRequestedAt: undefined,
          feedback: undefined
        }
      }));

      toast({
        title: "Documento subido",
        description: `${documents[documentId]?.name} ha sido subido correctamente`
      });

      onDocumentUploaded?.();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error al subir documento",
        description: error.message || "No se pudo subir el documento",
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const handleFileSelect = (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocument(documentId, file);
    }
  };

  const handleViewDocument = (document: DocumentItem) => {
    if (document.fileUrl) {
      // Get file type from the stored file name
      let fileType = 'unknown';

      if (document.fileName) {
        // Use the stored file name to determine type
        const extension = document.fileName.split('.').pop()?.toLowerCase();
        if (extension) {
          fileType = extension;
        }
      }

      // Fallback: try to detect from URL if we still don't have a type
      if (fileType === 'unknown') {
        const urlMatch = document.fileUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        if (urlMatch) {
          fileType = urlMatch[1].toLowerCase();
        }
      }

      // Additional fallback: check MIME type patterns in URL or filename
      if (fileType === 'unknown' && document.fileName) {
        const lowerFileName = document.fileName.toLowerCase();
        if (lowerFileName.includes('pdf')) fileType = 'pdf';
        else if (lowerFileName.includes('docx') || lowerFileName.includes('doc')) fileType = 'docx';
        else if (lowerFileName.includes('jpg') || lowerFileName.includes('jpeg') || lowerFileName.includes('png') || lowerFileName.includes('gif')) fileType = 'image';
      }

      setViewerDocument({
        url: document.fileUrl,
        name: document.name,
        type: fileType
      });
      setViewerOpen(true);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Delete from Supabase storage
      const existingDoc = Object.values(documents).find(doc => doc.id === documentId && doc.uploaded);
      if (existingDoc?.fileUrl) {
        // Extract file path from signed URL
        const urlParts = existingDoc.fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
        const filePath = `${candidateId}/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from('candidate-documents')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting from storage:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('candidate_documents')
        .delete()
        .eq('candidate_id', candidateId)
        .eq('document_type', documentId);

      if (dbError) {
        throw dbError;
      }

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          uploaded: false,
          fileUrl: undefined,
          uploadedAt: undefined,
          fileName: undefined,
          status: 'pending', // Reset status when deleted
          needsReupload: false,
          reuploadRequestedAt: undefined,
          feedback: undefined
        }
      }));

      toast({
        title: "Documento eliminado",
        description: `${documents[documentId]?.name} ha sido eliminado correctamente`
      });

      onDocumentUploaded?.();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error al eliminar documento",
        description: error.message || "No se pudo eliminar el documento",
        variant: "destructive"
      });
    }
  };

  const handleRequestReupload = async (documentId: string) => {
    try {
      // Mark document as needing re-upload by updating the database
      const { error } = await supabase
        .from('candidate_documents')
        .upsert({
          candidate_id: candidateId,
          document_type: documentId,
          file_url: null, // Clear the URL to indicate it needs re-upload
          file_name: null,
          file_size: null,
          uploaded_at: null,
          needs_reupload: true, // Add this field to track re-upload requests
          reupload_requested_at: new Date().toISOString(),
          reupload_requested_by: 'recruiter', // Track who requested the re-upload
          status: 'rejected' // Set status to rejected when re-upload is requested
        });

      if (error) {
        throw error;
      }

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          uploaded: false,
          fileUrl: undefined,
          uploadedAt: undefined,
          fileName: undefined,
          needsReupload: true,
          reuploadRequestedAt: new Date().toISOString(),
          status: 'rejected'
        }
      }));

      toast({
        title: "Re-carga solicitada",
        description: `Se ha solicitado la re-carga de ${documents[documentId]?.name}. El candidato podrá subir el documento corregido.`
      });

      onDocumentUploaded?.();
    } catch (error: any) {
      console.error('Error requesting re-upload:', error);
      toast({
        title: "Error al solicitar re-carga",
        description: error.message || "No se pudo solicitar la re-carga del documento",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (documentId: string, status: 'approved' | 'rejected', feedback?: string) => {
    try {
      setProcessingStatus(true);

      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'rejected') {
        updateData.feedback = feedback;
        updateData.needs_reupload = true; // Automatically request re-upload if rejected
        updateData.reupload_requested_at = new Date().toISOString();
        updateData.reupload_requested_by = 'recruiter';
      } else if (status === 'approved') {
        updateData.feedback = null; // Clear feedback if approved
        updateData.needs_reupload = false;
        updateData.reupload_requested_at = null;
        updateData.reupload_requested_by = null;
      }

      const { error } = await supabase
        .from('candidate_documents')
        .update(updateData)
        .eq('candidate_id', candidateId)
        .eq('document_type', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(prev => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          status: status,
          feedback: status === 'rejected' ? feedback : undefined,
          needsReupload: status === 'rejected',
          reuploadRequestedAt: status === 'rejected' ? new Date().toISOString() : undefined
        }
      }));

      toast({
        title: status === 'approved' ? "Documento aprobado" : "Documento rechazado",
        description: `El estado del documento ha sido actualizado correctamente.`
      });

      if (status === 'rejected') {
        setRejectDialogOpen(false);
        setRejectionFeedback('');
        setSelectedDocumentId(null);
      }

    } catch (error: any) {
      console.error('Error updating document status:', error);

      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del documento",
        variant: "destructive"
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  const openRejectDialog = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setRejectionFeedback('');
    setRejectDialogOpen(true);
  };

  const handleDownloadAll = async () => {
    try {
      setIsDownloading(true);
      toast({
        title: "Generando PDF unificado",
        description: "Por favor espere mientras se procesan los documentos...",
      });

      // Collect all uploaded documents
      const docsToMerge = [];

      // Iterate categories in order
      for (const category of Object.values(DOCUMENT_CATEGORIES)) {
        for (const item of category.items) {
          const doc = documents[item.id];
          if (doc && doc.uploaded && doc.fileUrl) {
            // Determine type
            let type = 'unknown';
            if (doc.fileName) {
              const ext = doc.fileName.split('.').pop()?.toLowerCase();
              if (ext) type = ext;
            }
            // Normalize type for backend
            if (type === 'jpeg') type = 'jpg';

            docsToMerge.push({
              url: doc.fileUrl,
              name: item.name,
              type: type
            });
          }
        }
      }

      if (docsToMerge.length === 0) {
        toast({
          title: "No hay documentos",
          description: "No hay documentos subidos para descargar.",
          variant: "destructive"
        });
        return;
      }

      console.log('Sending documents to merge:', docsToMerge);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: docsToMerge })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Documentos_${candidateName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Descarga completada",
        description: "El PDF unificado se ha descargado correctamente.",
      });

    } catch (error: any) {
      console.error('Error downloading all documents:', error);
      toast({
        title: "Error en la descarga",
        description: error.message || "No se pudo generar el PDF unificado.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <FileText className="h-4 w-4" />;

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCompletionStats = () => {
    const total = Object.keys(documents).length;
    const uploaded = Object.values(documents).filter(doc => doc.uploaded).length;
    const required = Object.values(documents).filter(doc => doc.required).length;
    const requiredUploaded = Object.values(documents).filter(doc => doc.required && doc.uploaded).length;

    return { total, uploaded, required, requiredUploaded };
  };

  const { total, uploaded, required, requiredUploaded } = getCompletionStats();
  const completionPercentage = total > 0 ? (uploaded / total) * 100 : 0;
  const requiredCompletionPercentage = required > 0 ? (requiredUploaded / required) * 100 : 0;

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-12">
          <div className="flex flex-col justify-center items-center py-8 text-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mb-4"></div>
            <span className="font-medium tracking-wide">Cargando documentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <Card className="border-0 shadow-md bg-white overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 p-6 md:p-8 relative">
          {isAdmin && (
            <div className="absolute right-6 top-6 hidden md:block">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-all text-slate-700"
                onClick={handleDownloadAll}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Download className="h-4 w-4 text-slate-500" />
                )}
                Descargar Todo PDF
              </Button>
            </div>
          )}
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100/50 rounded-2xl mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-slate-800 font-bold tracking-tight mb-4">
              Requisitos de Ingreso
            </CardTitle>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              A continuación, encontrará el listado de documentos requeridos para el ingreso a la empresa{' '}
              <strong className="text-slate-800 font-semibold">INTELLIGENT CUSTOMER ACQUISITION SAS</strong>. 
              El aporte de esta documentación es requisito de obligatorio cumplimiento dentro del proceso de contratación.
            </p>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 mt-4 bg-white hover:bg-slate-50 border-slate-200 shadow-sm md:hidden text-slate-700 w-full justify-center"
                onClick={handleDownloadAll}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Download className="h-4 w-4 text-slate-500" />
                )}
                Descargar Todo PDF
              </Button>
            )}
          </div>
          {isReadOnly && (
            <div className="mt-6 p-4 bg-blue-50/80 border border-blue-200/60 rounded-xl max-w-2xl mx-auto flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-semibold">
                  Vista de Solo Lectura - Candidato Contratado
                </p>
                <p className="text-sm text-blue-700/80 mt-1">
                  Los documentos ya han sido procesados y no pueden ser editados o modificados.
                </p>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-6 md:p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-5 bg-blue-50/40 rounded-2xl border border-blue-100/50 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                <div className="text-4xl font-black tracking-tight text-blue-600 mb-2">{uploaded}<span className="text-2xl text-blue-400 font-bold">/{total}</span></div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">Documentos Subidos</div>
              </div>
              <div className="text-center p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                <div className="text-4xl font-black tracking-tight text-emerald-600 mb-2">{requiredUploaded}<span className="text-2xl text-emerald-400 font-bold">/{required}</span></div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">Obligatorios Completados</div>
              </div>
              <div className="text-center p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                <div className="text-4xl font-black tracking-tight text-indigo-600 mb-2">{Math.round(completionPercentage)}<span className="text-2xl text-indigo-400 font-bold">%</span></div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">Progreso General</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Progreso de carga</span>
                <span className="text-slate-800 font-bold">{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-3 rounded-full bg-slate-100" />
            </div>

            {requiredCompletionPercentage < 100 && (
              <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl shadow-sm">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <AlertDescription className="ml-2 font-medium">
                  Faltan {required - requiredUploaded} documentos obligatorios por subir para completar el expediente.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Categories */}
      {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, category]) => (
        <Card key={categoryKey} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-lg text-slate-800 font-bold flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-3 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              {category.title}
            </CardTitle>
            {category.subtitle && (
              <p className="text-sm text-slate-500 font-medium mt-1 ml-5">{category.subtitle}</p>
            )}
            {category.description && (
              <p className="text-sm text-slate-600 mt-2 ml-5 leading-relaxed">{category.description}</p>
            )}
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              {category.items
                .filter((item) => isAdmin || item.id !== 'examenes-medicos')
                .map((item) => {
                  const doc = documents[item.id];
                  const isUploading = uploading[item.id];

                  return (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 gap-4 group">
                      <div className="flex items-start md:items-center gap-4 flex-1">
                        <div className="mt-0.5 md:mt-0">
                          {doc?.uploaded ? (
                            <div className="bg-green-100 p-1.5 rounded-full">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            </div>
                          ) : item.required ? (
                            <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-red-50 transition-colors">
                              <AlertCircle className="h-5 w-5 text-slate-400 group-hover:text-red-500 flex-shrink-0" />
                            </div>
                          ) : (
                            <div className="bg-slate-100 p-1.5 rounded-full">
                              <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="font-semibold text-sm text-slate-800 leading-snug">
                            {item.name}
                            {item.required && <span className="text-red-500 ml-1" title="Requerido">*</span>}
                          </div>
                          {item.description && (
                            <div className="text-sm text-slate-500 mt-1 leading-relaxed">{item.description}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {doc?.uploaded && doc.uploadedAt && (
                              <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-flex items-center">
                                <Check className="h-3 w-3 mr-1" />
                                Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                              </div>
                            )}
                            {doc?.feedback && (
                              <div className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md inline-flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Nota: {doc.feedback}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
                        {doc?.uploaded && doc.fileUrl && (
                          <div className="flex items-center gap-1">
                            {getFileIcon(doc.fileName || doc.fileUrl)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(doc)}
                              title="Ver documento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {isAdmin && !isReadOnly ? (
                          // Admin view: Show all management buttons including upload (only if not read-only)
                          <div className="flex items-center gap-2">
                            {/* Status Badges for Admin */}
                            {doc?.uploaded && (
                              <>
                                {doc.status === 'approved' && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Aprobado</Badge>}
                                {doc.status === 'rejected' && <Badge variant="destructive">Rechazado</Badge>}
                                {doc.status === 'pending' && <Badge variant="outline">Pendiente</Badge>}
                              </>
                            )}

                            {/* Upload/Replace button for recruiters */}
                            <div>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                                onChange={(e) => handleFileSelect(item.id, e)}
                                className="hidden"
                                id={`file-${item.id}`}
                                disabled={isUploading}
                              />
                              <label htmlFor={`file-${item.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  disabled={isUploading}
                                >
                                  <span className="cursor-pointer">
                                    {isUploading ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600 mr-2"></div>
                                        Subiendo...
                                      </>
                                    ) : doc?.uploaded ? (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Reemplazar
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Subir
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </label>
                            </div>

                            {/* Management buttons - only show if document is uploaded */}
                            {doc?.uploaded && (
                              <div className="flex items-center gap-1">
                                {doc.status !== 'approved' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(item.id, 'approved')}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Aprobar documento"
                                    disabled={processingStatus}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                {doc.status !== 'rejected' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRejectDialog(item.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Rechazar documento"
                                    disabled={processingStatus}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(item.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar documento"
                                  disabled={processingStatus}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            {/* Show re-upload requested indicator */}
                            {doc?.needsReupload && !doc?.uploaded && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                Re-carga solicitada
                              </Badge>
                            )}
                          </div>
                        ) : (
                          // Public view: Hide upload button once document is uploaded
                          !isReadOnly && (
                            <div className="flex items-center gap-2">
                              {doc?.uploaded && (
                                <>
                                  {doc.status === 'approved' && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Aprobado</Badge>}
                                  {doc.status === 'rejected' && <Badge variant="destructive">Rechazado</Badge>}
                                  {doc.status === 'pending' && <Badge variant="outline">Pendiente</Badge>}
                                </>
                              )}
                              {!doc?.uploaded || doc?.needsReupload ? (
                                <div>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                                    onChange={(e) => handleFileSelect(item.id, e)}
                                    className="hidden"
                                    id={`file-${item.id}`}
                                    disabled={isUploading}
                                  />
                                  <label htmlFor={`file-${item.id}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      disabled={isUploading}
                                    >
                                      <span className="cursor-pointer">
                                        {isUploading ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600 mr-2"></div>
                                            Subiendo...
                                          </>
                                        ) : doc?.needsReupload ? (
                                          <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Subir corregido
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Subir
                                          </>
                                        )}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                              ) : null}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Footer */}
      <div className="py-8 text-center pb-12">
        <div className="inline-flex items-center justify-center space-x-2 text-slate-500 bg-slate-50 px-6 py-3 rounded-full border border-slate-100 shadow-sm">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium tracking-wide">Agradecemos su colaboración y compromiso</span>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentUrl={viewerDocument.url}
        documentName={viewerDocument.name}
        documentType={viewerDocument.type}
      />
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Documento</DialogTitle>
            <DialogDescription>
              Por favor indica el motivo del rechazo. Este mensaje será visible para el candidato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Motivo del rechazo</Label>
              <Textarea
                id="feedback"
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                placeholder="Ej: El documento no es legible, falta la firma, etc."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => selectedDocumentId && handleUpdateStatus(selectedDocumentId, 'rejected', rejectionFeedback)}
              disabled={!rejectionFeedback.trim() || processingStatus}
            >
              {processingStatus ? 'Procesando...' : 'Rechazar Documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentChecklist;