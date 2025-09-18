
import { supabase } from '@/integrations/supabase/client';
import { Candidate, Application } from '@/types/candidate';

export async function fetchCandidateDetails(candidateId: string): Promise<Candidate> {
  const { data: candidateData, error: candidateError } = await supabase
    .from('candidates')
    .select('*, applications(id, status, job_id, created_at)')
    .eq('id', candidateId)
    .single();
  
  if (candidateError) {
    throw candidateError;
  }
  
  if (!candidateData) {
    throw new Error('No se encontró el candidato');
  }

  let analysisData = null;
  
  // Parse analysis_data if it exists
  if (candidateData.analysis_summary) {
    try {
      // Try to parse as JSON
      analysisData = JSON.parse(candidateData.analysis_summary);
      // Check if it's a JSON string (result of a previous analysis)
      if (typeof analysisData === 'string') {
        try {
          analysisData = JSON.parse(analysisData);
        } catch (e) {
          // Analysis already in string format
        }
      }
    } catch (e) {
      // If it can't be parsed as JSON, assume it's the old format
      analysisData = {
        perfilProfesional: candidateData.analysis_summary
      };
    }
  }

  // If there are applications, fetch job details for each
  let appsWithJobDetails = [];
  if (candidateData.applications && candidateData.applications.length > 0) {
    const jobPromises = candidateData.applications.map(async (app: any) => {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, department, location, type, description, requirements, responsibilities')
        .eq('id', app.job_id)
        .single();
      
      return {
        ...app,
        job_title: jobData?.title ?? 'Vacante Desconocida',
        job_department: jobData?.department ?? 'Departamento Desconocido',
        job_type: jobData?.type ?? 'tiempo-completo',
        job_description: jobData?.description,
        job_requirements: jobData?.requirements,
        job_responsibilities: jobData?.responsibilities
      };
    });
    
    appsWithJobDetails = await Promise.all(jobPromises);
  }

  return {
    ...candidateData,
    analysis_data: analysisData,
    applications: appsWithJobDetails
  };
}

export async function saveAnalysisData(candidateId: string, analysisResult: any, extractedText: string) {
  try {
    // Solo si tenemos datos de análisis, llamamos a la función Edge
    if (analysisResult) {
      
      try {
        // Call our edge function to save the data with multiple retries
        let retryCount = 0;
        const maxRetries = 3;
        let lastError = null;
        
        while (retryCount < maxRetries) {
          try {
            // Direct fetch approach without authorization since verify_jwt is false
            const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/save-candidate-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
              },
              body: JSON.stringify({
                candidateId,
                resumeText: extractedText,
                analysisData: analysisResult
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Edge function returned error: ${response.status}, ${errorText}`);
            }
            
            const data = await response.json();

            if (!data?.success) {
              throw new Error(data?.error || 'Error al guardar datos del análisis');
            }
            
            return data;
          } catch (error) {
            lastError = error;
            retryCount++;

            if (retryCount < maxRetries) {
              // Exponential backoff
              const delay = Math.pow(2, retryCount) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // If we've exhausted retries
        throw lastError || new Error('Error al invocar la función Edge después de múltiples intentos');
      } catch (edgeFunctionError: any) {
        throw new Error(`Error al invocar la función Edge: ${edgeFunctionError.message || JSON.stringify(edgeFunctionError)}`);
      }
    } else {
      // Si no hay datos de análisis, solo guardamos el texto del CV
      return await saveResumeText(candidateId, extractedText);
    }
    
  } catch (error: any) {
    throw error;
  }
}

export async function saveResumeText(candidateId: string, extractedText: string) {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .update({
        resume_text: extractedText,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId)
      .select('resume_text');
      
    if (error) {
      throw new Error(`Error al actualizar texto del CV: ${error.message}`);
    }
    
    return { 
      success: true, 
      message: 'Texto del CV guardado correctamente',
      data
    };
  } catch (error: any) {
    throw error;
  }
}

export async function analyzeResume(extractedText: string, jobDetails: any = null) {
  try {
    // Asegurarnos de que tenemos texto para analizar
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No hay texto para analizar');
    }
    
    // Retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        // Direct fetch approach without authorization since verify_jwt is false
        const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/extract-pdf-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29jZHRlc2FjemJmcndibHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzA0MjUsImV4cCI6MjA2MjE0NjQyNX0.nHNWlTMfxuwAKYaiw145IFTAx3R3sbfWygviPVSH-Zc"
          },
          body: JSON.stringify({ 
            extractedText,
            jobDetails
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Edge function returned error: ${response.status}, ${errorText}`);
        }
        
        const data = await response.json();

        if (!data?.success) {
          throw new Error(
            data?.error || 
            "Error durante el análisis del CV. Verifica los logs para más detalles."
          );
        }
        
        return data.analysis;
      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we've exhausted retries
    throw lastError || new Error('Error al invocar la función Edge después de múltiples intentos');
    
  } catch (error) {
    throw error;
  }
}

export function getResumeUrl(path: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  try {
    const { data } = supabase.storage.from('resumes').getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    return null;
  }
}
