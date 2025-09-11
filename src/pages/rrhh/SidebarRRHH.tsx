import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, Users, Calendar, Clock, Inbox, Search, FileText, BarChart2, Settings,
  HelpCircle, User, Briefcase, FilePlus2, Building2, Check, Circle,
  UserPlus, Trophy, GraduationCap, DollarSign, MapPin, Target,
  MessageSquare, Heart, Zap, UserCheck, ClipboardList, TrendingUp,
  FileCheck, Award, Smile, Shield, LogOut, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp
} from "lucide-react";
import { useRRHHAuth } from "@/contexts/RRHHAuthContext";
import RoleBadge from "@/components/ui/RoleBadge";
import { ScrollArea } from "@/components/ui/scroll-area"; // Importar ScrollArea

const MENU_SECTIONS = [
  {
    title: "Principal",
    icon: Home,
    links: [
      { to: "/rrhh/dashboard", label: "Inicio", icon: Home, roles: [] },
      { to: "/rrhh/inbox", label: "Bandeja de Entrada", icon: Inbox, roles: [] },
      { to: "/rrhh/buscar", label: "Buscar Global", icon: Search, roles: [] }
    ]
  },
  {
    title: "Organización",
    icon: Building2,
    links: [
      { to: "/rrhh/organizacion", label: "Organigrama", icon: Building2, roles: [] },
      { to: "/rrhh/personal", label: "Expedientes", icon: Users, roles: ["admin", "rrhh", "manager"] },
      { to: "/rrhh/reclutamiento", label: "Reclutamiento", icon: UserPlus, roles: ["admin", "rrhh"] }
    ]
  },
  {
    title: "Tiempo y Asistencia",
    icon: Clock,
    links: [
      { to: "/rrhh/control-jornada", label: "Control de Jornada", icon: Clock, roles: [] },
      { to: "/rrhh/ausencias", label: "Ausencias", icon: FileText, roles: [] },
      { to: "/rrhh/calendario", label: "Calendario", icon: Calendar, roles: [] }
    ]
  },
  {
    title: "Desempeño y Desarrollo",
    icon: Trophy,
    links: [
      { to: "/rrhh/desempeno", label: "Evaluaciones", icon: Trophy, roles: ["manager", "admin", "rrhh"] },
      { to: "/rrhh/objetivos", label: "Objetivos", icon: Target, roles: [] },
      { to: "/rrhh/formacion", label: "Formación", icon: GraduationCap, roles: ["admin", "rrhh", "manager"] },
      { to: "/rrhh/competencias", label: "Competencias", icon: Award, roles: ["admin", "rrhh", "manager"] }
    ]
  },
  {
    title: "Compensación",
    icon: DollarSign,
    links: [
      { to: "/rrhh/nomina", label: "Nómina", icon: DollarSign, roles: ["admin", "rrhh"] },
      { to: "/rrhh/beneficios", label: "Beneficios", icon: Heart, roles: ["admin", "rrhh"] },
      { to: "/rrhh/compensacion", label: "Compensación", icon: Briefcase, roles: ["admin", "rrhh", "manager"] }
    ]
  },
  {
    title: "Documentos y Cumplimiento",
    icon: FilePlus2,
    links: [
      { to: "/rrhh/documentos", label: "Documentos", icon: FilePlus2, roles: [] },
      { to: "/rrhh/firma-digital", label: "Firma Digital", icon: FileCheck, roles: ["admin", "rrhh"] },
      { to: "/rrhh/cumplimiento", label: "Cumplimiento", icon: Shield, roles: ["admin", "rrhh"] }
    ]
  },
  {
    title: "Cultura y Bienestar",
    icon: Heart,
    links: [
      { to: "/rrhh/clima-laboral", label: "Clima Laboral", icon: Smile, roles: ["admin", "rrhh", "manager"] },
      { to: "/rrhh/encuestas", label: "Encuestas", icon: MessageSquare, roles: ["admin", "rrhh"] },
      { to: "/rrhh/bienestar", label: "Bienestar", icon: Heart, roles: [] }
    ]
  },
  {
    title: "Analytics e IA",
    icon: BarChart2,
    links: [
      { to: "/rrhh/analitica", label: "People Analytics", icon: BarChart2, roles: ["admin", "manager"] },
      { to: "/rrhh/reportes", label: "Reportes", icon: TrendingUp, roles: ["admin", "rrhh", "manager"] },
      { to: "/rrhh/asistente-ia", label: "Asistente IA", icon: Zap, roles: [] }
    ]
  },
  {
    title: "Sistema",
    icon: Settings,
    links: [
      { to: "/rrhh/integraciones", label: "Integraciones", icon: Circle, roles: ["admin"] },
      { to: "/rrhh/configuracion", label: "Configuración", icon: Settings, roles: ["admin"] },
      { to: "/rrhh/perfil", label: "Mi Perfil", icon: User, roles: [] },
      { to: "/rrhh/ayuda", label: "Ayuda", icon: HelpCircle, roles: [] }
    ]
  }
];

export default function SidebarRRHH() {
  const { user, role, logout } = useRRHHAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate("/rrhh/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} min-h-screen bg-white shadow-lg flex flex-col fixed left-0 top-0 z-10 transition-all duration-300 border-r border-gray-200`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-slate-100 px-3 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <img
              src="/placeholder.svg"
              alt="Convert-IA Logo"
              className="h-6 w-6"
            />
            <span className="font-bold text-lg text-slate-800">Convert-IA RRHH</span>
          </div>
        )}
        {isCollapsed && (
          <img
            src="/placeholder.svg"
            alt="Convert-IA Logo"
            className="h-6 w-6 mx-auto"
          />
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
          title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation with ScrollArea */}
      <ScrollArea className="flex-1 h-[calc(100vh-128px)]"> {/* Ajustar altura para header y footer */}
        <nav className="py-4 px-2">
          {MENU_SECTIONS.map((section) => {
            const visibleLinks = section.links.filter(link =>
              !link.roles.length || link.roles.includes(role!)
            );

            if (visibleLinks.length === 0) return null;

            const isSectionCollapsed = collapsedSections.includes(section.title);

            return (
              <div key={section.title} className="mb-4">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wide px-3 py-2 hover:text-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className="w-3 h-3" />
                      <span>{section.title}</span>
                    </div>
                    {isSectionCollapsed ?
                      <ChevronDown className="w-3 h-3" /> :
                      <ChevronUp className="w-3 h-3" />
                    }
                  </button>
                )}

                {(!isSectionCollapsed || isCollapsed) && (
                  <ul className="space-y-1">
                    {visibleLinks.map(({ to, label, icon: Icon }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all duration-200 ${
                              isActive
                                ? "bg-slate-800 text-white font-semibold shadow-sm"
                                : "text-slate-700 hover:text-slate-900"
                            }`
                          }
                          title={isCollapsed ? label : ""}
                          end
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {!isCollapsed && <span className="truncate text-sm">{label}</span>}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Info and Logout */}
      <div className="p-4 border-t bg-slate-50 flex-shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.avatar || user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate text-sm">{user?.name || "Usuario"}</div>
                <div className="text-xs text-slate-500 truncate">{user?.position}</div>
                <RoleBadge role={role || "empleado"} />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white text-sm font-semibold mx-auto">
              {user?.avatar || user?.name?.charAt(0) || "U"}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isCollapsed && (
          <div className="text-xs text-slate-500 text-center mt-2">
            Plataforma RR. HH. Convert-IA
          </div>
        )}
      </div>
    </aside>
  );
}
