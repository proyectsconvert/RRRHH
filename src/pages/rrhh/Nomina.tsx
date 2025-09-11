import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayroll, useEmployees } from '@/hooks/useRRHHData';
import { Calculator, DollarSign, FileText, Download, Eye, Edit, Upload } from 'lucide-react';
import { PayrollUpload } from '@/components/rrhh/PayrollUpload';

export default function Nomina() {
  const { data: payrollData = [], isLoading } = usePayroll();
  const { data: employees = [] } = useEmployees();
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Generar períodos para el selector
  const periods = Array.from({ length: 12 }, (_, i) => {
    const month = String(currentMonth - i).padStart(2, '0');
    const year = currentYear;
    return `${year}-${month}`;
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Empleado no encontrado';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Filtrar datos de nómina
  const filteredPayroll = payrollData.filter(record => {
    const recordPeriod = `${record.period_year}-${String(record.period_month).padStart(2, '0')}`;
    const matchesPeriod = selectedPeriod === 'all' || recordPeriod === selectedPeriod;
    const matchesEmployee = selectedEmployee === 'all' || record.employee_id === selectedEmployee;
    return matchesPeriod && matchesEmployee;
  });

  // Calcular totales
  const totals = filteredPayroll.reduce((acc, record) => ({
    grossPay: acc.grossPay + Number(record.gross_pay),
    netPay: acc.netPay + Number(record.net_pay),
    taxes: acc.taxes + Number(record.taxes),
    deductions: acc.deductions + Number(record.deductions)
  }), { grossPay: 0, netPay: 0, taxes: 0, deductions: 0 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Nómina</h1>
        <div className="text-center py-8">Cargando datos de nómina...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Nómina</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsUploadOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Cargar Nómina
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generar Nómina
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Salario Bruto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.grossPay)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Salario Neto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.netPay)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Impuestos</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.taxes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deducciones</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.deductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Nómina Actual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los períodos</SelectItem>
                      {periods.map(period => (
                        <SelectItem key={period} value={period}>
                          {new Date(period + '-01').toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empleado</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los empleados</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="paid">Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de nómina */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Nómina</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayroll.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay registros</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No se encontraron registros de nómina para los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Salario Base</TableHead>
                      <TableHead>Bonificaciones</TableHead>
                      <TableHead>Deducciones</TableHead>
                      <TableHead>Salario Bruto</TableHead>
                      <TableHead>Impuestos</TableHead>
                      <TableHead>Salario Neto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(record.employee_id)}
                        </TableCell>
                        <TableCell>
                          {record.period_month}/{record.period_year}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(record.base_salary))}</TableCell>
                        <TableCell>{formatCurrency(Number(record.bonuses))}</TableCell>
                        <TableCell>{formatCurrency(Number(record.deductions))}</TableCell>
                        <TableCell>{formatCurrency(Number(record.gross_pay))}</TableCell>
                        <TableCell>{formatCurrency(Number(record.taxes))}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(Number(record.net_pay))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            record.status === 'paid' ? 'default' : 
                            record.status === 'approved' ? 'secondary' : 
                            'outline'
                          }>
                            {record.status === 'paid' ? 'Pagado' :
                             record.status === 'approved' ? 'Aprobado' :
                             'Borrador'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Nóminas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Historial detallado de todas las nóminas procesadas...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes Disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte mensual de nómina
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calculator className="w-4 h-4 mr-2" />
                  Análisis de costos laborales
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Reporte de impuestos
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Período</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Empleados activos</span>
                  <span className="font-semibold">{employees.filter(e => e.status === 'Activo').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo promedio por empleado</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.netPay / Math.max(filteredPayroll.length, 1))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total pagado este mes</span>
                  <span className="font-semibold">{formatCurrency(totals.netPay)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PayrollUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          // Recargar datos de nómina
          console.log('Nómina cargada exitosamente');
        }}
      />
    </div>
  );
}
