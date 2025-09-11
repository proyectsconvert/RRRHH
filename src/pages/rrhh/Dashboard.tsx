
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Briefcase,
  GraduationCap,
  Heart
} from "lucide-react";
import { useRRHHAuth } from "@/contexts/RRHHAuthContext";
import { useRRHHData } from "@/hooks/useRRHHData";

export default function RRHHDashboard() {
  const { user, role } = useRRHHAuth();
  const { employees, attendance, messages, absenceRequests } = useRRHHData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getQuickStats = () => {
    const totalEmployees = employees.length;
    const todayAttendance = attendance.filter(a => 
      new Date(a.date).toDateString() === new Date().toDateString()
    ).length;
    const pendingRequests = absenceRequests.filter(r => r.status === 'pending').length;
    const unreadMessages = messages.filter(m => m.status === 'unread' && m.recipient_id === user?.id).length;

    return {
      totalEmployees,
      todayAttendance,
      attendanceRate: totalEmployees > 0 ? Math.round((todayAttendance / totalEmployees) * 100) : 0,
      pendingRequests,
      unreadMessages
    };
  };

  const stats = getQuickStats();

  const quickActions = [
    { icon: Users, label: "Gestionar Personal", href: "/rrhh/personal", color: "bg-blue-500" },
    { icon: Calendar, label: "Ver Calendario", href: "/rrhh/calendario", color: "bg-green-500" },
    { icon: Clock, label: "Control Jornada", href: "/rrhh/control-jornada", color: "bg-orange-500" },
    { icon: Award, label: "Evaluaciones", href: "/rrhh/desempeno", color: "bg-purple-500" }
  ];

  const recentActivities = [
    { id: 1, type: "attendance", message: "15 empleados han marcado entrada hoy", time: "9:00 AM" },
    { id: 2, type: "absence", message: "2 solicitudes de ausencia pendientes", time: "8:30 AM" },
    { id: 3, type: "training", message: "Capacitación programada para mañana", time: "Ayer" },
    { id: 4, type: "evaluation", message: "5 evaluaciones completadas esta semana", time: "Ayer" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido al panel de control de Recursos Humanos
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {role}
            </Badge>
            <span className="text-sm text-gray-500">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Empleados</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Asistencia Hoy</p>
                <p className="text-2xl font-bold text-green-900">{stats.todayAttendance}/{stats.totalEmployees}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={stats.attendanceRate} className="w-16 h-2" />
                  <span className="text-xs text-green-600">{stats.attendanceRate}%</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-orange-900">{stats.pendingRequests}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Mensajes</p>
                <p className="text-2xl font-bold text-purple-900">{stats.unreadMessages}</p>
                <p className="text-xs text-purple-600">Sin leer</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-600" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>Accede a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
                asChild
              >
                <a href={action.href}>
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimos eventos en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'attendance' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {activity.type === 'absence' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    {activity.type === 'training' && <GraduationCap className="w-4 h-4 text-blue-500" />}
                    {activity.type === 'evaluation' && <Award className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
              Resumen de Rendimiento
            </CardTitle>
            <CardDescription>Métricas clave del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Productividad General</span>
                <div className="flex items-center gap-2">
                  <Progress value={85} className="w-20" />
                  <span className="text-sm font-bold">85%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Satisfacción Laboral</span>
                <div className="flex items-center gap-2">
                  <Progress value={92} className="w-20" />
                  <span className="text-sm font-bold">92%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Capacitaciones Completadas</span>
                <div className="flex items-center gap-2">
                  <Progress value={78} className="w-20" />
                  <span className="text-sm font-bold">78%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retención de Talento</span>
                <div className="flex items-center gap-2">
                  <Progress value={96} className="w-20" />
                  <span className="text-sm font-bold">96%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wellness Section */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Bienestar del Equipo
          </CardTitle>
          <CardDescription>Iniciativas de bienestar y clima laboral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-pink-600">4.8/5</div>
              <div className="text-sm text-gray-600">Satisfacción General</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-gray-600">Días Promedio Vacaciones</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-gray-600">Participación Eventos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
