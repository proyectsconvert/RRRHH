import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DocumentChecklist from '@/components/candidates/DocumentChecklist';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types/candidate';

const CandidateDocuments: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidate = async () => {
      if (!candidateId) {
        setError('ID de candidato no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if candidate exists and is in hiring process
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select(`
            *,
            applications!inner(status)
          `)
          .eq('id', candidateId)
          .single();

        if (candidateError) {
          throw candidateError;
        }

        if (!candidateData) {
          throw new Error('Candidato no encontrado');
        }

        // Check if candidate is in hiring process (has 'contratar' status)
        const isInHiringProcess = candidateData.applications?.some((app: any) => app.status === 'contratar');

        if (!isInHiringProcess) {
          throw new Error('Este candidato no está en proceso de contratación');
        }

        setCandidate(candidateData);
      } catch (err: any) {
        console.error('Error loading candidate:', err);
        setError(err.message || 'Error al cargar la información del candidato');
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-hrm-dark-cyan mx-auto mb-4" />
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error || 'No se pudo acceder a esta página'}
            </p>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Portal de Documentos
                </h1>
                <p className="text-gray-600">
                  Bienvenido(a), {candidate.first_name} {candidate.last_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Convertia</p>
              <p className="text-xs text-gray-400">Proceso de Contratación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DocumentChecklist
          candidateId={candidate.id}
          candidateName={`${candidate.first_name} ${candidate.last_name}`}
          onDocumentUploaded={() => {
            // Optional: show success message or refresh data
            console.log('Document uploaded successfully');
          }}
        />
      </div>
    </div>
  );
};

export default CandidateDocuments;