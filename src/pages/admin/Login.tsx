import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ensureUserIsActive } from '@/utils/auth-helpers';
const formSchema = z.object({
  email: z.string().email({
    message: 'Email inválido'
  }),
  password: z.string().min(6, {
    message: 'La contraseña debe tener al menos 6 caracteres'
  })
});
const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Revisar si ya está autenticado
  useEffect(() => {
    const checkSession = async () => {
      const {
        data
      } = await supabase.auth.getSession();
      if (data.session && data.session.user) {
        try {
          // Verificar que el usuario esté activo
          await ensureUserIsActive(data.session.user.id);
          navigate('/admin/dashboard');
        } catch (error) {
          // Si el usuario está inactivo, cerrar sesión
          console.warn('Usuario inactivo detectado, cerrando sesión:', error);
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Cuenta inactiva",
            description: "Tu cuenta ha sido desactivada. Contacta al administrador."
          });
        }
      }
    };
    checkSession();
  }, [navigate, toast]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) throw error;

      if (data.user) {
        await ensureUserIsActive(data.user.id);
      }

      toast({
        title: "¡Bienvenido a la plataforma!",
        description: "Has iniciado sesión correctamente."
      });
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      if (error.message?.includes('desactivada')) {
        await supabase.auth.signOut();
      }
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales incorrectas. Inténtalo de nuevo."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-900 via-cyan-800 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-cyan-500/10 blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-500/10 blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <Button variant="ghost" size="sm" asChild className="text-cyan-100 hover:text-white hover:bg-white/10 w-fit">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al portal público
            </Link>
          </Button>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <div className="mb-6 inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <img src="/placeholder.svg" alt="Convert-IA Logo" className="h-10 w-10 brightness-0 invert opacity-90" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Gestión Inteligente de Talento Humano
          </h1>
          <p className="text-cyan-100/80 text-lg leading-relaxed font-medium">
            Accede al panel de control integral para administrar candidatos, procesos de selección y análisis de rendimiento en tiempo real.
          </p>
        </div>

        <div className="relative z-10 text-cyan-200/60 text-sm font-medium">
          &copy; {new Date().getFullYear()} Intelligent Customer Acquisition SAS
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-white/50 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none">
        
        {/* Mobile back button */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Button variant="ghost" size="sm" asChild className="text-slate-500">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atrás
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden mb-8 flex justify-center">
              <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-blue-100/50 shadow-inner">
                <img src="/placeholder.svg" alt="Convert-IA Logo" className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800">Inicia Sesión</h2>
            <p className="text-slate-500 font-medium">Ingresa tus credenciales para continuar</p>
          </div>

          <Card className="border-0 shadow-none lg:bg-transparent bg-transparent">
            <CardContent className="p-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin@convertia.com" 
                          className="h-12 bg-white/80 border-slate-200/60 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl transition-all shadow-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-700 font-semibold">Contraseña</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="h-12 bg-white/80 border-slate-200/60 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl transition-all shadow-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl shadow-[0_4px_14px_0_rgba(14,116,144,0.39)] hover:shadow-[0_6px_20px_rgba(14,116,144,0.23)] hover:-translate-y-0.5 transition-all duration-200 font-semibold text-base" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Autenticando...
                        </div>
                      ) : (
                        'Ingresar al Panel'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;