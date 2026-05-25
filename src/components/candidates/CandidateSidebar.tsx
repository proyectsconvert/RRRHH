
import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Mail, Phone, MapPin, FileText, User, Loader2, SquareArrowRight, Pencil, Check, X } from 'lucide-react';
import { Candidate, Application } from '@/types/candidate';

// Get the primary status from candidate applications
const getCandidateStatus = (applications?: Application[]) => {
  if (!applications || applications.length === 0) return null;

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
  onUpdateContactInfo?: (fields: { email?: string; phone?: string; cedula?: string }) => Promise<void>;
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
  onUpdateContactInfo,
  getStatusText,
  canModifyCandidate
}) => {
  const [editingField, setEditingField] = useState<'email' | 'phone' | 'cedula' | null>(null);
  const [editEmail, setEditEmail] = useState(candidate.email || '');
  const [editPhone, setEditPhone] = useState(candidate.phone || '');
  const [editCedula, setEditCedula] = useState(candidate.document_id || '');
  const [saving, setSaving] = useState(false);

  const handleEdit = (field: 'email' | 'phone' | 'cedula') => {
    // Reset values to current candidate data when starting edit
    setEditEmail(candidate.email || '');
    setEditPhone(candidate.phone || '');
    setEditCedula(candidate.document_id || '');
    setEditingField(field);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleSave = async (field: 'email' | 'phone' | 'cedula') => {
    if (!onUpdateContactInfo) return;
    setSaving(true);
    try {
      const payload: { email?: string; phone?: string; cedula?: string } = {};
      if (field === 'email') payload.email = editEmail.trim();
      if (field === 'phone') payload.phone = editPhone.trim();
      if (field === 'cedula') payload.cedula = editCedula.trim();
      await onUpdateContactInfo(payload);
      setEditingField(null);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'email' | 'phone' | 'cedula') => {
    if (e.key === 'Enter') handleSave(field);
    if (e.key === 'Escape') handleCancel();
  };

  // Inline editable row
  const EditableField = ({
    field,
    icon,
    value,
    editValue,
    setEditValue,
    placeholder,
    type = 'text'
  }: {
    field: 'email' | 'phone' | 'cedula';
    icon: React.ReactNode;
    value: string;
    editValue: string;
    setEditValue: (v: string) => void;
    placeholder: string;
    type?: string;
  }) => {
    const isEditing = editingField === field;

    return (
      <div className="flex items-center gap-2 text-sm group min-h-[28px]">
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              autoFocus
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, field)}
              className="h-7 text-sm px-2 py-0 flex-1"
              placeholder={placeholder}
              disabled={saving}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => handleSave(field)}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="truncate flex-1">{value || <span className="text-muted-foreground italic">No especificado</span>}</span>
            {onUpdateContactInfo && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                onClick={() => handleEdit(field)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

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
            <EditableField
              field="email"
              icon={<Mail className="h-4 w-4" />}
              value={candidate.email}
              editValue={editEmail}
              setEditValue={setEditEmail}
              placeholder="correo@ejemplo.com"
              type="email"
            />

            <EditableField
              field="phone"
              icon={<Phone className="h-4 w-4" />}
              value={candidate.phone || ''}
              editValue={editPhone}
              setEditValue={setEditPhone}
              placeholder="Número de teléfono"
              type="tel"
            />

            <EditableField
              field="cedula"
              icon={<User className="h-4 w-4" />}
              value={candidate.document_id ? `Cédula: ${candidate.document_id}` : ''}
              editValue={editCedula}
              setEditValue={setEditCedula}
              placeholder="Número de cédula"
            />

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
