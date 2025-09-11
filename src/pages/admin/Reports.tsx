import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { 
  PlusCircle, Download, BarChart, Users, 
  FileText, Loader2, FileSpreadsheet, FileText as FileTextIcon,
  File 
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportData } from '@/utils/export';
import { Report } from '@/utils/supabase-helpers';

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Since we don't have a reports table yet, we'll simulate reports with fake data
        // In a production environment, you would fetch from an actual reports table
        setReports([
          {
            id: '1',
            name: 'Candidates Report - 2025-05-01',
            type: 'candidates',
            created_at: '2025-05-01T12:00:00Z',
            result: {
              summary: "Análisis de candidatos activos",
              total_candidates: 25,
              new_this_month: 8,
              by_skill: {
                "React": 12,
                "Node.js": 9,
                "Python": 7,
                "UI/UX": 5
              },
              data: [
                { name: "Candidato 1", position: "Frontend Developer", status: "Reviewing" },
                { name: "Candidato 2", position: "Backend Developer", status: "Interview" }
              ]
            }
          },
          {
            id: '2',
            name: 'Vacancies Report - 2025-05-02',
            type: 'vacancies',
            created_at: '2025-05-02T14:30:00Z',
            result: {
              summary: "Análisis de vacantes activas",
              total_jobs: 12,
              open_positions: 7,
              most_applied: "Frontend Developer",
              by_department: {
                "Tecnología": 5,
                "Marketing": 3,
                "Ventas": 2,
                "RRHH": 2
              },
              data: [
                { title: "Frontend Developer", applicants: 15, status: "Open" },
                { title: "Marketing Manager", applicants: 8, status: "Open" }
              ]
            }
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los reportes.",
        });
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [toast]);

  const generateReport = async (type: string) => {
    try {
      setGeneratingReport(type);
      
      // Generate sample report data
      let reportData: Report = {
        id: Date.now().toString(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${format(new Date(), 'yyyy-MM-dd')}`,
        type,
        created_at: new Date().toISOString(),
        result: {},
      };
      
      // Create different sample data based on report type
      if (type === 'candidates') {
        reportData.result = {
          summary: "Análisis de candidatos activos",
          total_candidates: 25,
          new_this_month: 8,
          by_skill: {
            "React": 12,
            "Node.js": 9,
            "Python": 7,
            "UI/UX": 5
          },
          data: [
            { name: "Candidato 1", position: "Frontend Developer", status: "Reviewing" },
            { name: "Candidato 2", position: "Backend Developer", status: "Interview" }
          ]
        };
      } else if (type === 'vacancies') {
        reportData.result = {
          summary: "Análisis de vacantes activas",
          total_jobs: 12,
          open_positions: 7,
          most_applied: "Frontend Developer",
          by_department: {
            "Tecnología": 5,
            "Marketing": 3,
            "Ventas": 2,
            "RRHH": 2
          },
          data: [
            { title: "Frontend Developer", applicants: 15, status: "Open" },
            { title: "Marketing Manager", applicants: 8, status: "Open" }
          ]
        };
      } else if (type === 'analytics') {
        reportData.result = {
          summary: "Análisis de contrataciones",
          avg_time_to_hire: "21 días",
          cost_per_hire: "$1,200",
          best_sources: ["LinkedIn", "Indeed", "Referrals"],
          monthly_trend: {
            "Enero": 3,
            "Febrero": 4,
            "Marzo": 2,
            "Abril": 5
          },
          data: [
            { position: "Full Stack Developer", time_to_hire: "18 días", source: "LinkedIn" },
            { position: "Digital Marketing", time_to_hire: "24 días", source: "Indeed" }
          ]
        };
      }
      
      // Store report in state
      setReports(prev => [reportData, ...prev]);
      
      toast({
        title: "Reporte generado",
        description: "El reporte se ha generado correctamente.",
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el reporte.",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadReport = (report: Report, format: 'csv' | 'xlsx' | 'txt' | 'pdf') => {
    try {
      if (format === 'csv' || format === 'xlsx' || format === 'txt' || format === 'pdf') {
        // Use our export utility for these formats
        let dataToExport: any[] = [];
        
        // Convert the report data to a format suitable for export
        if (report.result && report.result.data && Array.isArray(report.result.data)) {
          dataToExport = report.result.data;
        } else if (report.result) {
          // If there's no data array, flatten the result object
          const flattenedData = { ...report.result };
          delete flattenedData.data;
          
          // Handle nested objects by converting them to strings
          Object.keys(flattenedData).forEach(key => {
            if (typeof flattenedData[key] === 'object' && flattenedData[key] !== null) {
              flattenedData[key] = JSON.stringify(flattenedData[key]);
            }
          });
          
          dataToExport = [flattenedData];
        }
        
        exportData(dataToExport, {
          filename: report.name.replace(/\s+/g, '_'),
          format
        });
      } else {
        // Create a JSON Blob with the report data (fallback)
        const data = JSON.stringify(report.result, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "Reporte descargado",
        description: `El reporte se ha descargado correctamente.`,
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo descargar el reporte.",
      });
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'candidates':
        return <Users className="h-6 w-6 text-blue-500" />;
      case 'vacancies':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'analytics':
        return <BarChart className="h-6 w-6 text-purple-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div>
      <h1 className="page-title">Reportes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md font-medium">Reporte de Candidatos</CardTitle>
            <Users className="h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Genera un informe detallado de todos los candidatos y sus aplicaciones.</p>
            <Button 
              size="sm" 
              onClick={() => generateReport('candidates')}
              disabled={generatingReport !== null}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              {generatingReport === 'candidates' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md font-medium">Reporte de Vacantes</CardTitle>
            <FileText className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Genera un informe sobre las vacantes activas y su rendimiento.</p>
            <Button 
              size="sm" 
              onClick={() => generateReport('vacancies')}
              disabled={generatingReport !== null}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              {generatingReport === 'vacancies' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md font-medium">Análisis de Contrataciones</CardTitle>
            <BarChart className="h-6 w-6 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Genera estadísticas y análisis sobre el proceso de contratación.</p>
            <Button 
              size="sm" 
              onClick={() => generateReport('analytics')}
              disabled={generatingReport !== null}
              className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
            >
              {generatingReport === 'analytics' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reportes Generados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getReportIcon(report.type)}
                          <span className="ml-2">{report.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadReport(report, 'csv')}>
                              <FileTextIcon className="h-4 w-4 mr-2" />
                              <span>CSV</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadReport(report, 'xlsx')}>
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              <span>Excel (XLSX)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadReport(report, 'txt')}>
                              <FileTextIcon className="h-4 w-4 mr-2" />
                              <span>Texto (TXT)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadReport(report, 'pdf')}>
                              <File className="h-4 w-4 mr-2" />
                              <span>PDF</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      No hay reportes generados aún. Crea uno utilizando los botones arriba.
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

export default Reports;
