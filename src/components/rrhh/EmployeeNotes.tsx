
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StickyNote, Plus, Lock, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeNote {
  id: string;
  employee_id: string;
  note_content: string;
  note_type: string;
  is_confidential: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface EmployeeNotesProps {
  employeeId: string;
  employeeName: string;
}

const noteTypes = [
  { value: 'general', label: 'General' },
  { value: 'performance', label: 'Desempeño' },
  { value: 'disciplinary', label: 'Disciplinaria' },
  { value: 'achievement', label: 'Logro' },
  { value: 'training', label: 'Capacitación' },
  { value: 'medical', label: 'Médica' },
  { value: 'administrative', label: 'Administrativa' }
];

export const EmployeeNotes: React.FC<EmployeeNotesProps> = ({
  employeeId,
  employeeName
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<EmployeeNote | null>(null);
  const [formData, setFormData] = useState({
    note_content: '',
    note_type: 'general',
    is_confidential: false
  });

  useEffect(() => {
    loadNotes();
  }, [employeeId]);

  const loadNotes = async () => {
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

  const handleSaveNote = async () => {
    if (!formData.note_content.trim()) {
      toast({
        title: "Error",
        description: "El contenido de la nota es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingNote) {
        // Actualizar nota existente
        const { error } = await supabase
          .from('rrhh_employee_notes')
          .update({
            note_content: formData.note_content,
            note_type: formData.note_type,
            is_confidential: formData.is_confidential,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Nota actualizada correctamente"
        });
      } else {
        // Crear nueva nota usando la función SQL
        const { data, error } = await supabase.rpc('create_employee_note', {
          p_employee_id: employeeId,
          p_note_content: formData.note_content,
          p_created_by: 'current-user', // En producción sería el ID del usuario actual
          p_note_type: formData.note_type,
          p_is_confidential: formData.is_confidential
        });

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Nota creada correctamente"
        });
      }

      setIsDialogOpen(false);
      setEditingNote(null);
      setFormData({
        note_content: '',
        note_type: 'general',
        is_confidential: false
      });
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive"
      });
    }
  };

  const handleEditNote = (note: EmployeeNote) => {
    setEditingNote(note);
    setFormData({
      note_content: note.note_content,
      note_type: note.note_type,
      is_confidential: note.is_confidential
    });
    setIsDialogOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;

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
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive"
      });
    }
  };

  const openNewNoteDialog = () => {
    setEditingNote(null);
    setFormData({
      note_content: '',
      note_type: 'general',
      is_confidential: false
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando notas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-600" />
            Notas del Empleado
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewNoteDialog} size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? 'Editar Nota' : 'Nueva Nota'} - {employeeName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note_type">Tipo de Nota</Label>
                  <Select value={formData.note_type} onValueChange={(value) => setFormData(prev => ({ ...prev, note_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="note_content">Contenido</Label>
                  <Textarea
                    id="note_content"
                    value={formData.note_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, note_content: e.target.value }))}
                    placeholder="Escribe el contenido de la nota..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_confidential"
                    checked={formData.is_confidential}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_confidential: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_confidential" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Nota confidencial
                  </Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveNote} className="bg-amber-600 hover:bg-amber-700">
                    {editingNote ? 'Actualizar' : 'Crear'} Nota
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No hay notas para este empleado</p>
            <p className="text-sm">Haz clic en "Nueva Nota" para agregar una</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {noteTypes.find(t => t.value === note.note_type)?.label || note.note_type}
                    </Badge>
                    {note.is_confidential && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Confidencial
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-900 mb-2">{note.note_content}</p>
                <p className="text-xs text-gray-500">
                  Creada el {new Date(note.created_at).toLocaleDateString('es-ES')} a las {new Date(note.created_at).toLocaleTimeString('es-ES')}
                  {note.updated_at !== note.created_at && (
                    <span> • Editada el {new Date(note.updated_at).toLocaleDateString('es-ES')}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
