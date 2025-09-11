
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAttendanceActions = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const startWorkday = async (employeeId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('register_attendance', {
        p_employee_id: employeeId,
        p_check_in_time: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Jornada iniciada",
        description: "Tu jornada laboral ha comenzado correctamente"
      });

      return data;
    } catch (error) {
      console.error('Error starting workday:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la jornada",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const endWorkday = async (employeeId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('register_attendance', {
        p_employee_id: employeeId,
        p_check_out_time: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Jornada finalizada",
        description: "Tu jornada laboral ha terminado correctamente"
      });

      return data;
    } catch (error) {
      console.error('Error ending workday:', error);
      toast({
        title: "Error",
        description: "No se pudo finalizar la jornada",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerPastAttendance = async (employeeId: string, date: string, checkIn: string, checkOut?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('register_attendance', {
        p_employee_id: employeeId,
        p_date: date,
        p_check_in_time: `${date}T${checkIn}:00`,
        p_check_out_time: checkOut ? `${date}T${checkOut}:00` : null
      });

      if (error) throw error;

      toast({
        title: "Asistencia registrada",
        description: "El registro de asistencia ha sido guardado"
      });

      return data;
    } catch (error) {
      console.error('Error registering past attendance:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la asistencia",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    startWorkday,
    endWorkday,
    registerPastAttendance,
    loading
  };
};
