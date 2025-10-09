import { supabase } from '@/integrations/supabase/client';

export interface CandidateAccessToken {
  id: string;
  candidate_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * Generate a temporary access token for a candidate to access their documents
 * @param candidateId The candidate ID
 * @param expiresInHours How many hours the token should be valid (default: 168 = 7 days)
 * @returns The access token string
 */
export async function generateCandidateAccessToken(
  candidateId: string,
  expiresInHours: number = 168 // 7 days default
): Promise<string> {
  try {
    // Generate a unique token
    const token = crypto.randomUUID();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Store the token in the database
    const { error } = await supabase
      .from('candidate_access_tokens')
      .insert({
        candidate_id: candidateId,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Error creating access token:', error);
      throw new Error('No se pudo generar el token de acceso');
    }

    return token;
  } catch (error) {
    console.error('Error generating candidate access token:', error);
    throw error;
  }
}

/**
 * Validate a candidate access token
 * @param token The token to validate
 * @param candidateId The candidate ID (optional, for additional security)
 * @returns The candidate ID if valid, null if invalid
 */
export async function validateCandidateAccessToken(
  token: string,
  candidateId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('candidate_access_tokens')
      .select('candidate_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if token has expired
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Token expired, clean it up
      await supabase
        .from('candidate_access_tokens')
        .delete()
        .eq('token', token);
      return null;
    }

    // If candidateId is provided, verify it matches
    if (candidateId && data.candidate_id !== candidateId) {
      return null;
    }

    return data.candidate_id;
  } catch (error) {
    console.error('Error validating candidate access token:', error);
    return null;
  }
}

/**
 * Clean up expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('candidate_access_tokens')
      .delete()
      .lt('expires_at', now);

    if (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error);
  }
}