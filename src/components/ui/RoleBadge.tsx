
import React from "react";
const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  rrhh: "bg-sky-100 text-blue-700",
  manager: "bg-emerald-100 text-emerald-700",
  empleado: "bg-gray-100 text-gray-700",
};
export default function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${roleColors[role] || "bg-gray-100 text-gray-600"}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
