import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DocumentChecklist from '@/components/candidates/DocumentChecklist';
import { createClient } from '@supabase/supabase-js';
import { Candidate } from '@/types/candidate';
import { validateCandidateAccessToken } from '@/utils/candidate-access';

// Create a completely anonymous Supabase client (no authentication)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const CandidateDocuments: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [searchParams] = useSearchParams();
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

        // Get the access token from URL parameters
        const token = searchParams.get('token');

        if (!token) {
          throw new Error('Token de acceso no proporcionado. El enlace puede haber expirado.');
        }

        // Validate the access token
        const validatedCandidateId = await validateCandidateAccessToken(token, candidateId);

        if (!validatedCandidateId) {
          throw new Error('Token de acceso inválido o expirado. Por favor solicite un nuevo enlace al reclutador.');
        }

        // Get candidate data using the validated access
        const { data: candidateData, error: candidateError } = await supabase
          .from('candidates')
          .select(`
            *,
            applications(status)
          `)
          .eq('id', candidateId)
          .single();

        if (candidateError) {
          throw candidateError;
        }

        if (!candidateData) {
          throw new Error('Candidato no encontrado');
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
  }, [candidateId, searchParams]);

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
          isAdmin={false} // Public view with limited functionality
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