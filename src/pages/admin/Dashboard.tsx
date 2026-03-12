
import React, { useState, useEffect } from 'react';
import { Calendar, File, User, Users } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const Dashboard = () => {
  const [stats, setStats] = useState([
    {
      title: 'Candidatos Totales',
      value: 0,
      icon: Users,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Vacantes Activas',
      value: 0,
      icon: File,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Entrevistas Programadas',
      value: 0,
      icon: Calendar,
      trend: { value: 0, isPositive: false },
    },
    {
      title: 'Contrataciones este Mes',
      value: 0,
      icon: User,
      trend: { value: 0, isPositive: true },
    },
  ]);

  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [popularJobs, setPopularJobs] = useState<any[]>([]);
  const [applicationsByStatus, setApplicationsByStatus] = useState<any[]>([]);
  const [interviewStats, setInterviewStats] = useState({
    rcAssigned: 0,
    etAssigned: 0,
    totalActive: 0,
    inProcess: 0,
  });
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Función para cargar los datos del dashboard
  const loadDashboardData = async () => {
    try {
      // Get current user info
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
        }
      }

      // Obtener conteo de candidatos
      const { count: candidatesCount, error: candidatesError } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      if (candidatesError) throw candidatesError;

      // Obtener vacantes activas
      const { count: activeJobsCount, error: jobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (jobsError) throw jobsError;

      // Obtener entrevistas programadas (aplicaciones en estado 'interview')
      const { count: interviewsCount, error: interviewsError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'interview');

      if (interviewsError) throw interviewsError;

      // Obtener contrataciones del mes actual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count: hiresCount, error: hiresError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'hired')
        .gte('updated_at', firstDayOfMonth);

      if (hiresError) throw hiresError;

      // Get candidates data for interview statistics
      const { data: candidatesData, error: candidatesDataError } = await supabase
        .from('candidates')
        .select(`
          id,
          applications(
            id,
            status,
            recruiter_id
          )
        `);

      if (candidatesDataError) throw candidatesDataError;

      // Calculate interview statistics
      let rcAssigned = 0;
      let etAssigned = 0;
      let totalActive = 0;
      let inProcess = 0;

      candidatesData?.forEach(candidate => {
        candidate.applications?.forEach(app => {
          if (currentUserRole === 'reclutador' && currentUserId) {
            // For recruiters, only count their assigned interviews
            if (app.recruiter_id === currentUserId) {
              if (app.status === 'entrevista-rc') rcAssigned++;
              if (app.status === 'entrevista-et') etAssigned++;
              if (['entrevista-rc', 'entrevista-et'].includes(app.status)) totalActive++;
              if (['entrevista-rc', 'entrevista-et', 'asignar-campana'].includes(app.status)) inProcess++;
            }
          } else {
            // For admins, count all interviews
            if (app.status === 'entrevista-rc') rcAssigned++;
            if (app.status === 'entrevista-et') etAssigned++;
            if (['entrevista-rc', 'entrevista-et'].includes(app.status)) totalActive++;
            if (['entrevista-rc', 'entrevista-et', 'asignar-campana'].includes(app.status)) inProcess++;
          }
        });
      });

      setInterviewStats({
        rcAssigned,
        etAssigned,
        totalActive,
        inProcess,
      });
      
      // Actualizar los estados con los datos obtenidos
      setStats([
        {
          title: 'Candidatos Totales',
          value: candidatesCount || 0,
          icon: Users,
          trend: { value: 12, isPositive: true }, // Valor estático por ahora
        },
        {
          title: 'Vacantes Activas',
          value: activeJobsCount || 0,
          icon: File,
          trend: { value: 5, isPositive: true }, // Valor estático por ahora
        },
        {
          title: 'Entrevistas Programadas',
          value: interviewsCount || 0,
          icon: Calendar,
          trend: { value: 3, isPositive: false }, // Valor estático por ahora
        },
        {
          title: 'Contrataciones este Mes',
          value: hiresCount || 0,
          icon: User,
          trend: { value: 25, isPositive: true }, // Valor estático por ahora
        },
      ]);
      
      // Cargar candidatos recientes
      const { data: recentCandidatesData, error: recentCandidatesError } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentCandidatesError) throw recentCandidatesError;
      setRecentCandidates(recentCandidatesData || []);
      
      // Cargar vacantes populares
      try {
        // Intentar usar la función RPC primero
        const { data: popularJobsData, error: popularJobsError } = await supabase
          .from('jobs')  // Cambio: usamos jobs directamente en lugar de la función RPC
          .select('id, title, department, created_at, status')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (popularJobsError) throw popularJobsError;
        setPopularJobs(popularJobsData || []);
      } catch (error) {
        console.error("Error al obtener trabajos populares:", error);
        // Fallback si hay error
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title, department, created_at, status')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);
        
        setPopularJobs(jobsData || []);
      }
      
      // Cargar datos para el gráfico de aplicaciones por estado
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('status');
      
      if (applicationsError) throw applicationsError;
      
      // Agrupar aplicaciones por estado
      const statusCounts: Record<string, number> = {};
      applicationsData?.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });
      
      // Convertir a formato para el gráfico
      const chartData = Object.keys(statusCounts).map(status => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusCounts[status]
      }));
      
      setApplicationsByStatus(chartData);
      
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    }
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
    
    // Configurar suscripción en tiempo real para cambios en las tablas
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => loadDashboardData())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => loadDashboardData())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => loadDashboardData())
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadDashboardData())
      .subscribe();
    
    // Limpiar suscripción
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Función para determinar el color de estado
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'open': 'bg-hrm-dark-green/20 text-hrm-dark-green',
      'closed': 'bg-red-100 text-red-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'new': 'bg-blue-100 text-blue-800',
      'interview': 'bg-purple-100 text-purple-800',
      'hired': 'bg-green-100 text-green-800',
      'rejected': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Dashboard General</h1>
          <p className="text-muted-foreground mt-1">Resumen y métricas principales de la plataforma</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats
          .filter((stat, index) => {
            // Hide "Entrevistas Programadas" (index 2) and "Contrataciones este Mes" (index 3) for recruiters
            if (currentUserRole === 'reclutador') {
              return index !== 2 && index !== 3;
            }
            return true;
          })
          .map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
      </div>

      {/* Interview Statistics Cards */}
      {(currentUserRole === 'reclutador' || currentUserRole === 'admin') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/60 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between z-10">
              <div>
                <p className="text-sm font-semibold text-muted-foreground tracking-tight">Entrevistas RC Asignadas</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {interviewStats.rcAssigned}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">RC</span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/60 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between z-10">
              <div>
                <p className="text-sm font-semibold text-muted-foreground tracking-tight">Entrevistas Técnicas Asignadas</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {interviewStats.etAssigned}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">ET</span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/60 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between z-10">
              <div>
                <p className="text-sm font-semibold text-muted-foreground tracking-tight">Total Entrevistas Activas</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {interviewStats.totalActive}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg leading-none">∑</span>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/60 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110"></div>
            <div className="relative flex items-center justify-between z-10">
              <div>
                <p className="text-sm font-semibold text-muted-foreground tracking-tight">Candidatos en Proceso</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {interviewStats.inProcess}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">⚡</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Card className="bg-background p-2 md:p-6 rounded-3xl shadow-sm border border-border/60 transition-shadow hover:shadow-md">
          <CardHeader className="pb-8">
            <CardTitle className="flex items-center text-xl font-bold text-foreground">
              <div className="h-3 w-3 rounded-full bg-indigo-500 mr-3 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
              Aplicaciones por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsByStatus.length > 0 ? (
              <ChartContainer 
                className="h-[320px] w-full" 
                config={{
                  new: { color: 'rgb(59 130 246)' },
                  interview: { color: 'rgb(147 51 234)' },
                  hired: { color: 'rgb(16 185 129)' }, // Emerald
                  rejected: { color: 'rgb(244 63 94)' } // Rose
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <ChartTooltip 
                      content={<ChartTooltipContent className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl rounded-xl" />} 
                      cursor={{fill: '#f1f5f9'}}
                    />
                    <Bar dataKey="count" name="Cantidad" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/50 rounded-2xl border border-dashed border-border/60">
                <File className="h-12 w-12 mb-3 text-muted-foreground/50" />
                <p className="font-medium">No hay datos de aplicaciones disponibles aún.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Candidates Table */}
        <div className="bg-background rounded-3xl shadow-sm border border-border/60 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
          <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center">
              <Users className="h-5 w-5 mr-2 text-cyan-600 dark:text-cyan-400" />
              Candidatos Recientes
            </h2>
          </div>
          <div className="p-0 flex-1">
            {recentCandidates.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50 hover:bg-muted/50">
                  <TableRow className="border-b-border/50">
                    <TableHead className="font-semibold text-muted-foreground">Nombre</TableHead>
                    <TableHead className="font-semibold text-muted-foreground hidden sm:table-cell">Email</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-right pr-6">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCandidates.map((candidate) => (
                    <TableRow key={candidate.id} className="hover:bg-muted/50 transition-colors border-b-border/50">
                      <TableCell className="font-medium text-foreground py-4">
                        {`${candidate.first_name} ${candidate.last_name}`}
                        <div className="text-xs text-muted-foreground font-normal sm:hidden mt-1">{candidate.email}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell py-4">{candidate.email}</TableCell>
                      <TableCell className="text-muted-foreground text-right pr-6 py-4 whitespace-nowrap">{formatDate(candidate.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground bg-muted/30 m-4 rounded-2xl border border-dashed border-border/60">
                <Users className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium">No hay candidatos recientes.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Popular Jobs Table */}
        <div className="bg-background rounded-3xl shadow-sm border border-border/60 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
          <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center">
              <File className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              Vacantes Populares
            </h2>
          </div>
          <div className="p-0 flex-1">
            {popularJobs.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50 hover:bg-muted/50">
                  <TableRow className="border-b-border/50">
                    <TableHead className="font-semibold text-muted-foreground">Título</TableHead>
                    <TableHead className="font-semibold text-muted-foreground hidden sm:table-cell">Departamento</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-right pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-muted/50 transition-colors border-b-border/50">
                      <TableCell className="font-medium text-foreground py-4">
                        {job.title}
                        <div className="text-xs text-muted-foreground font-normal sm:hidden mt-1">{job.department}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell py-4">{job.department}</TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Badge className={`font-medium shadow-sm transition-transform hover:scale-105 ${getStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground bg-muted/30 m-4 rounded-2xl border border-dashed border-border/60">
                <File className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium">No hay vacantes disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
