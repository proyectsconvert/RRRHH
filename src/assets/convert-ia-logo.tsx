import React from 'react';
import { cn } from '@/lib/utils';

export const ConvertIALogo = ({
  className = "",
  textColor = "text-slate-50",
  showText = true,
  size = 8,
}: {
  className?: string;
  textColor?: string;
  showText?: boolean;
  size?: number;
}) => {
  // 1. Creamos un mapa de tamaños a clases de Tailwind.
  // Al escribir las clases completas aquí, Tailwind las detectará y generará el CSS.
  const sizeClasses = {
    6: 'h-6',
    8: 'h-8',
    10: 'h-10',
    12: 'h-12', // Puedes agregar más tamaños si los necesitas
  };

  return (
    // 2. Usamos el mapa para obtener la clase correcta.
    // Proporcionamos un valor por defecto si el size no está en el mapa.
    <div className={cn(
      "flex items-center gap-2 overflow-hidden",
      sizeClasses[size] || 'h-8', // Aquí está la magia
      className
    )}>
      
      {/* Esta parte ya es correcta y no necesita cambios. */}
      {/* Se ajustará a la altura del div, que ahora sí funcionará. */}
      <img
        src="/favicon-convertia.png"
        alt="Convert-IA Logo Icon"
        className="h-full w-auto flex-shrink-0"
      />
      
      {showText && (
        <span className={cn(
          "font-bold text-lg whitespace-nowrap transition-opacity duration-300",
          textColor
        )}>
          Convert-IA
        </span>
      )}
    </div>
  );
};

export default ConvertIALogo;