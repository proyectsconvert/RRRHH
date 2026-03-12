import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Loader2, Mail, Phone, MapPin, RefreshCw, Ellipsis, Columns3, EyeOff, Grid2x2X, Trash2, Ban, SquareArrowRight, Eye, Search, Download, CalendarIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { sendWelcomeMessage } from "@/utils/evolution-api";
import { generateCandidateAccessToken } from "@/utils/candidate-access";
import TeamsMeetingDialog, { MeetingData } from "@/components/candidates/TeamsMeetingDialog";
import { analyzeResume, saveAnalysisData, transferCandidate } from "@/services/candidate-service";
import * as XLSX from 'xlsx';
import { DOCUMENT_CATEGORIES } from "@/components/candidates/DocumentChecklist";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  cedula?: string;
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
  completeTranscription?: "content" | "empty";
}

const initialColumnVisibility = {
  vacante: true,
  compatibilidad: true,
  experiencia: true,
  habilidades: true,
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
    'finalizar-contrato': 4,
    'contratado': 5,
    'proceso-contratacion': 6,
    'training': 7,
    'prueba-tecnica': 8,
    'entrevista-et': 9,
    'entrevista-rc': 10,
    'asignar-campana': 11,
    'under_review': 12,
    'applied': 13,
    'new': 14
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
    'entrevista-rc': { label: 'Entrevista Inicial', variant: 'outline' as const, color: 'text-yellow-600 border-yellow-600', className: 'font-bold text-sm' },
    'entrevista-et': { label: 'Entrevista Técnica', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800 ' },
    'prueba-tecnica': { label: 'Prueba Técnica', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
    'asignar-campana': { label: 'En Campaña', variant: 'outline' as const, color: 'text-hrm-teal border-hrm-teal' },
    'proceso-contratacion': { label: 'Proceso de Contratación', variant: 'secondary' as const, color: '' },
    'contratado': { label: 'CONTRATADO', variant: 'default' as const, color: 'bg-green-600 text-white font-bold', canChange: false },
    'finalizar-contrato': { label: 'CONTRATO FINALIZADO', variant: 'destructive' as const, color: 'bg-red-600 text-white font-bold', canChange: false },
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
  const { toast } = useToast(); const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isDiscardModalOpen, setDiscardModalOpen] = useState(false);
  const [isBlockModalOpen, setBlockModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [transferRecruiter, setTransferRecruiter] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false);
  const [currentInterviewType, setCurrentInterviewType] = useState<'entrevista-rc' | 'entrevista-et' | 'prueba-tecnica' | null>(null);
  const [recruiters, setRecruiters] = useState<{ id: string, first_name: string, last_name: string }[]>([]);
  const [currentUserRecruiter, setCurrentUserRecruiter] = useState<{ id: string, first_name: string, last_name: string } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [interviewTypeFilter, setInterviewTypeFilter] = useState<'all' | 'entrevista-rc' | 'entrevista-et'>('all');
  const [exporting, setExporting] = useState(false);
  const [transcribingCandidates, setTranscribingCandidates] = useState<Set<string>>(new Set());
  const [transcriptionStatus, setTranscriptionStatus] = useState<{ [key: string]: 'pending' | 'processing' | 'completed' | 'failed' }>({});
  const [analysisStatus, setAnalysisStatus] = useState<{ [key: string]: 'pending' | 'analyzing' | 'completed' | 'failed' }>({});
  const [processedCandidates, setProcessedCandidates] = useState<Set<string>>(new Set());
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  // Training Session State
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingDate, setTrainingDate] = useState<Date | undefined>(undefined);
  const [trainingTime, setTrainingTime] = useState("09:00");
  const [trainingDescription, setTrainingDescription] = useState("");
  const [trainingModality, setTrainingModality] = useState<'virtual' | 'presencial'>('virtual');
  const [trainingAddress, setTrainingAddress] = useState("");
  const [trainingLink, setTrainingLink] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId) {
      setSelectedJob([jobId]);
    }
  }, [searchParams]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUserRole(profile.role);
          setCurrentUserRecruiter({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name
          });
        }
      }
    };
    getCurrentUser();
  }, []);

  // Helper function to check if current user can modify a candidate's status
  const canModifyCandidate = (candidate: Candidate, newStatus?: string): boolean => {
    // Check if candidate is already hired - allow modifications only for "finalizar-contrato"
    const isHired = candidate.applications?.some(app => app.status === 'contratado');
    if (isHired && newStatus !== 'finalizar-contrato') return false;

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
      return candidate && canModifyCandidate(candidate, newStatus);
    });
  };

  // Helper function to check if any selected candidate is hired
  const hasHiredCandidates = (): boolean => {
    return selectedCandidates.some(candidateId => {
      const candidate = candidates.find(c => c.id === candidateId);
      return candidate && candidate.applications?.some(app => app.status === 'contratado');
    });
  };

  // Check if any selected candidate is hired and we're not changing to "finalizar-contrato"
  const hasHiredCandidatesExcludingRetirar = (): boolean => {
    return selectedCandidates.some(candidateId => {
      const candidate = candidates.find(c => c.id === candidateId);
      return candidate && candidate.applications?.some(app => app.status === 'contratado') && newStatus !== 'finalizar-contrato';
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

      // Use cedula field directly from candidates table for all candidates
      if (data && data.length > 0) {
        console.log('Using cedula field from candidates table for all candidates');
        data.forEach(candidate => {
          // The cedula field is already included in the select query (*)
          console.log(`Candidate ${candidate.id} cedula:`, candidate.cedula);
        });
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
        // Determine completeTranscription variable per candidate
        const completeTranscription = (candidate.resume_text &&
          candidate.resume_text.trim().length > 0 &&
          !candidate.resume_text.trim().startsWith('%PDF-') &&
          !candidate.resume_text.includes('obj <</Type/') &&
          !candidate.resume_text.includes('/Filter/FlateDecode'))
          ? "content" : "empty";

        let transcription_status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';

        // Check current transcription status from state first
        if (transcriptionStatus[candidate.id]) {
          transcription_status = transcriptionStatus[candidate.id];
        } else if (completeTranscription === "content") {
          // If resume_text has valid content, transcription is complete
          transcription_status = 'completed';
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
          analysis_status,
          completeTranscription
        };
      });

      // Only process candidates that haven't been fully processed yet (both transcription and analysis completed)
      const unprocessedCandidates = processedCandidates.filter(candidate =>
        !(candidate.transcription_status === 'completed' && candidate.analysis_status === 'completed')
      );

      // Auto-transcribe new candidates without resume_text (only once per candidate)
      // Use completeTranscription to control transcription processes
      const candidatesToTranscribe = unprocessedCandidates.filter(candidate =>
        candidate.resume_url &&
        candidate.completeTranscription === "empty" &&
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
      // Use completeTranscription to control analysis processes
      const candidatesToAnalyze = unprocessedCandidates.filter(candidate =>
        candidate.completeTranscription === "content" &&
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
    // Initial fetch
    fetchCandidates(true);
  }, []);

  useEffect(() => {
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
          // Debounce fetch to avoid loops if multiple updates happen quickly?
          // For now just fetch silently.
          fetchCandidates(false);
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array for stable subscription

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCandidates();
  };

  // Function to export all candidate data including AI analysis
  const handleExportCandidates = async () => {
    try {
      setExporting(true);

      // Get all candidates with full data
      const { data: candidatesData, error } = await supabase
        .from('candidates')
        .select(`
          *,
          applications(
            id,
            job_id,
            status,
            campaign_id,
            recruiter_id,
            created_at,
            updated_at,
            jobs(title),
            campaigns!campaign_id(name),
            recruiter:recruiter_id(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching candidates for export:', error);
        toast({
          title: "Error",
          description: "No se pudieron obtener los datos de los candidatos.",
          variant: "destructive"
        });
        return;
      }

      // Process candidates data for export
      const exportData = (candidatesData || []).map(candidate => {
        // Parse analysis data
        let analysisData = null;
        if (candidate.analysis_summary) {
          try {
            analysisData = JSON.parse(candidate.analysis_summary);
            if (typeof analysisData === 'string') {
              analysisData = JSON.parse(analysisData);
            }
          } catch (e) {
            analysisData = null;
          }
        }

        // Get primary application status
        const primaryStatus = getCandidateStatus(candidate.applications);

        // Get primary job and campaign
        const primaryApplication = candidate.applications?.[0];
        const primaryJob = primaryApplication?.jobs?.title || 'N/A';
        const primaryCampaign = primaryApplication?.campaigns?.name || 'N/A';
        const primaryRecruiter = primaryApplication?.recruiter ?
          `${primaryApplication.recruiter.first_name} ${primaryApplication.recruiter.last_name}` : 'N/A';

        return {
          // Personal Information
          'ID': candidate.id,
          'Nombre': candidate.first_name,
          'Apellido': candidate.last_name,
          'Cédula': candidate.cedula || 'N/A',
          'Email': candidate.email,
          'Teléfono': candidate.phone || 'N/A',
          'Ubicación': candidate.location || 'N/A',
          'Años de Experiencia': candidate.experience_years || 'N/A',
          'Habilidades': candidate.skills ? candidate.skills.join(', ') : 'N/A',
          'Fecha de Creación': format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),

          // Application Information
          'Vacante': primaryJob,
          'Campaña': primaryCampaign,
          'Estado': getStatusDisplay(primaryStatus).label,
          'Reclutador': primaryRecruiter,
          'Número de Aplicaciones': candidate.applications?.length || 0,

          // AI Analysis Data
          'Análisis IA - Compatibilidad (%)': analysisData?.compatibilidad?.porcentaje || 'N/A',
          'Análisis IA - Fortalezas': analysisData?.compatibilidad?.fortalezas ? analysisData.compatibilidad.fortalezas.join('; ') : 'N/A',
          'Análisis IA - Áreas de Mejora': analysisData?.areasAMejorar ? analysisData.areasAMejorar.join('; ') : 'N/A',
          'Análisis IA - Recomendaciones': analysisData?.compatibilidad?.recomendacion || 'N/A'
        };
      });

      // Convert to Excel
      if (exportData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay candidatos para exportar.",
          variant: "destructive"
        });
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = Object.keys(exportData[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50 characters
      });
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Candidatos');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `candidatos_completos_${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: es })}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación completada",
        description: `Se exportaron ${exportData.length} candidatos con toda su información y análisis IA.`,
      });

    } catch (error) {
      console.error('Error exporting candidates:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo exportar los datos de los candidatos.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
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

      // Check if the file is a PDF or Word document
      const isPdfFile = resumeUrl.toLowerCase().includes('.pdf') ||
        resumeUrl.includes('application/pdf');
      const isWordFile = resumeUrl.toLowerCase().includes('.doc') ||
        resumeUrl.toLowerCase().includes('.docx') ||
        resumeUrl.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        resumeUrl.includes('application/msword');

      let extractedText = '';

      if (isPdfFile) {
        // Use the existing PDF text extraction logic
        console.log(`Procesando archivo PDF para candidato ${candidate.id}`);
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
      } else if (isWordFile) {
        // Handle Word document text extraction using mammoth.js
        console.log(`Procesando archivo Word para candidato ${candidate.id}`);

        try {
          // Fetch the Word document as ArrayBuffer
          const response = await fetch(resumeUrl);
          if (!response.ok) {
            throw new Error(`Error al descargar documento Word: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();

          // Use mammoth.js to extract text from the Word document
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ arrayBuffer });

          if (result.messages && result.messages.length > 0) {
            console.warn('Advertencias durante la extracción de Word:', result.messages);
          }

          extractedText = result.value;
          console.log(`Texto extraído exitosamente de documento Word para candidato ${candidate.id} (${extractedText.length} caracteres)`);
        } catch (wordError) {
          console.error('Error procesando documento Word:', wordError);
          throw new Error('No se pudo procesar el documento Word. Asegúrese de que sea un archivo .docx válido.');
        }
      } else {
        // Unsupported file type
        console.log(`Tipo de archivo no soportado para candidato ${candidate.id}: ${resumeUrl}`);
        throw new Error('Tipo de archivo no soportado. Solo se permiten archivos PDF y Word (.doc, .docx).');
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

      // Check if it's a PDF parsing error (InvalidPDFException)
      const isPdfError = error instanceof Error && error.message.includes('Invalid PDF structure');

      if (isPdfError) {
        console.log(`Archivo PDF inválido para candidato ${candidate.id}, probablemente es un documento Word subido como PDF`);
        toast({
          title: "Archivo no válido",
          description: `El CV de ${candidate.first_name} ${candidate.last_name} no es un PDF válido. Parece ser un documento Word.`,
          variant: "destructive"
        });
      }

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

  const handleMeetingCreated = async (meetingData: MeetingData) => {
    if (!currentInterviewType || selectedCandidates.length === 0) return;

    try {
      const updates = [];
      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.applications) {
          for (const app of candidate.applications) {
            updates.push(
              supabase
                .from('applications')
                .update({
                  status: currentInterviewType,
                  recruiter_id: currentUserId, // Assign current user as recruiter
                  updated_at: new Date().toISOString(),
                  // Meeting details
                  meeting_date: meetingData.date.toISOString().split('T')[0],
                  meeting_time: meetingData.time,
                  meeting_link: meetingData.meetingLink,
                  meeting_title: meetingData.title,
                  meeting_modality: meetingData.modality,
                  meeting_address: meetingData.address,
                  meeting_status: 'scheduled'
                })
                .eq('id', app.id)
            );
          }
        }
      }

      await Promise.all(updates);

      // Send messages
      const messagePromises = selectedCandidates.map(async (candidateId) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate?.phone) {
          try {
            // Format time
            const [hours, minutes] = meetingData.time.split(':');
            const hour24 = parseInt(hours);
            const ampm = hour24 >= 12 ? 'PM' : 'AM';
            const hour12 = hour24 % 12 || 12;
            const timeFormatted = `${hour12}:${minutes} ${ampm}`;
            const dateTimeStr = `${meetingData.date.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

            let interviewTypeName = '';
            let messageIntro = '';

            switch (currentInterviewType) {
              case 'entrevista-rc':
                interviewTypeName = 'Entrevista con Recursos Humanos';
                messageIntro = 'Felicidades, has avanzado a la fase de';
                break;
              case 'entrevista-et':
                interviewTypeName = 'Entrevista Técnica';
                messageIntro = 'Felicidades, has avanzado a la fase de';
                break;
              case 'prueba-tecnica':
                interviewTypeName = 'Prueba Técnica';
                messageIntro = 'Felicidades, has avanzado a la fase de';
                break;
              default:
                interviewTypeName = 'Entrevista';
                messageIntro = 'Felicidades, has avanzado a la fase de';
            }

            const locationInfo = meetingData.modality === 'presencial'
              ? `Te esperamos en la siguiente dirección: ${meetingData.address}`
              : `Te puedes conectar mediante el siguiente enlace: ${meetingData.meetingLink}`;

            let message = `${messageIntro} *${interviewTypeName}*. La cita quedó programada para el día ${dateTimeStr}. ${locationInfo}`;

            if (currentInterviewType === 'entrevista-rc' && meetingData.description) {
              message += `\n\nDetalles adicionales: ${meetingData.description}`;
            }

            const { sendEvolutionMessage } = await import('@/utils/evolution-api');
            await sendEvolutionMessage(candidate.phone, message, true);
          } catch (error) {
            console.error(`Failed to send message to ${candidate.first_name}:`, error);
          }
        }
      });

      await Promise.all(messagePromises);

      toast({
        title: "Entrevistas programadas",
        description: `Se han programado las entrevistas y actualizado el estado de ${selectedCandidates.length} candidatos.`,
      });

      setIsTeamsDialogOpen(false);
      setStatusModalOpen(false);
      await fetchCandidates(); // Refresh list

    } catch (error) {
      console.error('Error in handleMeetingCreated:', error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar las entrevistas",
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

    // Check if any selected candidate is already hired and we're not changing to "finalizar-contrato"
    const hiredCandidates = selectedCandidates.filter(candidateId => {
      const candidate = candidates.find(c => c.id === candidateId);
      return candidate && candidate.applications?.some(app => app.status === 'contratado') && newStatus !== 'finalizar-contrato';
    });

    if (hiredCandidates.length > 0) {
      toast({
        title: "Estado Final",
        description: "Algunos candidatos seleccionados ya están contratados. Solo se puede cambiar a 'Retirar'.",
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

    // For interview statuses and technical tests, update status immediately and then show Teams dialog for scheduling
    if (newStatus === 'entrevista-rc' || newStatus === 'entrevista-et' || newStatus === 'prueba-tecnica') {
      const candidate = candidates.find(c => c.id === selectedCandidates[0]);
      if (candidate) {
        setCurrentCandidate(candidate);
        setCurrentInterviewType(newStatus);
        setIsTeamsDialogOpen(true);
        setStatusModalOpen(false);
        return;
      }
    }

    if (newStatus) {
      // Validate training fields if needed
      if (newStatus === 'asignar-campana') {
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

      console.log('Updating candidates status:', selectedCandidates);

      try {
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

        // Send messages to candidates based on status change
        const statusesWithMessages = ['proceso-contratacion', 'prueba-tecnica', 'asignar-campana'];

        if (statusesWithMessages.includes(newStatus)) {
          const messagePromises = selectedCandidates.map(async (candidateId) => {
            const candidate = candidates.find(c => c.id === candidateId);
            if (candidate?.phone) {
              try {
                const candidateName = `${candidate.first_name} ${candidate.last_name}`;

                let message = '';
                let messageType = '';

                if (newStatus === 'proceso-contratacion') {
                  // Generate access token for this candidate
                  const accessToken = await generateCandidateAccessToken(candidate.id, 168); // 7 days
                  const documentUrl = `${window.location.origin}/candidate-documents/${candidate.id}?token=${accessToken}`;

                  message = `¡Felicidades ${candidateName}! Has avanzado al proceso de contratación. Para continuar, por favor revisa y firma estos documentos: -  en el siguiente enlace: ${documentUrl}`;
                  messageType = 'Welcome message';
                } else if (newStatus === 'prueba-tecnica') {
                  message = `Hola ${candidateName}, has avanzado a la etapa de Prueba Técnica. Nuestro equipo se pondrá en contacto contigo pronto para coordinar los detalles.`;
                  messageType = 'Technical test notification';
                } else if (newStatus === 'asignar-campana' && trainingDate) {
                  // Format time
                  const [hours, minutes] = trainingTime.split(':');
                  const hour24 = parseInt(hours);
                  const ampm = hour24 >= 12 ? 'PM' : 'AM';
                  const hour12 = hour24 % 12 || 12;
                  const timeFormatted = `${hour12}:${minutes} ${ampm}`;
                  const dateTimeStr = `${trainingDate.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

                  const campaignName = campaigns.find(c => c.id === selectedCampaign)?.name || 'la campaña';

                  const locationInfo = trainingModality === 'presencial'
                    ? `Te esperamos en la siguiente dirección: ${trainingAddress}`
                    : `Te puedes conectar mediante el siguiente enlace: ${trainingLink}`;

                  message = `Felicidades, te informamos que avanzaste a *Inicio de Formación* en la campaña ${campaignName}.. La cita quedó programada para el día ${dateTimeStr}. ${locationInfo}\n\nDetalles adicionales: ${trainingDescription || 'Ninguno'}`;
                  messageType = 'Campaign assignment notification';
                }

                const { sendEvolutionMessage } = await import('@/utils/evolution-api');
                await sendEvolutionMessage(candidate.phone, message, true);
                console.log(`${messageType} sent to ${candidateName} (${candidate.phone})`);
              } catch (error) {
                console.error(`Failed to send message to ${candidate.first_name} ${candidate.last_name}:`, error);
                // Don't show error toast for individual message failures to avoid spam
              }
            } else {
              console.warn(`No phone number found for candidate ${candidate?.first_name} ${candidate?.last_name}`);
            }
          });

          // Send messages in parallel but don't wait for them to complete
          Promise.all(messagePromises).catch(error => {
            console.error('Error sending messages:', error);
          });
        }


        // Handle "finalizar-contrato" status
        if (newStatus === 'finalizar-contrato') {
          toast({
            title: "Contrato Finalizado",
            description: "El contrato del candidato ha sido finalizado.",
            variant: "default"
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
        setTransferModalOpen(false);
        setTransferRecruiter("");
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
    }
  };

  // Handle meeting creation and add meeting details (status already updated)
  const _handleMeetingCreated_Deprecated = async (meetingData: MeetingData) => {
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

          const dateTimeStr = `${meetingData.date.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

          const interviewTypeName = currentInterviewType === 'entrevista-rc' ? 'Entrevista con Recursos Humanos' : 'Entrevista Técnica';
          const locationInfo = meetingData.modality === 'presencial'
            ? `Te esperamos en la siguiente dirección: ${meetingData.address}`
            : `Te puedes conectar mediante el siguiente enlace: ${meetingData.meetingLink}`;

          const message = `Felicidades, has avanzado a la fase de *${interviewTypeName}*. La cita quedó programada para el día ${dateTimeStr}. ${locationInfo}`;

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
      setTransferModalOpen(false);
      setTransferRecruiter("");
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

  // Handle transfer candidates
  const handleTransferCandidates = async () => {
    if (selectedCandidates.length === 0 || !transferRecruiter || !currentUserId) return;

    // Check permissions before transferring candidates
    if (!canModifySelectedCandidates()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para transferir estos candidatos",
        variant: "destructive"
      });
      setTransferModalOpen(false);
      return;
    }

    try {
      // Transfer each selected candidate
      const transferPromises = selectedCandidates.map(candidateId =>
        transferCandidate(candidateId, transferRecruiter, currentUserId)
      );

      await Promise.all(transferPromises);

      toast({
        title: "Candidatos transferidos",
        description: `${selectedCandidates.length} candidatos transferidos exitosamente`,
      });

      setTransferModalOpen(false);
      setTransferRecruiter("");
      setSelectedCandidates([]);
      fetchCandidates();
    } catch (error: any) {
      console.error('Error transferring candidates:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron transferir los candidatos",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (statusCount: number) => {
    if (statusCount === 0) return 'text-gray-500';
    if (statusCount <= 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleDownloadSelectedDocuments = async () => {
    if (selectedCandidates.length === 0) return;

    try {
      setDownloadingDocs(true);
      toast({
        title: "Preparando descarga",
        description: "Obteniendo documentos de los candidatos seleccionados...",
      });

      // Fetch all documents for selected candidates
      const { data: allDocs, error } = await supabase
        .from('candidate_documents')
        .select('*')
        .in('candidate_id', selectedCandidates);

      if (error) throw error;

      if (!allDocs || allDocs.length === 0) {
        toast({
          title: "Sin documentos",
          description: "Ninguno de los candidatos seleccionados tiene documentos subidos.",
          variant: "destructive"
        });
        return;
      }

      const zip = new JSZip();
      const { data: { session } } = await supabase.auth.getSession();
      let successCount = 0;

      // Group documents by candidate
      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) continue;

        const candidateDocs = allDocs.filter(doc => doc.candidate_id === candidateId);
        if (candidateDocs.length === 0) continue;

        // Process this candidate's documents
        const docsToMerge: any[] = [];

        // Sort documents by category order defined in DOCUMENT_CATEGORIES
        const sortedCandidateDocs = [];
        for (const category of Object.values(DOCUMENT_CATEGORIES)) {
          for (const item of category.items) {
            const doc = candidateDocs.find(d => d.document_type === item.id);
            if (doc) {
              sortedCandidateDocs.push(doc);
            }
          }
        }

        // Generate signed URLs for each document
        for (const doc of sortedCandidateDocs) {
          try {
            const urlParts = doc.file_url.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            const filePath = `${candidateId}/${fileName}`;

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('candidate-documents')
              .createSignedUrl(filePath, 3600);

            if (!signedUrlError && signedUrlData?.signedUrl) {
              let type = doc.file_name.split('.').pop()?.toLowerCase() || 'unknown';
              if (type === 'jpeg') type = 'jpg';

              docsToMerge.push({
                url: signedUrlData.signedUrl,
                name: `${candidate.first_name} ${candidate.last_name} - ${doc.document_type}`,
                type: type
              });
            }
          } catch (err) {
            console.warn(`Error generating signed URL for doc ${doc.id}:`, err);
          }
        }

        if (docsToMerge.length > 0) {
          // Generate PDF for this single candidate
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-documents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ documents: docsToMerge })
            });

            if (response.ok) {
              const blob = await response.blob();
              const fileName = `${candidate.first_name}_${candidate.last_name}_${candidate.cedula || 'documentos'}.pdf`.replace(/\s+/g, '_');
              zip.file(fileName, blob);
              successCount++;
            } else {
              console.error(`Failed to merge docs for ${candidate.first_name}`);
            }
          } catch (e) {
            console.error(`Error processing candidate ${candidate.id}`, e);
          }
        }
      }

      if (successCount === 0) {
        toast({
          title: "Error",
          description: "No se pudieron generar los documentos PDF.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Generando ZIP",
        description: `Comprimiendo ${successCount} archivos PDF...`,
      });

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `candidatos_documentos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.zip`);

      toast({
        title: "Descarga completada",
        description: "El archivo ZIP ha sido descargado exitosamente.",
      });

    } catch (err: any) {
      console.error('Error downloading documents:', err);
      toast({
        title: "Error en la descarga",
        description: err.message || "No se pudieron descargar los documentos.",
        variant: "destructive"
      });
    } finally {
      setDownloadingDocs(false);
    }
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
          'contratados': ['contratar', 'contratado', 'proceso-contratacion'],
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
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] min-w-0 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4">
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

          <Button
            variant="default"
            onClick={handleExportCandidates}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
          >
            <Download className={`h-4 w-4 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exportando...' : 'Exportar Candidatos'}
          </Button>

          {activeTab === 'contratados' && (
            <Button
              variant="outline"
              onClick={handleDownloadSelectedDocuments}
              disabled={downloadingDocs || selectedCandidates.length === 0}
              className="border-hrm-teal text-hrm-teal hover:bg-hrm-teal/10 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-900/30 flex items-center gap-1"
            >
              <Download className={`h-4 w-4 ${downloadingDocs ? 'animate-spin' : ''}`} />
              {downloadingDocs ? 'Descargando...' : 'Descargar Documentos'}
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


      <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full">
        <Tabs defaultValue={activeTab} className="flex-1 flex flex-col min-h-0 min-w-0 w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col xl:flex-row justify-between xl:items-center shrink-0 gap-3 pb-2 overflow-x-auto custom-scrollbar">

            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="sin-revisar">Sin Revisar ({filteredCandidates('sin-revisar').length})</TabsTrigger>
                <TabsTrigger value="en-entrevista">En Entrevista ({filteredCandidates('en-entrevista').length})</TabsTrigger>
                <TabsTrigger value="prueba-tecnica">Prueba Técnica ({filteredCandidates('prueba-tecnica').length})</TabsTrigger>
                <TabsTrigger value="en-formacion">En Campaña ({filteredCandidates('en-formacion').length})</TabsTrigger>
                <div className="h-6 w-px bg-border mx-2" />
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

                  <Dialog open={isTransferModalOpen} onOpenChange={setTransferModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canModifySelectedCandidates()}
                      >
                        <SquareArrowRight className="mr-2 h-4 w-4" />
                        Transferir
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-none">
                      <DialogHeader className="bg-hrm-dark-primary py-8 px-6 rounded-t-lg">
                        <DialogTitle className="text-white text-xl">
                          Transferir Candidatos
                        </DialogTitle>
                        <DialogDescription className="text-gray-200">
                          Selecciona el reclutador al que deseas transferir los candidatos seleccionados.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4 px-6">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="transfer-recruiter" className="text-right">
                            Reclutador
                          </Label>
                          <Select value={transferRecruiter} onValueChange={setTransferRecruiter}>
                            <SelectTrigger id="transfer-recruiter" className="col-span-3">
                              <SelectValue placeholder="Selecciona un reclutador" />
                            </SelectTrigger>
                            <SelectContent>
                              {recruiters
                                .filter(recruiter => recruiter.id !== currentUserId) // Exclude current user
                                .map((recruiter) => (
                                  <SelectItem key={recruiter.id} value={recruiter.id}>
                                    {recruiter.first_name} {recruiter.last_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-lg border-t">
                        <Button variant="ghost" onClick={() => setTransferModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleTransferCandidates} disabled={!transferRecruiter}>
                          Transferir Candidatos
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* 👇 AQUÍ EMPIEZA LA IMPLEMENTACIÓN DEL DIALOG 👇 */}
                  <Dialog open={isStatusModalOpen} onOpenChange={setStatusModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canModifySelectedCandidates() || hasHiredCandidates()}
                      >
                        <SquareArrowRight className="mr-2 h-4 w-4" />
                        Cambiar Estado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={cn("p-0 border-none shadow-none transition-all duration-300", newStatus === 'asignar-campana' ? "sm:max-w-[800px]" : "sm:max-w-[425px]")} >
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
                              <SelectItem value="asignar-campana">Inicio de formación</SelectItem>
                              <SelectItem value="proceso-contratacion">Proceso de contratación</SelectItem>
                              <SelectItem value="training">En Formación</SelectItem>

                              <SelectItem value="discarded">Descartado</SelectItem>

                              <SelectItem value="finalizar-contrato">Finalizar Contrato</SelectItem>

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
                              {/* Add current user if they're a recruiter but not in the list */}
                              {currentUserRecruiter && !recruiters.find(r => r.id === currentUserRecruiter.id) && (
                                <SelectItem key={currentUserRecruiter.id} value={currentUserRecruiter.id}>
                                  {currentUserRecruiter.first_name} {currentUserRecruiter.last_name} (Tú)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* --- SELECT DE CAMPAÑA Y FORMACIÓN --- */}
                        {newStatus === 'asignar-campana' && (
                          <>
                            {campaigns.length > 0 && (
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

                            {/* Training Session Fields - Inline */}
                            <div className="col-span-4 space-y-4 border-t pt-4 mt-2">
                              <h4 className="font-medium text-sm text-gray-900 mb-2">Detalles de la sesión (Se aplicará a TODOS los seleccionados)</h4>

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
                                          id="virtual-bulk"
                                          name="modality-bulk"
                                          checked={trainingModality === 'virtual'}
                                          onChange={() => setTrainingModality('virtual')}
                                          className="cursor-pointer"
                                        />
                                        <Label htmlFor="virtual-bulk" className="cursor-pointer font-normal">Virtual</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          id="presencial-bulk"
                                          name="modality-bulk"
                                          checked={trainingModality === 'presencial'}
                                          onChange={() => setTrainingModality('presencial')}
                                          className="cursor-pointer"
                                        />
                                        <Label htmlFor="presencial-bulk" className="cursor-pointer font-normal">Presencial</Label>
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
                                    <div className="flex gap-2">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant={"outline"}
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !trainingDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {trainingDate ? format(trainingDate, "PPP", { locale: es }) : "Fecha"}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={trainingDate}
                                            onSelect={setTrainingDate}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <Input
                                        type="time"
                                        value={trainingTime}
                                        onChange={(e) => setTrainingTime(e.target.value)}
                                        className="w-[120px]"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="trainingDescription">Descripción / Notas</Label>
                                    <textarea
                                      id="trainingDescription"
                                      value={trainingDescription}
                                      onChange={(e) => setTrainingDescription(e.target.value)}
                                      placeholder="Detalles adicionales..."
                                      className="flex min-h-[105px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
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

          <div className="flex-1 flex flex-col min-h-0 w-full overflow-x-auto overflow-y-hidden custom-scrollbar mt-4">
            <TabsContent value="all" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              <CandidatesTable
                candidates={filteredCandidates('all')}
                loading={loading}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                columnVisibility={columnVisibility}
                setDiscardModalOpen={setDiscardModalOpen}
                setBlockModalOpen={setBlockModalOpen}
                setStatusModalOpen={setStatusModalOpen}
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>

            <TabsContent value="discarded" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              <CandidatesTable
                candidates={filteredCandidates('discarded')}
                loading={loading}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                columnVisibility={columnVisibility}
                setDiscardModalOpen={setDiscardModalOpen}
                setBlockModalOpen={setBlockModalOpen}
                setStatusModalOpen={setStatusModalOpen}
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>

            <TabsContent value="contratados" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              <CandidatesTable
                candidates={filteredCandidates('contratados')}
                loading={loading}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                columnVisibility={columnVisibility}
                setDiscardModalOpen={setDiscardModalOpen}
                setBlockModalOpen={setBlockModalOpen}
                setStatusModalOpen={setStatusModalOpen}
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>

            <TabsContent value="sin-revisar" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              <CandidatesTable
                candidates={filteredCandidates('sin-revisar')}
                loading={loading}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                columnVisibility={columnVisibility}
                setDiscardModalOpen={setDiscardModalOpen}
                setBlockModalOpen={setBlockModalOpen}
                setStatusModalOpen={setStatusModalOpen}
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>

            <TabsContent value="en-entrevista" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              {/* Interview Type Filter Buttons */}
              <div className="mb-4 flex gap-2 shrink-0">
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
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>

            <TabsContent value="prueba-tecnica" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              <CandidatesTable
                candidates={filteredCandidates('prueba-tecnica')}
                loading={loading}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                columnVisibility={columnVisibility}
                setDiscardModalOpen={setDiscardModalOpen}
                setBlockModalOpen={setBlockModalOpen}
                setStatusModalOpen={setStatusModalOpen}
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>

            <TabsContent value="en-formacion" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
              <CandidatesTable
                candidates={filteredCandidates('en-formacion')}
                loading={loading}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                columnVisibility={columnVisibility}
                setDiscardModalOpen={setDiscardModalOpen}
                setBlockModalOpen={setBlockModalOpen}
                setStatusModalOpen={setStatusModalOpen}
                setTransferModalOpen={setTransferModalOpen}
                activeTab={activeTab}
                canModifyCandidate={canModifyCandidate}
              />
            </TabsContent>
          </div>
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
          setTransferModalOpen(false);
          setTransferRecruiter("");
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
  setTransferModalOpen: (isOpen: boolean) => void;
  activeTab: string;
  canModifyCandidate: (candidate: Candidate) => boolean;
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ candidates, loading, selectedCandidates,
  setSelectedCandidates, columnVisibility, setDiscardModalOpen, setBlockModalOpen, setStatusModalOpen, setTransferModalOpen, activeTab, canModifyCandidate }) => {
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
    <div className="mt-4 flex-1 overflow-x-auto overflow-y-hidden flex flex-col min-h-0 min-w-0 w-full h-full custom-scrollbar">
      <Card className="flex-1 flex flex-col min-h-0 min-w-0 shadow-md dark:shadow-none border border-transparent dark:border-border h-full w-full">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden h-full w-full relative">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : (
            <div className="w-full flex-1 overflow-y-auto overflow-x-auto custom-scrollbar min-h-0 lg:max-h-[calc(100vh-350px)]">
              <Table className="min-w-[1200px]">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">Candidato</TableHead>
                  {columnVisibility.vacante && <TableHead className="min-w-[180px]">Vacante</TableHead>}
                  {columnVisibility.compatibilidad && <TableHead className="min-w-[140px] text-center">Compatibilidad</TableHead>}
                  {columnVisibility.experiencia && !['en-formacion', 'contratados'].includes(activeTab) && <TableHead className="min-w-[120px]">Experiencia</TableHead>}
                  {columnVisibility.habilidades && !['en-formacion', 'discarded', 'contratados'].includes(activeTab) && <TableHead className="min-w-[180px]">Habilidades</TableHead>}
                  {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.estado_aplicacion && <TableHead className="min-w-[180px]">Estado</TableHead>}
                  {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.reclutador && <TableHead className="min-w-[160px]">Reclutador</TableHead>}
                  {columnVisibility.fecha && <TableHead className="min-w-[130px]">Fecha</TableHead>}
                  <TableHead className="text-right min-w-[100px]">Detalles</TableHead>
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
                            <Link to={`/admin/candidates/${candidate.id}`} className="hover:text-primary">
                              {candidate.first_name} {candidate.last_name}
                            </Link>
                            {/* Status Indicators */}
                            {(candidate.transcription_status || candidate.analysis_status) && (
                              <div className="mt-1 space-y-1">
                                {/* Transcription Status */}
                                {candidate.transcription_status === 'processing' && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Transcribiendo...
                                  </Badge>
                                )}
                                {candidate.transcription_status === 'completed' && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                                    ✓ Transcripción completa
                                  </Badge>
                                )}
                                {candidate.transcription_status === 'failed' && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-600 dark:text-red-400 dark:border-red-400">
                                    ✗ Error en transcripción
                                  </Badge>
                                )}

                                {/* Analysis Status */}
                                {candidate.analysis_status === 'analyzing' && (
                                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-600 dark:text-purple-400 dark:border-purple-400">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Analizando con IA...
                                  </Badge>
                                )}
                                {candidate.analysis_status === 'completed' && (
                                  <div className="text-xs text-green-600 dark:text-green-400">
                                    ✓ Analizado con IA
                                  </div>
                                )}
                                {candidate.analysis_status === 'failed' && (
                                  <div className="text-xs text-red-600 dark:text-red-400">
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

                        {columnVisibility.vacante && <TableCell className="w-[150px] max-w-[150px] lg:w-[160px] lg:max-w-[160px] xl:w-[220px] xl:max-w-[220px]">
                          <div className="flex flex-col gap-1 items-start w-full">
                            {candidate.applications && candidate.applications.length > 0 ? (
                              candidate.applications.map(app => (
                                <TooltipProvider key={app.id}>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="w-full px-2 py-0.5 text-xs font-medium border-hrm-teal/40 text-hrm-teal bg-hrm-teal/5 rounded-md cursor-default overflow-hidden whitespace-nowrap block">
                                        <span className="truncate block">{app.jobs?.title || 'Vacante no disponible'}</span>
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] text-center">
                                      <p>{app.jobs?.title || 'Vacante no disponible'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">Sin postulaciones</span>
                            )}
                          </div>
                        </TableCell>}

                        {columnVisibility.compatibilidad && (
                          <TableCell>
                            {analysisData?.compatibilidad?.porcentaje !== undefined ? (
                              <div className="flex items-center justify-center">
                                <Badge variant="outline" className={`font-bold text-sm ${analysisData.compatibilidad.porcentaje >= 75
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

                        {columnVisibility.experiencia && !['en-formacion', 'contratados'].includes(activeTab) && <TableCell>
                          {candidate.experience_years ? `${candidate.experience_years} ${candidate.experience_years === 1 ? 'mes' : 'meses'}` : 'No especificada'}
                        </TableCell>}

                        {columnVisibility.habilidades && !['en-formacion', 'discarded', 'contratados'].includes(activeTab) && <TableCell>
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

                        {(activeTab === 'all' || activeTab === 'en-entrevista') && columnVisibility.estado_aplicacion && <TableCell>
                          <div className="flex items-center">
                            {(() => {
                              const primaryStatus = getCandidateStatus(candidate.applications);
                              const statusDisplay = getStatusDisplay(primaryStatus);
                              return (
                                <Badge variant={statusDisplay.variant} className={cn("whitespace-nowrap px-3 py-1 rounded-lg", statusDisplay.color)}>
                                  {statusDisplay.label}
                                </Badge>
                              );
                            })()}
                          </div>
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
                                <>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCandidates([candidate.id]);
                                    setStatusModalOpen(true);
                                  }}>
                                    <SquareArrowRight className="mr-2 h-4 w-4" /> {/* <-- Icono añadido */}
                                    <span>Cambiar Estado</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCandidates([candidate.id]);
                                    setTransferModalOpen(true);
                                  }}>
                                    <SquareArrowRight className="mr-2 h-4 w-4" />
                                    <span>Transferir Candidato</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {candidate.applications?.some(app => app.status === 'contratado') && (
                                <DropdownMenuItem disabled className="text-green-600">
                                  <span className="font-bold">CONTRATADO - Estado Final</span>
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
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default Candidates;