import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRRHHAuth, mockRRHHUsers } from "@/contexts/RRHHAuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
const Login: React.FC = () => {
  const {
    login,
    isLoading,
    isAuthenticated
  } = useRRHHAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/rrhh/dashboard");
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente."
      });
      navigate("/rrhh/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: "Correo o contraseña incorrectos"
      });
    }
  };
  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
    setShowDemoUsers(false);
  };
  const usersByRole = {
    admin: mockRRHHUsers.filter(u => u.role === "admin"),
    rrhh: mockRRHHUsers.filter(u => u.role === "rrhh"),
    manager: mockRRHHUsers.filter(u => u.role === "manager"),
    empleado: mockRRHHUsers.filter(u => u.role === "empleado").slice(0, 4)
  };
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Regresar al inicio
              </Link>
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <img src="/placeholder.svg" alt="Convert-IA Logo" className="h-16 w-16 mb-4" />
            <CardTitle className="ml-2 font-semibold text-lg text-hrm-dark-cyan">CONVERT-IA RRHH</CardTitle>
            <CardDescription className="text-center">Accede a tu plataforma de recursos humanos</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="usuario@convertia.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="w-full">
            <Button type="button" variant="outline" onClick={() => setShowDemoUsers(!showDemoUsers)} className="w-full text-sm">
              {showDemoUsers ? "Ocultar usuarios demo" : "Ver usuarios demo"}
            </Button>

            {showDemoUsers && <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(usersByRole).map(([role, users]) => <div key={role} className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {role === "admin" ? "Administradores" : role === "rrhh" ? "Personal RRHH" : role === "manager" ? "Gerentes" : "Empleados"}
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {users.map(user => <button key={user.id} type="button" onClick={() => handleDemoLogin(user.email)} className={`text-left p-2 rounded-lg transition-colors text-xs ${user.is_active === false ? 'bg-red-50 hover:bg-red-100 opacity-60' : 'bg-gray-50 hover:bg-cyan-50'}`}>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-gray-600">{user.email}</div>
                          <div className="text-gray-500">{user.position}</div>
                          {user.is_active === false && <div className="text-red-600 font-medium">Cuenta inactiva</div>}
                        </button>)}
                    </div>
                  </div>)}
                <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                  <strong>Nota:</strong> Cualquier contraseña funciona en modo demo
                </div>
              </div>}
          </div>
          <div className="text-center text-sm text-gray-500">
            © 2025 Convert-IA. Todos los derechos reservados.
          </div>
        </CardFooter>
      </Card>
    </div>;
};
export default Login;