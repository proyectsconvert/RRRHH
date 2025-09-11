import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Search,
  Filter
} from "lucide-react";
import { useRRHHData, useCreateAbsenceRequest } from "@/hooks/useRRHHData";
import { useToast } from "@/hooks/use-toast";
import type { AbsenceRequestResponse, Employee } from "@/types/rrhh";

export default function Ausencias() {
  const { employees, absenceRequests, isLoading } = useRRHHData();
  const { toast } = useToast();
  const createAbsenceRequest = useCreateAbsenceRequest();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequestResponse | null>(null);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form state for new request
  const [newRequest, setNewRequest] = useState({
    employee_id: "",
    absence_type: "",
    start_date: "",
    end_date: "",
    reason: ""
  });

  const absenceTypes = [
    { value: "vacation", label: "Vacaciones" },
    { value: "sick", label: "Licencia médica" },
    { value: "personal", label: "Asuntos personales" },
    { value: "maternity", label: "Licencia de maternidad" },
    { value: "paternity", label: "Licencia de paternidad" },
    { value: "study", label: "Permiso de estudio" },
    { value: "other", label: "Otros" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRequests = (absenceRequests as AbsenceRequestResponse[]).filter((request) => {
    const employeeName = request.employee_name || 'Empleado no encontrado';
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.absence_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmitRequest = async () => {
    if (!newRequest.employee_id || !newRequest.absence_type || !newRequest.start_date || !newRequest.end_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Calculate days
    const startDate = new Date(newRequest.start_date);
    const endDate = new Date(newRequest.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff <= 0) {
      toast({
        title: "Error",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive"
      });
      return;
    }

    try {
      await createAbsenceRequest.mutateAsync({
        employeeId: newRequest.employee_id,
        absenceType: newRequest.absence_type,
        startDate: newRequest.start_date,
        endDate: newRequest.end_date,
        reason: newRequest.reason
      });

      toast({
        title: "Solicitud creada",
        description: "La solicitud de ausencia ha sido enviada correctamente"
      });
      
      setIsNewRequestOpen(false);
      setNewRequest({
        employee_id: "",
        absence_type: "",
        start_date: "",
        end_date: "",
        reason: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la solicitud",
        variant: "destructive"
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // Aquí iría la llamada a la API para aprobar
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ha sido aprobada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // Aquí iría la llamada a la API para rechazar
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive"
      });
    }
  };

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = filteredRequests.filter(r => r.status === 'approved').length;
  const totalDaysRequested = filteredRequests.reduce((sum, r) => sum + r.days_requested, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ausencias</h1>
          <p className="text-gray-600 mt-2">Administra solicitudes de vacaciones y permisos</p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Ausencia</DialogTitle>
              <DialogDescription>
                Completa la información para la solicitud
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">Empleado</Label>
                <Select 
                  value={newRequest.employee_id}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, employee_id: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: Employee) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name || `${emp.first_name} ${emp.last_name}`} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <Select 
                  value={newRequest.absence_type}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, absence_type: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Tipo de ausencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {absenceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">Desde</Label>
                <Input
                  id="start_date"
                  type="date"
                  className="col-span-3"
                  value={newRequest.start_date}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">Hasta</Label>
                <Input
                  id="end_date"
                  type="date"
                  className="col-span-3"
                  value={newRequest.end_date}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Motivo</Label>
                <Textarea
                  id="reason"
                  className="col-span-3"
                  placeholder="Describe el motivo de la solicitud"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitRequest}>
                Enviar Solicitud
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingRequests}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Aprobadas</p>
                <p className="text-2xl font-bold text-green-900">{approvedRequests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Solicitudes</p>
                <p className="text-2xl font-bold text-blue-900">{filteredRequests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Días Solicitados</p>
                <p className="text-2xl font-bold text-purple-900">{totalDaysRequested}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por empleado o tipo de ausencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Solicitudes</TabsTrigger>
          <TabsTrigger value="calendar">Vista Calendario</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Requests List */}
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(request.employee_name || 'E').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.employee_name || 'Empleado no encontrado'}</h3>
                        <p className="text-sm text-gray-600">
                          {absenceTypes.find(t => t.value === request.absence_type)?.label || request.absence_type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.start_date).toLocaleDateString('es-ES')} - {new Date(request.end_date).toLocaleDateString('es-ES')}
                          <span className="ml-2">({request.days_requested} días)</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{getStatusLabel(request.status)}</span>
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailOpen(true);
                          }}
                        >
                          Ver Detalles
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {request.reason && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Motivo:</strong> {request.reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vista de Calendario</h3>
              <p className="text-gray-600">
                La vista de calendario estará disponible próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Análisis de Ausencias</h3>
              <p className="text-gray-600">
                Los reportes y análisis estarán disponibles próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de ausencia
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Empleado</Label>
                  <p className="text-gray-900">{selectedRequest.employee_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Ausencia</Label>
                  <p className="text-gray-900">
                    {absenceTypes.find(t => t.value === selectedRequest.absence_type)?.label || selectedRequest.absence_type}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha de Inicio</Label>
                  <p className="text-gray-900">{new Date(selectedRequest.start_date).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha de Fin</Label>
                  <p className="text-gray-900">{new Date(selectedRequest.end_date).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Días Solicitados</Label>
                  <p className="text-gray-900">{selectedRequest.days_requested}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
              </div>
              
              {selectedRequest.reason && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Motivo</Label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.reason}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha de Solicitud</Label>
                <p className="text-gray-900">{new Date(selectedRequest.created_at).toLocaleDateString('es-ES')}</p>
              </div>
              
              {selectedRequest.approved_by && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Aprobado por</Label>
                  <p className="text-gray-900">{selectedRequest.approved_by}</p>
                </div>
              )}
              
              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notas</Label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" 
                ? "Intenta ajustar los filtros de búsqueda"
                : "No hay solicitudes de ausencia registradas"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
