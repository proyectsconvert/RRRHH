
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Target, TrendingUp, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Survey {
  id: string;
  title: string;
  survey_type: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface SurveyResponse {
  id: string;
  survey_id: string;
  completed: boolean;
  submitted_at: string;
}

export default function ClimaLaboral() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar encuestas de clima laboral
      const { data: surveysData, error: surveysError } = await supabase
        .from('rrhh_surveys')
        .select('*')
        .eq('survey_type', 'climate')
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;

      // Cargar respuestas
      const { data: responsesData, error: responsesError } = await supabase
        .from('rrhh_survey_responses')
        .select('*');

      if (responsesError) throw responsesError;

      setSurveys(surveysData || []);
      setResponses(responsesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParticipationRate = (surveyId: string) => {
    const surveyResponses = responses.filter(r => r.survey_id === surveyId && r.completed);
    const totalEmployees = 90; // Este valor debería venir de una consulta real
    return Math.round((surveyResponses.length / totalEmployees) * 100);
  };

  const metrics = [
    { 
      title: 'Satisfacción General', 
      value: 78, 
      icon: Heart, 
      color: 'text-red-500',
      trend: '+5%'
    },
    { 
      title: 'Colaboración', 
      value: 85, 
      icon: Users, 
      color: 'text-blue-500',
      trend: '+2%'
    },
    { 
      title: 'Objetivos Claros', 
      value: 72, 
      icon: Target, 
      color: 'text-green-500',
      trend: '+8%'
    },
    { 
      title: 'Desarrollo Profesional', 
      value: 68, 
      icon: TrendingUp, 
      color: 'text-purple-500',
      trend: '+3%'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Clima Laboral</h1>
        <div className="text-center py-8">Cargando datos de clima laboral...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clima Laboral</h1>
        <Button>
          <MessageCircle className="w-4 h-4 mr-2" />
          Nueva Encuesta
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}%</p>
                  <p className="text-xs text-green-600">{metric.trend}</p>
                </div>
                <metric.icon className={`w-8 h-8 ${metric.color}`} />
              </div>
              <div className="mt-4">
                <Progress value={metric.value} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Encuestas activas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Encuestas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {surveys.filter(s => s.is_active).map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{survey.title}</h4>
                    <p className="text-sm text-gray-500">
                      Participación: {getParticipationRate(survey.id)}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Activa</Badge>
                    <Button variant="outline" size="sm">Ver</Button>
                  </div>
                </div>
              ))}
              {surveys.filter(s => s.is_active).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay encuestas activas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Encuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {surveys.filter(s => !s.is_active).slice(0, 5).map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{survey.title}</h4>
                    <p className="text-sm text-gray-500">
                      Finalizada • {getParticipationRate(survey.id)}% participación
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Finalizada</Badge>
                    <Button variant="outline" size="sm">Resultados</Button>
                  </div>
                </div>
              ))}
              {surveys.filter(s => !s.is_active).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay encuestas finalizadas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de tendencias (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Satisfacción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <p className="text-gray-500">Gráfico de tendencias - Próximamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
