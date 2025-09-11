
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyStats {
  total_days_worked: number;
  total_hours_worked: number;
  total_expected_hours: number;
  days_present: number;
  days_absent: number;
  total_overtime_hours: number;
  attendance_percentage: number;
}

interface AttendanceEmployeeStatsProps {
  employeeId: string;
  currentDate: Date;
}

export const AttendanceEmployeeStats: React.FC<AttendanceEmployeeStatsProps> = ({
  employeeId,
  currentDate
}) => {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [employeeId, currentDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_employee_monthly_stats', {
        p_employee_id: employeeId,
        p_year: currentDate.getFullYear(),
        p_month: currentDate.getMonth() + 1
      });

      if (error) throw error;
      setStats(data[0] || null);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-gray-500">
          No hay datos disponibles para este mes
        </CardContent>
      </Card>
    );
  }

  const attendanceColor = stats.attendance_percentage >= 90 ? 'text-green-600' : 
                         stats.attendance_percentage >= 75 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Días Trabajados</p>
                <p className="text-2xl font-bold text-blue-900">{stats.days_present}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Horas Trabajadas</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.total_hours_worked.toFixed(1)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Asistencia</p>
                <p className={`text-2xl font-bold ${attendanceColor}`}>
                  {stats.attendance_percentage.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Horas Extra</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.total_overtime_hours.toFixed(1)}h
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Horas Trabajadas</span>
                <span>{stats.total_hours_worked.toFixed(1)}h / {stats.total_expected_hours.toFixed(1)}h</span>
              </div>
              <Progress 
                value={(stats.total_hours_worked / stats.total_expected_hours) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Días de Asistencia</span>
                <span>{stats.days_present} / {stats.days_present + stats.days_absent}</span>
              </div>
              <Progress 
                value={stats.attendance_percentage} 
                className="h-2"
              />
            </div>

            {stats.total_overtime_hours > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    {stats.total_overtime_hours.toFixed(1)} horas extra este mes
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
