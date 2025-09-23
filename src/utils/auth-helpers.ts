import { supabase } from '@/integrations/supabase/client';

/**
 * Valida si un usuario está activo en el sistema
 * @param userId - ID del usuario a validar
 * @returns Promise<boolean> - true si el usuario está activo, false si está inactivo
 */
export const validateUserActiveStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error validating user status:', error);
      return false;
    }

    return data?.is_active === true;
  } catch (error) {
    console.error('Error in validateUserActiveStatus:', error);
    return false;
  }
};

/**
 * Obtiene el perfil completo del usuario incluyendo el estado activo
 * @param userId - ID del usuario
 * @returns Promise con el perfil del usuario o null si hay error
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Verifica si el usuario actual está activo y lanza error si no lo está
 * @param userId - ID del usuario a verificar
 * @throws Error si el usuario está inactivo
 */
export const ensureUserIsActive = async (userId: string): Promise<void> => {
  const isActive = await validateUserActiveStatus(userId);

  if (!isActive) {
    throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador para más información.');
  }
};