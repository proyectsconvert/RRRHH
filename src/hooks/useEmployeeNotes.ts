
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeNote {
  id: string;
  employee_id: string;
  note_content: string;
  note_type: string;
  is_confidential: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useEmployeeNotes = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotes = async (employeeId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rrhh_employee_notes')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las notas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (noteData: {
    employee_id: string;
    note_content: string;
    note_type: string;
    is_confidential: boolean;
  }) => {
    try {
      const { data, error } = await supabase.rpc('create_employee_note', {
        p_employee_id: noteData.employee_id,
        p_note_content: noteData.note_content,
        p_created_by: 'current-user', // En producción sería el ID del usuario actual
        p_note_type: noteData.note_type,
        p_is_confidential: noteData.is_confidential
      });

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Nota creada correctamente"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la nota",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<EmployeeNote>) => {
    try {
      const { error } = await supabase
        .from('rrhh_employee_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Nota actualizada correctamente"
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la nota",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('rrhh_employee_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Nota eliminada correctamente"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    notes,
    loading,
    loadNotes,
    createNote,
    updateNote,
    deleteNote
  };
};
