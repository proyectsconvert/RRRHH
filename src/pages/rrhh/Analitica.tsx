
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useRRHHData";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Brain, TrendingUp, Users, 
  MessageSquare, Send, Bot, Zap
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Analitica() {
  const { toast } = useToast();
  const { data: employees = [] } = useEmployees();
  const [activeTab, setActiveTab] = useState('people-analytics');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [maxDailyUsage] = useState(5); // Límite para colaboradores

  const [analyticsData, setAnalyticsData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    turnoverRate: 0,
    averageTenure: 0,
    departmentDistribution: [] as Array<{name: string, count: number}>,
    performanceMetrics: {
      highPerformers: 0,
      needsImprovement: 0,
      averageScore: 0
    }
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [employees]);

  const loadAnalyticsData = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'Activo').length;
    
    // Distribución por departamento
    const deptDistribution = employees.reduce((acc, emp) => {
      const dept = emp.department?.name || 'Sin departamento';
      const existing = acc.find(item => item.name === dept);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: dept, count: 1 });
      }
      return acc;
    }, [] as Array<{name: string, count: number}>);

    setAnalyticsData({
      totalEmployees,
      activeEmployees,
      turnoverRate: 7.6, // Simulado
      averageTenure: 2.3, // Simulado
      departmentDistribution: deptDistribution,
      performanceMetrics: {
        highPerformers: Math.floor(activeEmployees * 0.3),
        needsImprovement: Math.floor(activeEmployees * 0.15),
        averageScore: 8.2
      }
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || dailyUsage >= maxDailyUsage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simular respuesta de IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Gracias por tu consulta sobre "${inputMessage}". Basándome en los datos de RRHH disponibles, puedo ayudarte con análisis de:
        
• Métricas de personal y rendimiento
• Tendencias de asistencia y rotación
• Distribución departamental
• Recomendaciones de mejora

¿Te gustaría que profundice en algún aspecto específico?`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setDailyUsage(prev => prev + 1);

      toast({
        title: "Respuesta generada",
        description: `Consultas restantes hoy: ${maxDailyUsage - dailyUsage - 1}`
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la consulta",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAutomaticReport = async () => {
    try {
      setIsLoading(true);
      
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Reporte generado",
        description: "Se ha generado un análisis completo de RRHH"
      });

      const reportMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📊 **Reporte Automático de RRHH - ${new Date().toLocaleDateString()}**

**Resumen Ejecutivo:**
• Total empleados: ${analyticsData.totalEmployees}
• Empleados activos: ${analyticsData.activeEmployees}
• Tasa de rotación: ${analyticsData.turnoverRate}%

**Distribución por Departamento:**
${analyticsData.departmentDistribution.map(dept => 
  `• ${dept.name}: ${dept.count} empleados`).join('\n')}

**Recomendaciones:**
• Implementar programa de retención en departamentos con alta rotación
• Optimizar procesos de onboarding para nuevos empleados
• Revisar estructura salarial comparativa del mercado`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, reportMessage]);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte automático",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'people-analytics', title: 'People Analytics', icon: BarChart },
    { id: 'asistente-ia', title: 'Asistente IA', icon: Brain },
    { id: 'ia-operativa', title: 'IA Operativa', icon: Zap }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart className="h-8 w-8 text-purple-600" />
            Analytics e Inteligencia Artificial
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis de datos, métricas avanzadas y asistencia inteligente
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'people-analytics' && (
        <div className="space-y-6">
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{analyticsData.totalEmployees}</h3>
                    <p className="text-sm text-gray-600">Total Empleados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{analyticsData.turnoverRate}%</h3>
                    <p className="text-sm text-gray-600">Tasa de Rotación</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{analyticsData.performanceMetrics.averageScore}</h3>
                    <p className="text-sm text-gray-600">Score Promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{analyticsData.averageTenure}</h3>
                    <p className="text-sm text-gray-600">Antigüedad Promedio (años)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.departmentDistribution.map((dept, index) => (
                    <div key={dept.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${(dept.count / analyticsData.totalEmployees) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{dept.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Alto Rendimiento</span>
                    <Badge className="bg-green-100 text-green-800">
                      {analyticsData.performanceMetrics.highPerformers}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Necesita Mejora</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {analyticsData.performanceMetrics.needsImprovement}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Rendimiento Estándar</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {analyticsData.activeEmployees - analyticsData.performanceMetrics.highPerformers - analyticsData.performanceMetrics.needsImprovement}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'asistente-ia' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Asistente IA de RRHH
                  <Badge variant="outline" className="ml-auto">
                    {dailyUsage}/{maxDailyUsage} consultas hoy
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">
                        ¡Hola! Soy tu asistente de RRHH. Puedo ayudarte con análisis de datos, métricas y recomendaciones.
                      </p>
                    </div>
                  )}
                  
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={dailyUsage >= maxDailyUsage ? "Límite diario alcanzado" : "Escribe tu consulta..."}
                    disabled={isLoading || dailyUsage >= maxDailyUsage}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || !inputMessage.trim() || dailyUsage >= maxDailyUsage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultas Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => setInputMessage("¿Cuál es la tasa de rotación actual?")}
                >
                  Tasa de rotación
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => setInputMessage("Analiza la distribución por departamentos")}
                >
                  Distribución departamental
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => setInputMessage("¿Qué departamento necesita más atención?")}
                >
                  Análisis departamental
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={() => setInputMessage("Recomendaciones para mejorar el rendimiento")}
                >
                  Mejoras sugeridas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Límites de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Colaborador</p>
                    <p className="text-gray-600">5 consultas/día</p>
                  </div>
                  <div>
                    <p className="font-medium">Manager</p>
                    <p className="text-gray-600">20 consultas/día</p>
                  </div>
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-gray-600">Ilimitado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'ia-operativa' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>IA Operativa - Automatización Inteligente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-6 w-6 text-yellow-600" />
                    <h3 className="font-semibold">Generación Automática</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Genera evaluaciones, planes de desarrollo y recomendaciones automáticamente
                  </p>
                  <Button 
                    onClick={generateAutomaticReport}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generando...' : 'Generar Reporte Automático'}
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <h3 className="font-semibold">Análisis Predictivo</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Predice tendencias de rotación y necesidades de formación
                  </p>
                  <Button variant="outline" className="w-full">
                    Ejecutar Análisis Predictivo
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold">Optimización de Procesos</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Identifica cuellos de botella y sugiere mejoras en procesos
                  </p>
                  <Button variant="outline" className="w-full">
                    Analizar Procesos
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h3 className="font-semibold">Matching Inteligente</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Relaciona candidatos con posiciones y empleados con proyectos
                  </p>
                  <Button variant="outline" className="w-full">
                    Ejecutar Matching
                  </Button>
                </Card>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Configuración de IA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Frecuencia de Análisis</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option>Diario</option>
                      <option>Semanal</option>
                      <option>Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nivel de Detalle</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option>Básico</option>
                      <option>Intermedio</option>
                      <option>Avanzado</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
