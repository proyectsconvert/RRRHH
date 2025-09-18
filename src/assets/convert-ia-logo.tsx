import React from 'react';

export const ConvertIALogo = ({
  className = "",
  size = 8, // Tamaño por defecto (h-8, w-8)
  textColor = "text-slate-50" // Color de texto por defecto
}: {
  className?: string;
  size?: number;
  textColor?: string;
}) => (
  <div className={`flex items-center ${className}`}>
    {/* Usamos las props para generar las clases de Tailwind dinámicamente */}
    <img 
      src="/favicon-convertia.png" 
      alt="Convert-IA Logo" 
      className={`h-${size} w-${size}`} 
    />
    <span className={`ml-2 font-bold text-lg ${textColor}`}>
      convert-ia®
    </span>
  </div>
);
export default ConvertIALogo;