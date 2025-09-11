
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, Save, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DayRecord {
  date: string;
  day_name: string;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name?: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  break_duration_minutes: number;
  hours_worked?: number;
  expected_hours: number;
  overtime_hours: number;
  work_type: string;
  status: string;
  comments?: string;
  attendance_id?: string;
}

interface EmployeeAttendanceCalendarProps {
  employeeId: string;
  employeeName: string;
}

export const EmployeeAttendanceCalendar: React.FC<EmployeeAttendanceCalendarProps> = ({
  employeeId,
  employeeName
}) => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<DayRecord[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, employeeId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_employee_calendar', {
        p_employee_id: employeeId,
        p_year: currentDate.getFullYear(),
        p_month: currentDate.getMonth() + 1
      });

      if (error) throw error;
      setCalendarData(data || []);
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el calendario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const formatTimeForInput = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const saveAttendanceRecord = async (dayRecord: DayRecord, updates: Partial<DayRecord>) => {
    try {
      setSavingDay(dayRecord.date);
      
      const formatTimeForDB = (time: string, baseDate: string) => {
        if (!time) return null;
        const [hours, minutes] = time.split(':');
        const date = new Date(baseDate);
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date.toISOString();
      };

      const { data, error } = await supabase.rpc('update_attendance_record', {
        p_employee_id: employeeId,
        p_date: dayRecord.date,
        p_check_in_time: updates.check_in_time ? formatTimeForDB(updates.check_in_time, dayRecord.date) : null,
        p_check_out_time: updates.check_out_time ? formatTimeForDB(updates.check_out_time, dayRecord.date) : null,
        p_break_start_time: updates.break_start_time ? formatTimeForDB(updates.break_start_time, dayRecord.date) : null,
        p_break_end_time: updates.break_end_time ? formatTimeForDB(updates.break_end_time, dayRecord.date) : null,
        p_work_type: updates.work_type || dayRecord.work_type,
        p_comments: updates.comments || dayRecord.comments,
        p_is_holiday: updates.is_holiday || dayRecord.is_holiday,
        p_holiday_name: updates.holiday_name || dayRecord.holiday_name
      });

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "Registro de jornada actualizado correctamente"
      });

      loadCalendarData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro",
        variant: "destructive"
      });
    } finally {
      setSavingDay(null);
    }
  };

  const getStatusBadge = (status: string, isWeekend: boolean, isHoliday: boolean) => {
    if (isWeekend) return <Badge variant="outline" className="bg-gray-100">Fin de semana</Badge>;
    if (isHoliday) return <Badge variant="outline" className="bg-blue-100 text-blue-800">Festivo</Badge>;
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completo</Badge>;
      case 'present':
        return <Badge className="bg-blue-500 text-white">Presente</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-600 text-white">Confirmado</Badge>;
      case 'absent':
        return <Badge className="bg-red-500 text-white">Ausente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentMonthYear = currentDate.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between bg-cyan-50 p-4 rounded-lg">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-lg font-semibold capitalize">{currentMonthYear}</h3>
          <p className="text-sm text-gray-600">{employeeName}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Lista de días */}
      <div className="space-y-2">
        {calendarData.map((day) => (
          <Card key={day.date} className="overflow-hidden">
            <Collapsible 
              open={expandedDays.has(day.date)}
              onOpenChange={() => toggleDayExpansion(day.date)}
            >
              <CollapsibleTrigger asChild>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-medium text-gray-600">
                          {day.day_name.slice(0, 3)}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(day.date).getDate()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(day.status, day.is_weekend, day.is_holiday)}
                        {day.holiday_name && (
                          <span className="text-sm text-blue-600">{day.holiday_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        {day.check_in_time && (
                          <div>Entrada: {formatTimeForInput(day.check_in_time)}</div>
                        )}
                        {day.check_out_time && (
                          <div>Salida: {formatTimeForInput(day.check_out_time)}</div>
                        )}
                        {day.hours_worked && (
                          <div className="font-medium">
                            {day.hours_worked.toFixed(2)}h trabajadas
                          </div>
                        )}
                      </div>
                      
                      {expandedDays.has(day.date) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t bg-gray-50 p-4">
                  <AttendanceDayForm 
                    dayRecord={day}
                    onSave={(updates) => saveAttendanceRecord(day, updates)}
                    isSaving={savingDay === day.date}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface AttendanceDayFormProps {
  dayRecord: DayRecord;
  onSave: (updates: Partial<DayRecord>) => void;
  isSaving: boolean;
}

const AttendanceDayForm: React.FC<AttendanceDayFormProps> = ({ 
  dayRecord, 
  onSave, 
  isSaving 
}) => {
  const [formData, setFormData] = useState({
    check_in_time: dayRecord.check_in_time ? new Date(dayRecord.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    check_out_time: dayRecord.check_out_time ? new Date(dayRecord.check_out_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    break_start_time: dayRecord.break_start_time ? new Date(dayRecord.break_start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    break_end_time: dayRecord.break_end_time ? new Date(dayRecord.break_end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    work_type: dayRecord.work_type,
    comments: dayRecord.comments || '',
    is_holiday: dayRecord.is_holiday,
    holiday_name: dayRecord.holiday_name || ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (dayRecord.is_weekend) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p>Fin de semana - No se requiere registro</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Hora de Entrada</Label>
          <Input
            type="time"
            value={formData.check_in_time}
            onChange={(e) => handleInputChange('check_in_time', e.target.value)}
          />
        </div>
        <div>
          <Label>Hora de Salida</Label>
          <Input
            type="time"
            value={formData.check_out_time}
            onChange={(e) => handleInputChange('check_out_time', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Inicio Descanso</Label>
          <Input
            type="time"
            value={formData.break_start_time}
            onChange={(e) => handleInputChange('break_start_time', e.target.value)}
          />
        </div>
        <div>
          <Label>Fin Descanso</Label>
          <Input
            type="time"
            value={formData.break_end_time}
            onChange={(e) => handleInputChange('break_end_time', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Tipo de Trabajo</Label>
        <Select value={formData.work_type} onValueChange={(value) => handleInputChange('work_type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Trabajo">Trabajo</SelectItem>
            <SelectItem value="Teletrabajo">Teletrabajo</SelectItem>
            <SelectItem value="Viaje de trabajo">Viaje de trabajo</SelectItem>
            <SelectItem value="Formación">Formación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Comentarios</Label>
        <Textarea
          value={formData.comments}
          onChange={(e) => handleInputChange('comments', e.target.value)}
          placeholder="Notas adicionales del día..."
          rows={2}
        />
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full bg-cyan-600 hover:bg-cyan-700"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Guardar Registro
          </>
        )}
      </Button>
    </div>
  );
};
