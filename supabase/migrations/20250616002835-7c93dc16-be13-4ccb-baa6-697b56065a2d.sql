
-- Agregar campos adicionales a la tabla de asistencia para mejor control
ALTER TABLE public.rrhh_attendance 
ADD COLUMN IF NOT EXISTS work_type text DEFAULT 'Trabajo',
ADD COLUMN IF NOT EXISTS is_holiday boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS holiday_name text,
ADD COLUMN IF NOT EXISTS total_break_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_hours numeric DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS comments text;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_rrhh_attendance_employee_date ON public.rrhh_attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_rrhh_attendance_date ON public.rrhh_attendance(date);

-- Función mejorada para calcular estadísticas de asistencia mensual
CREATE OR REPLACE FUNCTION public.get_employee_monthly_stats(
  p_employee_id UUID,
  p_year INTEGER,
  p_month INTEGER
) RETURNS TABLE(
  total_days_worked INTEGER,
  total_hours_worked NUMERIC,
  total_expected_hours NUMERIC,
  days_present INTEGER,
  days_absent INTEGER,
  total_overtime_hours NUMERIC,
  attendance_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_total_work_days INTEGER;
BEGIN
  -- Calcular fechas del mes
  v_start_date := DATE(p_year || '-' || p_month || '-01');
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calcular días laborables (excluyendo sábados y domingos)
  SELECT COUNT(*)::INTEGER INTO v_total_work_days
  FROM generate_series(v_start_date, v_end_date, '1 day'::INTERVAL) AS day_series
  WHERE EXTRACT(DOW FROM day_series) NOT IN (0, 6); -- 0=Sunday, 6=Saturday
  
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN ra.status IN ('present', 'completed', 'confirmed') THEN 1 END)::INTEGER as total_days_worked,
    COALESCE(SUM(ra.hours_worked), 0) as total_hours_worked,
    COALESCE(SUM(ra.expected_hours), v_total_work_days * 8.0) as total_expected_hours,
    COUNT(CASE WHEN ra.status IN ('present', 'completed', 'confirmed') THEN 1 END)::INTEGER as days_present,
    (v_total_work_days - COUNT(CASE WHEN ra.status IN ('present', 'completed', 'confirmed') THEN 1 END))::INTEGER as days_absent,
    COALESCE(SUM(ra.overtime_hours), 0) as total_overtime_hours,
    CASE 
      WHEN v_total_work_days > 0 THEN 
        (COUNT(CASE WHEN ra.status IN ('present', 'completed', 'confirmed') THEN 1 END)::NUMERIC / v_total_work_days * 100)
      ELSE 0 
    END as attendance_percentage
  FROM rrhh_attendance ra
  WHERE ra.employee_id = p_employee_id
    AND ra.date >= v_start_date
    AND ra.date <= v_end_date;
END;
$$;

-- Función para obtener el calendario completo de un empleado
CREATE OR REPLACE FUNCTION public.get_employee_calendar(
  p_employee_id UUID,
  p_year INTEGER,
  p_month INTEGER
) RETURNS TABLE(
  date DATE,
  day_name TEXT,
  is_weekend BOOLEAN,
  is_holiday BOOLEAN,
  holiday_name TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  break_start_time TIMESTAMP WITH TIME ZONE,
  break_end_time TIMESTAMP WITH TIME ZONE,
  break_duration_minutes INTEGER,
  hours_worked NUMERIC,
  expected_hours NUMERIC,
  overtime_hours NUMERIC,
  work_type TEXT,
  status TEXT,
  comments TEXT,
  attendance_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calcular fechas del mes
  v_start_date := DATE(p_year || '-' || p_month || '-01');
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  RETURN QUERY
  SELECT 
    day_series::DATE as date,
    TO_CHAR(day_series, 'Day') as day_name,
    EXTRACT(DOW FROM day_series) IN (0, 6) as is_weekend,
    COALESCE(ra.is_holiday, false) as is_holiday,
    ra.holiday_name,
    ra.check_in_time,
    ra.check_out_time,
    ra.break_start_time,
    ra.break_end_time,
    COALESCE(ra.break_duration_minutes, 0) as break_duration_minutes,
    ra.hours_worked,
    COALESCE(ra.expected_hours, 8.0) as expected_hours,
    COALESCE(ra.overtime_hours, 0) as overtime_hours,
    COALESCE(ra.work_type, 'Trabajo') as work_type,
    COALESCE(ra.status, 'absent') as status,
    ra.comments,
    ra.id as attendance_id
  FROM generate_series(v_start_date, v_end_date, '1 day'::INTERVAL) AS day_series
  LEFT JOIN rrhh_attendance ra ON ra.date = day_series::DATE AND ra.employee_id = p_employee_id
  ORDER BY day_series;
END;
$$;

-- Función para actualizar registro de asistencia con validaciones
CREATE OR REPLACE FUNCTION public.update_attendance_record(
  p_employee_id UUID,
  p_date DATE,
  p_check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_check_out_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_break_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_break_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_work_type TEXT DEFAULT 'Trabajo',
  p_comments TEXT DEFAULT NULL,
  p_is_holiday BOOLEAN DEFAULT false,
  p_holiday_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attendance_id UUID;
  v_hours_worked NUMERIC := 0;
  v_break_duration INTEGER := 0;
  v_overtime_hours NUMERIC := 0;
  v_expected_hours NUMERIC := 8.0;
  v_status TEXT := 'absent';
BEGIN
  -- Calcular duración del descanso en minutos
  IF p_break_start_time IS NOT NULL AND p_break_end_time IS NOT NULL THEN
    v_break_duration := EXTRACT(EPOCH FROM (p_break_end_time - p_break_start_time)) / 60;
  END IF;

  -- Calcular horas trabajadas (excluyendo descanso)
  IF p_check_in_time IS NOT NULL AND p_check_out_time IS NOT NULL THEN
    v_hours_worked := EXTRACT(EPOCH FROM (p_check_out_time - p_check_in_time)) / 3600 - (v_break_duration / 60.0);
    v_status := 'completed';
    
    -- Calcular horas extra si trabajó más de las esperadas
    IF v_hours_worked > v_expected_hours THEN
      v_overtime_hours := v_hours_worked - v_expected_hours;
    END IF;
  ELSIF p_check_in_time IS NOT NULL THEN
    v_status := 'present';
  ELSIF p_is_holiday THEN
    v_status := 'holiday';
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
    overtime_hours,
    expected_hours,
    work_type,
    status,
    comments,
    is_holiday,
    holiday_name
  ) VALUES (
    p_employee_id,
    p_date,
    p_check_in_time,
    p_check_out_time,
    p_break_start_time,
    p_break_end_time,
    v_break_duration,
    v_hours_worked,
    v_overtime_hours,
    v_expected_hours,
    p_work_type,
    v_status,
    p_comments,
    p_is_holiday,
    p_holiday_name
  ) 
  ON CONFLICT (employee_id, date) 
  DO UPDATE SET
    check_in_time = COALESCE(EXCLUDED.check_in_time, rrhh_attendance.check_in_time),
    check_out_time = COALESCE(EXCLUDED.check_out_time, rrhh_attendance.check_out_time),
    break_start_time = COALESCE(EXCLUDED.break_start_time, rrhh_attendance.break_start_time),
    break_end_time = COALESCE(EXCLUDED.break_end_time, rrhh_attendance.break_end_time),
    break_duration_minutes = EXCLUDED.break_duration_minutes,
    hours_worked = EXCLUDED.hours_worked,
    overtime_hours = EXCLUDED.overtime_hours,
    work_type = EXCLUDED.work_type,
    status = EXCLUDED.status,
    comments = EXCLUDED.comments,
    is_holiday = EXCLUDED.is_holiday,
    holiday_name = EXCLUDED.holiday_name,
    updated_at = NOW()
  RETURNING id INTO v_attendance_id;

  RETURN v_attendance_id;
END;
$$;

-- Políticas RLS para las nuevas funciones
CREATE POLICY "Employees can view their own attendance calendar" 
  ON public.rrhh_attendance 
  FOR SELECT 
  USING (public.is_rrhh_admin() OR auth.uid()::text = employee_id::text);

CREATE POLICY "Employees can update their own attendance" 
  ON public.rrhh_attendance 
  FOR UPDATE 
  USING (public.is_rrhh_admin() OR auth.uid()::text = employee_id::text);
