import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Image, CheckCircle, XCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
}

const DOCUMENT_CATEGORIES: Record<string, DocumentCategory> = {
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
        id: "antecedentes",
        name: "CERTIFICADO DE ANTECEDENTES DISCIPLINARIOS (Policía, Contraloría, Procuraduría)",
        description: "",
        required: true
      },
      {
        id: "referencias-personales",
        name: "2 REFERENCIAS PERSONALES (Firmadas, no mayor a 30 días)",
        description: "",
        required: true
      },
      {
        id: "certificaciones-laborales",
        name: "2 CERTIFICACIONES LABORALES (Los últimos dos trabajos)",
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
  onDocumentUploaded
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<{[key: string]: DocumentItem}>({});
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<{
    url?: string;
    name?: string;
    type?: string;
  }>({});

  useEffect(() => {
    loadDocumentStatus();
  }, [candidateId]);

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
      const allDocuments: {[key: string]: DocumentItem} = {};

      // Process each document and generate fresh signed URLs
      for (const category of Object.entries(DOCUMENT_CATEGORIES)) {
        const [categoryKey, categoryData] = category;
        for (const item of categoryData.items) {
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
            fileUrl: fileUrl,
            uploadedAt: existingDoc?.uploaded_at,
            fileName: existingDoc?.file_name
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
          uploaded_at: new Date().toISOString()
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
          fileName: file.name
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

      setViewerDocument({
        url: document.fileUrl,
        name: document.name,
        type: fileType
      });
      setViewerOpen(true);
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
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <span className="ml-2">Cargando documentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">
            REQUISITOS INGRESO DE PERSONAL
          </CardTitle>
          <p className="text-center text-gray-600">
            A continuación, encontrará el listado de documentos que usted debe aportar para el ingreso a la empresa<br />
            <strong>INTELLIGENT CUSTOMER ACQUISITION SAS</strong><br />
            el aporte de esta documentación es requisito de obligatorio cumplimiento dentro del proceso de contratación.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{uploaded}/{total}</div>
                <div className="text-sm text-gray-600">Documentos Subidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{requiredUploaded}/{required}</div>
                <div className="text-sm text-gray-600">Documentos Obligatorios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(completionPercentage)}%</div>
                <div className="text-sm text-gray-600">Completado</div>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {requiredCompletionPercentage < 100 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Faltan {required - requiredUploaded} documentos obligatorios por subir
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Categories */}
      {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, category]) => (
        <Card key={categoryKey}>
          <CardHeader>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            {category.subtitle && (
              <p className="text-sm text-gray-600">{category.subtitle}</p>
            )}
            {category.description && (
              <p className="text-sm text-gray-500 mt-2">{category.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.items.map((item) => {
                const doc = documents[item.id];
                const isUploading = uploading[item.id];

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {doc?.uploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : item.required ? (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}

                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {item.name}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        )}
                        {doc?.uploaded && doc.uploadedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Subido el {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc?.uploaded && doc.fileUrl && (
                        <div className="flex items-center gap-1">
                          {getFileIcon(doc.fileUrl)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

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
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Footer */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 italic">
            Agradecemos su colaboración
          </p>
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentUrl={viewerDocument.url}
        documentName={viewerDocument.name}
        documentType={viewerDocument.type}
      />
    </div>
  );
};

export default DocumentChecklist;