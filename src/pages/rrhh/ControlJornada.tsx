
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Calendar, 
  Users, 
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Timer,
  Shield
} from "lucide-react";
import { useRRHHData } from "@/hooks/useRRHHData";
import { AttendanceAdminView } from "@/components/rrhh/AttendanceAdminView";
import { AttendanceEmployeeView } from "@/components/rrhh/AttendanceEmployeeView";
import type { Employee, AttendanceRecordResponse } from "@/types/rrhh";

export default function ControlJornada() {
  const { employees, attendance, isLoading } = useRRHHData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const attendanceRecords = attendance as AttendanceRecordResponse[];

  const todayAttendance = attendanceRecords.filter((record) => 
    record.date === new Date().toISOString().split('T')[0]
  );

  const getAttendanceStatus = (employeeId: string) => {
    const todayRecord = todayAttendance.find((record) => record.employee_id === employeeId);
    if (!todayRecord) return 'absent';
    if (todayRecord.check_in_time && !todayRecord.check_out_time) return 'present';
    if (todayRecord.check_in_time && todayRecord.check_out_time) return 'completed';
    return 'absent';
  };

  const presentEmployees = employees.filter((emp: Employee) => getAttendanceStatus(emp.id) === 'present').length;
  const absentEmployees = employees.filter((emp: Employee) => getAttendanceStatus(emp.id) === 'absent').length;
  const completedEmployees = employees.filter((emp: Employee) => getAttendanceStatus(emp.id) === 'completed').length;
  const attendanceRate = employees.length > 0 ? Math.round(((presentEmployees + completedEmployees) / employees.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando control de jornada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Jornada</h1>
          <p className="text-gray-600 mt-2">Gestiona las entradas y salidas del personal</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-lg font-mono">
              {currentTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {currentTime.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Presentes</p>
                <p className="text-2xl font-bold text-green-900">{presentEmployees}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Jornada Completa</p>
                <p className="text-2xl font-bold text-blue-900">{completedEmployees}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Ausentes</p>
                <p className="text-2xl font-bold text-red-900">{absentEmployees}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Tasa de Asistencia</p>
                <p className="text-2xl font-bold text-purple-900">{attendanceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="employee" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Mi Jornada
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Validación Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employee" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-cyan-600" />
                Registro de Jornada Personal
              </CardTitle>
              <CardDescription>
                Registra tu entrada, salida y descansos del día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceEmployeeView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <AttendanceAdminView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
