
import React, { useState } from "react";
import { Target, Plus, Calendar, TrendingUp, Clock, Award, Users, Filter, Search } from "lucide-react";

interface Objetivo {
  id: string;
  titulo: string;
  descripcion: string;
  empleado: string;
  supervisor: string;
  departamento: string;
  fechaInicio: string;
  fechaLimite: string;
  progreso: number;
  estado: "Activo" | "Completado" | "Vencido" | "Pausado";
  prioridad: "Alta" | "Media" | "Baja";
  categoria: "Individual" | "Equipo" | "Organizacional";
  kpis: {
    nombre: string;
    valor: number;
    meta: number;
    unidad: string;
  }[];
}

const SAMPLE_OBJETIVOS: Objetivo[] = [
  {
    id: "1",
    titulo: "Aumentar Conversiones del Equipo",
    descripcion: "Incrementar la tasa de conversión del equipo de ventas en un 15% durante el Q2",
    empleado: "Ana María García",
    supervisor: "Carlos Rodríguez",
    departamento: "Ventas",
    fechaInicio: "2025-04-01",
    fechaLimite: "2025-06-30",
    progreso: 85,
    estado: "Activo",
    prioridad: "Alta",
    categoria: "Individual",
    kpis: [
      { nombre: "Tasa Conversión", valor: 12.3, meta: 15, unidad: "%" },
      { nombre: "Ventas Cerradas", valor: 28, meta: 35, unidad: "unidades" }
    ]
  },
  {
    id: "2",
    titulo: "Implementar Sistema CRM",
    descripcion: "Migrar completamente al nuevo sistema CRM y capacitar al equipo",
    empleado: "Juan Carlos Pérez",
    supervisor: "María Rodríguez",
    departamento: "Tecnología",
    fechaInicio: "2025-03-15",
    fechaLimite: "2025-07-15",
    progreso: 60,
    estado: "Activo",
    prioridad: "Alta",
    categoria: "Equipo",
    kpis: [
      { nombre: "Migración Datos", valor: 75, meta: 100, unidad: "%" },
      { nombre: "Usuarios Capacitados", valor: 18, meta: 30, unidad: "personas" }
    ]
  },
  {
    id: "3",
    titulo: "Certificación en Liderazgo",
    descripcion: "Completar programa de certificación en liderazgo estratégico",
    empleado: "Laura Martínez",
    supervisor: "Ana Directora",
    departamento: "Producto",
    fechaInicio: "2025-01-01",
    fechaLimite: "2025-05-30",
    progreso: 100,
    estado: "Completado",
    prioridad: "Media",
    categoria: "Individual",
    kpis: [
      { nombre: "Módulos Completados", valor: 8, meta: 8, unidad: "módulos" },
      { nombre: "Calificación", valor: 92, meta: 85, unidad: "puntos" }
    ]
  }
];

export default function Objetivos() {
  const [activeTab, setActiveTab] = useState<"mis-objetivos" | "equipo" | "organizacion">("mis-objetivos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "bg-green-100 text-green-800";
      case "Activo": return "bg-blue-100 text-blue-800";
      case "Vencido": return "bg-red-100 text-red-800";
      case "Pausado": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "bg-red-50 text-red-700 border-red-200";
      case "Media": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Baja": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredObjetivos = SAMPLE_OBJETIVOS.filter(objetivo => {
    const matchesStatus = filterStatus === "Todos" || objetivo.estado === filterStatus;
    const matchesSearch = objetivo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         objetivo.empleado.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="h-7 w-7 text-cyan-600" />
            Gestión de Objetivos
          </h1>
          <p className="text-gray-600 mt-1">Define, rastrea y evalúa objetivos individuales, de equipo y organizacionales</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Objetivo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Objetivos Activos</p>
              <p className="text-2xl font-bold text-blue-600">
                {SAMPLE_OBJETIVOS.filter(o => o.estado === "Activo").length}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio Progreso</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(SAMPLE_OBJETIVOS.reduce((acc, obj) => acc + obj.progreso, 0) / SAMPLE_OBJETIVOS.length)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-purple-600">
                {SAMPLE_OBJETIVOS.filter(o => o.estado === "Completado").length}
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximos Vencimientos</p>
              <p className="text-2xl font-bold text-orange-600">
                {SAMPLE_OBJETIVOS.filter(o => {
                  const limite = new Date(o.fechaLimite);
                  const hoy = new Date();
                  const diffDays = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
                  return diffDays <= 30 && diffDays > 0;
                }).length}
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
              onClick={() => setActiveTab("mis-objetivos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mis-objetivos"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Mis Objetivos
            </button>
            <button
              onClick={() => setActiveTab("equipo")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "equipo"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Objetivos de Equipo
            </button>
            <button
              onClick={() => setActiveTab("organizacion")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "organizacion"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Objetivos Organizacionales
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar objetivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Completado">Completados</option>
                <option value="Vencido">Vencidos</option>
                <option value="Pausado">Pausados</option>
              </select>
            </div>
          </div>

          {/* Objectives List */}
          <div className="space-y-4">
            {filteredObjetivos.map((objetivo) => (
              <div key={objetivo.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{objetivo.titulo}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(objetivo.estado)}`}>
                        {objetivo.estado}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(objetivo.prioridad)}`}>
                        {objetivo.prioridad}
                      </span>
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                        {objetivo.categoria}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{objetivo.descripcion}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Empleado: {objetivo.empleado}</span>
                      <span>Supervisor: {objetivo.supervisor}</span>
                      <span>Límite: {new Date(objetivo.fechaLimite).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-gray-900">{objetivo.progreso}%</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(objetivo.progreso)}`}
                        style={{ width: `${objetivo.progreso}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                {objetivo.kpis.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Indicadores Clave (KPIs):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {objetivo.kpis.map((kpi, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border">
                          <div className="text-xs text-gray-600">{kpi.nombre}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {kpi.valor} {kpi.unidad}
                            </span>
                            <span className="text-xs text-gray-500">
                              Meta: {kpi.meta} {kpi.unidad}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div 
                              className={`h-1 rounded-full ${
                                (kpi.valor / kpi.meta) >= 1 ? 'bg-green-500' :
                                (kpi.valor / kpi.meta) >= 0.8 ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min((kpi.valor / kpi.meta) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="bg-cyan-50 text-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors text-sm">
                    Ver Detalle
                  </button>
                  {objetivo.estado === "Activo" && (
                    <button className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm">
                      Actualizar Progreso
                    </button>
                  )}
                  <button className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
