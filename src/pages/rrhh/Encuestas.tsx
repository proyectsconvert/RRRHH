
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Plus, Eye, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Survey {
  id: string;
  title: string;
  description: string;
  survey_type: string;
  questions: any[];
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function Encuestas() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    survey_type: 'custom',
    questions: [{ question: '', type: 'text', options: [] }]
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedSurveys = (data || []).map(survey => ({
        ...survey,
        questions: Array.isArray(survey.questions) ? survey.questions : 
                  typeof survey.questions === 'string' ? JSON.parse(survey.questions) : []
      }));
      
      setSurveys(transformedSurveys);
    } catch (error) {
      console.error('Error loading surveys:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('rrhh_surveys')
        .insert({
          ...formData,
          questions: JSON.stringify(formData.questions)
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Encuesta creada correctamente"
      });

      setFormData({
        title: '',
        description: '',
        survey_type: 'custom',
        questions: [{ question: '', type: 'text', options: [] }]
      });
      setShowForm(false);
      loadSurveys();
    } catch (error) {
      console.error('Error creating survey:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la encuesta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', type: 'text', options: [] }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const getSurveyTypeName = (type: string) => {
    const types: Record<string, string> = {
      climate: 'Clima Laboral',
      '360': 'Evaluación 360°',
      onboarding: 'Onboarding',
      offboarding: 'Offboarding',
      custom: 'Personalizada',
      satisfaction: 'Satisfacción'
    };
    return types[type] || type;
  };

  const getStatusBadge = (survey: Survey) => {
    if (!survey.is_active) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }
    
    const now = new Date();
    const startDate = new Date(survey.start_date);
    const endDate = new Date(survey.end_date);
    
    if (now < startDate) {
      return <Badge variant="outline">Programada</Badge>;
    } else if (now > endDate) {
      return <Badge variant="destructive">Finalizada</Badge>;
    } else {
      return <Badge variant="default">Activa</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Encuestas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Encuesta
        </Button>
      </div>

      {/* Templates rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-medium">Clima Laboral</h3>
            <p className="text-sm text-gray-500">Evaluar satisfacción general</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <BarChart className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-medium">Evaluación 360°</h3>
            <p className="text-sm text-gray-500">Feedback multidireccional</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-medium">Onboarding</h3>
            <p className="text-sm text-gray-500">Experiencia nuevos empleados</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Encuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey_type">Tipo de encuesta</Label>
                  <Select value={formData.survey_type} onValueChange={(value) => setFormData(prev => ({ ...prev, survey_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="climate">Clima Laboral</SelectItem>
                      <SelectItem value="360">Evaluación 360°</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="offboarding">Offboarding</SelectItem>
                      <SelectItem value="satisfaction">Satisfacción</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Preguntas</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    Agregar Pregunta
                  </Button>
                </div>
                
                {formData.questions.map((question, index) => (
                  <div key={index} className="p-4 border rounded space-y-2">
                    <Input
                      placeholder="Escriba la pregunta..."
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                    />
                    <Select 
                      value={question.type} 
                      onValueChange={(value) => updateQuestion(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="rating">Escala 1-5</SelectItem>
                        <SelectItem value="multiple">Opción múltiple</SelectItem>
                        <SelectItem value="yes_no">Sí/No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Encuesta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Encuestas Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">{survey.title}</h4>
                    <p className="text-sm text-gray-500">{survey.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getSurveyTypeName(survey.survey_type)}
                      </Badge>
                      {getStatusBadge(survey)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {surveys.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay encuestas creadas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
