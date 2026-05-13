import React from 'react';
import { Calendar, MapPin, Users, Share2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface JobType {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'open' | 'in_progress' | 'closed' | 'draft';
  created_at?: string;
  createdAt?: Date;
  updated_at?: string;
  applicants?: number;
  applications?: Array<any>;
  description?: string;
  requirements?: string | null;
  responsibilities?: string | null;
  salary_range?: string | null;
  campaign_id?: string | null;
}

interface JobCardProps {
  job: JobType;
  isAdmin?: boolean;
  isRecruiter?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, isAdmin = false, isRecruiter = false }) => {
  const { toast } = useToast();
  const jobStatusColors = {
    open: 'bg-hrm-dark-green/20 text-hrm-dark-green dark:bg-green-900/40 dark:text-green-400',
    closed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  };

  // Etiquetas legibles para los IDs legacy. Para valores nuevos (texto libre)
  // se muestra el valor tal como lo escribió el usuario.
  const legacyJobTypeLabels: Record<string, string> = {
    'full-time': 'Tiempo Completo',
    'part-time': 'Medio Tiempo',
    'contract': 'Contrato',
    'internship': 'Pasantía',
    'temporary': 'Temporal',
  };
  const formatJobType = (value?: string | null) =>
    (value && legacyJobTypeLabels[value]) || value || 'No especificado';

  const jobStatusLabels = {
    'open': 'Abierta',
    'closed': 'Cerrada',
    'draft': 'Borrador',
    'in_progress': 'En Proceso',
  };

  // Función para manejar las diferentes formas en que puede venir la fecha
  const getFormattedDate = () => {
    if (job.createdAt instanceof Date) {
      return job.createdAt.toLocaleDateString();
    } else if (job.created_at) {
      return new Date(job.created_at).toLocaleDateString();
    } else {
      return 'Fecha desconocida';
    }
  };

  // Cantidad de postulantes (puede venir de diferentes fuentes)
  const applicantsCount = job.applicants || (job.applications?.length || 0);

  const handleShare = async () => {
    const url = `${window.location.origin}/postularse/${job.id}`;
    const shareData = {
      title: `Postúlate a: ${job.title}`,
      text: `¡Mira esta vacante de ${job.title} en ${job.department}!`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error al compartir:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Enlace copiado",
          description: "El enlace ha sido copiado al portapapeles.",
        });
      } catch (err) {
        console.error('Error al copiar:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo copiar el enlace.",
        });
      }
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg font-semibold text-hrm-dark-cyan dark:text-cyan-400">
              {isAdmin ? (
                <Link to={`/admin/jobs/${job.id}`} className="hover:underline">
                  {job.title}
                </Link>
              ) : (
                <Link to={`/jobs/${job.id}`} className="hover:underline">
                  {job.title}
                </Link>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{job.department}</p>
          </div>
          <Badge className={jobStatusColors[job.status] || jobStatusColors.open}>
            {jobStatusLabels[job.status] || 'Abierta'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Publicado: {getFormattedDate()}</span>
          </div>
          {(isAdmin || job.status === 'open') && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span>{applicantsCount} {applicantsCount === 1 ? 'Candidato' : 'Candidatos'}</span>
            </div>
          )}
          <div className="mt-3">
            <Badge variant="outline" className="text-xs">
              {formatJobType(job.type)}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {isAdmin ? (
          <div className="flex space-x-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="border-hrm-steel-blue text-hrm-steel-blue hover:bg-hrm-steel-blue hover:text-white"
              asChild
            >
              <Link to={`/admin/jobs/${job.id}`}>Ver detalles</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-hrm-dark-cyan text-hrm-dark-cyan hover:bg-hrm-dark-cyan hover:text-white dark:border-cyan-500 dark:text-cyan-400 dark:hover:bg-cyan-600 dark:hover:text-white"
              asChild
            >
              <Link to={`/admin/jobs/${job.id}/edit`}>Editar</Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-hrm-dark-cyan text-hrm-dark-cyan hover:bg-hrm-dark-cyan hover:text-white dark:border-cyan-500 dark:text-cyan-400 dark:hover:bg-cyan-600 dark:hover:text-white"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Código QR para Postulación</DialogTitle>
                  <DialogDescription>
                    Escanea este código para acceder directamente al formulario de postulación para la vacante: {job.title}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <QRCode
                      value={`${window.location.origin}/postularse/${job.id}`}
                      size={200}
                      level="H"
                    />
                  </div>
                </div>
                <div className="flex justify-center pb-4 flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground break-all text-center px-4">
                    {`${window.location.origin}/postularse/${job.id}`}
                  </p>
                  <Button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-hrm-dark-cyan hover:bg-hrm-steel-blue text-white"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="w-full flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-hrm-steel-blue text-hrm-steel-blue hover:bg-hrm-steel-blue hover:text-white"
              asChild
            >
              <Link to={`/jobs/${job.id}`}>Ver detalles</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-hrm-dark-cyan hover:bg-hrm-steel-blue dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:text-white"
              asChild
            >
              <Link to={`/postularse/${job.id}`}>Postularse</Link>
            </Button>

            {/* QR Code for Recruiters (who are not admins) */}
            {isRecruiter && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-hrm-dark-cyan text-hrm-dark-cyan hover:bg-hrm-dark-cyan hover:text-white dark:border-cyan-500 dark:text-cyan-400 dark:hover:bg-cyan-600 dark:hover:text-white px-3"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Código QR para Postulación</DialogTitle>
                    <DialogDescription>
                      Escanea este código para acceder directamente al formulario de postulación para la vacante: {job.title}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <QRCode
                        value={`${window.location.origin}/postularse/${job.id}`}
                        size={200}
                        level="H"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center pb-4 flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground break-all text-center px-4">
                      {`${window.location.origin}/postularse/${job.id}`}
                    </p>
                    <Button
                      onClick={handleShare}
                      className="flex items-center gap-2 bg-hrm-dark-cyan hover:bg-hrm-steel-blue text-white"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartir
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;
