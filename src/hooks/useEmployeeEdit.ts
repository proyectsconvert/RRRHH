
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeEdit {
  id: string;
  employee_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  edited_by: string;
  edited_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const useEmployeeEdit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const editEmployee = async (employeeId: string, updates: any) => {
    try {
      setLoading(true);
      console.log('Editing employee:', employeeId, updates);

      // Actualizar el empleado directamente
      const { error } = await supabase
        .from('rrhh_employees_master')
        .update(updates)
        .eq('id', employeeId);

      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }

      // Registrar cada cambio en la tabla de ediciones
      const edits = Object.entries(updates).map(([field, value]) => ({
        employee_id: employeeId,
        field_name: field,
        old_value: '', // Se podría obtener el valor anterior si es necesario
        new_value: String(value),
        status: 'approved'
      }));

      for (const edit of edits) {
        await supabase.from('rrhh_employee_edits').insert(edit);
      }

      toast({
        title: "Éxito",
        description: "Empleado actualizado correctamente"
      });

      return true;
    } catch (error) {
      console.error('Error editing employee:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeEdits = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('rrhh_employee_edits')
        .select('*')
        .eq('employee_id', employeeId)
        .order('edited_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee edits:', error);
      return [];
    }
  };

  return {
    editEmployee,
    getEmployeeEdits,
    loading
  };
};
