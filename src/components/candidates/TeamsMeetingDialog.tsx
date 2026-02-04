import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TeamsMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (meetingData: MeetingData) => void;
  onSkipMeeting?: () => void;
  candidateName: string;
  interviewType: 'entrevista-rc' | 'entrevista-et' | 'asignar-campana';
}

export interface MeetingData {
  title: string;
  date: Date;
  time: string;
  duration: number;
  description: string;
  meetingLink: string;
  modality: 'virtual' | 'presencial';
  address?: string;
}

const TeamsMeetingDialog: React.FC<TeamsMeetingDialogProps> = ({
  isOpen,
  onClose,
  onMeetingCreated,
  onSkipMeeting,
  candidateName,
  interviewType
}) => {
  const getInitialTitle = () => {
    switch (interviewType) {
      case 'entrevista-rc': return `Entrevista Recursos Humanos - ${candidateName}`;
      case 'entrevista-et': return `Entrevista Técnica - ${candidateName}`;
      case 'asignar-campana': return `Sesión de Formación - ${candidateName}`;
      default: return `Reunión - ${candidateName}`;
    }
  };

  const getInitialDescription = () => {
    switch (interviewType) {
      case 'entrevista-rc': return `Entrevista de Recursos Humanos con ${candidateName}`;
      case 'entrevista-et': return `Entrevista Técnica con ${candidateName}`;
      case 'asignar-campana': return `Sesión de inicio de formación para ${candidateName}`;
      default: return `Reunión con ${candidateName}`;
    }
  };

  const [title, setTitle] = useState(getInitialTitle());
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState(getInitialDescription());
  const [meetingLink, setMeetingLink] = useState('');
  const [modality, setModality] = useState<'virtual' | 'presencial'>('virtual');
  const [address, setAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Update effect to reset fields when type or name changes would be ideal, 
  // but state initialization only happens once. relying on key or manual reset in parent if needed.
  // Or better, use a useEffect here to update if props change significantly when reopening.
  // For now simple init is okay assuming component remounts or key changes.

  const getTypeLabel = () => {
    switch (interviewType) {
      case 'entrevista-rc': return 'Recursos Humanos';
      case 'entrevista-et': return 'Técnica';
      case 'asignar-campana': return 'Inicio de Formación';
      default: return '';
    }
  };

  const interviewTypeLabel = getTypeLabel();

  const handleCreateMeeting = async () => {
    // Validate required fields based on modality
    if (!date || !time) return;

    if (modality === 'virtual' && !meetingLink.trim()) return;
    if (modality === 'presencial' && !address.trim()) return;

    setIsCreating(true);

    try {
      // Simulate processing - in real implementation, this could validate the link or save meeting details
      await new Promise(resolve => setTimeout(resolve, 1000));

      const meetingData: MeetingData = {
        title,
        date,
        time,
        duration,
        description,
        meetingLink: meetingLink.trim(),
        modality,
        address: modality === 'presencial' ? address.trim() : undefined
      };

      onMeetingCreated(meetingData);
      onClose();

      // Reset form (optional, state will be mostly reset by unmount usually)
      setTitle(getInitialTitle());
      setDate(undefined);
      setTime('09:00');
      setDuration(60);
      setDescription(getInitialDescription());
      setMeetingLink('');
      setModality('virtual');
      setAddress('');
    } catch (error) {
      console.error('Error processing meeting:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            {interviewType === 'asignar-campana' ? 'Programar Inicio de Formación' : `Programar Entrevista ${interviewTypeLabel}`}
          </DialogTitle>
          <DialogDescription>
            {interviewType === 'asignar-campana'
              ? `Programa la sesión de inicio de formación para ${candidateName}`
              : `Programa la entrevista ${interviewType === 'entrevista-rc' ? 'de Recursos Humanos' : 'técnica'} para ${candidateName}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la reunión</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la reunión"
            />
          </div>

          <div className="space-y-2">
            <Label>Modalidad</Label>
            <RadioGroup value={modality} onValueChange={(value) => setModality(value as 'virtual' | 'presencial')} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="virtual" id="virtual" />
                <Label htmlFor="virtual" className="cursor-pointer">Virtual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="presencial" id="presencial" />
                <Label htmlFor="presencial" className="cursor-pointer">Presencial</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la reunión"
              rows={3}
            />
          </div>

          {modality === 'virtual' ? (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Link de la reunión *</Label>
              <Input
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                required
              />
              <p className="text-sm text-muted-foreground">
                Pega el link de la reunión de Teams, Zoom u otra plataforma
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="address">Dirección de la entrevista *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección completa de la oficina"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Ingresa la dirección donde el candidato debe presentarse
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between space-x-2 pt-4 border-t">
          <div>
            {onSkipMeeting && (
              <Button variant="ghost" onClick={onSkipMeeting} disabled={isCreating}>
                Omitir reunión por ahora
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMeeting}
              disabled={!date || !time || (modality === 'virtual' ? !meetingLink.trim() : !address.trim()) || isCreating}
            >
              {isCreating ? 'Procesando reunión...' : 'Programar Reunión'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamsMeetingDialog;