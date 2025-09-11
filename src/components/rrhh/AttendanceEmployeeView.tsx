
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, User } from 'lucide-react';
import { useRRHHData } from '@/hooks/useRRHHData';
import { EmployeeAttendanceCalendar } from './EmployeeAttendanceCalendar';
import { AttendanceEmployeeStats } from './AttendanceEmployeeStats';

export const AttendanceEmployeeView: React.FC = () => {
  const { employees, isLoading } = useRRHHData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentDate] = useState(new Date());

  // For now, simulate current user as first employee - in real app this would come from auth
  const currentUserId = employees.length > 0 ? employees[0].id : '';
  const displayEmployeeId = selectedEmployeeId || currentUserId;
  const selectedEmployee = employees.find(emp => emp.id === displayEmployeeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  if (!selectedEmployee) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay empleados disponibles
          </h3>
          <p className="text-gray-600">
            No se encontraron empleados en el sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de empleado (para admins que pueden ver otros empleados) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-cyan-600" />
            Mi Registro de Jornada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empleado
            </label>
            <Select 
              value={displayEmployeeId} 
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="w-full">
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
        </CardContent>
      </Card>

      {/* Estadísticas del empleado */}
      <AttendanceEmployeeStats 
        employeeId={displayEmployeeId}
        currentDate={currentDate}
      />

      {/* Calendario de jornada */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Jornada</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeAttendanceCalendar
            employeeId={displayEmployeeId}
            employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
          />
        </CardContent>
      </Card>
    </div>
  );
};
