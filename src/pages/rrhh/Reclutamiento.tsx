import React, { useState } from "react";
import { UserPlus, Search, Filter, Eye, MessageSquare, Star, Calendar, MapPin, Briefcase, GraduationCap, Phone, Mail, Download } from "lucide-react";

interface Candidate {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  puesto: string;
  experiencia: string;
  ubicacion: string;
  salarioEsperado: number;
  estado: "Nuevo" | "En Proceso" | "Entrevista" | "Oferta" | "Contratado" | "Descartado";
  puntuacion: number;
  fechaAplicacion: string;
  cv?: string;
  linkedin?: string;
}

interface JobPosition {
  id: string;
  titulo: string;
  departamento: string;
  ubicacion: string;
  tipo: "Tiempo Completo" | "Medio Tiempo" | "Contrato" | "Pasantía";
  estado: "Activa" | "Pausada" | "Cerrada";
  candidatos: number;
  fechaCreacion: string;
}

const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: "1",
    nombre: "Francisco Villaverde",
    email: "francisco.villaverde@convertia.com",
    telefono: "+57 300 123 4567",
    puesto: "Desarrollador Frontend",
    experiencia: "3 años",
    ubicacion: "Bogotá",
    salarioEsperado: 4500000,
    estado: "En Proceso",
    puntuacion: 8.5,
    fechaAplicacion: "2025-05-25",
    cv: "cv_francisco_villaverde.pdf",
    linkedin: "linkedin.com/in/francisco-villaverde"
  },
  {
    id: "2",
    nombre: "Esteban Salamanca",
    email: "esteban.salamanca@convertia.com",
    telefono: "+57 310 987 6543",
    puesto: "Product Manager",
    experiencia: "5 años",
    ubicacion: "Medellín",
    salarioEsperado: 7200000,
    estado: "Entrevista",
    puntuacion: 9.2,
    fechaAplicacion: "2025-05-23",
    cv: "cv_esteban_salamanca.pdf",
    linkedin: "linkedin.com/in/esteban-salamanca"
  },
  {
    id: "3",
    nombre: "Cristian Garcia",
    email: "cristian.garcia@convertia.com",
    telefono: "+57 320 456 7890",
    puesto: "UX Designer",
    experiencia: "2 años",
    ubicacion: "Cali",
    salarioEsperado: 3800000,
    estado: "Nuevo",
    puntuacion: 7.8,
    fechaAplicacion: "2025-05-27",
    cv: "cv_cristian_garcia.pdf"
  }
];

const SAMPLE_POSITIONS: JobPosition[] = [
  {
    id: "1",
    titulo: "Desarrollador Frontend Senior",
    departamento: "Tecnología",
    ubicacion: "Bogotá",
    tipo: "Tiempo Completo",
    estado: "Activa",
    candidatos: 15,
    fechaCreacion: "2025-05-15"
  },
  {
    id: "2",
    titulo: "Product Manager",
    departamento: "Producto",
    ubicacion: "Remoto",
    tipo: "Tiempo Completo",
    estado: "Activa",
    candidatos: 8,
    fechaCreacion: "2025-05-10"
  },
  {
    id: "3",
    titulo: "UX Designer Junior",
    departamento: "Diseño",
    ubicacion: "Medellín",
    tipo: "Tiempo Completo",
    estado: "Pausada",
    candidatos: 12,
    fechaCreacion: "2025-05-05"
  }
];

export default function Reclutamiento() {
  const [activeTab, setActiveTab] = useState<"candidatos" | "vacantes">("candidatos");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Nuevo": return "bg-blue-100 text-blue-800";
      case "En Proceso": return "bg-yellow-100 text-yellow-800";
      case "Entrevista": return "bg-purple-100 text-purple-800";
      case "Oferta": return "bg-orange-100 text-orange-800";
      case "Contratado": return "bg-green-100 text-green-800";
      case "Descartado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPositionStatusColor = (status: string) => {
    switch (status) {
      case "Activa": return "bg-green-100 text-green-800";
      case "Pausada": return "bg-yellow-100 text-yellow-800";
      case "Cerrada": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCandidates = SAMPLE_CANDIDATES.filter(candidate => {
    const matchesSearch = candidate.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.puesto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Todos" || candidate.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="h-7 w-7 text-cyan-600" />
            Reclutamiento y Selección
          </h1>
          <p className="text-gray-600 mt-1">ATS completo para gestión de candidatos y vacantes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" />
            Exportar Reporte
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <UserPlus className="h-4 w-4" />
            Nueva Vacante
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vacantes Activas</p>
              <p className="text-2xl font-bold text-blue-600">
                {SAMPLE_POSITIONS.filter(p => p.estado === "Activa").length}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Candidatos</p>
              <p className="text-2xl font-bold text-green-600">{SAMPLE_CANDIDATES.length}</p>
            </div>
            <UserPlus className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-yellow-600">
                {SAMPLE_CANDIDATES.filter(c => c.estado === "En Proceso").length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contrataciones</p>
              <p className="text-2xl font-bold text-purple-600">
                {SAMPLE_CANDIDATES.filter(c => c.estado === "Contratado").length}
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("candidatos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "candidatos"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Candidatos ({SAMPLE_CANDIDATES.length})
            </button>
            <button
              onClick={() => setActiveTab("vacantes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "vacantes"
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Vacantes ({SAMPLE_POSITIONS.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "candidatos" ? (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar candidatos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Oferta">Oferta</option>
                  <option value="Contratado">Contratado</option>
                  <option value="Descartado">Descartado</option>
                </select>
              </div>

              {/* Candidates List */}
              <div className="grid gap-4">
                {filteredCandidates.map((candidate) => (
                  <div key={candidate.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                          <span className="text-cyan-600 font-semibold text-lg">
                            {candidate.nombre.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.nombre}</h3>
                          <p className="text-sm text-gray-600">{candidate.puesto}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {candidate.ubicacion}
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {candidate.experiencia}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {candidate.puntuacion}/10
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {candidate.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {candidate.telefono}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(candidate.estado)}`}>
                          {candidate.estado}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button className="p-2 text-gray-600 hover:text-cyan-600 hover:bg-white rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-cyan-600 hover:bg-white rounded-lg transition-colors">
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-cyan-600 hover:bg-white rounded-lg transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Job Positions */}
              {SAMPLE_POSITIONS.map((position) => (
                <div key={position.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{position.titulo}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPositionStatusColor(position.estado)}`}>
                          {position.estado}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {position.departamento}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {position.ubicacion}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {position.tipo}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          {position.candidatos} candidatos
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        Creada el {new Date(position.fechaCreacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="bg-cyan-50 text-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors text-sm">
                        Ver Candidatos
                      </button>
                      <button className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
