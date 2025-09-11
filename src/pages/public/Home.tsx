
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const Home = () => {
  return <div>
      <div className="bg-gradient-to-b from-hrm-light-gray/30 to-white">
        <div className="hrm-container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-hrm-dark-cyan mb-6">
              Reclutamiento Impulsado por Inteligencia Artificial
            </h1>
            <p className="text-xl text-gray-600 mb-8">Innovación global, oportunidades sin límites. ¡Construye el futuro con nosotros!</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue text-white font-medium">
                <Link to="/jobs">Ver vacantes disponibles</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-hrm-dark-cyan text-hrm-dark-cyan hover:bg-hrm-dark-cyan/10">
                <a href="https://www.convertia.com/es-CO" target="_blank" rel="noopener noreferrer">
                  Conoce más sobre nosotros <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="hrm-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-hrm-dark-cyan mb-4">¿Por qué elegirnos?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">No somos solo una empresa. Somos un motor de cambio. Buscamos mentes inquietas que quieran dejar huella</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-hrm-light-gray">
            <div className="h-12 w-12 rounded-full bg-hrm-dark-cyan/20 flex items-center justify-center text-hrm-dark-cyan mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-hrm-dark-cyan mb-2">Tu perfil cuenta con el respaldo de IA</h3>
            <p className="text-gray-600">Nuestra tecnología analiza tu hoja de vida para identificar oportunidades que se ajusten a tu experiencia y aspiraciones.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-hrm-light-gray">
            <div className="h-12 w-12 rounded-full bg-hrm-dark-cyan/20 flex items-center justify-center text-hrm-dark-cyan mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <h3 className="text-xl font-semibold text-hrm-dark-cyan mb-2">Postula fácilmente desde cualquier lugar</h3>
            <p className="text-gray-600">Hemos diseñado una experiencia ágil y moderna para que puedas aplicar a nuestras vacantes en cuestión de minutos.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-hrm-light-gray">
            <div className="h-12 w-12 rounded-full bg-hrm-dark-cyan/20 flex items-center justify-center text-hrm-dark-cyan mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-hrm-dark-cyan mb-2">Seguimiento y transparencia</h3>
            <p className="text-gray-600">No estás solo: comunicación constante y orientación personalizada de nuestros expertos
          </p>
          </div>
        </div>
      </div>
      
      <div className="bg-hrm-dark-cyan text-white">
        <div className="hrm-container py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">¿Listo para dar el siguiente paso en tu carrera profesional?</h2>
            <Button asChild size="lg" className="bg-white text-hrm-dark-cyan hover:bg-gray-100">
              <Link to="/jobs">Explorar vacantes</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Home;
