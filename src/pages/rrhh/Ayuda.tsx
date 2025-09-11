
import React from "react";
export default function Ayuda() {
  // Chat soporte y feedback
  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Ayuda y Feedback</h2>
      <div className="bg-white rounded shadow p-6 mb-8">
        <strong>Chat de soporte (simulado)</strong>
        <div className="mt-2">¿En qué podemos ayudarte?</div>
        <button className="bg-cyan-700 text-white rounded px-4 py-1 my-3">Iniciar chat</button>
      </div>
      <form className="bg-white rounded shadow p-6">
        <strong>Enviar feedback sobre el sistema</strong>
        <textarea className="w-full rounded border p-2 mt-2 mb-3" rows={3} placeholder="Cuéntanos tu sugerencia o problema"/>
        <button className="bg-emerald-700 text-white rounded px-3 py-1">Enviar</button>
      </form>
    </div>
  );
}
