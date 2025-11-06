
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, FileText, User, Loader2, SquareArrowRight } from 'lucide-react';
import { Candidate, Application } from '@/types/candidate';

// Get the primary status from candidate applications
const getCandidateStatus = (applications?: Application[]) => {
  if (!applications || applications.length === 0) return null;

  // Priority order for status display (lower number = higher priority)
  const statusPriority: { [key: string]: number } = {
    'blocked': 1,
    'rejected': 2,
    'discarded': 3,
    'contratado': 4,
    'proceso-contratacion': 5,
    'training': 6,
    'entrevista-et': 7,
    'entrevista-rc': 8,
    'asignar-campana': 9,
    'under_review': 10,
    'applied': 11,
    'new': 12
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
    'proceso-contratacion': { label: 'Proceso de Contratación', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'contratado': { label: 'CONTRATADO', variant: 'default' as const, color: 'bg-green-600 text-white font-bold', canChange: false },
    'finalizar-contrato': { label: 'Finalizar Contrato', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'training': { label: 'En Formación', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'rejected': { label: 'Rechazado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'discarded': { label: 'Descartado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    'blocked': { label: 'Bloqueado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
  };

  return statusConfig[status || ''] || { label: 'Sin Estado', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
};

interface CandidateSidebarProps {
  candidate: Candidate;
  analyzing: boolean;
  resumeContent: string | null;
  transcribing?: boolean;
  onViewResume: () => void;
  onAnalyzeCV: (applicationId?: string) => void;
  onChangeStatus?: () => void;
  getStatusText: (status: string) => string;
  canModifyCandidate?: (candidate: Candidate) => boolean;
}

const CandidateSidebar: React.FC<CandidateSidebarProps> = ({
  candidate,
  analyzing,
  resumeContent,
  transcribing = false,
  onViewResume,
  onAnalyzeCV,
  onChangeStatus,
  getStatusText,
  canModifyCandidate
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {candidate.first_name} {candidate.last_name}
          </CardTitle>
          <CardDescription>
            {candidate.experience_years ? `${candidate.experience_years} ${candidate.experience_years === 1 ? 'mes' : 'meses'}` : 'Experiencia no especificada'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{candidate.email}</span>
            </div>

            {candidate.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.phone}</span>
              </div>
            )}

            {/* Cédula */}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Cédula: {candidate.document_id || 'No especificada'}</span>
            </div>

            {candidate.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.location}</span>
              </div>
            )}
          </div>

          {/* Candidate Status */}
          {candidate.applications && candidate.applications.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Estado del Candidato</h3>
              {(() => {
                const primaryStatus = getCandidateStatus(candidate.applications);
                const statusDisplay = getStatusDisplay(primaryStatus);
                return (
                  <Badge variant={statusDisplay.variant} className={statusDisplay.color}>
                    {statusDisplay.label}
                  </Badge>
                );
              })()}
            </div>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Habilidades</h3>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {candidate.resume_url && (
            <div>
              <h3 className="text-sm font-medium mb-2">Curriculum Vitae</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onViewResume}
                disabled={transcribing}
              >
                <FileText className="mr-2 h-4 w-4" />
                {transcribing ? 'Transcribiendo...' : 'Ver CV'}
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
           {(() => {
             const primaryStatus = getCandidateStatus(candidate.applications);
             const statusDisplay = getStatusDisplay(primaryStatus);
             const canChangeStatus = statusDisplay.canChange !== false;

             return onChangeStatus && canModifyCandidate && canModifyCandidate(candidate) ? (
               primaryStatus === 'contratado' ? (
                 <Button
                   variant="destructive"
                   className="w-full"
                   onClick={onChangeStatus}
                 >
                   <SquareArrowRight className="mr-2 h-4 w-4" />
                   Finalizar Contrato
                 </Button>
               ) : canChangeStatus ? (
                 <Button
                   variant="outline"
                   className="w-full"
                   onClick={onChangeStatus}
                 >
                   <SquareArrowRight className="mr-2 h-4 w-4" />
                   Cambiar Estado
                 </Button>
               ) : (
                 <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md">
                   <p className="text-sm text-green-800 font-medium text-center">
                     Candidato Contratado
                   </p>
                   <p className="text-xs text-green-600 text-center mt-1">
                     Estado final - No se pueden realizar más cambios
                   </p>
                 </div>
               )
             ) : primaryStatus === 'contratado' ? (
               <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md">
                 <p className="text-sm text-green-800 font-medium text-center">
                   Candidato Contratado
                 </p>
                 <p className="text-xs text-green-600 text-center mt-1">
                   Estado final - No se pueden realizar más cambios
                 </p>
               </div>
             ) : null;
           })()}
         </CardFooter>
      </Card>
      
      {candidate.applications && candidate.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aplicaciones</CardTitle>
            <CardDescription>
              {candidate.applications.length} {candidate.applications.length === 1 ? 'posición aplicada' : 'posiciones aplicadas'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidate.applications.map((app: Application) => (
              <div key={app.id} className="p-3 border rounded-lg hover:bg-muted/50">
                <div className="font-medium">{app.job_title || 'Posición'}</div>
                {app.job_department && (
                  <div className="text-xs text-muted-foreground">{app.job_department}</div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(app.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateSidebar;
