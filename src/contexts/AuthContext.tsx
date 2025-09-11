import React, { createContext, useContext, useState, ReactNode } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AuthContextType = {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  profile?: any;
  updateProfile?: (profile: any) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const mockUsers: User[] = [
  { id: "1", name: "Admin", email: "admin@email.com", role: "admin" },
  { id: "2", name: "RRHH", email: "rrhh@email.com", role: "rrhh" },
  { id: "3", name: "Empleado", email: "empleado@email.com", role: "empleado" },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulación de login
    const found = mockUsers.find((u) => u.email === email);
    setTimeout(() => {
      setUser(found || null);
      setIsLoading(false);
    }, 500);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}; 