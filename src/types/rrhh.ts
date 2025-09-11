
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string | { id: string; name: string; description?: string };
  status: 'Activo' | 'Inactivo' | 'Vacaciones' | 'Licencia' | 'Suspendido';
  employment_type?: string; // Making this optional to match usage
  hire_date?: string;
  salary?: number;
  birth_date?: string;
  name?: string; // Computed property
}

// Database response types for partial employee data
export interface PartialEmployee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  email?: string;
  status?: string;
  name?: string;
}

export interface AbsenceRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  updated_at?: string;
  notes?: string;
}

// Database response type for absence requests
export interface AbsenceRequestResponse {
  id: string;
  employee_id: string;
  employee_name?: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string; // Raw string from database
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  updated_at?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  hours_worked?: number;
  overtime_hours?: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  employee?: Employee;
}

// Database response type for attendance records
export interface AttendanceRecordResponse {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location?: any; // Adding the missing property
  check_out_location?: any;
  break_start_time?: string; // Added missing break fields
  break_end_time?: string;
  break_duration_minutes?: number;
  hours_worked?: number;
  overtime_hours?: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  employee?: PartialEmployee;
  work_type?: string; // Added new fields from database
  is_holiday?: boolean;
  holiday_name?: string;
  expected_hours?: number;
  comments?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  status: 'unread' | 'read';
  created_at: string;
  read_at?: string;
  sender?: Employee;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  base_salary: number;
  overtime_pay?: number;
  bonuses?: number;
  deductions?: number;
  gross_pay: number;
  taxes?: number;
  net_pay: number;
  payment_date?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}
