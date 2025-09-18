
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { RRHHAuthProvider } from "@/contexts/RRHHAuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import ModuleProtectedRoute from "@/components/auth/ModuleProtectedRoute";
import Unauthorized from "./pages/admin/Unauthorized";

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Public Pages
import Home from "./pages/public/Home";
import JobsList from "./pages/public/JobsList";
import JobDetail from "./pages/public/JobDetail";
import ThankYou from "./pages/public/ThankYou";
import ApplicationForm from "@/components/candidates/ApplicationForm";
import TrainingChat from "./pages/public/TrainingChat";

// Admin Pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Jobs from "./pages/admin/Jobs";
import JobForm from "./pages/admin/JobForm";
import AdminJobDetail from "./pages/admin/JobDetail";
import Campaigns from "./pages/admin/Campaigns";
import Candidates from "./pages/admin/Candidates";
import CandidateDetail from "./pages/admin/CandidateDetail";
import ChatbotManager from "./pages/admin/ChatbotManager";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import TrainingCodes from "./pages/admin/TrainingCodes";
import TrainingSessions from "./pages/admin/TrainingSessions";
import TrainingHistory from "./pages/admin/TrainingHistory";
import SessionDetail from './pages/admin/SessionDetail';
import WhatsApp from "./pages/admin/WhatsApp";
import Users from "./pages/admin/Users";

// RRHH Pages
import RRHHLogin from "./pages/rrhh/Login";
import RRHHLayout from "./pages/rrhh/Layout";
import ProtectedRRHHRoute from "./pages/rrhh/ProtectedRRHHRoute";
import RRHHDashboard from "./pages/rrhh/Dashboard";
import Organizacion from "./pages/rrhh/Organizacion";
import Personal from "./pages/rrhh/Personal";
import Reclutamiento from "./pages/rrhh/Reclutamiento";
import Ausencias from "./pages/rrhh/Ausencias";
import ControlJornada from "./pages/rrhh/ControlJornada";
import Calendario from "./pages/rrhh/Calendario";
import Desempeno from "./pages/rrhh/Desempeno";
import Objetivos from "./pages/rrhh/Objetivos";
import Formacion from "./pages/rrhh/Formacion";
import Analitica from "./pages/rrhh/Analitica";
import Nomina from "./pages/rrhh/Nomina";
import Documentos from "./pages/rrhh/Documentos";
import Integraciones from "./pages/rrhh/Integraciones";
import Inbox from "./pages/rrhh/Inbox";
import Buscar from "./pages/rrhh/Buscar";
import Perfil from "./pages/rrhh/Perfil";
import Ayuda from "./pages/rrhh/Ayuda";
import Configuracion from "./pages/rrhh/Configuracion";

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Componente para proteger rutas de administrador
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hrm-dark-cyan"></div>
      </div>;
    }

    if (!session) {
      const path = window.location.pathname;
      if (!path.startsWith("/admin/login")) {
        return <Navigate to="/admin/login" replace />;
      }
    }
    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="jobs/:jobId" element={<JobDetail />} />
                <Route path="postularse/:jobId" element={<ApplicationForm />} />
                <Route path="gracias" element={<ThankYou />} />
                <Route path="entrenamiento" element={<TrainingChat />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/unauthorized" element={
                <ProtectedRoute>
                  <Unauthorized />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />

                {/* Dashboard - acceso básico para todos */}
                <Route path="dashboard" element={
                  <ModuleProtectedRoute requiredModule="dashboard">
                    <Dashboard />
                  </ModuleProtectedRoute>
                } />

                {/* Users Management */}
                <Route path="users" element={
                  <ModuleProtectedRoute requiredModule="users">
                    <Users />
                  </ModuleProtectedRoute>
                } />

                {/* Jobs Management */}
                <Route path="jobs" element={
                  <ModuleProtectedRoute requiredModule="jobs">
                    <Jobs />
                  </ModuleProtectedRoute>
                } />
                <Route path="jobs/new" element={
                  <ModuleProtectedRoute requiredModule="jobs">
                    <JobForm />
                  </ModuleProtectedRoute>
                } />
                <Route path="jobs/:id" element={
                  <ModuleProtectedRoute requiredModule="jobs">
                    <AdminJobDetail />
                  </ModuleProtectedRoute>
                } />
                <Route path="jobs/:id/edit" element={
                  <ModuleProtectedRoute requiredModule="jobs">
                    <JobForm />
                  </ModuleProtectedRoute>
                } />

                {/* Campaigns */}
                <Route path="campaigns" element={
                  <ModuleProtectedRoute requiredModule="campaigns">
                    <Campaigns />
                  </ModuleProtectedRoute>
                } />

                {/* Candidates */}
                <Route path="candidates" element={
                  <ModuleProtectedRoute requiredModule="candidates">
                    <Candidates />
                  </ModuleProtectedRoute>
                } />
                <Route path="candidates/:id" element={
                  <ModuleProtectedRoute requiredModule="candidates">
                    <CandidateDetail />
                  </ModuleProtectedRoute>
                } />

                {/* Chatbot */}
                <Route path="chatbot" element={
                  <ModuleProtectedRoute requiredModule="chatbot">
                    <ChatbotManager />
                  </ModuleProtectedRoute>
                } />

                {/* WhatsApp */}
                <Route path="whatsapp" element={
                  <ModuleProtectedRoute requiredModule="whatsapp">
                    <WhatsApp />
                  </ModuleProtectedRoute>
                } />

                {/* Training */}
                <Route path="training-codes" element={
                  <ModuleProtectedRoute requiredModule="training">
                    <TrainingCodes />
                  </ModuleProtectedRoute>
                } />
                <Route path="training-sessions" element={
                  <ModuleProtectedRoute requiredModule="training">
                    <TrainingSessions />
                  </ModuleProtectedRoute>
                } />
                <Route path="training-history" element={
                  <ModuleProtectedRoute requiredModule="training">
                    <TrainingHistory />
                  </ModuleProtectedRoute>
                } />
                <Route path="training-sessions/:sessionId" element={
                  <ModuleProtectedRoute requiredModule="training">
                    <SessionDetail />
                  </ModuleProtectedRoute>
                } />

                {/* Reports */}
                <Route path="reports" element={
                  <ModuleProtectedRoute requiredModule="reports">
                    <Reports />
                  </ModuleProtectedRoute>
                } />

                {/* Settings */}
                <Route path="settings" element={
                  <ModuleProtectedRoute requiredModule="settings">
                    <Settings />
                  </ModuleProtectedRoute>
                } />
              </Route>
              
              {/* RRHH Routes */}
              <Route path="/rrhh/login" element={<RRHHAuthProvider><RRHHLogin /></RRHHAuthProvider>} />
              <Route path="/rrhh" element={
                <RRHHAuthProvider>
                  <ProtectedRRHHRoute>
                    <RRHHLayout>
                      <Outlet />
                    </RRHHLayout>
                  </ProtectedRRHHRoute>
                </RRHHAuthProvider>
              }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<RRHHDashboard />} />
                <Route path="organizacion" element={<Organizacion />} />
                <Route path="personal" element={<Personal />} />
                <Route path="reclutamiento" element={<Reclutamiento />} />
                <Route path="ausencias" element={<Ausencias />} />
                <Route path="control-jornada" element={<ControlJornada />} />
                <Route path="calendario" element={<Calendario />} />
                <Route path="desempeno" element={<Desempeno />} />
                <Route path="objetivos" element={<Objetivos />} />
                <Route path="formacion" element={<Formacion />} />
                <Route path="competencias" element={<Desempeno />} />
                <Route path="analitica" element={<Analitica />} />
                <Route path="reportes" element={<Analitica />} />
                <Route path="asistente-ia" element={<RRHHDashboard />} />
                <Route path="nomina" element={<Nomina />} />
                <Route path="beneficios" element={<Nomina />} />
                <Route path="compensacion" element={<Nomina />} />
                <Route path="documentos" element={<Documentos />} />
                <Route path="cumplimiento" element={<Documentos />} />
                <Route path="clima-laboral" element={<Analitica />} />
                <Route path="encuestas" element={<Analitica />} />
                <Route path="bienestar" element={<Analitica />} />
                <Route path="integraciones" element={<Integraciones />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="buscar" element={<Buscar />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="ayuda" element={<Ayuda />} />
                <Route path="configuracion" element={<Configuracion />} />
              </Route>
              
              {/* Redirects */}
              <Route path="/dashboard" element={<Navigate to="/rrhh" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
