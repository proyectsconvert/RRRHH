
-- Crear tabla para notas de empleados
CREATE TABLE public.rrhh_employee_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  note_content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note_type TEXT DEFAULT 'general',
  is_confidential BOOLEAN DEFAULT false
);

-- Habilitar RLS en la tabla de notas
ALTER TABLE public.rrhh_employee_notes ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins y RRHH puedan ver las notas
CREATE POLICY "Only admin and RRHH can view employee notes" 
  ON public.rrhh_employee_notes 
  FOR SELECT 
  USING (public.is_rrhh_admin());

-- Política para que solo admins y RRHH puedan crear notas
CREATE POLICY "Only admin and RRHH can create employee notes" 
  ON public.rrhh_employee_notes 
  FOR INSERT 
  WITH CHECK (public.is_rrhh_admin());

-- Política para que solo admins y RRHH puedan actualizar notas
CREATE POLICY "Only admin and RRHH can update employee notes" 
  ON public.rrhh_employee_notes 
  FOR UPDATE 
  USING (public.is_rrhh_admin());

-- Política para que solo admins y RRHH puedan eliminar notas
CREATE POLICY "Only admin and RRHH can delete employee notes" 
  ON public.rrhh_employee_notes 
  FOR DELETE 
  USING (public.is_rrhh_admin());

-- Actualizar tabla de asistencia para incluir tiempo de descanso
ALTER TABLE public.rrhh_attendance 
ADD COLUMN break_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN break_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN break_duration_minutes INTEGER DEFAULT 0;

-- Función para registrar asistencia con descanso
CREATE OR REPLACE FUNCTION public.register_attendance_with_break(
  p_employee_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_check_out_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_break_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_break_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attendance_id UUID;
  v_hours_worked NUMERIC := 0;
  v_break_duration INTEGER := 0;
BEGIN
  -- Calcular duración del descanso en minutos
  IF p_break_start_time IS NOT NULL AND p_break_end_time IS NOT NULL THEN
    v_break_duration := EXTRACT(EPOCH FROM (p_break_end_time - p_break_start_time)) / 60;
  END IF;

  -- Calcular horas trabajadas (excluyendo descanso)
  IF p_check_in_time IS NOT NULL AND p_check_out_time IS NOT NULL THEN
    v_hours_worked := EXTRACT(EPOCH FROM (p_check_out_time - p_check_in_time)) / 3600 - (v_break_duration / 60.0);
  END IF;

  INSERT INTO rrhh_attendance (
    employee_id,
    date,
    check_in_time,
    check_out_time,
    break_start_time,
    break_end_time,
    break_duration_minutes,
    hours_worked,
    status
  ) VALUES (
    p_employee_id,
    p_date,
    p_check_in_time,
    p_check_out_time,
    p_break_start_time,
    p_break_end_time,
    v_break_duration,
    v_hours_worked,
    CASE 
      WHEN p_check_out_time IS NOT NULL THEN 'completed'
      WHEN p_check_in_time IS NOT NULL THEN 'present'
      ELSE 'absent'
    END
  ) 
  ON CONFLICT (employee_id, date) 
  DO UPDATE SET
    check_in_time = COALESCE(EXCLUDED.check_in_time, rrhh_attendance.check_in_time),
    check_out_time = COALESCE(EXCLUDED.check_out_time, rrhh_attendance.check_out_time),
    break_start_time = COALESCE(EXCLUDED.break_start_time, rrhh_attendance.break_start_time),
    break_end_time = COALESCE(EXCLUDED.break_end_time, rrhh_attendance.break_end_time),
    break_duration_minutes = EXCLUDED.break_duration_minutes,
    hours_worked = EXCLUDED.hours_worked,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO v_attendance_id;

  RETURN v_attendance_id;
END;
$$;

-- Función para crear notas de empleados
CREATE OR REPLACE FUNCTION public.create_employee_note(
  p_employee_id UUID,
  p_note_content TEXT,
  p_created_by UUID,
  p_note_type TEXT DEFAULT 'general',
  p_is_confidential BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_note_id UUID;
BEGIN
  INSERT INTO rrhh_employee_notes (
    employee_id,
    note_content,
    created_by,
    note_type,
    is_confidential
  ) VALUES (
    p_employee_id,
    p_note_content,
    p_created_by,
    p_note_type,
    p_is_confidential
  ) RETURNING id INTO v_note_id;

  RETURN v_note_id;
END;
$$;
