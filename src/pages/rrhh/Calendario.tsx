
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Users, 
  Clock, 
  MapPin, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Gift,
  Briefcase,
  Coffee
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  type: 'reunión' | 'cumpleaños' | 'ausencia' | 'evento' | 'capacitación';
  date: string;
  time?: string;
  description: string;
  attendees?: string[];
  location?: string;
}

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('todos');
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = () => {
    const sampleEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "Reunión de Equipo - Marketing",
        type: "reunión",
        date: "2025-05-30",
        time: "10:00",
        description: "Revisión mensual de campañas y estrategias",
        attendees: ["Equipo Marketing", "Dirección"],
        location: "Sala de Juntas A"
      },
      {
        id: "2",
        title: "Cumpleaños - Laura Martinez",
        type: "cumpleaños",
        date: "2025-05-31",
        description: "¡Celebremos el cumpleaños de Laura!",
        attendees: ["Todo el equipo"]
      },
      {
        id: "3",
        title: "Vacaciones - Pedro Aponte",
        type: "ausencia",
        date: "2025-06-10",
        description: "Vacaciones programadas - 5 días",
        attendees: ["Pedro Aponte"]
      },
      {
        id: "4",
        title: "Capacitación en Tecnología",
        type: "capacitación",
        date: "2025-06-05",
        time: "14:00",
        description: "Workshop sobre nuevas tecnologías y herramientas",
        attendees: ["Equipo IT", "Desarrollo"],
        location: "Aula Virtual"
      },
      {
        id: "5",
        title: "All Hands Meeting",
        type: "evento",
        date: "2025-06-15",
        time: "09:00",
        description: "Reunión general mensual de toda la empresa",
        attendees: ["Todos los empleados"],
        location: "Auditorio Principal"
      }
    ];
    setEvents(sampleEvents);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter(event => {
      if (filterType === 'todos') return event.date === dateStr;
      return event.date === dateStr && event.type === filterType;
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'reunión':
        return <Users className="w-4 h-4" />;
      case 'cumpleaños':
        return <Gift className="w-4 h-4" />;
      case 'ausencia':
        return <Clock className="w-4 h-4" />;
      case 'evento':
        return <Briefcase className="w-4 h-4" />;
      case 'capacitación':
        return <Coffee className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'reunión':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cumpleaños':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'ausencia':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'evento':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'capacitación':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === formatDateString(new Date());

      days.push(
        <div
          key={day}
          className={`h-32 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-cyan-50 border-cyan-300' : 'bg-white'
          }`}
          onClick={() => setSelectedDate(dateStr)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-cyan-700' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)} truncate`}
                title={event.title}
              >
                <div className="flex items-center gap-1">
                  {getEventTypeIcon(event.type)}
                  <span className="truncate">{event.title}</span>
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayEvents.length - 3} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario Empresarial</h1>
          <p className="text-gray-600 mt-2">Eventos, reuniones, cumpleaños y ausencias del equipo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento</DialogTitle>
              <DialogDescription>
                Agrega un evento al calendario empresarial
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Título</Label>
                <Input id="title" className="col-span-3" placeholder="Nombre del evento" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reunión">Reunión</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="capacitación">Capacitación</SelectItem>
                    <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Fecha</Label>
                <Input id="date" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Hora</Label>
                <Input id="time" type="time" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descripción</Label>
                <Textarea id="description" className="col-span-3" placeholder="Descripción del evento" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button>Crear Evento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats and Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Eventos Este Mes</p>
                <p className="text-2xl font-bold text-blue-900">
                  {events.filter(e => new Date(e.date).getMonth() === currentDate.getMonth()).length}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700">Cumpleaños</p>
                <p className="text-2xl font-bold text-pink-900">
                  {events.filter(e => e.type === 'cumpleaños' && new Date(e.date).getMonth() === currentDate.getMonth()).length}
                </p>
              </div>
              <Gift className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Reuniones</p>
                <p className="text-2xl font-bold text-green-900">
                  {events.filter(e => e.type === 'reunión' && new Date(e.date).getMonth() === currentDate.getMonth()).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Ausencias</p>
                <p className="text-2xl font-bold text-orange-900">
                  {events.filter(e => e.type === 'ausencia' && new Date(e.date).getMonth() === currentDate.getMonth()).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-cyan-600" />
                  {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription>Calendario empresarial con eventos y reuniones</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="reunión">Reuniones</SelectItem>
                    <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
                    <SelectItem value="ausencia">Ausencias</SelectItem>
                    <SelectItem value="evento">Eventos</SelectItem>
                    <SelectItem value="capacitación">Capacitación</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-600 bg-gray-50 border border-gray-200">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            <CardDescription>Esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getUpcomingEvents().slice(0, 5).map((event) => (
                <div key={event.id} className={`p-3 rounded-lg border ${getEventTypeColor(event.type)}`}>
                  <div className="flex items-start gap-2">
                    {getEventTypeIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{event.title}</h4>
                      <p className="text-xs opacity-80 mt-1">
                        {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {event.time && ` - ${event.time}`}
                      </p>
                      {event.location && (
                        <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Eventos del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className={`p-4 rounded-lg border ${getEventTypeColor(event.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getEventTypeIcon(event.type)}
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm opacity-80 mt-1">{event.description}</p>
                        {event.time && (
                          <p className="text-sm opacity-70 flex items-center gap-1 mt-2">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-sm opacity-70 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                        {event.attendees && (
                          <p className="text-sm opacity-70 flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" />
                            {event.attendees.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {event.type}
                    </Badge>
                  </div>
                </div>
              ))}
              {getEventsForDate(selectedDate).length === 0 && (
                <p className="text-gray-500 text-center py-8">No hay eventos programados para este día</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
