
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-100/50 blur-3xl"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-blue-100/50 blur-3xl"></div>
        </div>
        
        <div className="hrm-container relative z-10 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Plataforma de Reclutamiento Inteligente
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.1] tracking-tight mb-8">
              Innovación Global,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
                Oportunidades Sin Límites
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              Únete a un equipo donde la inteligencia artificial y el talento humano convergen para construir el futuro.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
              <Button asChild size="lg" className="h-14 px-8 bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-white font-bold text-lg rounded-2xl">
                <Link to="/jobs">Explorar Vacantes</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-cyan-200 hover:text-cyan-700 hover:-translate-y-1 transition-all duration-300 font-bold text-lg rounded-2xl bg-white shadow-sm">
                <Link to="/status-check">Consultar mi Estado</Link>
              </Button>
            </div>
            <div className="mt-10">
              <a href="https://www.convertia.com/es-CO" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-cyan-600 transition-colors">
                Conoce más sobre Convert-IA <ExternalLink className="ml-1.5 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="hrm-container py-24 relative">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-4">¿Por qué elegirnos?</h2>
          <p className="text-lg text-slate-500 font-medium">No somos solo una empresa. Somos un motor de cambio. Buscamos mentes inquietas que quieran dejar huella.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-6 shadow-md group-hover:rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Selección Potenciada por IA</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Nuestra tecnología inteligente analiza tu perfil para identificar la oportunidad perfecta que impulse tu carrera al siguiente nivel.</p>
          </div>
          
          <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-md group-hover:rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4"></path>
                <path d="M12 18v4"></path>
                <path d="M4.93 4.93l2.83 2.83"></path>
                <path d="M16.24 16.24l2.83 2.83"></path>
                <path d="M2 12h4"></path>
                <path d="M18 12h4"></path>
                <path d="M4.93 19.07l2.83-2.83"></path>
                <path d="M16.24 7.76l2.83-2.83"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Experiencia Ágil y Transparente</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Postula fácilmente desde cualquier dispositivo. Un proceso diseñado pensando en ti, sin fricciones ni complicaciones.</p>
          </div>
          
          <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-md group-hover:-rotate-12 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Acompañamiento Continuo</h3>
            <p className="text-slate-500 leading-relaxed font-medium">Recibe feedback constante y orientación personalizada en cada etapa. Tu éxito es nuestra prioridad principal.</p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="relative overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900 via-cyan-800 to-blue-900 z-0"></div>
        {/* Decorative elements for CTA */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full border-[20px] border-white/20"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full border-[20px] border-white/20"></div>
        </div>
        
        <div className="hrm-container py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">¿Listo para dar el siguiente paso en tu carrera profesional?</h2>
            <p className="text-cyan-100/90 text-lg mb-10 max-w-2xl mx-auto font-medium">Cientos de oportunidades esperan por ti. Toma el control de tu futuro laboral, y comienza hoy mismo.</p>
            <Button asChild size="lg" className="h-14 px-10 bg-white text-cyan-800 hover:bg-cyan-50 hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold text-lg rounded-2xl">
              <Link to="/jobs">Ver Todas las Vacantes</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
