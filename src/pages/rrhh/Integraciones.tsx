
import React from "react";
import { RealIntegrations } from "@/components/rrhh/RealIntegrations";

export default function Integraciones() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Integraciones</h1>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600">
          Conecta tu sistema de RRHH con las herramientas que ya utilizas en tu empresa.
          Configura integraciones para automatizar flujos de trabajo y sincronizar datos.
        </p>
      </div>

      <RealIntegrations />
    </div>
  );
}
