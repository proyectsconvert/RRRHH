
import React, { createContext, useContext, useState, ReactNode } from "react";

export type RRHHUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  avatar?: string;
};

export type RRHHAuthContextType = {
  user: RRHHUser | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  profile?: any;
  updateProfile?: (profile: any) => void;
};

const RRHHAuthContext = createContext<RRHHAuthContextType | undefined>(undefined);

export const mockRRHHUsers: RRHHUser[] = [
  // Administradores
  { 
    id: "1", 
    name: "Aiko ivvone barroso", 
    email: "aiko.barroso@convertia.com", 
    role: "admin",
    department: "Recursos Humanos",
    position: "Directora de RRHH",
    avatar: "AB"
  },
  { 
    id: "2", 
    name: "jose Luis pascual", 
    email: "jose.pascual@convertia.com", 
    role: "admin",
    department: "Administración",
    position: "Gerente General",
    avatar: "JP"
  },
  
  // Personal de RRHH
  { 
    id: "3", 
    name: "sebastian hernandez", 
    email: "sebastian.hernandez@convertia.com", 
    role: "rrhh",
    department: "Recursos Humanos",
    position: "Especialista en Reclutamiento",
    avatar: "SH"
  },
  { 
    id: "4", 
    name: "bernardo peñuela", 
    email: "bernardo.penuela@convertia.com", 
    role: "rrhh",
    department: "Recursos Humanos",
    position: "Analista de Nómina",
    avatar: "BP"
  },
  { 
    id: "5", 
    name: "Johana nope", 
    email: "johana.nope@convertia.com", 
    role: "rrhh",
    department: "Recursos Humanos",
    position: "Coordinadora de Capacitación",
    avatar: "JN"
  },
  
  // Managers/Supervisores
  { 
    id: "6", 
    name: "Steven Vasquez", 
    email: "steven.vasquez@convertia.com", 
    role: "manager",
    department: "Tecnología",
    position: "Gerente de TI",
    avatar: "SV"
  },
  { 
    id: "7", 
    name: "Nidia cortes", 
    email: "nidia.cortes@convertia.com", 
    role: "manager",
    department: "Marketing",
    position: "Gerente de Marketing",
    avatar: "NC"
  },
  { 
    id: "8", 
    name: "pedro aponte", 
    email: "pedro.aponte@convertia.com", 
    role: "manager",
    department: "Ventas",
    position: "Gerente de Ventas",
    avatar: "PA"
  },
  
  // Empleados
  { 
    id: "9", 
    name: "Tania Camacho", 
    email: "tania.camacho@convertia.com", 
    role: "empleado",
    department: "Tecnología",
    position: "Desarrolladora Frontend",
    avatar: "TC"
  },
  { 
    id: "10", 
    name: "Harold Alvarez", 
    email: "harold.alvarez@convertia.com", 
    role: "empleado",
    department: "Tecnología",
    position: "Desarrollador Backend",
    avatar: "HA"
  },
  { 
    id: "11", 
    name: "Esteban Salamanca", 
    email: "esteban.salamanca@convertia.com", 
    role: "empleado",
    department: "Marketing",
    position: "Especialista en Redes Sociales",
    avatar: "ES"
  },
  { 
    id: "12", 
    name: "Santiago Martín", 
    email: "santiago.martin@convertia.com", 
    role: "empleado",
    department: "Ventas",
    position: "Ejecutivo de Ventas",
    avatar: "SM"
  },
  { 
    id: "13", 
    name: "Isabella González", 
    email: "isabella.gonzalez@convertia.com", 
    role: "empleado",
    department: "Administración",
    position: "Asistente Administrativa",
    avatar: "IG"
  },
  { 
    id: "14", 
    name: "Mateo Silva", 
    email: "mateo.silva@convertia.com", 
    role: "empleado",
    department: "Tecnología",
    position: "QA Tester",
    avatar: "MS"
  },
  { 
    id: "15", 
    name: "Sofía Ramírez", 
    email: "sofia.ramirez@convertia.com", 
    role: "empleado",
    department: "Marketing",
    position: "Diseñadora Gráfica",
    avatar: "SR"
  }
];

export const RRHHAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<RRHHUser | null>(() => {
    const stored = localStorage.getItem("rrhhUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const found = mockRRHHUsers.find((u) => u.email === email);
        
        if (found) {
          setUser(found);
          localStorage.setItem("rrhhUser", JSON.stringify(found));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error("Usuario no encontrado"));
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rrhhUser");
  };

  return (
    <RRHHAuthContext.Provider
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
    </RRHHAuthContext.Provider>
  );
};

export const useRRHHAuth = () => {
  const context = useContext(RRHHAuthContext);
  if (!context) throw new Error("useRRHHAuth debe usarse dentro de RRHHAuthProvider");
  return context;
}; 
