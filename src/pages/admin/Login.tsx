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
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        throw error;
      }

      // Verificar que el usuario existe y está activo
      if (data.user) {
        await ensureUserIsActive(data.user.id);
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente."
      });
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Error de autenticación:', error);

      // Cerrar sesión si hay error de validación de estado activo
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
            <CardTitle className="text-hrm-dark-cyan">CONVERT-IA RECLUTAMIENTO</CardTitle>
            <CardDescription className="text-center">Accede a tu panel de administración</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="password" render={({
              field
            }) => <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <Button type="submit" className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-500">
            
            
            
          </div>
        </CardFooter>
      </Card>
    </div>;
};
export default Login;