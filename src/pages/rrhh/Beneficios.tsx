
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Calendar, Home, Clock, CreditCard, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Benefit {
  id: string;
  name: string;
  description: string;
  benefit_type: string;
  value_type: string;
  value_amount: number;
  is_active: boolean;
}

interface EmployeeBenefit {
  id: string;
  benefit: Benefit;
  assigned_date: string;
  effective_date: string;
  expiry_date: string;
  is_active: boolean;
}

export default function Beneficios() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [employeeBenefits, setEmployeeBenefits] = useState<EmployeeBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBenefits();
    loadEmployeeBenefits();
  }, []);

  const loadBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_benefits')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Error loading benefits:', error);
    }
  };

  const loadEmployeeBenefits = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_employee_benefits')
        .select(`
          *,
          benefit:rrhh_benefits(*)
        `)
        .eq('is_active', true)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setEmployeeBenefits(data || []);
    } catch (error) {
      console.error('Error loading employee benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'time_off':
        return <Calendar className="w-5 h-5" />;
      case 'remote_work':
        return <Home className="w-5 h-5" />;
      case 'early_leave':
        return <Clock className="w-5 h-5" />;
      case 'gift_card':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getBenefitTypeName = (type: string) => {
    const types: Record<string, string> = {
      time_off: 'Días libres',
      remote_work: 'Trabajo remoto',
      early_leave: 'Salida anticipada',
      gift_card: 'Tarjeta regalo',
      health: 'Salud',
      education: 'Educación',
      transport: 'Transporte'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Beneficios</h1>
        <div className="text-center py-8">Cargando beneficios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Beneficios</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Beneficio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mis Beneficios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeBenefits.map((employeeBenefit) => (
                <div key={employeeBenefit.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-500">
                      {getBenefitIcon(employeeBenefit.benefit.benefit_type)}
                    </div>
                    <div>
                      <h4 className="font-medium">{employeeBenefit.benefit.name}</h4>
                      <p className="text-sm text-gray-500">{employeeBenefit.benefit.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {getBenefitTypeName(employeeBenefit.benefit.benefit_type)}
                  </Badge>
                </div>
              ))}
              {employeeBenefits.length === 0 && (
                <p className="text-center text-gray-500 py-4">No tienes beneficios asignados</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficios Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="text-green-500">
                      {getBenefitIcon(benefit.benefit_type)}
                    </div>
                    <div>
                      <h4 className="font-medium">{benefit.name}</h4>
                      <p className="text-sm text-gray-500">{benefit.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {getBenefitTypeName(benefit.benefit_type)}
                    </Badge>
                    {benefit.value_amount && (
                      <p className="text-sm text-gray-500 mt-1">
                        {benefit.value_amount} {benefit.value_type}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {benefits.length === 0 && (
                <p className="text-center text-gray-500 py-4">No hay beneficios disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
