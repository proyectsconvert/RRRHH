
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
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TeamsMeetingDialog, { MeetingData } from '@/components/candidates/TeamsMeetingDialog';
import DocumentChecklist from '@/components/candidates/DocumentChecklist';
import DocumentViewer from '@/components/candidates/DocumentViewer';
import { sendWelcomeMessage, sendEvolutionDocument } from '@/utils/evolution-api';
import { generateRejectionPDF } from '@/utils/rejection-pdf';
import { generateCandidateAccessToken } from '@/utils/candidate-access';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  fetchCandidateDetails,
  saveAnalysisData,
  analyzeResume,
  getResumeUrl,
  saveResumeText,
  updateCandidateContactInfo
} from '@/services/candidate-service';
import { getStatusText, getJobTypeText } from '@/utils/formatters';
import { Candidate } from '@/types/candidate';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
}

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingResumeText, setSavingResumeText] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false);
  const [currentInterviewType, setCurrentInterviewType] = useState<'entrevista-rc' | 'entrevista-et' | 'prueba-tecnica' | null>(null);
  const [recruiters, setRecruiters] = useState<{ id: string, first_name: string, last_name: string }[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [currentUserRecruiter, setCurrentUserRecruiter] = useState<{ id: string, first_name: string, last_name: string } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);
  const [hireStartDate, setHireStartDate] = useState<Date | undefined>(undefined);
  const [textExtracted, setTextExtracted] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  // Training Session State
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingDate, setTrainingDate] = useState<Date | undefined>(undefined);
  const [trainingTime, setTrainingTime] = useState("09:00");
  const [trainingDescription, setTrainingDescription] = useState("");
  const [trainingModality, setTrainingModality] = useState<'virtual' | 'presencial'>('virtual');
  const [trainingAddress, setTrainingAddress] = useState("");
  const [trainingLink, setTrainingLink] = useState("");

  // Hiring Process Deadline State
  const [hiringDeadlineDate, setHiringDeadlineDate] = useState<Date | undefined>(undefined);
  const [hiringDeadlineTime, setHiringDeadlineTime] = useState("17:00");

  // Debug: Log when component mounts and receives props
  useEffect(() => {
    console.log('🏗️ CandidateDetail component mounted/updated:', {
      id,
      hasCandidate: !!candidate,
      candidateId: candidate?.id,
      hasResumeContent: !!resumeContent,
      resumeContentLength: resumeContent?.length
    });
  }, [id, candidate, resumeContent]);


  useEffect(() => {
    const loadCandidate = async () => {
      // Skip loading if data is already loaded for this candidate
      if (dataLoaded && candidate?.id === id) {
        return;
      }

      try {
        setLoading(true);

        if (!id) {
          throw new Error('ID de candidato no proporcionado');
        }

        console.log('Buscando candidato con ID:', id);

        const candidateData = await fetchCandidateDetails(id);
        console.log('Candidato cargado:', candidateData);

        // Load resume_text from database to check if extraction is needed
        console.log('Verificando si existe texto del CV en la base de datos...');

        // Check if candidate has valid resume_text (not PDF binary content)
        const hasValidText = candidateData.resume_text &&
          candidateData.resume_text.trim().length > 0 &&
          !candidateData.resume_text.trim().startsWith('%PDF-') &&
          !candidateData.resume_text.includes('obj <</Type/') &&
          !candidateData.resume_text.includes('/Filter/FlateDecode');

        if (hasValidText) {
          console.log('--Texto válido del CV encontrado en la base de datos, cargando...');
          setResumeContent(candidateData.resume_text);
          setTextExtracted(true);
        }
        // Removed automatic CV opening and text extraction from candidate profile
        // Users must manually click "Ver CV" button to open the PDF viewer

        // Set resume content for auto-analysis check
        if (hasValidText) {
          setResumeContent(candidateData.resume_text);
        }


        setCandidate(candidateData);
        setDataLoaded(true);
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
      // Only fetch recruiters if not already loaded
      if (recruiters.length > 0) return;

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

    const fetchActiveCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    fetchActiveCampaigns();
  }, [id, toast, dataLoaded, candidate?.id, recruiters.length]);


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
    console.log('handleAnalyzeCV called with applicationId:', applicationId);
    console.log('resumeContent length:', resumeContent?.length);
    console.log('candidate resume_url:', candidate?.resume_url);

    // If we don't have resume content, try to open PDF viewer to extract it first
    if (!resumeContent) {
      console.log('No resume content found, opening PDF viewer');
      toast({
        title: "Información",
        description: "Primero debe extraer el texto del CV. Abriendo visor de PDF..."
      });
      setPdfViewerOpen(true);
      return;
    }

    console.log('Proceeding with CV analysis...');

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

      console.log('Setting analyzing state to true');
      toast({ title: "Analizando", description: "Evaluando ajuste del candidato..." });

      // Asegurar que el texto del CV esté guardado antes de analizar
      console.log('Saving resume text before analysis...');
      await handleSaveResumeText(resumeContent);
      console.log('Resume text saved, proceeding with analysis');

      console.log('Calling analyzeResume function...');
      const analysisResult = await analyzeResume(resumeContent, jobContext);
      console.log('analyzeResume completed, result type:', typeof analysisResult);

      // Parse the result to ensure it's JSON
      let parsedAnalysis;
      try {
        // If it's already an object (already parsed by Supabase client)
        if (typeof analysisResult === 'object') {
          parsedAnalysis = analysisResult;
          console.log('Analysis result is already an object');
        } else {
          // If it's a JSON string
          console.log('Parsing analysis result as JSON string');
          parsedAnalysis = JSON.parse(analysisResult);
        }
        console.log('Parsed analysis:', parsedAnalysis);
      } catch (error) {
        console.error("Error al parsear el análisis:", error);
        parsedAnalysis = { error: "No se pudo parsear el análisis" };
      }

      // Save analysis data and resume text
      console.log('Saving analysis data...');
      await handleSaveAnalysisData(analysisResult, resumeContent);
      console.log('Analysis data saved');

      // Update local state
      console.log('Updating local candidate state...');
      setCandidate(prev => prev ? {
        ...prev,
        analysis_summary: analysisResult,
        analysis_data: parsedAnalysis,
        resume_text: resumeContent
      } : null);
      console.log('Local state updated');

      toast({
        title: "Análisis completado",
        description: "Evaluación del candidato finalizada correctamente"
      });
      console.log('Analysis process completed successfully');

    } catch (error: any) {
      console.error('Error de análisis:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al analizar el CV"
      });
    } finally {
      console.log('Setting analyzing state to false');
      setAnalyzing(false);
    }
  };

  const handleTextExtracted = async (text: string) => {
    console.log("📄 Texto extraído en el componente principal:", text.substring(0, 100) + "...");

    // Validate that we got actual readable text, not PDF binary content
    const isValidText = text &&
      text.trim().length > 0 &&
      !text.trim().startsWith('%PDF-') &&
      !text.includes('obj <</Type/') &&
      !text.includes('/Filter/FlateDecode');

    if (!isValidText) {
      console.error('❌ Texto extraído contiene datos binarios del documento, no se guardará');
      setTranscribing(false);
      toast({
        variant: "destructive",
        title: "Error de extracción",
        description: "No se pudo extraer texto legible del documento. El archivo puede contener solo imágenes o estar corrupto."
      });
      return;
    }

    console.log('✅ Texto válido extraído, actualizando estado...');
    setResumeContent(text);
    setTranscribing(false);
    setTextExtracted(true);

    // Automatically save the extracted text to database
    try {
      console.log('💾 Guardando texto extraído automáticamente...');
      await saveResumeText(id!, text);
      console.log('✅ Texto guardado exitosamente en la base de datos');
    } catch (error) {
      console.error('❌ Error al guardar texto automáticamente:', error);
      // Don't show error toast for auto-save, just log it
    }

    toast({
      title: "Texto extraído",
      description: "El contenido del CV ha sido extraído correctamente"
    });
  };

  // Helper function to check if current user can modify this candidate
  const canModifyCandidate = (candidate: Candidate, newStatus?: string): boolean => {
    // Check if candidate is already hired - allow modifications only for "finalizar-contrato" or "retirar"
    const isHired = candidate.applications?.some(app => app.status === 'contratado');
    if (isHired && newStatus !== 'finalizar-contrato' && newStatus !== 'retirar') return false;

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

    // Check if candidate is already hired - prevent status changes except "retirar" or "finalizar-contrato"
    const isHired = candidate.applications?.some(app => app.status === 'contratado');
    if (isHired && newStatus !== 'retirar' && newStatus !== 'finalizar-contrato') {
      toast({
        title: "Estado Final",
        description: "Este candidato ya está contratado. Solo se puede cambiar a 'Retirar' o 'Finalizar Contrato'.",
        variant: "destructive"
      });
      setStatusModalOpen(false);
      return;
    }

    setStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    console.log('handleStatusChange called with newStatus:', newStatus);


    if (!newStatus || !candidate) {
      console.log('Missing newStatus or candidate');
      return;
    }

    // CRITICAL FIX: Check for interview statuses IMMEDIATELY
    const targetStatus = newStatus.trim();
    console.log('Target status:', targetStatus);

    if (targetStatus === 'entrevista-rc' || targetStatus === 'entrevista-et' || targetStatus === 'prueba-tecnica') {
      console.log('INTERVIEW STATUS DETECTED - Opening dialog and STOPPING update');
      toast({
        title: "Programar Entrevista / Prueba",
        description: "Abriendo formulario de programación...",
      });
      setCurrentInterviewType(targetStatus as 'entrevista-rc' | 'entrevista-et' | 'prueba-tecnica');
      setIsTeamsDialogOpen(true);
      setStatusModalOpen(false);
      return; // STOP HERE
    }

    // For asignar-campana, we now handle it inline in the dialog, so we proceed to execution
    // but first we validate if fields are filled if status is asignar-campana
    if (targetStatus === 'asignar-campana') {
      if (!trainingDate || !trainingTime) {
        toast({
          title: "Campos requeridos",
          description: "Por favor selecciona fecha y hora para el inicio de formación",
          variant: "destructive"
        });
        return;
      }
      if (trainingModality === 'virtual' && !trainingLink) {
        toast({
          title: "Campos requeridos",
          description: "Por favor ingresa el link de la reunión",
          variant: "destructive"
        });
        return;
      }
      if (trainingModality === 'presencial' && !trainingAddress) {
        toast({
          title: "Campos requeridos",
          description: "Por favor ingresa la dirección",
          variant: "destructive"
        });
        return;
      }
    }

    // ONLY proceed with DB update if NOT an interview status
    console.log('Proceeding with database update for status:', targetStatus);

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

    // Check if candidate is already hired - prevent status changes except "retirar" or "finalizar-contrato"
    const isHired = candidate.applications?.some(app => app.status === 'contratado');
    if (isHired && newStatus !== 'retirar' && newStatus !== 'finalizar-contrato') {
      toast({
        title: "Estado Final",
        description: "Este candidato ya está contratado. Solo se puede cambiar a 'Retirar' o 'Finalizar Contrato'.",
        variant: "destructive"
      });
      setStatusModalOpen(false);
      return;
    }

    console.log('Proceeding with database update for status:', targetStatus);

    // SAFETY CHECK: Ensure we never update to interview status here (redundant but necessary)
    if (targetStatus === 'entrevista-rc' || targetStatus === 'entrevista-et') {
      console.error('CRITICAL ERROR: Attempted to update to interview status outside of dialog flow');
      toast({
        title: "Error Crítico",
        description: "Error interno: Intento de actualización de estado inválido.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update status for all candidate applications
      const updates = [];
      if (candidate.applications) {
        for (const app of candidate.applications) {
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
          };

          if (newStatus === 'asignar-campana') {
            if (selectedCampaign) {
              updateData.campaign_id = selectedCampaign;
            }
            if (trainingDate) {
              updateData.meeting_date = trainingDate.toISOString().split('T')[0];
            }
            updateData.meeting_time = trainingTime || null;
            updateData.meeting_link = trainingLink || null;
            updateData.meeting_title = trainingTitle || 'Inicio de Formación';
            updateData.meeting_modality = trainingModality || null;
            updateData.meeting_address = trainingAddress || null;
            updateData.meeting_status = 'scheduled';
          }

          updates.push(
            supabase
              .from('applications')
              .update(updateData)
              .eq('id', app.id)
          );
        }
      }

      await Promise.all(updates);

      // If status is asignar-campana (Inicio de formación), send WhatsApp message
      if (targetStatus === 'asignar-campana' && candidate.phone && trainingDate) {
        try {
          // Format time
          const [hours, minutes] = trainingTime.split(':');
          const hour24 = parseInt(hours);
          const ampm = hour24 >= 12 ? 'PM' : 'AM';
          const hour12 = hour24 % 12 || 12;
          const timeFormatted = `${hour12}:${minutes} ${ampm}`;
          const dateTimeStr = `${trainingDate.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

          const campaignName = campaigns.find(c => c.id === selectedCampaign)?.name || 'la campaña';
          const jobTitle = candidate.applications?.[0]?.job_title || 'la vacante';

          const locationInfo = trainingModality === 'presencial'
            ? (trainingAddress || 'Carrera 16A #79-25 – Bogotá, El Lago')
            : `Virtual (Enlace de la reunión: ${trainingLink})`;

          const message = `🎉 ¡FELICITACIONES! BIENVENIDO/A A CONVERTIA 🎉\nHoy das un gran paso en tu camino profesional 🚀 Has sido SELECCIONADO/A como *${jobTitle}* para la campaña *${campaignName}*, junto a Convertia ❤️.\n\n📅 Inicio de formación: ${dateTimeStr}\n📍 Lugar: ${locationInfo}\n\n👩💼 Presentarse con:\n•\tSara Lara\n•\tLaura Martínez\n•\tGinneth Algarra\n•\t\n📌 IMPORTANTE\n📝 Debes traer:\n ✓ Hoja de vida actualizada\n✓ Copia de la cédula al 150 %\n✓ Certificados de EPS, pensión y cesantías (si aplica)\n✓ Esfero negro y agenda\n✓ Almuerzo y onces 🍱\n\n✨ Estás a punto de iniciar una nueva etapa llena de aprendizaje, crecimiento y oportunidades. 🚀\nConfirma tu asistencia y prepárate para comenzar esta experiencia con nosotros.`;

          const { sendEvolutionMessage } = await import('@/utils/evolution-api');
          await sendEvolutionMessage(candidate.phone, message, true);
          console.log('Training session message sent');

          // Schedule 7 AM reminder for the training day
          try {
            const [rHours, rMinutes] = trainingTime.split(':');
            const rHour24 = parseInt(rHours);
            const rAmpm = rHour24 >= 12 ? 'p.m.' : 'a.m.';
            const rHour12 = rHour24 % 12 || 12;
            const rTimeFormatted = `${rHour12}:${rMinutes} ${rAmpm}`;

            const locationLine = trainingModality === 'presencial'
              ? `Lugar: ${trainingAddress || 'Sede Convertia'}`
              : `Enlace: ${trainingLink}`;

            const reminderMessage =
              `¡Hola! Hoy es un día importante 💪\n` +
              `Recuerda que hoy inicia tu capacitación ${rTimeFormatted}\n` +
              `${locationLine}\n` +
              `¡Te esperamos con toda la energía! 🚀\n` +
              `Confírmanos por favor tu asistencia, ¡Este es el primer paso hacia un gran logro!`;

            await supabase.from('training_reminders').upsert({
              candidate_id: candidate.id,
              phone: candidate.phone,
              message: reminderMessage,
              scheduled_date: trainingDate.toISOString().split('T')[0],
              sent: false,
              sent_at: null,
            }, { onConflict: 'candidate_id,scheduled_date' });
            console.log('Training reminder scheduled for', trainingDate.toISOString().split('T')[0]);
          } catch (reminderError) {
            console.error('Error scheduling reminder:', reminderError);
            // Non-blocking — don't show error to user
          }
        } catch (msgError) {
          console.error('Error sending training message:', msgError);
          toast({
            title: "Advertencia",
            description: "Estado actualizado pero falló el envío del mensaje de WhatsApp",
            variant: "destructive"
          });
        }
      }

      await Promise.all(updates);

      // Send welcome message to candidates whose status changed to "proceso-contratacion"
      if (newStatus === 'proceso-contratacion') {
        if (candidate.phone) {
          try {
            const candidateName = `${candidate.first_name} ${candidate.last_name}`;

            // Generate access token for this candidate
            const accessToken = await generateCandidateAccessToken(candidate.id, 168); // 7 days
            const documentUrl = `${window.location.origin}/candidate-documents/${candidate.id}?token=${accessToken}`;

            const deadline = hiringDeadlineDate
              ? { date: hiringDeadlineDate, time: hiringDeadlineTime }
              : undefined;
            await sendWelcomeMessage(candidate.phone, candidateName, documentUrl, deadline);
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

      // Send rejection PDF when status changes to "discarded"
      if (targetStatus === 'discarded' && candidate.phone) {
        try {
          const jobTitle = candidate.applications?.[0]?.job_title || 'la vacante';
          const base64Pdf = await generateRejectionPDF(jobTitle);
          await sendEvolutionDocument(candidate.phone, base64Pdf, 'carta-convertia.pdf', '');
          console.log('Rejection PDF sent via WhatsApp');
        } catch (pdfError) {
          console.error('Error sending rejection PDF:', pdfError);
          toast({
            title: "Advertencia",
            description: "Estado actualizado pero no se pudo enviar la carta de rechazo por WhatsApp",
            variant: "destructive"
          });
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

  const handleHire = async () => {
    if (!hireStartDate || !candidate) {
      console.error('Missing hireStartDate or candidate:', { hireStartDate, candidate });
      return;
    }

    console.log('Starting hire process for candidate:', candidate.id, 'with date:', hireStartDate);

    try {
      // Update status to "contratado" for all candidate applications
      const updates = [];
      if (candidate.applications) {
        console.log('Updating applications:', candidate.applications.length);
        for (const app of candidate.applications) {
          console.log('Updating application:', app.id, 'to status: contratado');
          updates.push(
            supabase
              .from('applications')
              .update({
                status: 'contratado',
                hire_date: hireStartDate.toISOString().split('T')[0], // YYYY-MM-DD format
                updated_at: new Date().toISOString()
              })
              .eq('id', app.id)
          );
        }
      }

      console.log('Executing application updates...');
      const updateResults = await Promise.all(updates);
      console.log('Application update results:', updateResults);

      // Check for errors in application updates
      for (let i = 0; i < updateResults.length; i++) {
        if (updateResults[i].error) {
          console.error(`Error updating application ${candidate.applications?.[i]?.id}:`, updateResults[i].error);
          throw new Error(`Failed to update application: ${updateResults[i].error.message}`);
        }
      }

      // Also update the candidate status to "contratado" in the candidates table
      console.log('Updating candidate table...');
      const { data: candidateUpdateData, error: candidateUpdateError } = await supabase
        .from('candidates')
        .update({
          status: 'contratado',
          hire_date: hireStartDate.toISOString().split('T')[0], // YYYY-MM-DD format
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id)
        .select('id, status, hire_date');

      if (candidateUpdateError) {
        console.error('Error updating candidate table:', candidateUpdateError);
        throw new Error(`Failed to update candidate status: ${candidateUpdateError.message}`);
      }

      console.log('Candidate update result:', candidateUpdateData);

      // Send welcome message via Evolution API
      if (candidate.phone) {
        try {
          const candidateName = `${candidate.first_name} ${candidate.last_name}`;
          const formattedDate = format(hireStartDate, 'dd/MM/yyyy', { locale: es });
          const message = `Bienvenido a convertía ${candidateName}, gracias por hacer parte de este equipo, inicias labores desde el día ${formattedDate}`;

          const { sendEvolutionMessage } = await import('@/utils/evolution-api');
          await sendEvolutionMessage(candidate.phone, message, true);

          console.log(`Welcome message sent to ${candidateName} (${candidate.phone})`);
        } catch (error) {
          console.error(`Failed to send welcome message to ${candidate.first_name} ${candidate.last_name}:`, error);
          toast({
            title: "Advertencia",
            description: "El candidato fue contratado correctamente pero no se pudo enviar el mensaje de WhatsApp",
            variant: "destructive"
          });
        }
      } else {
        console.warn(`No phone number found for candidate ${candidate.first_name} ${candidate.last_name}`);
      }

      toast({
        title: "Candidato Contratado",
        description: `${candidate.first_name} ${candidate.last_name} ha sido contratado exitosamente. Inicia labores el ${format(hireStartDate, 'dd/MM/yyyy', { locale: es })}.`,
      });

      setIsHireDialogOpen(false);
      setHireStartDate(undefined);

      // Refresh candidate data
      if (id) {
        console.log('Refreshing candidate data...');
        try {
          const candidateData = await fetchCandidateDetails(id);
          console.log('Refreshed candidate data:', {
            id: candidateData.id,
            status: candidateData.status,
            hire_date: candidateData.hire_date,
            applicationsCount: candidateData.applications?.length,
            applicationStatuses: candidateData.applications?.map(app => ({ id: app.id, status: app.status }))
          });
          setCandidate(candidateData);
          console.log('Candidate data refreshed successfully');
        } catch (refreshError) {
          console.error('Error refreshing candidate data:', refreshError);
          toast({
            title: "Advertencia",
            description: "El candidato fue contratado pero hubo un error al refrescar los datos. Recarga la página para ver los cambios.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error hiring candidate:', error);
      toast({
        title: "Error",
        description: "No se pudo contratar al candidato",
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
          // Format time as H:MM A.M./P.M.
          const [hours, minutes] = meetingData.time.split(':');
          const hour24 = parseInt(hours);
          const ampm = hour24 >= 12 ? 'P.M.' : 'A.M.';
          const hour12 = hour24 % 12 || 12;
          const timeFormatted = `${hour12}:${minutes} ${ampm}`;

          // Detect if the meeting is tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = meetingData.date.toDateString() === tomorrow.toDateString();

          // Build Spanish date string
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
          const dayOfWeek = dayNames[meetingData.date.getDay()];
          const dayNum = meetingData.date.getDate().toString().padStart(2, '0');
          const monthName = monthNames[meetingData.date.getMonth()];
          const datePrefix = isTomorrow ? '¡MAÑANA! ' : '';
          const dateLine = `${datePrefix}${dayOfWeek}, ${dayNum} de ${monthName} a las⏰ ${timeFormatted}`;

          // Detect platform from link
          const linkLower = meetingData.meetingLink?.toLowerCase() || '';
          const platform = linkLower.includes('zoom') ? 'Zoom' : linkLower.includes('meet.google') ? 'Google Meet' : 'Teams';

          // Job title for the RC message
          const jobTitle = candidate.applications?.[0]?.job_title || 'la vacante';

          let message = '';

          if (currentInterviewType === 'entrevista-rc') {
            // New branded format for RC interviews
            if (meetingData.modality === 'presencial') {
              message =
                `¡Hola! 👋 ✨\n\n` +
                `Estamos emocionados de invitarte a una entrevista presencial para el puesto de *${jobTitle}*..\n\n` +
                `¡Una nueva oportunidad de trabajo que podría ser el comienzo de una etapa maravillosa en tu carrera!\n\n` +
                `La cita es ${dateLine}\n` +
                `¡Estamos deseando conocerte!\n\n` +
                `Asegúrate de lucir genial. ¡Llega con toda tu buena energía! 💯\n\n` +
                `📍 *Dirección:* ${meetingData.address}\n\n` +
                `¡Nos vemos pronto!\n\n` +
                `Confirma tu asistencia respondiendo a este mensaje.`;
            } else {
              message =
                `¡Hola! 👋 ✨\n\n` +
                `Estamos emocionados de invitarte a una entrevista virtual para el puesto de *${jobTitle}*..\n\n` +
                `¡Una nueva oportunidad de trabajo que podría ser el comienzo de una etapa maravillosa en tu carrera!\n\n` +
                `La cita es ${dateLine}\n` +
                `¡Estamos deseando conocerte!\n\n` +
                `Asegúrate de tener la cámara encendida 📷, micrófono 🎤 y de lucir genial.\n\n` +
                `¡Conéctate con toda tu buena energía! 💯\n\n` +
                `💻 Plataforma de Entrevista: ${platform}\n` +
                `NOTA: NO es necesario que ingreses desde tu correo, solo con tu nombre.\n\n` +
                `👉 Dale click en el enlace para unirte a la entrevista:\n\n` +
                `*(${meetingData.meetingLink})*\n\n` +
                `¡Nos vemos pronto!\n\n` +
                `Confirma tu asistencia respondiendo a este mensaje.`;
            }
          } else if (currentInterviewType === 'entrevista-et') {
            // Branded format for ET interviews (Entrevista Técnica / último filtro)
            const isToday = meetingData.date.toDateString() === new Date().toDateString();
            const currentYear = new Date().getFullYear();
            const dayText = isToday ? 'el día de ¡HOY!' : `el día ${dateLine}`;

            if (meetingData.modality === 'presencial') {
              message =
                `¡Hola! 👋\n\n` +
                `¡Estamos emocionados de que sigas adelante en el proceso para el cargo de *${jobTitle}* en Convertia! 🎉\n` +
                `Te encuentras citado a entrevista de último filtro con jefe inmediato ${dayText}.\n\n` +
                `✨ Inicia el ${currentYear} con el empleo que mereces 🚀 ✨\n\n` +
                `📅 Fecha y Hora: ${dateLine}\n\n` +
                `📍 *Dirección:* ${meetingData.address}\n\n` +
                `Confirma tu asistencia y prepárate para iniciar esta experiencia Convertia.`;
            } else {
              message =
                `¡Hola! 👋\n\n` +
                `¡Estamos emocionados de que sigas adelante en el proceso para el cargo de *${jobTitle}* en Convertia! 🎉\n` +
                `Te encuentras citado a entrevista de último filtro con jefe inmediato ${dayText}.\n\n` +
                `✨ Inicia el ${currentYear} con el empleo que mereces 🚀 ✨\n\n` +
                `📅 Fecha y Hora: ${dateLine}\n\n` +
                `💻 Plataforma de Entrevista: ${platform}\n` +
                `NOTA: NO es necesario que ingreses desde tu correo, solo con tu nombre.\n\n` +
                `👉 Enlace a la Entrevista:\n` +
                `*(${meetingData.meetingLink})*\n\n` +
                `Confirma tu asistencia y prepárate para iniciar esta experiencia Convertia.`;
            }
          } else {
            // Generic format for prueba-tecnica
            const interviewTypeName = 'Prueba Técnica';

            const locationInfo = meetingData.modality === 'presencial'
              ? `📍 *Dirección:* ${meetingData.address}`
              : `🔗 *Enlace de la reunión:* ${meetingData.meetingLink}`;

            message = `Felicidades, has avanzado a la fase de *${interviewTypeName}*.`;

            if (meetingData.title && meetingData.title.trim()) {
              message += `\n\n📌 *${meetingData.title.trim()}*`;
            }

            message += `\n\n🗓️ *Fecha y hora:* ${dayOfWeek}, ${dayNum} de ${monthName} a las ${timeFormatted}`;

            if (meetingData.duration) {
              message += `\n⏱️ *Duración:* ${meetingData.duration} minutos`;
            }

            message += `\n${locationInfo}`;

            if (meetingData.description && meetingData.description.trim()) {
              message += `\n\n📝 *Detalles adicionales:*\n${meetingData.description.trim()}`;
            }
          }

          const { sendEvolutionMessage } = await import('@/utils/evolution-api');
          if (currentInterviewType === 'entrevista-rc') {
            console.log('--- ENVIANDO MENSAJE A EVOLUTION API (ENTREVISTA RC) ---');
            console.log('Destinatario:', candidate.phone);
            console.log('Mensaje:', message);
            console.log('---------------------------------------------------------');
          }
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

  const handleUpdateContactInfo = async (fields: { email?: string; phone?: string; cedula?: string }) => {
    if (!id || !candidate) return;
    try {
      await updateCandidateContactInfo(id, fields);
      setCandidate(prev => prev ? {
        ...prev,
        email: fields.email ?? prev.email,
        phone: fields.phone ?? prev.phone,
        document_id: fields.cedula ?? prev.document_id,
      } : null);
      toast({ title: "Información actualizada", description: "Los datos de contacto han sido guardados correctamente." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo actualizar la información." });
      throw error;
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

  const resumeUrl = candidate.resume_url ? getResumeUrl(candidate.resume_url) : null;

  // Determine file type for proper viewing
  const getFileType = (url?: string) => {
    if (!url) return 'unknown';

    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'word';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      default:
        return 'unknown';
    }
  };

  const fileType = getFileType(resumeUrl);

  // Check if candidate is in hiring process or already hired
  const isInHiringProcess = candidate.applications?.some(app => app.status === 'proceso-contratacion');
  const isHired = candidate.applications?.some(app => app.status === 'contratado');

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
          transcribing={transcribing}
          onViewResume={() => setPdfViewerOpen(true)}
          onAnalyzeCV={handleAnalyzeCV}
          onChangeStatus={handleChangeStatus}
          onUpdateContactInfo={handleUpdateContactInfo}
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

          {/* Document Checklist - Show for candidates in hiring process OR already hired */}
          {(isInHiringProcess || isHired) && (
            <DocumentChecklist
              candidateId={candidate.id}
              candidateName={`${candidate.first_name} ${candidate.last_name}`}
              isAdmin={!isHired} // Admin view with management buttons only for non-hired candidates
              isReadOnly={isHired} // Read-only mode for hired candidates
              onDocumentUploaded={() => {
                // Optional: refresh candidate data if needed
                console.log('Document uploaded, candidate data refresh if needed');
              }}
            />
          )}

          {/* Hire Button - Only show for candidates in hiring process */}
          {isInHiringProcess && !isHired && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones de Contratación</CardTitle>
                <CardDescription>
                  El candidato está en proceso de contratación. Si todos los documentos están completos y aprobado, puede proceder con la contratación final.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  onClick={() => {
                    console.log('Contratar button clicked for candidate:', candidate.id);
                    setIsHireDialogOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Contratar
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Hired Status Display - Show for hired candidates */}
          {isHired && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Estado: CONTRATADO</CardTitle>
                <CardDescription>
                  Este candidato ha sido contratado exitosamente. Este es un estado final y no se pueden realizar más cambios de estado.
                  {candidate.status && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <strong>Estado en tabla candidates:</strong> {candidate.status}
                      {candidate.hire_date && (
                        <div><strong>Fecha de contratación:</strong> {candidate.hire_date}</div>
                      )}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <div className="w-full p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 font-medium text-center">
                    ✅ Candidato Contratado
                  </p>
                  <p className="text-xs text-green-600 text-center mt-1">
                    Estado final alcanzado - No se permiten más modificaciones
                  </p>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      {resumeUrl && (
        <DocumentViewer
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
          documentUrl={resumeUrl}
          documentName={`CV de ${candidate.first_name} ${candidate.last_name}`}
          documentType={fileType === 'pdf' ? 'pdf' :
            fileType === 'word' ? 'document' :
              fileType === 'image' ? 'image' : undefined}
          onTextExtracted={handleTextExtracted}
          onAnalyze={() => handleAnalyzeCV(candidate.applications?.[0]?.id)}
        />
      )}

      {/* Status Change Dialog */}
      <Dialog open={isStatusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent
          className={cn(
            "p-0 border-none shadow-none transition-all duration-300 w-[95vw] max-h-[90vh] overflow-y-auto",
            (newStatus === 'asignar-campana' || newStatus === 'proceso-contratacion') ? "sm:max-w-[600px]" : "sm:max-w-[425px]"
          )}
        >
          <DialogHeader className="bg-hrm-dark-primary py-6 sm:py-9 px-4 sm:px-6 rounded-t-lg border-none shadow-none">
            <DialogTitle className="text-white text-lg sm:text-xl">Cambiar Estado del Candidato</DialogTitle>
            <DialogDescription className="text-gray-200 text-sm">
              Selecciona el nuevo estado para {candidate.first_name} {candidate.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="status" className="sm:text-right">
                Estado
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status" className="sm:col-span-3 w-full">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrevista-rc">Asignar Entrevista (RC)</SelectItem>
                  <SelectItem value="entrevista-et">Asignar Entrevista Técnica (ET)</SelectItem>
                  <SelectItem value="prueba-tecnica">Asignar Prueba Técnica</SelectItem>
                  <SelectItem value="asignar-campana">Inicio de formación</SelectItem>
                  <SelectItem value="proceso-contratacion">Proceso de contratación</SelectItem>
                  <SelectItem value="training">En Formación</SelectItem>

                  <SelectItem value="discarded">Descartado</SelectItem>

                  <SelectItem value="finalizar-contrato">Finalizar Contrato</SelectItem>

                </SelectContent>
              </Select>
            </div>

            {/* --- SELECT DE RECLUTADOR --- */}
            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="recruiter" className="sm:text-right">
                Reclutador
              </Label>
              <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
                <SelectTrigger id="recruiter" className="sm:col-span-3 w-full">
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

            {/* --- SELECT DE CAMPAÑA Y CAMPOS DE FORMACIÓN --- */}
            {newStatus === 'asignar-campana' && (
              <>
                {/* Campaña Selector - Existing */}
                {campaigns.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="campaign" className="sm:text-right">
                      Campaña
                    </Label>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger id="campaign" className="sm:col-span-3 w-full">
                        <SelectValue placeholder="Selecciona una campaña activa" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Training Session Fields - 2 Column Layout */}
                <div className="col-span-4 space-y-4 border-t pt-4 mt-2">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Detalles de la sesión de formación</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="trainingTitle">Título de la sesión</Label>
                        <Input
                          id="trainingTitle"
                          value={trainingTitle}
                          onChange={(e) => setTrainingTitle(e.target.value)}
                          placeholder="Ej. Sesión de Bienvenida"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Modalidad</Label>
                        <div className="flex gap-4 p-2 border rounded-md bg-gray-50/50">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="virtual"
                              name="modality"
                              checked={trainingModality === 'virtual'}
                              onChange={() => setTrainingModality('virtual')}
                              className="cursor-pointer"
                            />
                            <Label htmlFor="virtual" className="cursor-pointer font-normal">Virtual</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="presencial"
                              name="modality"
                              checked={trainingModality === 'presencial'}
                              onChange={() => setTrainingModality('presencial')}
                              className="cursor-pointer"
                            />
                            <Label htmlFor="presencial" className="cursor-pointer font-normal">Presencial</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={trainingModality === 'virtual' ? "trainingLink" : "trainingAddress"}>
                          {trainingModality === 'virtual' ? "Link de la reunión" : "Dirección"}
                        </Label>
                        {trainingModality === 'virtual' ? (
                          <Input
                            id="trainingLink"
                            value={trainingLink}
                            onChange={(e) => setTrainingLink(e.target.value)}
                            placeholder="https://..."
                          />
                        ) : (
                          <Input
                            id="trainingAddress"
                            value={trainingAddress}
                            onChange={(e) => setTrainingAddress(e.target.value)}
                            placeholder="Dirección completa"
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Fecha y Hora</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full sm:flex-1 justify-start text-left font-normal",
                                  !trainingDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {trainingDate ? format(trainingDate, "PPP", { locale: es }) : "Fecha"}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                               <Calendar
                                 mode="single"
                                 selected={trainingDate}
                                 onSelect={setTrainingDate}
                                 disabled={(date) => {
                                   const today = new Date();
                                   today.setHours(0, 0, 0, 0);
                                   return date < today;
                                 }}
                                 initialFocus
                               />
                            </PopoverContent>
                          </Popover>
                          <Input
                            type="time"
                            value={trainingTime}
                            onChange={(e) => setTrainingTime(e.target.value)}
                            className="w-full sm:w-[120px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trainingDescription">Descripción / Notas</Label>
                        <textarea
                          id="trainingDescription"
                          value={trainingDescription}
                          onChange={(e) => setTrainingDescription(e.target.value)}
                          placeholder="Detalles adicionales para el candidato..."
                          className="flex min-h-[105px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- FECHA LÍMITE DE DOCUMENTOS (proceso-contratacion) --- */}
            {newStatus === 'proceso-contratacion' && (
              <div className="col-span-4 space-y-3 border-t pt-4 mt-2">
                <h4 className="font-medium text-sm text-gray-900">Fecha límite para subir documentos</h4>
                <p className="text-xs text-gray-500">Esta fecha se enviará al candidato por WhatsApp como plazo para cargar sus documentos.</p>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:flex-1 justify-start text-left font-normal",
                          !hiringDeadlineDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {hiringDeadlineDate ? format(hiringDeadlineDate, "PPP", { locale: es }) : "Seleccionar fecha límite"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={hiringDeadlineDate}
                        onSelect={setHiringDeadlineDate}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={hiringDeadlineTime}
                    onChange={(e) => setHiringDeadlineTime(e.target.value)}
                    className="w-full sm:w-[120px]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200 gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleStatusChange} className="w-full sm:w-auto">Guardar Cambios</Button>
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

      {/* Hire Dialog */}
      <Dialog open={isHireDialogOpen} onOpenChange={setIsHireDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-0 border-none shadow-none">
          <DialogHeader className="bg-hrm-dark-primary py-6 sm:py-9 px-4 sm:px-6 rounded-t-lg border-none shadow-none">
            <DialogTitle className="text-white text-lg sm:text-xl">Contratar Candidato</DialogTitle>
            <DialogDescription className="text-gray-200 text-sm">
              Selecciona la fecha de inicio de labores para {candidate.first_name} {candidate.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="hire-date" className="sm:text-right">
                Fecha de Inicio
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:col-span-3 justify-start text-left font-normal",
                      !hireStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {hireStartDate ? format(hireStartDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={hireStartDate}
                    onSelect={setHireStartDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200 gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsHireDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button
              onClick={handleHire}
              disabled={!hireStartDate}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              Contratar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateDetail;
