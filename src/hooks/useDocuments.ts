
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_required: boolean;
  visibility: string;
  uploaded_by: string;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    position: string;
  };
}

export const useDocuments = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocuments = async (filters?: {
    employeeId?: string;
    documentType?: string;
    searchTerm?: string;
  }) => {
    try {
      setLoading(true);
      console.log('Loading documents with filters:', filters);

      let query = supabase
        .from('rrhh_employee_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.employeeId && filters.employeeId !== 'all') {
        query = query.eq('employee_id', filters.employeeId);
      }

      if (filters?.documentType && filters.documentType !== 'all') {
        query = query.eq('document_type', filters.documentType);
      }

      if (filters?.searchTerm) {
        query = query.ilike('document_name', `%${filters.searchTerm}%`);
      }

      const { data: documentsData, error } = await query;
      
      if (error) {
        console.error('Error loading documents:', error);
        throw error;
      }

      console.log(`Loaded ${documentsData?.length || 0} documents`);
      setDocuments(documentsData || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive"
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (formData: {
    employeeId: string;
    documentName: string;
    documentType: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    isRequired?: boolean;
    visibility?: string;
  }) => {
    try {
      console.log('Uploading document:', formData);

      const { error } = await supabase.from('rrhh_employee_documents').insert({
        employee_id: formData.employeeId,
        document_name: formData.documentName,
        document_type: formData.documentType,
        file_path: formData.filePath,
        file_size: formData.fileSize || 0,
        mime_type: formData.mimeType || 'application/pdf',
        is_required: formData.isRequired || false,
        visibility: formData.visibility || 'private',
        uploaded_by: 'current-user'
      });

      if (error) {
        console.error('Error uploading document:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Documento subido correctamente"
      });

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      console.log('Deleting document:', documentId);

      const { error } = await supabase
        .from('rrhh_employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Documento eliminado correctamente"
      });

      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive"
      });
    }
  };

  return {
    documents,
    loading,
    loadDocuments,
    uploadDocument,
    deleteDocument
  };
};
