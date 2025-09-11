
import React, { useState } from 'react';
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

// Define job types and statuses as const arrays to use in the schema and component
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'temporary'] as const;
const JOB_STATUSES = ['open', 'in_progress', 'closed', 'draft'] as const;

// Define the schema with explicit types
const formSchema = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  department: z.string().min(2, "El departamento es requerido"),
  location: z.string().min(2, "La ubicación es requerida"),
  type: z.enum(JOB_TYPES),
  status: z.enum(JOB_STATUSES),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  salary_range: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = Boolean(id);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      department: "",
      location: "",
      type: "full-time",
      status: "open",
      description: "",
      requirements: "",
      responsibilities: "",
      salary_range: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      let result;
      
      // Ensure all required fields are present
      const jobData = {
        title: values.title,
        department: values.department,
        location: values.location,
        type: values.type,
        description: values.description,
        // For the database, if is draft we send it as open
        status: values.status === "draft" ? "open" : values.status,
        requirements: values.requirements || null,
        responsibilities: values.responsibilities || null,
        salary_range: values.salary_range || null,
      };
      
      if (isEditing) {
        result = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', id);
      } else {
        result = await supabase
          .from('jobs')
          .insert([jobData]);
      }
      
      if (result.error) {
        console.error("Error saving job:", result.error);
        throw result.error;
      }
      
      toast({
        title: isEditing ? "Vacante actualizada" : "Vacante creada",
        description: isEditing 
          ? "La vacante ha sido actualizada exitosamente" 
          : "La nueva vacante ha sido creada exitosamente",
      });
      
      navigate('/admin/jobs');
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al guardar la vacante. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load job data if editing
  React.useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Cast the values to ensure they match the schema types
          form.reset({
            title: data.title || "",
            department: data.department || "",
            location: data.location || "",
            type: data.type as typeof JOB_TYPES[number] || "full-time",
            status: data.status as typeof JOB_STATUSES[number] || "open",
            description: data.description || "",
            requirements: data.requirements || "",
            responsibilities: data.responsibilities || "",
            salary_range: data.salary_range || "",
          });
        }
      } catch (error) {
        console.error("Error fetching job:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información de la vacante",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJob();
  }, [id, toast, form]);
  
  return (
    <div>
      <h1 className="page-title mb-6">{isEditing ? "Editar Vacante" : "Nueva Vacante"}</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-hrm-light-gray">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Desarrollador Frontend" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Tecnología" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Remoto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de contrato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de contrato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Tiempo Completo</SelectItem>
                        <SelectItem value="part-time">Medio Tiempo</SelectItem>
                        <SelectItem value="contract">Contrato</SelectItem>
                        <SelectItem value="internship">Pasantía</SelectItem>
                        <SelectItem value="temporary">Temporal</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="open">Abierta</SelectItem>
                        <SelectItem value="in_progress">En Proceso</SelectItem>
                        <SelectItem value="closed">Cerrada</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rango Salarial</FormLabel>
                    <FormControl>
                      <Input placeholder="$2,500 - $3,500 USD/mes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción detallada de la vacante" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisitos</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Requisitos para la posición" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsibilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabilidades</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Responsabilidades principales del puesto" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/jobs')}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  isEditing ? "Actualizar Vacante" : "Crear Vacante"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default JobForm;
