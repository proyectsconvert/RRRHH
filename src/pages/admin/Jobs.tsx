import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// 1. Icono 'Handshake' importado
import { Plus, Loader2, Search, Handshake,BriefcaseBusiness, ChevronDown } from 'lucide-react'; 
import JobCard, { JobType } from '@/components/jobs/JobCard';
import JobDeleteButton from '@/components/jobs/JobDeleteButton';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

const JOB_TYPES = [
  { id: 'full-time', label: 'Tiempo Completo' },
  { id: 'part-time', label: 'Medio Tiempo' },
  { id: 'contract', label: 'Contrato' },
  { id: 'internship', label: 'Pasantía' },
  { id: 'temporary', label: 'Temporal' },
];

const Jobs = () => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // ... (el resto de las funciones como fetchJobs, useEffect, etc., permanecen iguales)
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, applications(id)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      const transformedJobs: JobType[] = data?.map(job => ({
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        status: job.status as JobType['status'], 
        type: job.type as JobType['type'],
        created_at: job.created_at,
        updated_at: job.updated_at,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        salary_range: job.salary_range,
        campaign_id: job.campaign_id,
        applicants: job.applications?.length || 0,
        createdAt: job.created_at ? new Date(job.created_at) : new Date()
      })) || [];
      
      setJobs(transformedJobs);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
       toast({
          title: "Error",
          description: "No se pudieron cargar las vacantes.",
          variant: "destructive"
        });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobs();

    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' }, 
        () => fetchJobs()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);
  
  const handleTypeSelectionChange = (typeId: string, isChecked: boolean) => {
    setSelectedTypes(prev => {
      if (isChecked) {
        return [...prev, typeId];
      } else {
        return prev.filter(id => id !== typeId); 
      }
    });
  };

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (activeTab !== 'all') {
      filtered = filtered.filter(job => job.status === activeTab);
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(job => selectedTypes.includes(job.type));
    }

    return filtered;
  }, [jobs, activeTab, searchQuery, selectedTypes]);

  const statusCounts = useMemo(() => {
    return {
      open: jobs.filter(j => j.status === 'open').length,
      closed: jobs.filter(j => j.status === 'closed').length,
      draft: jobs.filter(j => j.status === 'draft').length,
    };
  }, [jobs]);


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Vacantes</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar Vacante..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button className="bg-hrm-dark-cyan hover-bg-hrm-steel-blue" asChild>
            <Link to="/admin/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Vacante
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        {/* 2. Contenedor modificado: quitamos 'justify-between' para agrupar los elementos a la izquierda */}
        <div className="flex items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">Todas ({jobs.length})</TabsTrigger>
            <TabsTrigger value="open">Abiertas ({statusCounts.open})</TabsTrigger>
            <TabsTrigger value="closed">Cerradas ({statusCounts.closed})</TabsTrigger>
            <TabsTrigger value="draft">Borradores ({statusCounts.draft})</TabsTrigger>
          </TabsList>
          
          {/* 3. El Popover ahora está aquí, junto a los tabs, con un margen a la izquierda */}
          <div className="ml-4">
            <Popover>
              <PopoverTrigger asChild>
                {/* 4. Icono y texto del botón actualizados */}
                <Button variant="outline" size="sm">
                  
                  Tipo de Contrato
                  <ChevronDown className="mr-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="grid gap-2">
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    Tipo de Contrato
                  </div>
                  {JOB_TYPES.map((jobType) => (
                    <label
                      key={jobType.id}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <Checkbox
                        id={`type-${jobType.id}`}
                        checked={selectedTypes.includes(jobType.id)}
                        onCheckedChange={(checked) => handleTypeSelectionChange(jobType.id, !!checked)}
                      />
                      <span className="text-sm">{jobType.label}</span>
                    </label>
                  ))}
                  {selectedTypes.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTypes([])} className="mt-2">
                      Limpiar selección
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* El resto del componente (TabsContent) permanece igual */}
        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div key={job.id} className="relative">
                    <JobCard job={job} isAdmin={true} />
                    <JobDeleteButton 
                      jobId={job.id} 
                      jobTitle={job.title} 
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                  <p>No se encontraron vacantes que coincidan con tus filtros.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Jobs;