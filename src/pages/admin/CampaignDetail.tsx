import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, FileText, Users, Loader2, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  jobs?: any[];
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  created_at: string;
  applications?: {
    id: string;
    status: string;
    job_id: string;
    jobs: {
      title: string;
    };
  }[];
}

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCampaignDetail();
      fetchCampaignCandidates();
    }
  }, [id]);

  const fetchCampaignDetail = async () => {
    try {
      // Obtener detalles de la campaña
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la campaña.",
        });
        return;
      }

      // Obtener vacantes asociadas a la campaña
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, status, location, department')
        .eq('campaign_id', id);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      setCampaign({
        ...campaignData,
        jobs: jobsData || []
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCampaignCandidates = async () => {
    try {
      setLoading(true);

      // Obtener candidatos que tienen aplicaciones asignadas a esta campaña
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          job_id,
          campaign_id,
          candidates (
            id,
            first_name,
            last_name,
            email,
            phone,
            location,
            created_at
          ),
          jobs (
            title
          )
        `)
        .eq('campaign_id', id);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los candidatos de la campaña.",
        });
        return;
      }

      // Procesar los datos para obtener candidatos únicos con sus aplicaciones
      const candidatesMap = new Map();

      (applicationsData || []).forEach(app => {
        const candidate = app.candidates;
        if (candidate && !candidatesMap.has(candidate.id)) {
          candidatesMap.set(candidate.id, {
            ...candidate,
            applications: []
          });
        }

        if (candidate) {
          candidatesMap.get(candidate.id).applications.push({
            id: app.id,
            status: app.status,
            job_id: app.job_id,
            jobs: app.jobs
          });
        }
      });

      setCandidates(Array.from(candidatesMap.values()));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Activa</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completada</Badge>;
      case 'planned': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-blue-200">Planificada</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    const statusConfig = {
      'new': { label: 'Nuevo', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'applied': { label: 'Aplicado', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'under_review': { label: 'En Revisión', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'entrevista-rc': { label: 'Entrevista RC', variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800' },
      'entrevista-et': { label: 'Entrevista Técnica', variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800' },
      'asignar-campana': { label: 'En Campaña', variant: 'secondary' as const, color: 'bg-indigo-100 text-indigo-800' },
      'contratar': { label: 'Proceso de Contratación', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'contratado': { label: 'Contratado', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'training': { label: 'En Formación', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      'discarded': { label: 'Descartado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      'blocked': { label: 'Bloqueado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || { label: 'Sin Estado', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaña no encontrada</h2>
        <p className="text-gray-600 mb-8">La campaña que buscas no existe o ha sido eliminada.</p>
        <Button asChild>
          <Link to="/admin/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Campañas
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/campaigns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-gray-600 mt-1">{campaign.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(campaign.status)}
          <Button variant="outline" asChild>
            <Link to={`/admin/campaigns/${campaign.id}/edit`}>
              Editar Campaña
            </Link>
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-hrm-steel-blue" />
              Vacantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{campaign.jobs?.length || 0}</p>
            <p className="text-sm text-gray-500">
              {campaign.jobs?.filter(job => job.status === 'open').length || 0} abiertas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-hrm-dark-cyan" />
              Candidatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{candidates.length}</p>
            <p className="text-sm text-gray-500">En esta campaña</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Creada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatDistanceToNow(new Date(campaign.created_at), {
                addSuffix: true,
                locale: es
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Campaña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <div className="mt-1">{getStatusBadge(campaign.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de creación</label>
              <p className="mt-1">{new Date(campaign.created_at).toLocaleDateString('es-ES')}</p>
            </div>
            {campaign.start_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de inicio</label>
                <p className="mt-1">{new Date(campaign.start_date).toLocaleDateString('es-ES')}</p>
              </div>
            )}
            {campaign.end_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de fin</label>
                <p className="mt-1">{new Date(campaign.end_date).toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs in Campaign */}
      {campaign.jobs && campaign.jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vacantes en esta Campaña</CardTitle>
            <CardDescription>Vacantes asociadas a esta campaña de contratación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaign.jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-gray-500">
                      {job.department} • {job.location}
                    </p>
                  </div>
                  <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                    {job.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates in Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Candidatos en esta Campaña</CardTitle>
          <CardDescription>Candidatos asignados a esta campaña de contratación</CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Vacante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de aplicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="font-medium">
                        <Link to={`/admin/candidates/${candidate.id}`} className="hover:text-hrm-dark-cyan">
                          {candidate.first_name} {candidate.last_name}
                        </Link>
                      </div>
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {candidate.phone}
                          </div>
                        )}
                        {candidate.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {candidate.location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {candidate.applications?.map((app) => (
                          <Badge key={app.id} variant="outline" className="text-xs">
                            {app.jobs?.title || 'Vacante no disponible'}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {candidate.applications?.map((app) => (
                          <div key={app.id}>
                            {getApplicationStatusBadge(app.status)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(candidate.created_at), {
                        addSuffix: true,
                        locale: es
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/candidates/${candidate.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver perfil
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay candidatos asignados</p>
              <p className="text-sm">Los candidatos asignados a esta campaña aparecerán aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetail;