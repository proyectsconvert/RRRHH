import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define campaign statuses as const arrays to use in the schema and component
const CAMPAIGN_STATUSES = ['active', 'completed', 'planned', 'cancelled'] as const;

// Define the schema with explicit types
const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  status: z.enum(CAMPAIGN_STATUSES),
  responsable: z.string().optional().transform(val => val === "none" ? null : val),
});

type FormValues = z.infer<typeof formSchema>;

const CampaignForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const isEditing = Boolean(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planned",
      responsable: "none",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      // Prepare data for Supabase
      const campaignData = {
        name: values.name,
        description: values.description || null,
        status: values.status,
        responsable: values.responsable === "none" ? null : values.responsable,
      };

      let result;

      if (isEditing) {
        result = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', id);
      } else {
        result = await supabase
          .from('campaigns')
          .insert([campaignData]);
      }

      if (result.error) {
        console.error("Error saving campaign:", result.error);
        throw result.error;
      }

      toast({
        title: isEditing ? "Campaña actualizada" : "Campaña creada",
        description: isEditing
          ? "La campaña ha sido actualizada exitosamente"
          : "La nueva campaña ha sido creada exitosamente",
      });

      navigate('/admin/campaigns');
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al guardar la campaña. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load users for responsable select
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Try to load with role column, fallback to without it
        let usersData, usersError;

        try {
          const result = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, role')
            .neq('role', 'administrador') // Exclude administrators
            .order('first_name', { ascending: true, nullsFirst: false });
          usersData = result.data;
          usersError = result.error;
        } catch (e) {
          // Fallback to query without role column
          console.log('Role column not available, loading users without role filter...');
          const result = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .order('first_name', { ascending: true, nullsFirst: false });
          usersData = result.data;
          usersError = result.error;
        }
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar los usuarios",
          });
          return;
        }

        setUsers(usersData || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Load campaign data if editing
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name || "",
            description: data.description || "",
            status: data.status as typeof CAMPAIGN_STATUSES[number] || "planned",
            responsable: data.responsable || "none",
          });
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información de la campaña",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [id, toast, form]);

  return (
    <div>
      <h1 className="page-title mb-6">{isEditing ? "Editar Campaña" : "Nueva Campaña"}</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-hrm-light-gray">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Campaña</FormLabel>
                    <FormControl>
                      <Input placeholder="Campaña de Desarrolladores 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planificada</SelectItem>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el responsable" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingUsers ? (
                        <SelectItem value="loading" disabled>
                          Cargando usuarios...
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.email}
                              {user.role && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({user.role})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe los objetivos y alcance de la campaña de contratación"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/campaigns')}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  isEditing ? "Actualizar Campaña" : "Crear Campaña"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CampaignForm;