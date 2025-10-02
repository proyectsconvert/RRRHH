
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/ui/pdf-viewer';
import CandidateSidebar from '@/components/candidates/CandidateSidebar';
import AnalysisContent from '@/components/candidates/AnalysisContent';
import ResumeContent from '@/components/candidates/ResumeContent';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import TeamsMeetingDialog, { MeetingData } from '@/components/candidates/TeamsMeetingDialog';
import DocumentChecklist from '@/components/candidates/DocumentChecklist';
import { sendWelcomeMessage } from '@/utils/evolution-api';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchCandidateDetails, 
  saveAnalysisData, 
  analyzeResume, 
  getResumeUrl, 
  saveResumeText 
} from '@/services/candidate-service';
import { getStatusText, getJobTypeText } from '@/utils/formatters';
import { Candidate } from '@/types/candidate';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingResumeText, setSavingResumeText] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false);
  const [currentInterviewType, setCurrentInterviewType] = useState<'entrevista-rc' | 'entrevista-et' | null>(null);
  const [recruiters, setRecruiters] = useState<{id: string, first_name: string, last_name: string}[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [currentUserRecruiter, setCurrentUserRecruiter] = useState<{id: string, first_name: string, last_name: string} | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('ID de candidato no proporcionado');
        }
        
        console.log('Buscando candidato con ID:', id);
        
        const candidateData = await fetchCandidateDetails(id);
        console.log('Candidato cargado:', candidateData);
        
        // Set resume content if it exists
        if (candidateData.resume_text) {
          console.log('Texto del CV encontrado, longitud:', candidateData.resume_text.length);
          setResumeContent(candidateData.resume_text);
        } else {
          console.log('No se encontró texto del CV');
        }
        
        setCandidate(candidateData);
      } catch (error: any) {
        console.error('Error al cargar candidato:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo cargar los detalles del candidato"
        });
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRecruiters = async () => {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);

        // Get current user's role
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!userError && userProfile) {
          setCurrentUserRole(userProfile.role);
        } else {
          // Fallback: if role is not found, assume regular user (show all candidates)
          setCurrentUserRole(null);
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'reclutador')
        .order('first_name');
      if (error) {
        console.error("Error fetching recruiters:", error);
      } else {
        const recruitersList = data || [];
        setRecruiters(recruitersList);

        // Check if current user is a recruiter and set as default
        if (user) {
          const currentUserAsRecruiter = recruitersList.find(r => r.id === user.id);
          if (currentUserAsRecruiter) {
            setCurrentUserRecruiter(currentUserAsRecruiter);
            setSelectedRecruiter(user.id); // Set current user as selected by default
          }
        }
      }
    };

    if (id) loadCandidate();
    fetchRecruiters();
  }, [id, toast]);

  const handleSaveResumeText = async (text: string) => {
    try {
      if (!id) return;
      
      setSavingResumeText(true);
      console.log('Guardando texto extraído para el candidato:', id);
      console.log('Longitud del texto:', text.length);
      
      await saveResumeText(id, text);
      
      setResumeContent(text);
      
      toast({
        title: "Texto guardado",
        description: "El texto extraído del CV ha sido guardado correctamente"
      });
      
    } catch (error: any) {
      console.error('Error al guardar texto del CV:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el texto extraído"
      });
    } finally {
      setSavingResumeText(false);
    }
  };

  const handleSaveAnalysisData = async (analysisResult: any, extractedText: string) => {
    try {
      if (!id) return;

      console.log('Guardando datos de análisis para el candidato:', id);
      
      await saveAnalysisData(id, analysisResult, extractedText);
      
      toast({
        title: "Datos guardados",
        description: "La información del candidato ha sido guardada en la base de datos"
      });
      
    } catch (error: any) {
      console.error('Error al guardar datos del candidato:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar los datos del candidato"
      });
    }
  };

  const handleAnalyzeCV = async (applicationId?: string) => {
    if (!candidate?.resume_url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay CV disponible para análisis"
      });
      return;
    }

    if (!resumeContent) {
      toast({
        title: "Información",
        description: "Primero debe extraer el texto del CV. Abriendo visor de PDF..."
      });
      setPdfViewerOpen(true);
      return;
    }

    try {
      setAnalyzing(true);
      
      // Get job details if application ID is provided
      let jobContext = null;
      if (applicationId) {
        const application = candidate.applications?.find(app => app.id === applicationId);
        if (application) {
          jobContext = {
            title: application.job_title,
            requirements: application.job_requirements,
            responsibilities: application.job_responsibilities,
            description: application.job_description
          };
          setJobDetails(jobContext);
        }
      }

      toast({ title: "Analizando", description: "Evaluando ajuste del candidato..." });

      // Asegurar que el texto del CV esté guardado antes de analizar
      await handleSaveResumeText(resumeContent);

      const analysisResult = await analyzeResume(resumeContent, jobContext);
      
      // Parse the result to ensure it's JSON
      let parsedAnalysis;
      try {
        // If it's already an object (already parsed by Supabase client)
        if (typeof analysisResult === 'object') {
          parsedAnalysis = analysisResult;
        } else {
          // If it's a JSON string
          parsedAnalysis = JSON.parse(analysisResult);
        }
      } catch (error) {
        console.error("Error al parsear el análisis:", error);
        parsedAnalysis = { error: "No se pudo parsear el análisis" };
      }

      // Save analysis data and resume text
      await handleSaveAnalysisData(analysisResult, resumeContent);

      // Update local state
      setCandidate(prev => prev ? { 
        ...prev, 
        analysis_summary: analysisResult,
        analysis_data: parsedAnalysis,
        resume_text: resumeContent
      } : null);

      toast({
        title: "Análisis completado",
        description: "Evaluación del candidato finalizada correctamente"
      });
      
    } catch (error: any) {
      console.error('Error de análisis:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al analizar el CV"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTextExtracted = (text: string) => {
    console.log("Texto extraído en el componente principal:", text.substring(0, 100) + "...");
    setResumeContent(text);

    toast({
      title: "Texto extraído",
      description: "El contenido del CV ha sido extraído correctamente"
    });
  };

  // Helper function to check if current user can modify this candidate
  const canModifyCandidate = (candidate: Candidate): boolean => {
    // Admins can modify all candidates
    if (currentUserRole === 'admin') return true;

    // Non-recruiters can't modify candidates
    if (currentUserRole !== 'reclutador') return false;

    // Recruiters can only modify candidates where:
    // 1. No interview is assigned (recruiter_id is null), OR
    // 2. The interview is assigned to them (recruiter_id === currentUserId)
    if (!candidate.applications || candidate.applications.length === 0) return true;

    return candidate.applications.some(app =>
      !app.recruiter_id || app.recruiter_id === currentUserId
    );
  };

  const handleChangeStatus = () => {
    if (candidate && !canModifyCandidate(candidate)) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para cambiar el estado de este candidato",
        variant: "destructive"
      });
      return;
    }
    setStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    if (!newStatus || !candidate) return;

    // Check permissions before allowing status change
    if (!canModifyCandidate(candidate)) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para cambiar el estado de este candidato",
        variant: "destructive"
      });
      setStatusModalOpen(false);
      return;
    }

    // For interview statuses, show Teams dialog instead of updating immediately
    if (newStatus === 'entrevista-rc' || newStatus === 'entrevista-et') {
      setCurrentInterviewType(newStatus);
      setIsTeamsDialogOpen(true);
      setStatusModalOpen(false);
      return;
    }

    try {
      // Update status for all candidate applications
      const updates = [];
      if (candidate.applications) {
        for (const app of candidate.applications) {
          updates.push(
            supabase
              .from('applications')
              .update({
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', app.id)
          );
        }
      }

      await Promise.all(updates);

      // Send welcome message to candidates whose status changed to "contratar"
      if (newStatus === 'contratar') {
        if (candidate.phone) {
          try {
            const candidateName = `${candidate.first_name} ${candidate.last_name}`;
            const documentUrl = `${window.location.origin}/candidate-documents/${candidate.id}`;
            await sendWelcomeMessage(candidate.phone, candidateName, documentUrl);
            console.log(`Welcome message sent to ${candidateName} (${candidate.phone})`);
          } catch (error) {
            console.error(`Failed to send welcome message to ${candidate.first_name} ${candidate.last_name}:`, error);
            toast({
              title: "Advertencia",
              description: "El estado se cambió correctamente pero no se pudo enviar el mensaje de WhatsApp",
              variant: "destructive"
            });
          }
        } else {
          console.warn(`No phone number found for candidate ${candidate.first_name} ${candidate.last_name}`);
        }
      }

      toast({
        title: "Estado actualizado",
        description: "El estado del candidato ha sido actualizado correctamente",
      });

      setStatusModalOpen(false);
      setNewStatus("");
      setSelectedRecruiter("");

      // Refresh candidate data
      if (id) {
        const candidateData = await fetchCandidateDetails(id);
        setCandidate(candidateData);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del candidato",
        variant: "destructive"
      });
    }
  };

  const handleMeetingCreated = async (meetingData: MeetingData) => {
    if (!candidate || !currentInterviewType) return;

    // Double-check permissions before creating meeting and updating status
    if (!canModifyCandidate(candidate)) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para cambiar el estado de este candidato",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update candidate status to interview type
      const updates = [];
      if (candidate.applications) {
        for (const app of candidate.applications) {
          updates.push(
            supabase
              .from('applications')
              .update({
                status: currentInterviewType,
                updated_at: new Date().toISOString()
              })
              .eq('id', app.id)
          );
        }
      }

      await Promise.all(updates);

      // Send message via Evolution API
      if (candidate.phone) {
        try {
          // Format time with AM/PM
          const [hours, minutes] = meetingData.time.split(':');
          const hour24 = parseInt(hours);
          const ampm = hour24 >= 12 ? 'PM' : 'AM';
          const hour12 = hour24 % 12 || 12;
          const timeFormatted = `${hour12}:${minutes} ${ampm}`;

          const interviewTypeText = currentInterviewType === 'entrevista-rc' ? 'Si entrevista RC' : 'Si entrevista Técnica';
          const dateTimeStr = `${meetingData.date.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

          const message = `Felicidades, está en proceso de entrevista ${interviewTypeText}, quedo para el día ${dateTimeStr} con este link: ${meetingData.meetingLink}`;

          const { sendEvolutionMessage } = await import('@/utils/evolution-api');
          await sendEvolutionMessage(candidate.phone, message, true);

          console.log(`Interview message sent to ${candidate.first_name} ${candidate.last_name} (${candidate.phone})`);
        } catch (error) {
          console.error(`Failed to send interview message to ${candidate.first_name} ${candidate.last_name}:`, error);
          toast({
            title: "Advertencia",
            description: "La reunión se creó correctamente pero no se pudo enviar el mensaje de WhatsApp",
            variant: "destructive"
          });
        }
      } else {
        console.warn(`No phone number found for candidate ${candidate.first_name} ${candidate.last_name}`);
        toast({
          title: "Advertencia",
          description: "La reunión se creó correctamente pero el candidato no tiene número de teléfono registrado",
          variant: "destructive"
        });
      }

      toast({
        title: "Reunión programada",
        description: `Entrevista programada para ${meetingData.date.toLocaleDateString('es-ES')} a las ${meetingData.time}. Link enviado al candidato.`,
      });

      // Reset state
      setCurrentInterviewType(null);
      setNewStatus("");
      setSelectedRecruiter("");

      // Refresh candidate data
      if (id) {
        const candidateData = await fetchCandidateDetails(id);
        setCandidate(candidateData);
      }
    } catch (error) {
      console.error('Error creating meeting and updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la reunión y actualizar el estado",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="py-10">
        <Card>
          <CardHeader>
            <CardTitle>Candidato no encontrado</CardTitle>
            <CardDescription>El candidato solicitado no existe</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/admin/candidates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a candidatos
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const pdfUrl = candidate.resume_url ? getResumeUrl(candidate.resume_url) : null;

  // Check if candidate is in hiring process
  const isInHiringProcess = candidate.applications?.some(app => app.status === 'contratar');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/admin/candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Perfil del Candidato</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <CandidateSidebar
          candidate={candidate}
          analyzing={analyzing}
          resumeContent={resumeContent}
          onViewResume={() => setPdfViewerOpen(true)}
          onAnalyzeCV={handleAnalyzeCV}
          onChangeStatus={handleChangeStatus}
          getStatusText={getStatusText}
          canModifyCandidate={canModifyCandidate}
        />

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <AnalysisContent
            analysisData={candidate.analysis_data}
            jobDetails={jobDetails}
            analyzing={analyzing}
            resumeContent={resumeContent}
            onAnalyzeCV={handleAnalyzeCV}
            applicationId={candidate.applications?.[0]?.id}
          />

          <ResumeContent
            resumeContent={resumeContent}
            onSaveContent={handleSaveResumeText}
            isSaving={savingResumeText}
          />

          {/* Document Checklist - Only show for candidates in hiring process */}
          {isInHiringProcess && (
            <DocumentChecklist
              candidateId={candidate.id}
              candidateName={`${candidate.first_name} ${candidate.last_name}`}
              onDocumentUploaded={() => {
                // Optional: refresh candidate data if needed
                console.log('Document uploaded, candidate data refresh if needed');
              }}
            />
          )}
        </div>
      </div>
      
      {/* PDF Viewer */}
      {pdfUrl && (
        <PDFViewer
          url={pdfUrl}
          isOpen={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          title={`CV de ${candidate.first_name} ${candidate.last_name}`}
          onTextExtracted={handleTextExtracted}
          onAnalyze={() => handleAnalyzeCV(candidate.applications?.[0]?.id)}
        />
      )}

      {/* Status Change Dialog */}
      <Dialog open={isStatusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-none">
          <DialogHeader className="bg-hrm-dark-primary py-9 px-6 rounded-t-lg border-none shadow-none">
            <DialogTitle className="text-white text-xl">Cambiar Estado del Candidato</DialogTitle>
            <DialogDescription className="text-gray-200">
              Selecciona el nuevo estado para {candidate.first_name} {candidate.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 px-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrevista-rc">Asignar Entrevista (RC)</SelectItem>
                  <SelectItem value="entrevista-et">Asignar Entrevista Técnica (ET)</SelectItem>
                  <SelectItem value="asignar-campana">Asignar Campaña</SelectItem>
                  <SelectItem value="contratar">Proceso de contratación</SelectItem>
                  <SelectItem value="training">En Formación</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="discarded">Descartado</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* --- SELECT DE RECLUTADOR --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recruiter" className="text-right">
                Reclutador
              </Label>
              <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                <SelectTrigger id="recruiter" className="col-span-3">
                  <SelectValue placeholder={currentUserRecruiter ? `${currentUserRecruiter.first_name} ${currentUserRecruiter.last_name}` : "Selecciona un reclutador"} />
                </SelectTrigger>
                <SelectContent>
                  {recruiters.map((recruiter) => (
                    <SelectItem key={recruiter.id} value={recruiter.id}>
                      {recruiter.first_name} {recruiter.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleStatusChange}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teams Meeting Dialog */}
      <TeamsMeetingDialog
        isOpen={isTeamsDialogOpen}
        onClose={() => setIsTeamsDialogOpen(false)}
        onMeetingCreated={handleMeetingCreated}
        candidateName={`${candidate.first_name} ${candidate.last_name}`}
        interviewType={currentInterviewType || 'entrevista-rc'}
      />
    </div>
  );
};

export default CandidateDetail;
