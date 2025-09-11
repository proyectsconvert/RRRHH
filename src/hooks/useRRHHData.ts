
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { employeeService } from '@/services/rrhh-employee-service';
import type { 
  Employee, 
  PartialEmployee,
  AbsenceRequest, 
  AbsenceRequestResponse,
  AttendanceRecord, 
  AttendanceRecordResponse,
  Message, 
  PayrollRecord 
} from '@/types/rrhh';

// Helper function to get employee display name
const getEmployeeName = (employee: Employee | PartialEmployee): string => {
  if ('name' in employee && employee.name) return employee.name;
  return `${employee.first_name} ${employee.last_name}`.trim();
};

// Helper function to get department name
const getDepartmentName = (department: any): string => {
  if (typeof department === 'string') return department;
  if (department && typeof department === 'object' && department.name) return department.name;
  return 'Sin departamento';
};

// Helper function to normalize status
const normalizeStatus = (status: string): 'pending' | 'approved' | 'rejected' => {
  const normalized = status.toLowerCase();
  if (normalized === 'pending' || normalized === 'approved' || normalized === 'rejected') {
    return normalized as 'pending' | 'approved' | 'rejected';
  }
  return 'pending';
};

// Helper function to normalize employee status
const normalizeEmployeeStatus = (status?: string): 'Activo' | 'Inactivo' | 'Vacaciones' | 'Licencia' | 'Suspendido' => {
  if (!status) return 'Activo';
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'activo': return 'Activo';
    case 'inactivo': return 'Inactivo';
    case 'vacaciones': return 'Vacaciones';
    case 'licencia': return 'Licencia';
    case 'suspendido': return 'Suspendido';
    default: return 'Activo';
  }
};

export const useEmployees = () => {
  return useQuery({
    queryKey: ['rrhh-employees'],
    queryFn: async () => {
      console.log('Fetching employees...');
      const employees = await employeeService.getAllEmployees();
      
      // Enrich employees with computed properties
      return employees.map((emp: any) => ({
        ...emp,
        name: getEmployeeName(emp),
        department: getDepartmentName(emp.department)
      }));
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAttendance = () => {
  return useQuery({
    queryKey: ['rrhh-attendance'],
    queryFn: async (): Promise<AttendanceRecordResponse[]> => {
      console.log('Fetching attendance data...');
      try {
        const { data: attendanceData, error } = await supabase
          .from('rrhh_attendance')
          .select('*')
          .order('date', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error('Error fetching attendance:', error);
          throw error;
        }

        const { data: employees } = await supabase
          .from('rrhh_employees_master')
          .select('id, first_name, last_name, position, email, status');

        const enrichedAttendance = attendanceData?.map(record => {
          const employee = employees?.find(emp => emp.id === record.employee_id);
          return {
            ...record,
            employee: employee ? {
              ...employee,
              name: getEmployeeName(employee),
              email: employee.email || '',
              status: normalizeEmployeeStatus(employee.status)
            } : undefined
          };
        }) || [];
        
        console.log(`Loaded ${enrichedAttendance.length} attendance records`);
        return enrichedAttendance;
      } catch (error) {
        console.error('Error in attendance query:', error);
        return [];
      }
    },
    retry: 2,
  });
};

export const useMessages = () => {
  return useQuery({
    queryKey: ['rrhh-messages'],
    queryFn: async () => {
      console.log('Fetching messages...');
      try {
        const { data: messagesData, error } = await supabase
          .from('rrhh_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) {
          console.error('Error fetching messages:', error);
          throw error;
        }

        const { data: employees } = await supabase
          .from('rrhh_employees_master')
          .select('id, first_name, last_name, position, email, status');

        const enrichedMessages = messagesData?.map(message => {
          const sender = employees?.find(emp => emp.id === message.sender_id);
          return {
            ...message,
            sender: sender ? {
              ...sender,
              name: getEmployeeName(sender),
              email: sender.email || '',
              status: normalizeEmployeeStatus(sender.status)
            } : undefined
          };
        }) || [];
        
        console.log(`Loaded ${enrichedMessages.length} messages`);
        return enrichedMessages;
      } catch (error) {
        console.error('Error in messages query:', error);
        return [];
      }
    },
    retry: 2,
  });
};

export const useAbsenceRequests = () => {
  return useQuery({
    queryKey: ['rrhh-absence-requests'],
    queryFn: async (): Promise<AbsenceRequestResponse[]> => {
      console.log('Fetching absence requests...');
      try {
        const { data, error } = await supabase
          .from('rrhh_absence_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error('Error fetching absence requests:', error);
          throw error;
        }

        const { data: employees } = await supabase
          .from('rrhh_employees_master')
          .select('id, first_name, last_name, position');
        
        const enrichedRequests = data?.map(request => {
          const employee = employees?.find(emp => emp.id === request.employee_id);
          return {
            ...request,
            employee_name: employee ? getEmployeeName(employee) : 'Empleado no encontrado'
          };
        }) || [];
        
        console.log(`Loaded ${enrichedRequests.length} absence requests`);
        return enrichedRequests;
      } catch (error) {
        console.error('Error in absence requests query:', error);
        return [];
      }
    },
    retry: 2,
  });
};

export const usePayroll = () => {
  return useQuery({
    queryKey: ['rrhh-payroll'],
    queryFn: async () => {
      console.log('Fetching payroll data...');
      try {
        const { data, error } = await supabase
          .from('rrhh_payroll')
          .select('*')
          .order('period_year', { ascending: false })
          .order('period_month', { ascending: false })
          .limit(100);
        
        if (error) {
          console.error('Error fetching payroll:', error);
          throw error;
        }
        
        console.log(`Loaded ${data?.length || 0} payroll records`);
        return data || [];
      } catch (error) {
        console.error('Error in payroll query:', error);
        return [];
      }
    },
    retry: 2,
  });
};

// Unified hook that combines all data
export const useRRHHData = () => {
  const employeesQuery = useEmployees();
  const attendanceQuery = useAttendance();
  const messagesQuery = useMessages();
  const absenceRequestsQuery = useAbsenceRequests();
  const payrollQuery = usePayroll();

  return {
    employees: employeesQuery.data || [],
    attendance: attendanceQuery.data || [],
    messages: messagesQuery.data || [],
    absenceRequests: absenceRequestsQuery.data || [],
    payroll: payrollQuery.data || [],
    isLoading: employeesQuery.isLoading || attendanceQuery.isLoading || messagesQuery.isLoading || absenceRequestsQuery.isLoading || payrollQuery.isLoading,
    error: employeesQuery.error || attendanceQuery.error || messagesQuery.error || absenceRequestsQuery.error || payrollQuery.error,
  };
};

// Mutations
export const useRegisterAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, checkInTime, checkOutTime }: {
      employeeId: string;
      checkInTime?: string;
      checkOutTime?: string;
    }) => {
      console.log('Registering attendance...', { employeeId, checkInTime, checkOutTime });
      
      const { data, error } = await supabase.rpc('register_attendance', {
        p_employee_id: employeeId,
        p_check_in_time: checkInTime || new Date().toISOString(),
        p_check_out_time: checkOutTime || null,
      });
      
      if (error) {
        console.error('Error registering attendance:', error);
        throw error;
      }
      
      console.log('Attendance registered successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rrhh-attendance'] });
    },
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ senderId, recipientId, subject, content, messageType = 'general' }: {
      senderId: string;
      recipientId: string;
      subject: string;
      content: string;
      messageType?: string;
    }) => {
      console.log('Creating message...', { senderId, recipientId, subject });
      
      const { data, error } = await supabase.rpc('create_rrhh_message', {
        p_sender_id: senderId,
        p_recipient_id: recipientId,
        p_subject: subject,
        p_content: content,
        p_message_type: messageType,
      });
      
      if (error) {
        console.error('Error creating message:', error);
        throw error;
      }
      
      console.log('Message created successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rrhh-messages'] });
    },
  });
};

export const useCreateAbsenceRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, absenceType, startDate, endDate, reason }: {
      employeeId: string;
      absenceType: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      console.log('Creating absence request...', { employeeId, absenceType, startDate, endDate });
      
      const { data, error } = await supabase.rpc('create_absence_request', {
        p_employee_id: employeeId,
        p_absence_type: absenceType,
        p_start_date: startDate,
        p_end_date: endDate,
        p_reason: reason,
      });
      
      if (error) {
        console.error('Error creating absence request:', error);
        throw error;
      }
      
      console.log('Absence request created successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rrhh-absence-requests'] });
    },
  });
};
