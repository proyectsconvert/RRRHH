
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceEmployeeStats } from './AttendanceEmployeeStats';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  break_duration_minutes?: number;
  hours_worked?: number;
  overtime_hours?: number;
  status: string;
  notes?: string;
  employee?: {
    first_name: string;
    last_name: string;
    position: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

export const AttendanceAdminView: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeAttendance();
    }
  }, [selectedEmployee, currentDate, statusFilter]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_employees_master')
        .select('id, first_name, last_name, position')
        .eq('status', 'Activo')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
      
      if (data && data.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeAttendance = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      
      // Get the month range
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('rrhh_attendance')
        .select(`
          *,
          rrhh_employees_master!employee_id(first_name, last_name, position)
        `)
        .eq('employee_id', selectedEmployee)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedData = (data || []).map(record => ({
        ...record,
        employee: record.rrhh_employees_master ? {
          first_name: record.rrhh_employees_master.first_name,
          last_name: record.rrhh_employees_master.last_name,
          position: record.rrhh_employees_master.position
        } : undefined
      }));

      setAttendanceRecords(transformedData);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de asistencia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveAttendance = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('rrhh_attendance')
        .update({ status: 'confirmed' })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Aprobado",
        description: "Registro de asistencia confirmado"
      });

      loadEmployeeAttendance();
    } catch (error) {
      console.error('Error approving attendance:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el registro",
        variant: "destructive"
      });
    }
  };

  const rejectAttendance = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('rrhh_attendance')
        .update({ status: 'rejected' })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Rechazado",
        description: "Registro de asistencia rechazado"
      });

      loadEmployeeAttendance();
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el registro",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'HH:MM';
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMinutes = (minutes?: number) => {
    if (!minutes) return 'MM';
    return `${minutes}`;
  };

  const formatHours = (hours?: number) => {
    if (!hours || hours === 0) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500 text-white">Confirmed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 text-white">Pending</Badge>;
      case 'present':
        return <Badge className="bg-blue-500 text-white">Present</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
  };

  const getDayNumber = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getAbsenceInfo = (dateString: string) => {
    // This would connect to absence requests in a real implementation
    return 'None';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const currentMonthYear = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  if (loading && !selectedEmployee) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Cargando empleados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Validación de Asistencia - Vista Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="present">Presente</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 bg-cyan-50 p-4 rounded-lg">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold capitalize">{currentMonthYear}</h3>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {selectedEmployeeData && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg">
                {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
              </h4>
              <p className="text-gray-600">{selectedEmployeeData.position}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Statistics */}
      {selectedEmployee && (
        <AttendanceEmployeeStats 
          employeeId={selectedEmployee}
          currentDate={currentDate}
        />
      )}

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Registros de Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay registros</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron registros de asistencia para el empleado y período seleccionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Day</TableHead>
                    <TableHead className="font-semibold">Absences / Holidays</TableHead>
                    <TableHead className="font-semibold">Start</TableHead>
                    <TableHead className="font-semibold">End</TableHead>
                    <TableHead className="font-semibold">Break</TableHead>
                    <TableHead className="font-semibold">Comment</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="font-semibold">Overtime</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{getDayName(record.date)}</div>
                          <div className="text-gray-500">{getDayNumber(record.date)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {getAbsenceInfo(record.date)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatTime(record.check_in_time)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatTime(record.check_out_time)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatMinutes(record.break_duration_minutes)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-32 truncate">
                        {record.notes || ''}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {formatHours(record.hours_worked)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-orange-600">
                        {formatHours(record.overtime_hours)}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {(record.status === 'present' || record.status === 'pending') && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveAttendance(record.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectAttendance(record.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
