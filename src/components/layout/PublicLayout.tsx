
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import Chatbot from '../chatbot/Chatbot';
import { ConvertIALogo } from '../../assets/convert-ia-logo';

const PublicLayout = () => {
  return <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-hrm-light-gray">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <ConvertIALogo size={10} textColor="text-hrm-dark-cyan" />
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
              <li>
                <Link to="/admin/login" className="text-gray-600 hover:text-hrm-dark-cyan">
                  Admin
                </Link>
              </li>
              {/** 
              <li>
                <Link to="/rrhh" className="text-gray-600 hover:text-purple-800 px-2 py-1 rounded-md border border-hrm-light-gray hover:border-purple-500 transition-colors">
                  RRHH
                </Link>
              </li>*/}
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-50 border-t border-hrm-light-gray">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">RECLUTAMIENTO CONVERT-IA</p>
        </div>
      </footer>
      <Chatbot userType="public" />
    </div>;
};
export default PublicLayout;
