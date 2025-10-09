import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TeamsMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (meetingData: MeetingData) => void;
  onSkipMeeting?: () => void;
  candidateName: string;
  interviewType: 'entrevista-rc' | 'entrevista-et';
}

export interface MeetingData {
  title: string;
  date: Date;
  time: string;
  duration: number;
  description: string;
  meetingLink: string;
}

const TeamsMeetingDialog: React.FC<TeamsMeetingDialogProps> = ({
  isOpen,
  onClose,
  onMeetingCreated,
  onSkipMeeting,
  candidateName,
  interviewType
}) => {
  const [title, setTitle] = useState(`Entrevista ${interviewType === 'entrevista-rc' ? 'Recursos Humanos' : 'Técnica'} - ${candidateName}`);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState(`Entrevista ${interviewType === 'entrevista-rc' ? 'de Recursos Humanos' : 'Técnica'} con ${candidateName}`);
  const [meetingLink, setMeetingLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const interviewTypeLabel = interviewType === 'entrevista-rc' ? 'Recursos Humanos' : 'Técnica';

  const handleCreateMeeting = async () => {
    if (!date || !time || !meetingLink.trim()) return;

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
        meetingLink: meetingLink.trim()
      };

      onMeetingCreated(meetingData);
      onClose();

      // Reset form
      setTitle(`Entrevista ${interviewTypeLabel} - ${candidateName}`);
      setDate(undefined);
      setTime('09:00');
      setDuration(60);
      setDescription(`Entrevista ${interviewType === 'entrevista-rc' ? 'de Recursos Humanos' : 'Técnica'} con ${candidateName}`);
      setMeetingLink('');
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
            Programar Entrevista {interviewTypeLabel}
          </DialogTitle>
          <DialogDescription>
            Programa la entrevista {interviewType === 'entrevista-rc' ? 'de Recursos Humanos' : 'técnica'} para {candidateName}
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
              disabled={!date || !time || !meetingLink.trim() || isCreating}
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