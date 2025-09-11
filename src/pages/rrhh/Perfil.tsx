
import React from "react";
export default function Perfil() {
  // Datos personales y acceso a documentos propios
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Mi Perfil</h2>
      <div className="bg-white p-6 rounded shadow flex flex-col gap-2">
        <div><strong>Nombre:</strong> Juan Pérez</div>
        <div><strong>Correo:</strong> juan@email.com</div>
        <div><strong>Rol:</strong> Colaborador</div>
        <div className="mt-3 text-xs text-gray-500">Puedes ver tus documentos y solicitudes aquí.</div>
        <ul className="mt-2 list-disc ml-6 text-xs">
          <li>Contrato firmado.pdf</li>
          <li>Certificado vacaciones.pdf</li>
        </ul>
      </div>
    </div>
  );
}
