
import React from "react";
import { Navigate } from "react-router-dom";
import { useRRHHAuth } from "@/contexts/RRHHAuthContext";
export default function ProtectedRRHHRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useRRHHAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><span className="loader"></span></div>;
  if (!isAuthenticated) return <Navigate to="/rrhh/login" replace />;
  return <>{children}</>;
}
