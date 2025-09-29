-- Add role field directly to profiles table for better performance and simplicity
-- Migration: 20250925180000_add_role_to_profiles.sql

-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.role IS 'Primary role of the user (administrador, reclutador, rc_coordinator)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);