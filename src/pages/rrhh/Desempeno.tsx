import React, { useState } from "react";
import { Trophy, Star, Target, TrendingUp, Calendar, Users, Award, MessageSquare, FileText, Plus } from "lucide-react";

interface Evaluation {
  id: string;
  empleado: string;
  evaluador: string;
  periodo: string;
  tipo: "Anual" | "Semestral" | "Trimestral" | "360°";
  estado: "Pendiente" | "En Progreso" | "Completada" | "Vencida";
  puntuacionGeneral: number;
  competencias: {
    nombre: string;
    puntuacion: number;
  }[];
  objetivos: {
    descripcion: string;
    cumplimiento: number;
  }[];
  fechaVencimiento: string;
  fechaCreacion: string;
}

interface PerformanceMetric {
  empleado: string;
  puntuacionPromedio: number;
  objetivosCumplidos: number;
  totalObjetivos: number;
  tendencia: "up" | "down" | "stable";
  departamento: string;
}

const SAMPLE_EVALUATIONS: Evaluation[] = [
  {
    id: "1",
    empleado: "Cristian Garcia",
    evaluador: "Jose Luis Pascual",
    periodo: "Q2 2025",
    tipo: "Trimestral",
    estado: "Completada",
    puntuacionGeneral: 4.7,
    competencias: [
      { nombre: "Trabajo en Equipo", puntuacion: 4.8 },
      { nombre: "Comunicación", puntuacion: 4.5 },
      { nombre: "Liderazgo", puntuacion: 4.9 },
      { nombre: "Innovación", puntuacion: 4.6 }
    ],
    objetivos: [
      { descripcion: "Aumentar conversiones en 15%", cumplimiento: 120 },
      { descripcion: "Completar certificación", cumplimiento: 100 },
      { descripcion: "Liderar proyecto equipo", cumplimiento: 85 }
    ],
    fechaVencimiento: "2025-06-30",
    fechaCreacion: "2025-04-01"
  },
  {
    id: "2",
    empleado: "Jhon lozano",
    evaluador: "Juan Manjarrez",
    periodo: "Q2 2025",
    tipo: "360°",
    estado: "En Progreso",
    puntuacionGeneral: 0,
    competencias: [],
    objetivos: [
      { descripcion: "Optimizar procesos TI", cumplimiento: 60 },
      { descripcion: "Formar equipo junior", cumplimiento: 80 }
    ],
    fechaVencimiento: "2025-06-15",
    fechaCreacion: "2025-05-01"
  }
];

const SAMPLE_METRICS: PerformanceMetric[] = [
  {
    empleado: "Cristian Garcia",
    puntuacionPromedio: 4.7,
    objetivosCumplidos: 3,
    totalObjetivos: 3,
    tendencia: "up",
    departamento: "Marketing"
  },
  {
    empleado: "Jhon lozano",
    puntuacionPromedio: 4.2,
    objetivosCumplidos: 5,
    totalObjetivos: 6,
    tendencia: "stable",
    departamento: "Tecnología"
  },
  {
    empleado: "Alejando Cano",
    puntuacionPromedio: 4.9,
    objetivosCumplidos: 8,
    totalObjetivos: 8,
    tendencia: "up",
    departamento: "Producto"
  }
];

export default function Desempeno() {
  const [activeTab, setActiveTab] = useState<"evaluaciones" | "metricas" | "objetivos">("evaluaciones");
  const [filterStatus, setFilterStatus] = useState("Todas");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completada": return "bg-green-100 text-green-800";
      case "En Progreso": return "bg-blue-100 text-blue-800";
      case "Pendiente": return "bg-yellow-100 text-yellow-800";
      case "Vencida": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500 rotate-90" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 4.5) return "text-green-600 bg-green-50";
    if (score >= 3.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const filteredEvaluations = SAMPLE_EVALUATIONS.filter(evaluation => 
    filterStatus === "Todas" || evaluation.estado === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="h-7 w-7 text-cyan-600" />
            Evaluaciones de Desempeño
          </h1>
          <p className="text-gray-600 mt-1">Gestión integral de evaluaciones, objetivos y desarrollo del talento</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <FileText className="h-4 w-4" />
            Reporte General
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />
            Nueva Evaluación
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Evaluaciones</p>
              <p className="text-2xl font-bold text-blue-600">{SAMPLE_EVALUATIONS.length}</p>
            </div>
            <Trophy className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Puntuación Promedio</p>
              <p className="text-2xl font-bold text-green-600">4.6/5</p>
            </div>
            <Star className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Objetivos Cumplidos</p>
              <p className="text-2xl font-bold text-purple-600">89%</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">
                {SAMPLE_EVALUATIONS.filter(e => e.estado === "Pendiente").length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("evaluaciones")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "evaluaciones"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Evaluaciones
            </button>
            <button
              onClick={() => setActiveTab("metricas")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "metricas"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Métricas de Desempeño
            </button>
            <button
              onClick={() => setActiveTab("objetivos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "objetivos"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Gestión de Objetivos
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "evaluaciones" && (
            <div className="space-y-6">
              {/* Filter */}
              <div className="flex items-center gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="Todas">Todas las evaluaciones</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Completada">Completadas</option>
                  <option value="Vencida">Vencidas</option>
                </select>
              </div>

              {/* Evaluations List */}
              <div className="space-y-4">
                {filteredEvaluations.map((evaluation) => (
                  <div key={evaluation.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{evaluation.empleado}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(evaluation.estado)}`}>
                            {evaluation.estado}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {evaluation.tipo}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Evaluador: {evaluation.evaluador}</span>
                          <span>Período: {evaluation.periodo}</span>
                          <span>Vence: {new Date(evaluation.fechaVencimiento).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      
                      {evaluation.puntuacionGeneral > 0 && (
                        <div className={`px-3 py-2 rounded-lg ${getPerformanceColor(evaluation.puntuacionGeneral)}`}>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            <span className="font-semibold">{evaluation.puntuacionGeneral}/5</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {evaluation.competencias.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Competencias Evaluadas:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {evaluation.competencias.map((comp, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg">
                              <div className="text-xs text-gray-600">{comp.nombre}</div>
                              <div className="text-sm font-semibold text-gray-900">{comp.puntuacion}/5</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {evaluation.objetivos.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Objetivos:</h4>
                        <div className="space-y-2">
                          {evaluation.objetivos.map((obj, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg flex items-center justify-between">
                              <span className="text-sm text-gray-700">{obj.descripcion}</span>
                              <span className={`text-sm font-semibold ${
                                obj.cumplimiento >= 100 ? 'text-green-600' :
                                obj.cumplimiento >= 80 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {obj.cumplimiento}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button className="bg-cyan-50 text-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors text-sm">
                        Ver Detalle
                      </button>
                      {evaluation.estado !== "Completada" && (
                        <button className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm">
                          Continuar Evaluación
                        </button>
                      )}
                      <button className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "metricas" && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {SAMPLE_METRICS.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{metric.empleado}</h3>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {metric.departamento}
                          </span>
                          {getTrendIcon(metric.tendencia)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-gray-600">Puntuación Promedio</div>
                            <div className={`text-lg font-semibold ${getPerformanceColor(metric.puntuacionPromedio).split(' ')[0]}`}>
                              {metric.puntuacionPromedio}/5
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-gray-600">Objetivos Cumplidos</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {metric.objetivosCumplidos}/{metric.totalObjetivos}
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-gray-600">% Cumplimiento</div>
                            <div className={`text-lg font-semibold ${
                              (metric.objetivosCumplidos / metric.totalObjetivos) * 100 >= 90 ? 'text-green-600' :
                              (metric.objetivosCumplidos / metric.totalObjetivos) * 100 >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {Math.round((metric.objetivosCumplidos / metric.totalObjetivos) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "objetivos" && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Objetivos</h3>
                <p className="text-gray-600 mb-6">
                  Define y gestiona objetivos individuales y de equipo con seguimiento en tiempo real.
                </p>
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors">
                  <Plus className="h-4 w-4" />
                  Crear Nuevo Objetivo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
