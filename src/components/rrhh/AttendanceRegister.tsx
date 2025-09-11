
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Play, Square, Coffee, MapPin, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceRecord {
  id?: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  break_duration_minutes?: number;
  hours_worked?: number;
  status: string;
}

interface AttendanceRegisterProps {
  employeeId: string;
  employeeName: string;
  selectedDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({
  employeeId,
  employeeName,
  selectedDate,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<string>("Obteniendo ubicación...");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord>({
    employee_id: employeeId,
    date: selectedDate,
    status: 'absent'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExistingAttendance();
      getCurrentLocation();
    }
  }, [isOpen, employeeId, selectedDate]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setCurrentLocation("Ubicación no disponible");
        }
      );
    } else {
      setCurrentLocation("Geolocalización no soportada");
    }
  };

  const loadExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', selectedDate)
        .single();

      if (data) {
        setAttendanceData({
          ...data,
          check_in_time: data.check_in_time ? new Date(data.check_in_time).toTimeString().slice(0, 5) : '',
          check_out_time: data.check_out_time ? new Date(data.check_out_time).toTimeString().slice(0, 5) : '',
          break_start_time: data.break_start_time ? new Date(data.break_start_time).toTimeString().slice(0, 5) : '',
          break_end_time: data.break_end_time ? new Date(data.break_end_time).toTimeString().slice(0, 5) : ''
        });
      }
    } catch (error) {
      // No existe registro previo, se mantiene el estado inicial
      console.log('No previous attendance record found');
    }
  };

  const handleTimeChange = (field: keyof AttendanceRecord, value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const setCurrentTime = (field: keyof AttendanceRecord) => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    handleTimeChange(field, timeString);
  };

  const calculateWorkHours = () => {
    const { check_in_time, check_out_time, break_start_time, break_end_time } = attendanceData;
    
    if (!check_in_time || !check_out_time) return 0;

    const checkIn = new Date(`2000-01-01 ${check_in_time}`);
    const checkOut = new Date(`2000-01-01 ${check_out_time}`);
    
    let totalMinutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
    
    // Restar tiempo de descanso si está definido
    if (break_start_time && break_end_time) {
      const breakStart = new Date(`2000-01-01 ${break_start_time}`);
      const breakEnd = new Date(`2000-01-01 ${break_end_time}`);
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }

    return Math.max(0, totalMinutes / 60);
  };

  const handleSave = async () => {
    if (!attendanceData.check_in_time) {
      toast({
        title: "Error",
        description: "La hora de entrada es requerida",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const checkInDateTime = attendanceData.check_in_time ? 
        new Date(`${selectedDate}T${attendanceData.check_in_time}:00`).toISOString() : null;
      
      const checkOutDateTime = attendanceData.check_out_time ? 
        new Date(`${selectedDate}T${attendanceData.check_out_time}:00`).toISOString() : null;
      
      const breakStartDateTime = attendanceData.break_start_time ? 
        new Date(`${selectedDate}T${attendanceData.break_start_time}:00`).toISOString() : null;
      
      const breakEndDateTime = attendanceData.break_end_time ? 
        new Date(`${selectedDate}T${attendanceData.break_end_time}:00`).toISOString() : null;

      const { data, error } = await supabase.rpc('register_attendance_with_break', {
        p_employee_id: employeeId,
        p_date: selectedDate,
        p_check_in_time: checkInDateTime,
        p_check_out_time: checkOutDateTime,
        p_break_start_time: breakStartDateTime,
        p_break_end_time: breakEndDateTime
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Registro de asistencia guardado correctamente"
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de asistencia",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const workHours = calculateWorkHours();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            Registro de Jornada - {employeeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de ubicación */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900">Ubicación Actual</div>
              <div className="text-sm text-blue-700">{currentLocation}</div>
            </div>
          </div>

          {/* Fecha seleccionada */}
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={selectedDate}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Horarios de entrada y salida */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_time">Hora de Entrada</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="check_in_time"
                  type="time"
                  value={attendanceData.check_in_time || ''}
                  onChange={(e) => handleTimeChange('check_in_time', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTime('check_in_time')}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="check_out_time">Hora de Salida</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="check_out_time"
                  type="time"
                  value={attendanceData.check_out_time || ''}
                  onChange={(e) => handleTimeChange('check_out_time', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTime('check_out_time')}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Horarios de descanso */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Coffee className="w-4 h-4 text-amber-600" />
              Tiempo de Descanso (Opcional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="break_start_time">Inicio Descanso</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="break_start_time"
                    type="time"
                    value={attendanceData.break_start_time || ''}
                    onChange={(e) => handleTimeChange('break_start_time', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTime('break_start_time')}
                  >
                    <Coffee className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="break_end_time">Fin Descanso</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="break_end_time"
                    type="time"
                    value={attendanceData.break_end_time || ''}
                    onChange={(e) => handleTimeChange('break_end_time', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTime('break_end_time')}
                  >
                    <Coffee className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de horas */}
          {workHours > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900">Resumen</div>
              <div className="text-sm text-green-700">
                Horas trabajadas: {workHours.toFixed(2)} horas
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
