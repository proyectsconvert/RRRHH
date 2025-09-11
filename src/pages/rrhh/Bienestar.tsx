
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, Brain, Activity, Utensils, Scale, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WellnessResource {
  id: string;
  title: string;
  content: string;
  category: string;
  resource_type: string;
  external_url: string;
  is_active: boolean;
  created_at: string;
}

export default function Bienestar() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_wellness')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading wellness resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'Todos', icon: Heart, color: 'text-red-500' },
    { id: 'mental_health', name: 'Salud Mental', icon: Brain, color: 'text-purple-500' },
    { id: 'physical_health', name: 'Salud Física', icon: Activity, color: 'text-green-500' },
    { id: 'nutrition', name: 'Nutrición', icon: Utensils, color: 'text-orange-500' },
    { id: 'work_balance', name: 'Balance Laboral', icon: Scale, color: 'text-blue-500' },
    { id: 'stress_management', name: 'Manejo del Estrés', icon: Brain, color: 'text-indigo-500' }
  ];

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return '📄';
      case 'video':
        return '🎥';
      case 'guide':
        return '📖';
      case 'exercise':
        return '🏃‍♂️';
      case 'tip':
        return '💡';
      default:
        return '📄';
    }
  };

  const getResourceTypeName = (type: string) => {
    const types: Record<string, string> = {
      article: 'Artículo',
      video: 'Video',
      guide: 'Guía',
      exercise: 'Ejercicio',
      tip: 'Consejo'
    };
    return types[type] || type;
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Bienestar</h1>
        <div className="text-center py-8">Cargando recursos de bienestar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bienestar</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Recurso
        </Button>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar recursos de bienestar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            <category.icon className={`w-4 h-4 ${category.color}`} />
            <span>{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Recursos destacados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-8 h-8 text-blue-500" />
              <h3 className="font-bold text-lg">Mindfulness Diario</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Técnicas de meditación y respiración para reducir el estrés laboral.
            </p>
            <Button size="sm" className="w-full">
              Comenzar Sesión
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-8 h-8 text-green-500" />
              <h3 className="font-bold text-lg">Ejercicios de Oficina</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Rutinas simples para mantenerte activo durante la jornada laboral.
            </p>
            <Button size="sm" className="w-full">
              Ver Ejercicios
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Utensils className="w-8 h-8 text-orange-500" />
              <h3 className="font-bold text-lg">Alimentación Saludable</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Consejos nutricionales para mantener energía y concentración.
            </p>
            <Button size="sm" className="w-full">
              Ver Recetas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de recursos */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos de Bienestar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-4 border rounded hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getResourceTypeIcon(resource.resource_type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{resource.content}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getResourceTypeName(resource.resource_type)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === resource.category)?.name || resource.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {resource.external_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Ver Detalle
                  </Button>
                </div>
              </div>
            ))}
            {filteredResources.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay recursos disponibles para esta categoría
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
