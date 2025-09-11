import React, { useState } from "react";
import { GraduationCap, Plus, BookOpen, Users, Clock, Trophy, Play, Download, Star } from "lucide-react";

interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  instructor: string;
  duracion: number; // en horas
  modalidad: "Presencial" | "Virtual" | "Mixto";
  nivel: "Básico" | "Intermedio" | "Avanzado";
  categoria: string;
  fechaInicio: string;
  fechaFin: string;
  inscritos: number;
  capacidadMaxima: number;
  estado: "Próximo" | "En Curso" | "Completado" | "Cancelado";
  calificacion: number;
  precio: number;
  certificacion: boolean;
}

interface PlanFormacion {
  id: string;
  empleado: string;
  departamento: string;
  puesto: string;
  cursosAsignados: number;
  cursosCompletados: number;
  horasFormacion: number;
  progreso: number;
  competenciasObjetivo: string[];
}

const SAMPLE_CURSOS: Curso[] = [
  {
    id: "1",
    titulo: "Liderazgo Estratégico para Managers",
    descripcion: "Desarrolla habilidades de liderazgo avanzado y gestión estratégica de equipos",
    instructor: "Dr. Carlos Mendoza",
    duracion: 40,
    modalidad: "Mixto",
    nivel: "Avanzado",
    categoria: "Liderazgo",
    fechaInicio: "2025-07-01",
    fechaFin: "2025-07-30",
    inscritos: 15,
    capacidadMaxima: 20,
    estado: "Próximo",
    calificacion: 4.8,
    precio: 599,
    certificacion: true
  },
  {
    id: "2",
    titulo: "Excel Avanzado para Análisis de Datos",
    descripcion: "Domina funciones avanzadas de Excel para análisis y reportería empresarial",
    instructor: "Ana Rodríguez",
    duracion: 24,
    modalidad: "Virtual",
    nivel: "Intermedio",
    categoria: "Tecnología",
    fechaInicio: "2025-06-15",
    fechaFin: "2025-07-15",
    inscritos: 28,
    capacidadMaxima: 30,
    estado: "En Curso",
    calificacion: 4.6,
    precio: 299,
    certificacion: true
  },
  {
    id: "3",
    titulo: "Comunicación Efectiva y Presentaciones",
    descripcion: "Mejora tus habilidades de comunicación oral y diseño de presentaciones impactantes",
    instructor: "Luis García",
    duracion: 16,
    modalidad: "Presencial",
    nivel: "Básico",
    categoria: "Soft Skills",
    fechaInicio: "2025-05-01",
    fechaFin: "2025-05-15",
    inscritos: 25,
    capacidadMaxima: 25,
    estado: "Completado",
    calificacion: 4.9,
    precio: 199,
    certificacion: false
  }
];

const SAMPLE_PLANES: PlanFormacion[] = [
  {
    id: "1",
    empleado: "Cristian Garcia",
    departamento: "Marketing",
    puesto: "Marketing Manager",
    cursosAsignados: 4,
    cursosCompletados: 3,
    horasFormacion: 72,
    progreso: 75,
    competenciasObjetivo: ["Liderazgo", "Marketing Digital", "Análisis de Datos"]
  },
  {
    id: "2",
    empleado: "Jhon lozano",
    departamento: "Tecnología",
    puesto: "Desarrollador Senior",
    cursosAsignados: 3,
    cursosCompletados: 1,
    horasFormacion: 24,
    progreso: 33,
    competenciasObjetivo: ["Cloud Computing", "DevOps", "Arquitectura Software"]
  }
];

export default function Formacion() {
  const [activeTab, setActiveTab] = useState<"catalogo" | "mis-cursos" | "planes" | "reportes">("catalogo");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterLevel, setFilterLevel] = useState("Todos");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "bg-green-100 text-green-800";
      case "En Curso": return "bg-blue-100 text-blue-800";
      case "Próximo": return "bg-purple-100 text-purple-800";
      case "Cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Básico": return "bg-green-50 text-green-700 border-green-200";
      case "Intermedio": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Avanzado": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case "Virtual": return "🌐";
      case "Presencial": return "🏢";
      case "Mixto": return "🔄";
      default: return "📚";
    }
  };

  const filteredCursos = SAMPLE_CURSOS.filter(curso => {
    const matchesCategory = filterCategory === "Todas" || curso.categoria === filterCategory;
    const matchesLevel = filterLevel === "Todos" || curso.nivel === filterLevel;
    return matchesCategory && matchesLevel;
  });

  const categorias = [...new Set(SAMPLE_CURSOS.map(curso => curso.categoria))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-cyan-600" />
            Formación y Desarrollo
          </h1>
          <p className="text-gray-600 mt-1">Gestiona programas de capacitación, desarrollo de competencias y planes de formación</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <BookOpen className="h-4 w-4" />
            Catálogo Externo
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" />
            Crear Curso
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cursos Disponibles</p>
              <p className="text-2xl font-bold text-blue-600">{SAMPLE_CURSOS.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Empleados en Formación</p>
              <p className="text-2xl font-bold text-green-600">
                {SAMPLE_CURSOS.reduce((acc, curso) => acc + curso.inscritos, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas de Formación</p>
              <p className="text-2xl font-bold text-purple-600">
                {SAMPLE_PLANES.reduce((acc, plan) => acc + plan.horasFormacion, 0)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Certificaciones</p>
              <p className="text-2xl font-bold text-orange-600">
                {SAMPLE_CURSOS.filter(curso => curso.certificacion).length}
              </p>
            </div>
            <Trophy className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "catalogo"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Catálogo de Cursos
            </button>
            <button
              onClick={() => setActiveTab("mis-cursos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mis-cursos"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Mis Cursos
            </button>
            <button
              onClick={() => setActiveTab("planes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "planes"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Planes de Formación
            </button>
            <button
              onClick={() => setActiveTab("reportes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reportes"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reportes
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "catalogo" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="Todas">Todas las categorías</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="Todos">Todos los niveles</option>
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCursos.map((curso) => (
                  <div key={curso.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(curso.estado)}`}>
                            {curso.estado}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">{curso.titulo}</h3>
                        </div>
                        <span className="text-2xl">{getModalityIcon(curso.modalidad)}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">{curso.descripcion}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Instructor:</span>
                          <span className="font-medium">{curso.instructor}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Duración:</span>
                          <span className="font-medium">{curso.duracion}h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Capacidad:</span>
                          <span className="font-medium">{curso.inscritos}/{curso.capacidadMaxima}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs border rounded ${getLevelColor(curso.nivel)}`}>
                          {curso.nivel}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {curso.categoria}
                        </span>
                        {curso.certificacion && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Certificación
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{curso.calificacion}</span>
                        </div>
                        <span className="text-lg font-bold text-cyan-600">${curso.precio}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                          Inscribirse
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "planes" && (
            <div className="space-y-6">
              {SAMPLE_PLANES.map((plan) => (
                <div key={plan.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.empleado}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{plan.departamento}</span>
                        <span>{plan.puesto}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-600">{plan.progreso}%</div>
                      <div className="text-sm text-gray-500">Progreso</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Cursos Asignados</div>
                      <div className="text-lg font-semibold text-gray-900">{plan.cursosAsignados}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Cursos Completados</div>
                      <div className="text-lg font-semibold text-green-600">{plan.cursosCompletados}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="text-xs text-gray-600">Horas de Formación</div>
                      <div className="text-lg font-semibold text-blue-600">{plan.horasFormacion}h</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Competencias Objetivo:</h4>
                    <div className="flex flex-wrap gap-2">
                      {plan.competenciasObjetivo.map((competencia, index) => (
                        <span key={index} className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {competencia}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${plan.progreso}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="bg-cyan-50 text-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors text-sm">
                      Ver Plan Detallado
                    </button>
                    <button className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm">
                      Asignar Cursos
                    </button>
                    <button className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === "mis-cursos" || activeTab === "reportes") && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "mis-cursos" ? "Mis Cursos" : "Reportes de Formación"}
              </h3>
              <p className="text-gray-600">
                {activeTab === "mis-cursos" 
                  ? "Aquí aparecerán los cursos en los que estás inscrito"
                  : "Genera reportes detallados de formación y desarrollo"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
