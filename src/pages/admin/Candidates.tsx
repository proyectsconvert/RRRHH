
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

interface Job {
  id?: string;
  title: string;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  campaign_id?: string;
  jobs: Job | null;
  campaigns?: { name: string } | null;
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
  applications?: Application[];
  analysis_summary?: string | null; 
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
};

// Get the primary status from candidate applications
const getCandidateStatus = (applications?: Application[]) => {
  if (!applications || applications.length === 0) return null;

  // Priority order for status display (lower number = higher priority)
  const statusPriority: { [key: string]: number } = {
    'blocked': 1,
    'rejected': 2,
    'discarded': 3,
    'contratar': 4,
    'training': 5,
    'entrevista-et': 6,
    'entrevista-rc': 7,
    'asignar-campana': 8,
    'under_review': 9,
    'applied': 10,
    'new': 11
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
    'new': { label: 'Nuevo', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
    'applied': { label: 'Aplicado', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
    'under_review': { label: 'En Revisión', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
    'entrevista-rc': { label: 'Entrevista RC', variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800' },
    'entrevista-et': { label: 'Entrevista Técnica', variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800' },
    'asignar-campana': { label: 'En Campaña', variant: 'secondary' as const, color: 'bg-indigo-100 text-indigo-800' },
    'contratar': { label: 'Contratado', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'training': { label: 'En Formación', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'rejected': { label: 'Rechazado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'discarded': { label: 'Descartado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'blocked': { label: 'Bloqueado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
  };

  return statusConfig[status || ''] || { label: 'Sin Estado', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
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

  const handleJobSelectionChange = (jobId: string, isChecked: boolean) => {
    setSelectedJob(prev => {
      if (isChecked) {
        return [...prev, jobId];
      } else {
        return prev.filter(id => id !== jobId); 
      }
    });
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          phone_country,
          location,
          experience_years,
          skills,
          resume_url,
          analysis_summary,
          created_at,
          updated_at,
          applications(
            id,
            job_id,
            status,
            campaign_id,
            jobs(title),
            campaigns!campaign_id(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los candidatos.",
          variant: "destructive"
        });
        return;
      }

      // Por ahora, solo asignar los datos sin campañas hasta que se ejecute la migración
      setCandidates(data || []);
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

    fetchJobs();
    fetchActiveCampaigns();
  }, []);

  useEffect(() => {
    fetchCandidates();
    
    // Set up subscription for real-time updates
    const channel = supabase
      .channel('candidates-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidates' 
        }, 
        (payload) => {
          console.log('Candidate change detected:', payload);
          fetchCandidates(); // Refresh data when changes occur
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCandidates();
  };

  // Handle status change for selected candidates
  const handleStatusChange = async () => {
    if (!newStatus || selectedCandidates.length === 0) return;

    // Validate campaign selection if status is "asignar-campana"
    if (newStatus === 'asignar-campana' && !selectedCampaign) {
      toast({
        title: "Error",
        description: "Debes seleccionar una campaña",
        variant: "destructive"
      });
      return;
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

  // Handle discard candidates
  const handleDiscardCandidates = async () => {
    if (selectedCandidates.length === 0) return;

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
              'entrevista-rc', 'entrevista-et', 'asignar-campana',
              'contratar', 'training', 'rejected', 'discarded', 'blocked'
            ];
            return !processedStatuses.includes(app.status) || app.status === 'new' || app.status === 'applied' || app.status === 'under_review';
          });
        });
      } else {
        const statusFilters: { [key: string]: string[] } = {
          'en-entrevista': ['entrevista-rc', 'entrevista-et', 'asignar-campana'],
          'en-formacion': ['contratar', 'training'],
          'contratados': ['contratar'],
          'discarded': ['rejected', 'discarded', 'blocked']
        };

        const allowedStatuses = statusFilters[tabFilter] || [];
        filtered = filtered.filter(candidate =>
          candidate.applications?.some(app => allowedStatuses.includes(app.status))
        );
      }
    }

    // 2. Aplicar filtro de búsqueda por nombre (si hay algo escrito)
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(candidate => {
        const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
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
            placeholder="Buscar Candidato..." 
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
<<<<<<< HEAD
                <TabsTrigger value="en-proceso">En entrevista ({filteredCandidates('en-proceso').length})</TabsTrigger>
=======
                <TabsTrigger value="en-entrevista">En Entrevista ({filteredCandidates('en-entrevista').length})</TabsTrigger>
>>>>>>> frontend-v3
                <TabsTrigger value="en-formacion">En Formación ({filteredCandidates('en-formacion').length})</TabsTrigger>
                <div className="h-6 w-px bg-gray-400 mx-2" />
                <TabsTrigger value="all">Todos ({filteredCandidates('all').length})</TabsTrigger>
                <TabsTrigger value="contratados">Contratados ({filteredCandidates('contratados').length})</TabsTrigger>
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
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" size="sm">
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
                      <Button variant="destructive" size="sm">
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
                      <Button variant="secondary" size="sm">
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
                              <SelectItem value="asignar-campana">Asignar Campaña</SelectItem>
                              <SelectItem value="contratar">Contratar</SelectItem>
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
                              <SelectValue placeholder="Selecciona un reclutador" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ginneth">Ginneth</SelectItem>
                              <SelectItem value="laura">Laura</SelectItem>
                              <SelectItem value="sara">Sara</SelectItem>
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
            />
          </TabsContent>

          <TabsContent value="en-entrevista">
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
}

const CandidatesTable: React.FC<CandidatesTableProps> = ({ candidates, loading, selectedCandidates,
  setSelectedCandidates,columnVisibility, setDiscardModalOpen, setBlockModalOpen,setStatusModalOpen, activeTab }) => {
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
                  {columnVisibility.campana && <TableHead className="w-[10%]">Campaña</TableHead>}
                  {columnVisibility.compatibilidad && <TableHead>Compatibilidad</TableHead>}
                  {columnVisibility.experiencia && <TableHead>Experiencia</TableHead>}
                  {columnVisibility.habilidades && <TableHead className="w-[12%]">Habilidades</TableHead>}
                  {columnVisibility.aplicaciones && <TableHead className="w-[5%]">Aplicaciones</TableHead>}
                  {activeTab === 'all' && columnVisibility.estado_aplicacion && <TableHead>Estado</TableHead>}
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

                        {columnVisibility.campana && <TableCell>
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

                        {columnVisibility.experiencia && <TableCell>
                          {candidate.experience_years ? `${candidate.experience_years} meses` : 'No especificada'}
                        </TableCell>}

                        {columnVisibility.habilidades && <TableCell>
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

                        {columnVisibility.aplicaciones &&<TableCell className='text-center'>
                          <span 
                            className={`font-medium ${candidate.applications && candidate.applications.length > 0 
                              ? 'text-hrm-black/80' 
                              : 'text-gray-500'}`}
                          >
                            {candidate.applications ? candidate.applications.length : 0}
                          </span>
                        </TableCell>}

                        {activeTab === 'all' && columnVisibility.estado_aplicacion && <TableCell>
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
                              
                              <DropdownMenuItem onClick={() => {
                                setSelectedCandidates([candidate.id]);
                                setStatusModalOpen(true);
                              }}>
                                <SquareArrowRight className="mr-2 h-4 w-4" /> {/* <-- Icono añadido */}
                                <span>Cambiar Estado</span>
                              </DropdownMenuItem>
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
