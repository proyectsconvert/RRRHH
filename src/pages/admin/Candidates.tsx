import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Loader2, Mail, Phone, MapPin, RefreshCw, Ellipsis, Columns3, EyeOff, Grid2x2X,Trash2, Ban, SquareArrowRight, Eye, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {Dialog, DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,DialogTrigger,} from "@/components/ui/dialog";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { sendWelcomeMessage } from "@/utils/evolution-api";
import { generateCandidateAccessToken } from "@/utils/candidate-access";
import TeamsMeetingDialog, { MeetingData } from "@/components/candidates/TeamsMeetingDialog";
import { analyzeResume, saveAnalysisData } from "@/services/candidate-service";

interface Job {
  id?: string;
  title: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  campaign_id?: string;
  recruiter_id?: string;
  jobs: Job | null;
  campaigns?: { name: string } | null;
  recruiter?: { first_name: string; last_name: string };
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  experience_years?: number;
  skills?: string[];
  created_at: string;
  resume_url?: string;
  resume_text?: string | null;
  applications?: Application[];
  analysis_summary?: string | null;
  transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_status?: 'pending' | 'analyzing' | 'completed' | 'failed';
}

const initialColumnVisibility = {
  vacante: true,
  campana: true, // Activada ahora que la migración está lista
  compatibilidad: true,
  experiencia: true,
  habilidades: true,
  aplicaciones: true,
  estado_aplicacion: true,
  fecha: true,
  reclutador: true, // Nueva columna para mostrar el reclutador asignado
};

// Get the primary status from candidate applications
const getCandidateStatus = (applications?: Application[]) => {
  if (!applications || applications.length === 0) return null;

  // Priority order for status display (lower number = higher priority)
  const statusPriority: { [key: string]: number } = {
    'blocked': 1,
    'rejected': 2,
    'discarded': 3,
    'contratado': 4,
    'contratar': 5,
    'training': 6,
    'prueba-tecnica': 7,
    'entrevista-et': 8,
    'entrevista-rc': 9,
    'asignar-campana': 10,
    'under_review': 11,
    'applied': 12,
    'new': 13
  };

  // Find the application with highest priority status (lowest number)
  let primaryStatus = applications[0].status;
  let highestPriority = statusPriority[primaryStatus] || 99;

  for (const app of applications) {
    const priority = statusPriority[app.status] || 99;
    if (priority < highestPriority) {
      highestPriority = priority;
      primaryStatus = app.status;
    }
  }

  return primaryStatus;
};

// Get status display info
const getStatusDisplay = (status: string | null) => {
  const statusConfig = {
    'new': { label: 'Nuevo Candidato', variant: 'outline' as const, color: 'text-destructive border-destructive', className: 'font-bold text-sm' },
    'applied': { label: 'Aplicado', variant: 'outline' as const, color: 'text-destructive border-destructive', className: 'font-bold text-sm' },
    'under_review': { label: 'Bajo Revisión', variant: 'outline' as const, color: 'text-destructive border-destructive', className: 'font-bold text-sm' },
    'entrevista-rc': { label: 'Entrevista Inicial', variant: 'outline' as const, color: 'text-yellow-600 border-yellow-600' , className: 'font-bold text-sm'},
    'entrevista-et': { label: 'Entrevista Técnica', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800 ' },
    'prueba-tecnica': { label: 'Prueba Técnica', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
    'asignar-campana': { label: 'En Campaña', variant: 'outline' as const, color: 'text-hrm-teal border-hrm-teal' },
    'contratar': { label: 'Proceso de Contratación', variant: 'secondary' as const, color: '' },
    'contratado': { label: 'Contratado', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'training': { label: 'En Formación', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'rejected': { label: 'Rechazado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'discarded': { label: 'Descartado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'blocked': { label: 'Bloqueado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
  };

  return statusConfig[status || ''] || { label: 'Sin Revisar', variant: 'outline' as const, color: 'text-destructive border-destructive', className: 'font-bold text-sm' };
};

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
}

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isDiscardModalOpen, setDiscardModalOpen] = useState(false);
  const [isBlockModalOpen, setBlockModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false);
  const [currentInterviewType, setCurrentInterviewType] = useState<'entrevista-rc' | 'entrevista-et' | null>(null);
  const [recruiters, setRecruiters] = useState<{id: string, first_name: string, last_name: string}[]>([]);
  const [currentUserRecruiter, setCurrentUserRecruiter] = useState<{id: string, first_name: string, last_name: string} | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [interviewTypeFilter, setInterviewTypeFilter] = useState<'all' | 'entrevista-rc' | 'entrevista-et'>('all');
  const [transcribingCandidates, setTranscribingCandidates] = useState<Set<string>>(new Set());
  const [transcriptionStatus, setTranscriptionStatus] = useState<{[key: string]: 'pending' | 'processing' | 'completed' | 'failed'}>({});
  const [analysisStatus, setAnalysisStatus] = useState<{[key: string]: 'pending' | 'analyzing' | 'completed' | 'failed'}>({});
  const [processedCandidates, setProcessedCandidates] = useState<Set<string>>(new Set());

  // Helper function to check if current user can modify a candidate's status
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

  // Helper function to check if selected candidates can be modified
  const canModifySelectedCandidates = (): boolean => {
    return selectedCandidates.every(candidateId => {
      const candidate = candidates.find(c => c.id === candidateId);
      return candidate && canModifyCandidate(candidate);
    });
  };

  const handleJobSelectionChange = (jobId: string, isChecked: boolean) => {
    setSelectedJob(prev => {
      if (isChecked) {
        return [...prev, jobId];
      } else {
        return prev.filter(id => id !== jobId); 
      }
    });
  };

  const fetchCandidates = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          applications(
            id,
            job_id,
            status,
            campaign_id,
            recruiter_id,
            jobs(title),
            campaigns!campaign_id(name),
            recruiter:recruiter_id(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      // If we have candidates, fetch document_id from profiles table for those missing it
      if (data && data.length > 0) {
        const candidatesNeedingDocumentId = data.filter(candidate => !candidate.document_id);

        if (candidatesNeedingDocumentId.length > 0) {
          const candidateIds = candidatesNeedingDocumentId.map(c => c.id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, document_id')
            .in('id', candidateIds);

          // Merge document_id from profiles into candidates
          if (profilesData) {
            data.forEach(candidate => {
              const profile = profilesData.find(p => p.id === candidate.id);
              if (profile?.document_id && !candidate.document_id) {
                candidate.document_id = profile.document_id;
              }
            });
          }
        }
      }

      if (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los candidatos.",
          variant: "destructive"
        });
        return;
      }

      // Process candidates and check transcription status
      const processedCandidates = (data || []).map(candidate => {
        let transcription_status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';

        // Check current transcription status from state first
        if (transcriptionStatus[candidate.id]) {
          transcription_status = transcriptionStatus[candidate.id];
        } else if (candidate.resume_text && candidate.resume_text.trim().length > 0) {
          // Check if text is valid (not PDF binary content)
          const isValidText = !candidate.resume_text.trim().startsWith('%PDF-') &&
                            !candidate.resume_text.includes('obj <</Type/') &&
                            !candidate.resume_text.includes('/Filter/FlateDecode');

          transcription_status = isValidText ? 'completed' : 'failed';
        } else if (candidate.resume_url && transcribingCandidates.has(candidate.id)) {
          transcription_status = 'processing';
        }

        // Determine analysis status
        let analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed' = 'pending';
        if (analysisStatus[candidate.id]) {
          analysis_status = analysisStatus[candidate.id];
        } else if (candidate.analysis_summary) {
          analysis_status = 'completed';
        }

        return {
          ...candidate,
          transcription_status,
          analysis_status
        };
      });

      // Only process candidates that haven't been fully processed yet (both transcription and analysis completed)
      const unprocessedCandidates = processedCandidates.filter(candidate =>
        !(candidate.transcription_status === 'completed' && candidate.analysis_status === 'completed')
      );

      // Auto-transcribe new candidates without resume_text (only once per candidate)
      const candidatesToTranscribe = unprocessedCandidates.filter(candidate =>
        candidate.resume_url &&
        (!candidate.resume_text || candidate.resume_text.trim().length === 0 ||
          candidate.resume_text.trim().startsWith('%PDF-') ||
          candidate.resume_text.includes('obj <</Type/') ||
          candidate.resume_text.includes('/Filter/FlateDecode')) &&
        !transcribingCandidates.has(candidate.id) &&
        transcriptionStatus[candidate.id] !== 'processing' &&
        transcriptionStatus[candidate.id] !== 'completed'
      );

      if (candidatesToTranscribe.length > 0) {
        console.log(`🚀 Iniciando transcripción automática para ${candidatesToTranscribe.length} candidatos nuevos`);
        // Start transcription for new candidates
        candidatesToTranscribe.forEach(candidate => {
          setTranscribingCandidates(prev => new Set(prev).add(candidate.id));
          setTranscriptionStatus(prev => ({ ...prev, [candidate.id]: 'processing' }));

          // Send "ejecutarIA" variable to trigger analysis
          console.log(`📝 Enviando transcripción para candidato: ${candidate.first_name} ${candidate.last_name}`);
          autoTranscribeCandidate(candidate);
        });
      }

      // Check for candidates with completed transcription but no analysis - trigger automatic analysis (only once per candidate)
      const candidatesToAnalyze = unprocessedCandidates.filter(candidate =>
        candidate.resume_text &&
        candidate.resume_text.trim().length > 0 &&
        !candidate.resume_text.trim().startsWith('%PDF-') &&
        !candidate.resume_text.includes('obj <</Type/') &&
        !candidate.resume_text.includes('/Filter/FlateDecode') &&
        !candidate.analysis_summary &&
        candidate.transcription_status === 'completed' &&
        analysisStatus[candidate.id] !== 'analyzing' &&
        analysisStatus[candidate.id] !== 'completed' &&
        candidate.analysis_status !== 'completed'
      );

      if (candidatesToAnalyze.length > 0) {
        console.log(`🤖 Iniciando análisis automático para ${candidatesToAnalyze.length} candidatos con texto pero sin análisis`);
        candidatesToAnalyze.forEach(candidate => {
          setAnalysisStatus(prev => ({ ...prev, [candidate.id]: 'analyzing' }));
          setCandidates(prev => prev.map(c =>
            c.id === candidate.id
              ? { ...c, analysis_status: 'analyzing' as const }
              : c
          ));

          // Perform automatic analysis
          performAutomaticAnalysis(candidate);
        });
      }

      setCandidates(processedCandidates);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los candidatos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase.from('jobs').select('id, title');
      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data || []);
      }
    };

    const fetchActiveCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, description, status')
        .eq('status', 'active')
        .order('name');
      if (error) {
        console.error("Error fetching active campaigns:", error);
      } else {
        setCampaigns(data || []);
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
          } else if (currentUserRole === 'reclutador') {
            // If user has recruiter role but is not in the list, add them
            const userAsRecruiter = {
              id: user.id,
              first_name: 'Current', // This should be fetched from profile
              last_name: 'User'
            };
            setRecruiters(prev => [...prev, userAsRecruiter]);
            setCurrentUserRecruiter(userAsRecruiter);
            setSelectedRecruiter(user.id);
          }
        }
      }
    };

    fetchJobs();
    fetchActiveCampaigns();
    fetchRecruiters();
  }, []);

  useEffect(() => {
    // Only show loading screen on initial load, not on subsequent navigation
    const shouldShowLoading = !dataLoaded;
    fetchCandidates(shouldShowLoading);

    // Set up subscription for real-time updates (silent updates without loading screen)
    const channel = supabase
      .channel('candidates-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'  // Also listen to applications table changes
        },
        (payload) => {
          console.log('Applications change detected:', payload);
          fetchCandidates(false); // Refresh data silently when changes occur
        })
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        (payload) => {
          console.log('Candidate change detected:', payload);
          fetchCandidates(false); // Refresh data silently when changes occur
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, dataLoaded]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCandidates();
  };

  // Function to perform automatic AI analysis
  const performAutomaticAnalysis = async (candidate: Candidate, extractedText?: string) => {
    const textToAnalyze = extractedText || candidate.resume_text;

    if (!textToAnalyze) {
      console.log('❌ No hay texto del CV para analizar');
      setAnalysisStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, analysis_status: 'failed' as const }
          : c
      ));
      return;
    }

    try {
      console.log(`🤖 Iniciando análisis automático para candidato: ${candidate.first_name} ${candidate.last_name}`);

      // Get job details for context
      let jobContext = null;
      if (candidate.applications && candidate.applications.length > 0) {
        const app = candidate.applications[0];
        jobContext = {
          title: app.jobs?.title || 'Vacante'
          // Note: job requirements, responsibilities, and description are not available in the Application type
          // They would need to be fetched separately from the jobs table if needed
        };
      }

      // Call the analysis function with the extracted text from transcription
      console.log('🔍 TEXTO QUE SE ENVÍA AL ANÁLISIS:', textToAnalyze.substring(0, 500) + (textToAnalyze.length > 500 ? '...' : ''));
      console.log('📏 LONGITUD DEL TEXTO PARA ANÁLISIS:', textToAnalyze.length);
      console.log('📄 TEXTO COMPLETO PARA ANÁLISIS:', textToAnalyze);
      const analysisResult = await analyzeResume(textToAnalyze, jobContext);

      // Save analysis data
      await saveAnalysisData(candidate.id, analysisResult, candidate.resume_text);

      console.log('✅ Análisis automático completado exitosamente');
      setAnalysisStatus(prev => ({ ...prev, [candidate.id]: 'completed' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? {
              ...c,
              analysis_status: 'completed' as const,
              analysis_summary: JSON.stringify(analysisResult),
              analysis_data: analysisResult
            }
          : c
      ));

    } catch (error) {
      console.error('❌ Error en análisis automático:', error);
      setAnalysisStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, analysis_status: 'failed' as const }
          : c
      ));
    }
  };

  // Function to automatically transcribe a candidate's resume
  const autoTranscribeCandidate = async (candidate: Candidate) => {
    if (!candidate.resume_url) return;

    try {
      console.log(`Iniciando transcripción automática para candidato: ${candidate.first_name} ${candidate.last_name}`);

      // Get the resume URL
      const resumeUrl = candidate.resume_url.startsWith('http')
        ? candidate.resume_url
        : `https://kugocdtesaczbfrwblsi.supabase.co/storage/v1/object/public/resumes/${candidate.resume_url}`;

      // Use the existing PDF text extraction logic from pdf-viewer.tsx
      // Load PDF and extract text
      const pdfjsLib = await import('pdfjs-dist');

      // Initialize PDF.js worker
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(resumeUrl);
      const pdf = await loadingTask.promise;
      console.log(`PDF cargado con ${pdf.numPages} páginas para candidato ${candidate.id}`);

      let extractedText = '';

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => {
            const cleanText = item.str
              .replace(/\s+/g, ' ')
              .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
              .trim();
            return cleanText;
          })
          .filter((text: string) => text.length > 0)
          .join(' ');

        if (pageText.trim()) {
          extractedText += pageText + '\n\n';
        }
      }

      // Final cleanup
      extractedText = extractedText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n');

      // Validate extracted text
      const isValidText = extractedText &&
        extractedText.trim().length > 0 &&
        !extractedText.trim().startsWith('%PDF-') &&
        !extractedText.includes('obj <</Type/') &&
        !extractedText.includes('/Filter/FlateDecode');

      if (!isValidText) {
        throw new Error('El texto extraído no es válido o contiene datos binarios');
      }

      // Print the extracted text for debugging
      console.log('📄 TEXTO EXTRAÍDO INICIAL PARA CANDIDATO:', candidate.first_name, candidate.last_name);
      console.log('📝 CONTENIDO COMPLETO:', extractedText);
      console.log('📏 LONGITUD DEL TEXTO:', extractedText.length, 'caracteres');
      console.log('📋 PRIMEROS 500 CARACTERES:', extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''));

      // Save the extracted text
      const { error: saveError } = await supabase
        .from('candidates')
        .update({
          resume_text: extractedText,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id);

      if (saveError) {
        console.error('Error guardando texto extraído:', saveError);
        // Update transcription status to failed
        setCandidates(prev => prev.map(c =>
          c.id === candidate.id
            ? { ...c, transcription_status: 'failed' as const }
            : c
        ));
      } else {
        console.log(`Transcripción completada para candidato: ${candidate.first_name} ${candidate.last_name}`);
        // Update transcription status to completed
        setTranscriptionStatus(prev => ({ ...prev, [candidate.id]: 'completed' }));
        setCandidates(prev => prev.map(c =>
          c.id === candidate.id
            ? { ...c, transcription_status: 'completed' as const, resume_text: extractedText }
            : c
        ));

        // After transcription is complete, trigger automatic AI analysis
        console.log(`🎯 Enviando variable "ejecutarIA" después de completar transcripción para candidato: ${candidate.first_name} ${candidate.last_name}`);

        // Update analysis status to analyzing
        setAnalysisStatus(prev => ({ ...prev, [candidate.id]: 'analyzing' }));
        setCandidates(prev => prev.map(c =>
          c.id === candidate.id
            ? { ...c, analysis_status: 'analyzing' as const }
            : c
        ));

        // Instead of relying on CandidateDetail component being mounted, perform the analysis directly here
        console.log('🔄 Ejecutando análisis automático directamente desde Candidates...');
        performAutomaticAnalysis(candidate, extractedText);
      }

    } catch (error) {
      console.error(`Error en transcripción automática para candidato ${candidate.id}:`, error);
      // Update transcription status to failed
      setTranscriptionStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
      setAnalysisStatus(prev => ({ ...prev, [candidate.id]: 'failed' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, transcription_status: 'failed' as const, analysis_status: 'failed' as const }
          : c
      ));
    } finally {
      // Remove from transcribing set
      setTranscribingCandidates(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidate.id);
        return newSet;
      });
    }
  };

  // Listen for analysis status events from CandidateDetail page
  useEffect(() => {
    const handleAnalysisStarted = (event: CustomEvent) => {
      const { candidateId } = event.detail;
      console.log('📥 Evento analysisStarted recibido para candidato:', candidateId);
      setAnalysisStatus(prev => ({ ...prev, [candidateId]: 'analyzing' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidateId
          ? { ...c, analysis_status: 'analyzing' as const }
          : c
      ));
    };

    const handleAnalysisCompleted = (event: CustomEvent) => {
      const { candidateId } = event.detail;
      console.log('📥 Evento analysisCompleted recibido para candidato:', candidateId);
      setAnalysisStatus(prev => ({ ...prev, [candidateId]: 'completed' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidateId
          ? { ...c, analysis_status: 'completed' as const }
          : c
      ));
    };

    const handleAnalysisFailed = (event: CustomEvent) => {
      const { candidateId } = event.detail;
      console.log('📥 Evento analysisFailed recibido para candidato:', candidateId);
      setAnalysisStatus(prev => ({ ...prev, [candidateId]: 'failed' }));
      setCandidates(prev => prev.map(c =>
        c.id === candidateId
          ? { ...c, analysis_status: 'failed' as const }
          : c
      ));
    };

    console.log('👂 Agregando listeners para eventos de análisis en Candidates');
    window.addEventListener('analysisStarted', handleAnalysisStarted as EventListener);
    window.addEventListener('analysisCompleted', handleAnalysisCompleted as EventListener);
    window.addEventListener('analysisFailed', handleAnalysisFailed as EventListener);

    return () => {
      console.log('🗑️ Removiendo listeners para eventos de análisis en Candidates');
      window.removeEventListener('analysisStarted', handleAnalysisStarted as EventListener);
      window.removeEventListener('analysisCompleted', handleAnalysisCompleted as EventListener);
      window.removeEventListener('analysisFailed', handleAnalysisFailed as EventListener);
    };
  }, []);

  // Function to fix existing interview assignments (assign recruiter_id to current user)
  const fixExistingInterviews = async () => {
    if (!currentUserId) return;

    try {
      // First, check how many interviews need to be fixed
      const { data: existingInterviews, error: checkError } = await supabase
        .from('applications')
        .select('id, status, recruiter_id')
        .in('status', ['entrevista-rc', 'entrevista-et'])
        .is('recruiter_id', null);

      if (checkError) {
        console.error('Error checking existing interviews:', checkError);
        toast({
          title: "Error",
          description: "Error al verificar entrevistas existentes",
          variant: "destructive"
        });
        return;
      }

      if (!existingInterviews || existingInterviews.length === 0) {
        toast({
          title: "No hay entrevistas para asignar",
          description: "Todas las entrevistas ya están asignadas",
        });
        return;
      }

      // Update all applications with interview status but null recruiter_id
      const { error } = await supabase
        .from('applications')
        .update({ recruiter_id: currentUserId })
        .in('status', ['entrevista-rc', 'entrevista-et'])
        .is('recruiter_id', null);

      if (error) {
        console.error('Error fixing interviews:', error);
        toast({
          title: "Error",
          description: `No se pudieron actualizar las entrevistas: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Entrevistas actualizadas",
          description: `Se asignaron ${existingInterviews.length} entrevistas existentes al reclutador actual`,
        });
        fetchCandidates(false);
      }
    } catch (error) {
      console.error('Error in fixExistingInterviews:', error);
      toast({
        title: "Error",
        description: "Error al asignar entrevistas existentes",
        variant: "destructive"
      });
    }
  };

  // Handle status change for selected candidates
  const handleStatusChange = async () => {
    if (!newStatus || selectedCandidates.length === 0) return;

    // Check permissions before allowing status change
    if (!canModifySelectedCandidates()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para cambiar el estado de los candidatos seleccionados",
        variant: "destructive"
      });
      setStatusModalOpen(false);
      return;
    }

    // Validate campaign selection if status is "asignar-campana"
    if (newStatus === 'asignar-campana' && !selectedCampaign) {
      toast({
        title: "Error",
        description: "Debes seleccionar una campaña",
        variant: "destructive"
      });
      return;
    }

    // For interview statuses, update status immediately and then show Teams dialog for scheduling
    if (newStatus === 'entrevista-rc' || newStatus === 'entrevista-et') {
      const candidate = candidates.find(c => c.id === selectedCandidates[0]);
      if (candidate) {
        setCurrentCandidate(candidate);
        setCurrentInterviewType(newStatus);
        setIsTeamsDialogOpen(true);
        setStatusModalOpen(false);
        // Continue with status update below
      }
    }

    try {
      // Update status for all selected candidates' applications
      const updates = [];
      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.applications) {
          for (const app of candidate.applications) {
            const updateData: any = {
              status: newStatus,
              updated_at: new Date().toISOString()
            };

            // Solo agregar campaign_id si el estado es 'asignar-campana' y se seleccionó una campaña
            if (newStatus === 'asignar-campana' && selectedCampaign) {
              updateData.campaign_id = selectedCampaign;
            } else if (newStatus !== 'asignar-campana') {
              // Si no es asignar-campana, limpiar campaign_id
              updateData.campaign_id = null;
            }

            // Save recruiter_id for interview statuses
            if (newStatus === 'entrevista-rc' || newStatus === 'entrevista-et') {
              updateData.recruiter_id = currentUserId; // Always assign current user as recruiter for interviews
            }

            updates.push(
              supabase
                .from('applications')
                .update(updateData)
                .eq('id', app.id)
            );
          }
        }
      }

      await Promise.all(updates);

      // Send welcome message to candidates whose status changed to "contratar"
      if (newStatus === 'contratar') {
        const welcomeMessagePromises = selectedCandidates.map(async (candidateId) => {
          const candidate = candidates.find(c => c.id === candidateId);
          if (candidate?.phone) {
            try {
              const candidateName = `${candidate.first_name} ${candidate.last_name}`;

              // Generate access token for this candidate
              const accessToken = await generateCandidateAccessToken(candidate.id, 168); // 7 days
              const documentUrl = `${window.location.origin}/candidate-documents/${candidate.id}?token=${accessToken}`;

              await sendWelcomeMessage(candidate.phone, candidateName, documentUrl);
              console.log(`Welcome message sent to ${candidateName} (${candidate.phone})`);
            } catch (error) {
              console.error(`Failed to send welcome message to ${candidate.first_name} ${candidate.last_name}:`, error);
              // Don't show error toast for individual message failures to avoid spam
            }
          } else {
            console.warn(`No phone number found for candidate ${candidate?.first_name} ${candidate?.last_name}`);
          }
        });

        // Send messages in parallel but don't wait for them to complete
        Promise.all(welcomeMessagePromises).catch(error => {
          console.error('Error sending welcome messages:', error);
        });
      }

      toast({
        title: "Estado actualizado",
        description: `Se actualizaron ${selectedCandidates.length} candidatos`,
      });

      setStatusModalOpen(false);
      setNewStatus("");
      setSelectedRecruiter("");
      setSelectedCampaign("");
      setSelectedCandidates([]);
      fetchCandidates();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de los candidatos",
        variant: "destructive"
      });
    }
  };

  // Handle meeting creation and add meeting details (status already updated)
  const handleMeetingCreated = async (meetingData: MeetingData) => {
    if (!currentCandidate || !currentInterviewType || !currentUserId) {
      console.error('Missing required data for meeting creation');
      return;
    }

    try {
      // Update applications with meeting details (status already set)
      const updates = [];
      if (currentCandidate.applications) {
        for (const app of currentCandidate.applications) {
          updates.push(
            supabase
              .from('applications')
              .update({
                meeting_date: meetingData.date.toISOString().split('T')[0], // YYYY-MM-DD format
                meeting_time: meetingData.time, // HH:MM format
                meeting_link: meetingData.meetingLink,
                meeting_title: meetingData.title,
                updated_at: new Date().toISOString()
              })
              .eq('id', app.id)
          );
        }
      }

      await Promise.all(updates);

      console.log(`Meeting scheduled: ${currentInterviewType} for candidate ${currentCandidate.first_name} ${currentCandidate.last_name}`);

      // Send message via Evolution API
      if (currentCandidate.phone) {
        try {
          // Format time with AM/PM
          const [hours, minutes] = meetingData.time.split(':');
          const hour24 = parseInt(hours);
          const ampm = hour24 >= 12 ? 'PM' : 'AM';
          const hour12 = hour24 % 12 || 12;
          const timeFormatted = `${hour12}:${minutes} ${ampm}`;

          const interviewTypeText = currentInterviewType === 'entrevista-rc' ? 'RC/Tecnica' : 'Tecnica';
          const dateTimeStr = `${meetingData.date.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

          const message = `Felicidades, está en proceso de entrevista ${interviewTypeText}, quedo para el día ${dateTimeStr} con este link: ${meetingData.meetingLink}`;

          const { sendEvolutionMessage } = await import('@/utils/evolution-api');
          await sendEvolutionMessage(currentCandidate.phone, message, true);

          console.log(`Interview message sent to ${currentCandidate.first_name} ${currentCandidate.last_name} (${currentCandidate.phone})`);
        } catch (error) {
          console.error(`Failed to send interview message to ${currentCandidate.first_name} ${currentCandidate.last_name}:`, error);
          toast({
            title: "Advertencia",
            description: "La reunión se creó correctamente pero no se pudo enviar el mensaje de WhatsApp",
            variant: "destructive"
          });
        }
      } else {
        console.warn(`No phone number found for candidate ${currentCandidate.first_name} ${currentCandidate.last_name}`);
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
      setCurrentCandidate(null);
      setCurrentInterviewType(null);
      setNewStatus("");
      setSelectedRecruiter("");
      setSelectedCampaign("");
      setSelectedCandidates([]);

      // Refresh data immediately (silently)
      setTimeout(() => fetchCandidates(false), 500);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la reunión",
        variant: "destructive"
      });
    }
  };

  // Handle discard candidates
  const handleDiscardCandidates = async () => {
    if (selectedCandidates.length === 0) return;

    // Check permissions before discarding candidates
    if (!canModifySelectedCandidates()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para descartar estos candidatos",
        variant: "destructive"
      });
      setDiscardModalOpen(false);
      return;
    }

    try {
      // Update status to 'discarded' for all selected candidates' applications
      const updates = [];
      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.applications) {
          for (const app of candidate.applications) {
            updates.push(
              supabase
                .from('applications')
                .update({
                  status: 'discarded',
                  updated_at: new Date().toISOString()
                })
                .eq('id', app.id)
            );
          }
        }
      }

      await Promise.all(updates);

      toast({
        title: "Candidatos descartados",
        description: `${selectedCandidates.length} candidatos movidos a descartados`,
      });

      setDiscardModalOpen(false);
      setSelectedCandidates([]);
      fetchCandidates();
    } catch (error) {
      console.error('Error discarding candidates:', error);
      toast({
        title: "Error",
        description: "No se pudieron descartar los candidatos",
        variant: "destructive"
      });
    }
  };

  // Handle block candidates
  const handleBlockCandidates = async () => {
    if (selectedCandidates.length === 0) return;

    // Check permissions before blocking candidates
    if (!canModifySelectedCandidates()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para bloquear estos candidatos",
        variant: "destructive"
      });
      setBlockModalOpen(false);
      return;
    }

    try {
      // Update status to 'blocked' for all selected candidates' applications
      const updates = [];
      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.applications) {
          for (const app of candidate.applications) {
            updates.push(
              supabase
                .from('applications')
                .update({
                  status: 'blocked',
                  updated_at: new Date().toISOString()
                })
                .eq('id', app.id)
            );
          }
        }
      }

      await Promise.all(updates);

      toast({
        title: "Candidatos bloqueados",
        description: `${selectedCandidates.length} candidatos bloqueados`,
      });

      setBlockModalOpen(false);
      setSelectedCandidates([]);
      fetchCandidates();
    } catch (error) {
      console.error('Error blocking candidates:', error);
      toast({
        title: "Error",
        description: "No se pudieron bloquear los candidatos",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (statusCount: number) => {
    if (statusCount === 0) return 'text-gray-500';
    if (statusCount <= 2) return 'text-yellow-500';
    return 'text-green-500';
  };


  const getInterviewFilteredCandidates = (interviewFilter: 'all' | 'entrevista-rc' | 'entrevista-et') => {
    let filtered = candidates;

    // First apply the base interview filter
    const allowedStatuses = ['entrevista-rc', 'entrevista-et', 'asignar-campana'];
    filtered = filtered.filter(candidate =>
      candidate.applications?.some(app => allowedStatuses.includes(app.status))
    );

    // Apply role-based filtering for recruiters (only show their assigned interviews)
    if (currentUserRole === 'reclutador' && currentUserId) {
      filtered = filtered.filter(candidate =>
        candidate.applications?.some(app =>
          allowedStatuses.includes(app.status) && app.recruiter_id === currentUserId
        )
      );
    }

    // Then apply the specific interview type filter
    if (interviewFilter !== 'all') {
      filtered = filtered.filter(candidate =>
        candidate.applications?.some(app => app.status === interviewFilter)
      );
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(candidate => {
        const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
        const candidateId = candidate.id.toLowerCase();
        const phone = candidate.phone?.toLowerCase() || '';

        return fullName.includes(query) ||
               candidateId.includes(query) ||
               phone.includes(query);
      });
    }

    // Apply job filter
    if (selectedJob.length > 0) {
      filtered = filtered.filter(candidate =>
        candidate.applications?.some(app => selectedJob.includes(app.job_id))
      );
    }

    return filtered;
  };

  const filteredCandidates = (tabFilter?: string) => {
    let filtered = candidates;

    // 1. Aplicar filtro por pestaña (status de aplicaciones)
    if (tabFilter && tabFilter !== 'all') {
      if (tabFilter === 'sin-revisar') {
        // "Sin Revisar" incluye candidatos sin aplicaciones o con aplicaciones sin estado procesado
        filtered = filtered.filter(candidate => {
          if (!candidate.applications || candidate.applications.length === 0) {
            return true; // Candidatos sin aplicaciones
          }
          // Candidatos cuyas aplicaciones no están en otras categorías procesadas
          return candidate.applications.some(app => {
            const processedStatuses = [
              'entrevista-rc', 'entrevista-et', 'prueba-tecnica', 'asignar-campana',
              'contratar', 'contratado', 'training', 'rejected', 'discarded', 'blocked'
            ];
            return !processedStatuses.includes(app.status) || app.status === 'new' || app.status === 'applied' || app.status === 'under_review';
          });
        });
      } else {
        const statusFilters: { [key: string]: string[] } = {
          'en-entrevista': ['entrevista-rc', 'entrevista-et'],
          'prueba-tecnica': ['prueba-tecnica'],
          'en-formacion': ['asignar-campana'],
          'contratados': ['contratar', 'contratado'],
          'discarded': ['rejected', 'discarded', 'blocked']
        };

        const allowedStatuses = statusFilters[tabFilter] || [];
        filtered = filtered.filter(candidate =>
          candidate.applications?.some(app => allowedStatuses.includes(app.status))
        );

        // Apply role-based filtering for interview statuses
        if (tabFilter === 'en-entrevista') {
          if (currentUserRole === 'reclutador' && currentUserId) {
            // For recruiters, only show candidates where they are the assigned recruiter
            filtered = filtered.filter(candidate =>
              candidate.applications?.some(app =>
                allowedStatuses.includes(app.status) && app.recruiter_id === currentUserId
              )
            );
          }
          // For admins, show all interviews (no additional filtering needed)
        }

        // For other tabs, show all candidates regardless of role (recruiters need to be able to assign interviews)
        // Only restrict the "En Entrevista" tab to show only their assigned candidates

        // Apply interview type filter for 'en-entrevista' tab
        if (tabFilter === 'en-entrevista') {
          if (interviewTypeFilter !== 'all') {
            filtered = filtered.filter(candidate =>
              candidate.applications?.some(app => app.status === interviewTypeFilter)
            );
          }
          // For 'en-entrevista' tab, return the filtered result
          return filtered;
        }
      }
    }

    // 2. Aplicar filtro de búsqueda por nombre, cédula/ID y teléfono (si hay algo escrito)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(candidate => {
        const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
        const candidateId = candidate.id.toLowerCase();
        const phone = candidate.phone?.toLowerCase() || '';

        return fullName.includes(query) ||
               candidateId.includes(query) ||
               phone.includes(query);
      });
    }

    // 3. Aplicar filtro de vacante sobre el resultado anterior
    if (selectedJob.length > 0) {
      filtered = filtered.filter(candidate =>
        candidate.applications?.some(app => selectedJob.includes(app.job_id))
      );
    }

    return filtered;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Candidatos</h1>
        <div className="flex gap-2">

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {currentUserRole === 'reclutador' && (
            <Button
              variant="outline"
              onClick={fixExistingInterviews}
              className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              🔧 Asignar Entrevistas Existentes
            </Button>
          )}
          {/*
          <Button className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" asChild>
            <Link to="/admin/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Candidato
            </Link>
          </Button>
          */}
        </div>
      </div>


      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">

            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="sin-revisar">Sin Revisar ({filteredCandidates('sin-revisar').length})</TabsTrigger>
                <TabsTrigger value="en-entrevista">En Entrevista ({filteredCandidates('en-entrevista').length})</TabsTrigger>
                <TabsTrigger value="prueba-tecnica">Prueba Técnica ({filteredCandidates('prueba-tecnica').length})</TabsTrigger>
                <TabsTrigger value="en-formacion">En Campaña ({filteredCandidates('en-formacion').length})</TabsTrigger>
                <div className="h-6 w-px bg-gray-400 mx-2" />
                <TabsTrigger value="all">Todos ({filteredCandidates('all').length})</TabsTrigger>
                <TabsTrigger value="contratados">Proceso de Contratación ({filteredCandidates('contratados').length})</TabsTrigger>
                <TabsTrigger value="discarded">Descartados ({filteredCandidates('discarded').length})</TabsTrigger>

              </TabsList>

              {/*Filtrar*/}
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-4">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="grid gap-2">
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      Filtrar por Vacante
                    </div>
                    {jobs.map((job) => (
                      <label
                        key={job.id}
                        className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedJob.includes(job.id!)}
                          onCheckedChange={(checked) => {
                            handleJobSelectionChange(job.id!, !!checked);
                          }}
                        />
                        <span className="text-sm">{job.title}</span>
                      </label>
                    ))}
                    {selectedJob.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedJob([])}>
                        Limpiar selección
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
                {/*Ocultar*/}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Grid2x2X className="h-4 w-4" />
                      
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="grid gap-2">
                      <div className="px-2 py-1.5 text-sm font-semibold">
                        Mostrar/Ocultar Columnas
                      </div>
                      {Object.entries(columnVisibility).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <Checkbox
                            checked={value}
                            onCheckedChange={(checked) => {
                              setColumnVisibility(prev => ({ ...prev, [key]: !!checked }));
                            }}
                          />
                          <span className="text-sm capitalize">
                            {key === 'estado_aplicacion' ? 'Estado' :
                             key === 'campana' ? 'Campaña' :
                             key === 'reclutador' ? 'Reclutador' :
                             key.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
            </div>

            <div className="flex gap-2">
              {selectedCandidates.length > 0 && (
                <>
                  <Dialog open={isDiscardModalOpen} onOpenChange={setDiscardModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                        size="sm"
                        disabled={!canModifySelectedCandidates()}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Descartar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-none">
                      <DialogHeader className="bg-hrm-dark-primary py-8 px-6 rounded-t-lg">
                        <DialogTitle className="text-white text-xl">
                          Confirmar Candidatos Descartados
                        </DialogTitle>
                        <DialogDescription className="text-gray-200">
                          Los candidatos seleccionados serán enviados a la pestaña "Descartados".
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6 px-6 text-sm">
                        <p>
                          {selectedCandidates.length === 1
                            ? "1 candidato será descartado."
                            : `${selectedCandidates.length} candidatos serán descartados.`
                          }
                          {" "}¿Deseas continuar?
                        </p>
                      </div>
                      <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-lg border-t">
                        <Button variant="ghost" onClick={() => setDiscardModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleDiscardCandidates}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isBlockModalOpen} onOpenChange={setBlockModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canModifySelectedCandidates()}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Bloquear
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-none">
                      <DialogHeader className="bg-hrm-dark-destructive py-8 px-6 rounded-t-lg">
                        <DialogTitle className="text-white text-xl">
                          Confirmar Candidatos Bloqueados
                        </DialogTitle>
                        <DialogDescription className="text-gray-200">
                          Esta acción no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6 px-6 text-sm">
                        <p>
                          {selectedCandidates.length === 1
                            ? "1 candidato será bloqueado."
                            : `${selectedCandidates.length} candidatos serán bloqueados.`
                          }
                          {" "}¿Deseas continuar?
                        </p>
                      </div>
                      <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-lg border-t">
                        <Button variant="ghost" onClick={() => setBlockModalOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleBlockCandidates}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* 👇 AQUÍ EMPIEZA LA IMPLEMENTACIÓN DEL DIALOG 👇 */}
                  <Dialog open={isStatusModalOpen} onOpenChange={setStatusModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canModifySelectedCandidates()}
                      >
                        <SquareArrowRight className="mr-2 h-4 w-4" />
                        Cambiar Estado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-none" >
                      <DialogHeader className="bg-hrm-dark-primary py-9 px-6 rounded-t-lg border-none shadow-none">
                        <DialogTitle className="text-white text-xl">Cambiar Estado de Candidatos</DialogTitle>
                        <DialogDescription className="text-gray-200 ">
                          Selecciona el nuevo estado y el reclutador a cargo para los ({selectedCandidates.length}) candidatos seleccionados.
                        </DialogDescription>
                      </DialogHeader>

                      {/* 2. Añadimos padding solo a esta sección */}
                      <div className="grid gap-4 py-4 px-6"> 
                        {/* --- SELECT DE ESTADO --- */}
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
                              <SelectItem value="prueba-tecnica">Prueba Técnica</SelectItem>
                              <SelectItem value="asignar-campana">Asignar Campaña</SelectItem>
                              <SelectItem value="contratar">Proceso de contratación</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* --- SELECT DE CAMPAÑA (se activará después de la migración) --- */}
                        {newStatus === 'asignar-campana' && campaigns.length > 0 && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="campaign" className="text-right">
                              Campaña
                            </Label>
                            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                              <SelectTrigger id="campaign" className="col-span-3">
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
                              {/* Add current user if they're a recruiter but not in the list */}
                              {currentUserRecruiter && !recruiters.find(r => r.id === currentUserRecruiter.id) && (
                                <SelectItem key={currentUserRecruiter.id} value={currentUserRecruiter.id}>
                                  {currentUserRecruiter.first_name} {currentUserRecruiter.last_name} (Tú)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 3. Añadimos padding también al footer */}
                      <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
                        <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleStatusChange}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
   
        </div>

          <TabsContent value="all">
            <CandidatesTable
              candidates={filteredCandidates('all')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          <TabsContent value="discarded">
            <CandidatesTable
              candidates={filteredCandidates('discarded')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          <TabsContent value="contratados">
            <CandidatesTable
              candidates={filteredCandidates('contratados')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          <TabsContent value="sin-revisar">
            <CandidatesTable
              candidates={filteredCandidates('sin-revisar')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          <TabsContent value="en-entrevista">
            {/* Interview Type Filter Buttons */}
            <div className="mb-4 flex gap-2">
              <Button
                variant={interviewTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterviewTypeFilter('all')}
              >
                Todas las entrevistas ({getInterviewFilteredCandidates('all').length})
              </Button>
              <Button
                variant={interviewTypeFilter === 'entrevista-rc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterviewTypeFilter('entrevista-rc')}
              >
                Entrevista RC ({getInterviewFilteredCandidates('entrevista-rc').length})
              </Button>
              <Button
                variant={interviewTypeFilter === 'entrevista-et' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterviewTypeFilter('entrevista-et')}
              >
                Entrevista Técnica ({getInterviewFilteredCandidates('entrevista-et').length})
              </Button>
            </div>

            <CandidatesTable
              candidates={filteredCandidates('en-entrevista')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          <TabsContent value="prueba-tecnica">
            <CandidatesTable
              candidates={filteredCandidates('prueba-tecnica')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          <TabsContent value="en-formacion">
            <CandidatesTable
              candidates={filteredCandidates('en-formacion')}
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
              columnVisibility={columnVisibility}
              setDiscardModalOpen={setDiscardModalOpen}
              setBlockModalOpen={setBlockModalOpen}
              setStatusModalOpen={setStatusModalOpen}
              activeTab={activeTab}
              canModifyCandidate={canModifyCandidate}
            />
          </TabsContent>

          {/*
          <TabsContent value="all">
            <CandidatesTable 
              candidates={filteredCandidates('all')} 
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
            />
          </TabsContent>
          
          <TabsContent value="active">
            <CandidatesTable 
              candidates={filteredCandidates('active')} 
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
            />

          </TabsContent>
          
          <TabsContent value="new">
            <CandidatesTable 
              candidates={filteredCandidates('new')} 
              loading={loading}
              selectedCandidates={selectedCandidates}
              setSelectedCandidates={setSelectedCandidates}
            />
          </TabsContent>
          */}
        </Tabs>
      </div>

      {/* Teams Meeting Dialog */}
      <TeamsMeetingDialog
        isOpen={isTeamsDialogOpen}
        onClose={() => setIsTeamsDialogOpen(false)}
        onMeetingCreated={handleMeetingCreated}
        onSkipMeeting={() => {
          // Just close the dialog and refresh data - status was already updated
          setIsTeamsDialogOpen(false);
          setCurrentCandidate(null);
          setCurrentInterviewType(null);
          setNewStatus("");
          setSelectedRecruiter("");
          setSelectedCampaign("");
          setSelectedCandidates([]);
          setTimeout(() => fetchCandidates(false), 500);
        }}
        candidateName={currentCandidate ? `${currentCandidate.first_name} ${currentCandidate.last_name}` : ''}
        interviewType={currentInterviewType || 'entrevista-rc'}
      />
    </div>
  );
};

interface CandidatesTableProps {
  candidates: Candidate[];
  loading: boolean;
  selectedCandidates: string[];
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>;
  columnVisibility: typeof initialColumnVisibility;
  setDiscardModalOpen: (isOpen: boolean) => void;
  setBlockModalOpen: (isOpen: boolean) => void;
  setStatusModalOpen: (isOpen: boolean) => void;
  activeTab: string;
  canModifyCandidate: (candidate: Candidate) => boolean;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ candidates, loading, selectedCandidates,
  setSelectedCandidates,columnVisibility, setDiscardModalOpen, setBlockModalOpen,setStatusModalOpen, activeTab, canModifyCandidate }) => {
    const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(candidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, id]);
    } else {
      setSelectedCandidates(prev => prev.filter(candidateId => candidateId !== id));
    }
  }; 

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length + 3;

  return (
    <div className="mt-6">
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead className="w-[20%]" >Candidato</TableHead>
                  {columnVisibility.vacante && <TableHead className="w-[12%]">Vacante</TableHead>}
                  {columnVisibility.campana  && !['sin-revisar', 'en-entrevista'].includes(activeTab) &&  <TableHead className="w-[10%]">Campaña</TableHead>}
                  {columnVisibility.compatibilidad && <TableHead>Compatibilidad</TableHead>}
                  {columnVisibility.experiencia && <TableHead>Experiencia</TableHead>}
                  {columnVisibility.habilidades && <TableHead className="w-[12%]">Habilidades</TableHead>}
                  {columnVisibility.aplicaciones && <TableHead className="w-[5%]">Aplicaciones</TableHead>}
                  {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.estado_aplicacion && <TableHead>Estado</TableHead>}
                  {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.reclutador && <TableHead className="w-[12%]">Reclutador</TableHead>}
                  {columnVisibility.fecha && <TableHead>Fecha</TableHead>}
                  <TableHead className="text-right">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length > 0 ? (
                  candidates.map((candidate) => {
                    // (Aquí iría la lógica para obtener el `status` del candidato si la tienes)
                    // const status = getCandidateStatus(candidate.applications);
                    let analysisData: any = null;
                    if (candidate.analysis_summary) {
                      try {
                        analysisData = JSON.parse(candidate.analysis_summary);
                        if (typeof analysisData === 'string') {
                          // Intenta el segundo parseo si el resultado sigue siendo un string
                          analysisData = JSON.parse(analysisData);
                        }
                      } catch (e) {
                        console.error('Error al parsear analysis_summary para la tabla:', e);
                        analysisData = null;
                      }
                    }

                    return (
                      <TableRow key={candidate.id} data-state={selectedCandidates.includes(candidate.id) && "selected"}>
                        
                        <TableCell>
                          <Checkbox
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={(checked) => handleSelectOne(candidate.id, !!checked)}
                            aria-label={`Seleccionar a ${candidate.first_name}`}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-base">
                            <Link to={`/admin/candidates/${candidate.id}`} className="hover:text-hrm-dark-cyan">
                              {candidate.first_name} {candidate.last_name}
                            </Link>
                            {/* Status Indicators */}
                            {(candidate.transcription_status || candidate.analysis_status) && (
                              <div className="mt-1 space-y-1">
                                {/* Transcription Status */}
                                {candidate.transcription_status === 'processing' && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Transcribiendo...
                                  </Badge>
                                )}
                                {candidate.transcription_status === 'completed' && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    ✓ Transcripción completa
                                  </Badge>
                                )}
                                {candidate.transcription_status === 'failed' && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                                    ✗ Error en transcripción
                                  </Badge>
                                )}

                                {/* Analysis Status */}
                                {candidate.analysis_status === 'analyzing' && (
                                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Analizando con IA...
                                  </Badge>
                                )}
                                {candidate.analysis_status === 'completed' && (
                                  <div className="text-xs text-green-600">
                                    ✓ Analizado con IA
                                  </div>
                                )}
                                {candidate.analysis_status === 'failed' && (
                                  <div className="text-xs text-red-600">
                                    ✗ Error en análisis
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{candidate.email}</span>
                            </div>
                            {candidate.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                <span>{candidate.phone}</span>
                              </div>
                            )}
                            {candidate.location && (
                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                <span>{candidate.location}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {columnVisibility.vacante && <TableCell>
                          <div className="flex flex-col gap-1">
                            {candidate.applications && candidate.applications.length > 0 ? (
                              candidate.applications.map(app => (
                                <Badge key={app.id} variant="secondary" >
                                  {app.jobs?.title || 'Vacante no disponible'}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">Sin postulaciones</span>
                            )}
                          </div>
                        </TableCell>}

                        {columnVisibility.campana && activeTab && !['sin-revisar', 'en-entrevista'].includes(activeTab) && <TableCell>
                          <div className="flex flex-col gap-1">
                            {candidate.applications && candidate.applications.length > 0 ? (
                              candidate.applications
                                .filter(app => app.campaigns?.name)
                                .map(app => (
                                  <Badge key={app.id} variant="outline" className="text-xs">
                                    {app.campaigns?.name}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-gray-500 text-sm">Sin campaña</span>
                            )}
                          </div>
                        </TableCell>}

                        {columnVisibility.compatibilidad && (
                          <TableCell>
                            {analysisData?.compatibilidad?.porcentaje !== undefined ? (
                              <div className="flex items-center justify-center">
                                <Badge variant="outline" className={`font-bold text-sm ${
                                  analysisData.compatibilidad.porcentaje >= 75
                                    ? 'text-hrm-teal border-hrm-teal'
                                    : analysisData.compatibilidad.porcentaje >= 50
                                    ? 'text-yellow-600 border-yellow-600'
                                    : 'text-hrm-destructive border-hrm-destructive'
                                }`}>
                                  {analysisData.compatibilidad.porcentaje}%
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm text-center block">N/A</span>
                            )}
                          </TableCell>
                        )}

                        {columnVisibility.experiencia && !['en-formacion' , 'contratados'].includes(activeTab) && <TableCell>
                          {candidate.experience_years ? `${candidate.experience_years} meses` : 'No especificada'}
                        </TableCell>}

                        {columnVisibility.habilidades && !['en-formacion' , 'discarded' , 'contratados'].includes(activeTab) && <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills && candidate.skills.length > 0 ? 
                              candidate.skills.slice(0, 2).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))
                              : 'No especificadas'}
                            {candidate.skills && candidate.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>}

                        {columnVisibility.aplicaciones && !['contratados'].includes(activeTab) &&<TableCell className='text-center'>
                          <span 
                            className={`font-medium ${candidate.applications && candidate.applications.length > 0 
                              ? 'text-hrm-black/80' 
                              : 'text-gray-500'}`}
                          >
                            {candidate.applications ? candidate.applications.length : 0}
                          </span>
                        </TableCell>}

                        {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.estado_aplicacion && <TableCell>
                          {(() => {
                            const primaryStatus = getCandidateStatus(candidate.applications);
                            const statusDisplay = getStatusDisplay(primaryStatus);
                            return (
                              <Badge variant={statusDisplay.variant} className={statusDisplay.color}>
                                {statusDisplay.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>}

                        {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.reclutador && <TableCell>
                          <div className="flex flex-col gap-1">
                            {candidate.applications && candidate.applications.length > 0 ? (
                              candidate.applications
                                .filter(app => app.recruiter) // Only show applications that have a recruiter assigned
                                .map(app => (
                                  <Badge key={app.id} variant="outline" className="text-xs">
                                    {app.recruiter.first_name} {app.recruiter.last_name}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-gray-500 text-sm">Sin asignar</span>
                            )}
                          </div>
                        </TableCell>}

                        {columnVisibility.fecha && <TableCell>
                          {formatDistanceToNow(new Date(candidate.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </TableCell>}

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">                              
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/candidates/${candidate.id}`}>
                                  <Eye className="mr-2 h-4 w-4" /> {/* <-- Icono añadido */}
                                  <span>Ver Perfil</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {canModifyCandidate(candidate) && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCandidates([candidate.id]);
                                  setStatusModalOpen(true);
                                }}>
                                  <SquareArrowRight className="mr-2 h-4 w-4" /> {/* <-- Icono añadido */}
                                  <span>Cambiar Estado</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => {
                                setSelectedCandidates([candidate.id]);
                                setDiscardModalOpen(true);
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" /> {/* <-- Icono añadido */}
                                <span>Descartar</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => {
                                setSelectedCandidates([candidate.id]);
                                setBlockModalOpen(true);
                              }}>
                                <Ban className="mr-2 h-4 w-4" /> {/* <-- Icono añadido */}
                                <span>Bloquear</span>
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount + 2} className="text-center py-10 text-gray-500">
                      No hay candidatos disponibles en esta sección.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Candidates;