
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Award, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Compensation {
  id: string;
  compensation_type: string;
  amount: number;
  currency: string;
  reason: string;
  performance_metrics: any;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
}

export default function Compensacion() {
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompensations();
  }, []);

  const loadCompensations = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_compensation')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompensations(data || []);
    } catch (error) {
      console.error('Error loading compensations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompensationIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return <Award className="w-5 h-5" />;
      case 'incentive':
        return <TrendingUp className="w-5 h-5" />;
      case 'commission':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getCompensationTypeName = (type: string) => {
    const types: Record<string, string> = {
      bonus: 'Bonificación',
      incentive: 'Incentivo',
      commission: 'Comisión',
      merit_increase: 'Aumento por mérito'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      paid: 'secondary',
      rejected: 'destructive'
    };
    
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      paid: 'Pagado',
      rejected: 'Rechazado'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compensación</h1>
        <div className="text-center py-8">Cargando datos de compensación...</div>
      </div>
    );
  }

  const totalCompensation = compensations
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compensación</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Compensación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pagado</p>
                <p className="text-2xl font-bold">€{totalCompensation.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Compensaciones</p>
                <p className="text-2xl font-bold">{compensations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold">
                  {compensations.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Compensaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {compensations.map((compensation) => (
              <div key={compensation.id} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-4">
                  <div className="text-blue-500">
                    {getCompensationIcon(compensation.compensation_type)}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {getCompensationTypeName(compensation.compensation_type)}
                    </h4>
                    <p className="text-sm text-gray-500">{compensation.reason}</p>
                    {compensation.period_start && compensation.period_end && (
                      <p className="text-xs text-gray-400">
                        Período: {compensation.period_start} - {compensation.period_end}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    €{compensation.amount.toLocaleString()}
                  </p>
                  {getStatusBadge(compensation.status)}
                </div>
              </div>
            ))}
            {compensations.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay registros de compensación
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
