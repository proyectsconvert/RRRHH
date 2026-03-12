
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Chatbot from '../chatbot/Chatbot';
import { ConvertIALogo } from '../../assets/convert-ia-logo';

const PublicLayout = () => {
  const location = useLocation();
  const isCandidateDocumentsPage = location.pathname.startsWith('/candidate-documents');
  return <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-cyan-100 selection:text-cyan-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 lg:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <ConvertIALogo size={10} textColor="text-cyan-800" className="transition-transform group-hover:scale-105" />
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a 
                  href="https://www.convertia.com/es-CO" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-hrm-dark-cyan flex items-center gap-1"
                >
                  Sitio Web
                </a>
              </li>
              {/**
              <li>
                <Link to="/entrenamiento" className="text-gray-600 hover:text-hrm-dark-cyan">
                  Chat Entrenamiento
                </Link>
              </li>*/}
              {!isCandidateDocumentsPage && (
                <li>
                  <Link to="/admin/login" className="text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-full transition-colors border border-cyan-100/50">
                    Acceso Administrativo
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200/50 mt-auto">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
          <div className="opacity-50 grayscale hover:grayscale-0 transition-all duration-500 mb-4 scale-75">
            <ConvertIALogo size={8} textColor="text-slate-500" />
          </div>
          <p className="text-center text-slate-400 text-sm font-medium">RECLUTAMIENTO &copy; {new Date().getFullYear()} Intelligent Customer Acquisition SAS</p>
        </div>
      </footer>
      <Chatbot userType="public" />
    </div>;
};
export default PublicLayout;
