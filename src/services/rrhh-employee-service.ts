
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  status: 'Activo' | 'Inactivo' | 'Vacaciones' | 'Licencia' | 'Suspendido';
  employment_type?: 'Interno' | 'Externo' | 'Contratista' | 'Freelancer';
  position: string;
  hire_date: string;
  department_id?: string;
  work_center_id?: string;
  team_id?: string;
  work_center?: {
    id: string;
    name: string;
    country_code?: string;
  };
  department?: {
    id: string;
    name: string;
    description?: string;
  };
  team?: {
    id: string;
    name: string;
    department_id?: string;
  };
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
  };
  organizational_info?: {
    position_level: number;
    is_department_head: boolean;
    direct_reports: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface WorkCenter {
  id: string;
  name: string;
  country_code?: string;
}

export interface OrganizationalStructure {
  id: string;
  employee_id: string;
  manager_id?: string;
  position_level: number;
  is_department_head: boolean;
  department_id?: string;
}

export const employeeService = {
  // Obtener todos los empleados de forma simplificada
  async getAllEmployees(): Promise<Employee[]> {
    console.log('Fetching all employees...');
    
    try {
      // Primero obtenemos los empleados básicos
      const { data: employees, error: empError } = await supabase
        .from('rrhh_employees_master')
        .select(`
          id,
          first_name,
          last_name,
          full_name,
          email,
          position,
          status,
          hire_date,
          employment_type,
          department_id,
          work_center_id,
          team_id,
          created_at,
          updated_at
        `)
        .order('last_name', { ascending: true });

      if (empError) {
        console.error('Error fetching basic employees:', empError);
        throw empError;
      }

      if (!employees || employees.length === 0) {
        console.log('No employees found');
        return [];
      }

      // Obtener centros de trabajo
      const { data: workCenters } = await supabase
        .from('rrhh_work_centers')
        .select('id, name, country_code');

      // Obtener departamentos
      const { data: departments } = await supabase
        .from('rrhh_departments_master')
        .select('id, name, description');

      // Obtener equipos
      const { data: teams } = await supabase
        .from('rrhh_teams')
        .select('id, name, department_id');

      // Obtener información organizacional
      const { data: orgStructure } = await supabase
        .from('rrhh_organizational_structure')
        .select('employee_id, manager_id, position_level, is_department_head');

      // Combinar los datos
      const enrichedEmployees = employees.map(emp => {
        const workCenter = workCenters?.find(wc => wc.id === emp.work_center_id);
        const department = departments?.find(dept => dept.id === emp.department_id);
        const team = teams?.find(t => t.id === emp.team_id);
        const orgInfo = orgStructure?.find(org => org.employee_id === emp.id);

        // Encontrar manager
        let manager;
        if (orgInfo?.manager_id) {
          const managerData = employees.find(e => e.id === orgInfo.manager_id);
          if (managerData) {
            manager = {
              id: managerData.id,
              first_name: managerData.first_name,
              last_name: managerData.last_name,
              position: managerData.position
            };
          }
        }

        return {
          ...emp,
          work_center: workCenter || undefined,
          department: department || undefined,
          team: team || undefined,
          manager: manager || undefined,
          organizational_info: orgInfo ? {
            position_level: orgInfo.position_level,
            is_department_head: orgInfo.is_department_head,
            direct_reports: orgStructure?.filter(o => o.manager_id === emp.id).length || 0
          } : undefined,
          status: emp.status as Employee['status'],
          employment_type: emp.employment_type as Employee['employment_type']
        };
      });

      console.log(`Successfully loaded ${enrichedEmployees.length} employees`);
      return enrichedEmployees;
    } catch (error) {
      console.error('Error in getAllEmployees:', error);
      throw error;
    }
  },

  // Obtener empleado por ID
  async getEmployeeById(id: string): Promise<Employee | null> {
    console.log(`Fetching employee by ID: ${id}`);
    
    try {
      const { data: employee, error } = await supabase
        .from('rrhh_employees_master')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !employee) {
        console.log('Employee not found');
        return null;
      }

      return employee as Employee;
    } catch (error) {
      console.error('Error fetching employee by ID:', error);
      return null;
    }
  },

  // Obtener departamentos
  async getDepartments(): Promise<Department[]> {
    console.log('Fetching departments...');
    
    try {
      const { data: departments, error } = await supabase
        .from('rrhh_departments_master')
        .select('id, name, description')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching departments:', error);
        throw error;
      }

      return departments || [];
    } catch (error) {
      console.error('Error in getDepartments:', error);
      return [];
    }
  },

  // Obtener centros de trabajo
  async getWorkCenters(): Promise<WorkCenter[]> {
    console.log('Fetching work centers...');
    
    try {
      const { data: workCenters, error } = await supabase
        .from('rrhh_work_centers')
        .select('id, name, country_code')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching work centers:', error);
        throw error;
      }

      return workCenters || [];
    } catch (error) {
      console.error('Error in getWorkCenters:', error);
      return [];
    }
  },

  // Buscar empleados
  async searchEmployees(searchTerm: string, filters: {
    department?: string;
    workCenter?: string;
    status?: string;
    position?: string;
  } = {}): Promise<Employee[]> {
    console.log('Searching employees with term:', searchTerm, 'filters:', filters);
    
    try {
      let query = supabase
        .from('rrhh_employees_master')
        .select(`
          id,
          first_name,
          last_name,
          full_name,
          email,
          position,
          status,
          hire_date,
          employment_type,
          department_id,
          work_center_id,
          team_id,
          created_at,
          updated_at
        `);

      // Aplicar filtros
      if (filters.department) {
        query = query.eq('department_id', filters.department);
      }
      if (filters.workCenter) {
        query = query.eq('work_center_id', filters.workCenter);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Aplicar búsqueda de texto
      if (searchTerm.trim()) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`);
      }

      // Filtro de posición
      if (filters.position) {
        query = query.ilike('position', `%${filters.position}%`);
      }

      const { data: employees, error } = await query.order('last_name', { ascending: true });

      if (error) {
        console.error('Error searching employees:', error);
        throw error;
      }

      // Enriquecer con datos relacionados (similar a getAllEmployees)
      if (!employees || employees.length === 0) {
        return [];
      }

      const [workCenters, departments, teams] = await Promise.all([
        supabase.from('rrhh_work_centers').select('id, name, country_code'),
        supabase.from('rrhh_departments_master').select('id, name, description'),
        supabase.from('rrhh_teams').select('id, name, department_id')
      ]);

      return employees.map(emp => {
        const workCenter = workCenters.data?.find(wc => wc.id === emp.work_center_id);
        const department = departments.data?.find(dept => dept.id === emp.department_id);
        const team = teams.data?.find(t => t.id === emp.team_id);

        return {
          ...emp,
          work_center: workCenter || undefined,
          department: department || undefined,
          team: team || undefined,
          status: emp.status as Employee['status'],
          employment_type: emp.employment_type as Employee['employment_type']
        };
      });
    } catch (error) {
      console.error('Error in searchEmployees:', error);
      return [];
    }
  },

  // Obtener estructura organizacional
  async getOrganizationalStructure(): Promise<OrganizationalStructure[]> {
    console.log('Fetching organizational structure...');
    
    try {
      const { data: structure, error } = await supabase
        .from('rrhh_organizational_structure')
        .select('*')
        .order('position_level', { ascending: true });

      if (error) {
        console.error('Error fetching organizational structure:', error);
        throw error;
      }

      return structure || [];
    } catch (error) {
      console.error('Error in getOrganizationalStructure:', error);
      return [];
    }
  },

  // Actualizar estructura organizacional
  async updateOrganizationalStructure(employeeId: string, managerId?: string, positionLevel: number = 1): Promise<void> {
    console.log('Updating organizational structure for employee:', employeeId);
    
    try {
      const { error } = await supabase
        .from('rrhh_organizational_structure')
        .upsert({
          employee_id: employeeId,
          manager_id: managerId || null,
          position_level: positionLevel,
          is_department_head: !managerId, // Si no tiene manager, es jefe
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating organizational structure:', error);
        throw error;
      }

      console.log('Organizational structure updated successfully');
    } catch (error) {
      console.error('Error in updateOrganizationalStructure:', error);
      throw error;
    }
  },

  // Obtener estadísticas básicas
  async getEmployeeStats() {
    console.log('Fetching employee stats...');
    
    try {
      const { data: employees, error } = await supabase
        .from('rrhh_employees_master')
        .select('status, employment_type, hire_date, department_id, work_center_id');

      if (error) {
        console.error('Error fetching employee stats:', error);
        return {
          total: 0,
          active: 0,
          inactive: 0,
          byStatus: {},
          byEmploymentType: {},
          byDepartment: {}
        };
      }

      const stats = {
        total: employees?.length || 0,
        active: employees?.filter(e => e.status === 'Activo').length || 0,
        inactive: employees?.filter(e => e.status === 'Inactivo').length || 0,
        byStatus: {} as Record<string, number>,
        byEmploymentType: {} as Record<string, number>,
        byDepartment: {} as Record<string, number>
      };

      employees?.forEach(employee => {
        // Por status
        const status = employee.status || 'Sin definir';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Por tipo de empleo
        const empType = employee.employment_type || 'Sin definir';
        stats.byEmploymentType[empType] = (stats.byEmploymentType[empType] || 0) + 1;

        // Por departamento
        const dept = employee.department_id || 'Sin asignar';
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byStatus: {},
        byEmploymentType: {},
        byDepartment: {}
      };
    }
  }
};
