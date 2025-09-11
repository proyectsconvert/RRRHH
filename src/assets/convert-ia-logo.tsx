import React from 'react';
export const ConvertIALogo = ({
  className = ""
}: {
  className?: string;
}) => <div className={`flex items-center ${className}`}>
    <img src="/placeholder.svg" alt="Convert-IA Logo" className="h-8 w-8" />
    <span className="ml-2 font-bold text-lg text-slate-50">CONVERT-IA</span>
  </div>;
export default ConvertIALogo;