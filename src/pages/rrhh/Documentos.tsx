
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Search, Edit, Eye, Trash2, User, Settings } from 'lucide-react';
import { useEmployees } from '@/hooks/useRRHHData';
import { useDocuments } from '@/hooks/useDocuments';
import { EmployeeEditForm } from '@/components/rrhh/EmployeeEditForm';
import type { Employee } from '@/types/rrhh';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  visibility: string;
  is_required: boolean;
  created_at: string;
  employee_id: string;
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface LocalEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  status: 'Activo' | 'Inactivo' | 'Vacaciones' | 'Licencia' | 'Suspendido';
  employment_type: string;
  hire_date: string;
}

export default function Documentos() {
  const { toast } = useToast();
  const { data: employees = [], refetch: refetchEmployees } = useEmployees();
  const { documents, loading, loadDocuments, uploadDocument, deleteDocument } = useDocuments();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [documentType, setDocumentType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Estados para el formulario de subida
  const [uploadForm, setUploadForm] = useState({
    employeeId: '',
    documentName: '',
    documentType: 'contract',
    isRequired: false,
    visibility: 'private'
  });

  useEffect(() => {
    loadDocuments({
      employeeId: selectedEmployeeId,
      documentType: documentType,
      searchTerm: searchTerm
    });
  }, [selectedEmployeeId, documentType, searchTerm]);

  const documentTypes = [
    { value: 'contract', label: 'Contrato' },
    { value: 'id', label: 'Identificación' },
    { value: 'cv', label: 'Currículum' },
    { value: 'certificate', label: 'Certificado' },
    { value: 'evaluation', label: 'Evaluación' },
    { value: 'training', label: 'Capacitación' },
    { value: 'other', label: 'Otro' }
  ];

  const handleUploadDocument = async () => {
    try {
      await uploadDocument({
        employeeId: uploadForm.employeeId,
        documentName: uploadForm.documentName,
        documentType: uploadForm.documentType,
        filePath: `/documents/${uploadForm.employeeId}/${Date.now()}-${uploadForm.documentName}`,
        isRequired: uploadForm.isRequired,
        visibility: uploadForm.visibility
      });
      
      setIsUploadDialogOpen(false);
      setUploadForm({
        employeeId: '',
        documentName: '',
        documentType: 'contract',
        isRequired: false,
        visibility: 'private'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleEditEmployee = (employee: LocalEmployee) => {
    // Convert LocalEmployee to Employee type for the form
    const employeeForForm: Employee = {
      ...employee,
      phone: '',
      department: '',
      salary: 0,
      birth_date: '',
      name: `${employee.first_name} ${employee.last_name}`
    };
    setSelectedEmployee(employeeForForm);
    setIsEditFormOpen(true);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Empleado no encontrado';
  };

  const filteredEmployees = employees.filter(emp => 
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Transform employees from service to local interface with proper status typing
  const transformedEmployees: LocalEmployee[] = employees.map(emp => ({
    id: emp.id,
    first_name: emp.first_name,
    last_name: emp.last_name,
    email: emp.email,
    position: emp.position,
    status: emp.status as 'Activo' | 'Inactivo' | 'Vacaciones' | 'Licencia' | 'Suspendido',
    employment_type: emp.employment_type || 'Interno',
    hire_date: emp.hire_date
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Documentos</h1>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Empleado</Label>
                <Select value={uploadForm.employeeId} onValueChange={(value) => setUploadForm(prev => ({ ...prev, employeeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentName">Nombre del Documento</Label>
                <Input
                  id="documentName"
                  value={uploadForm.documentName}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, documentName: e.target.value }))}
                  placeholder="Ej: Contrato de trabajo 2024"
                />
              </div>
              <div>
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select value={uploadForm.documentType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, documentType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUploadDocument}>
                  Subir Documento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documentos Generales</TabsTrigger>
          <TabsTrigger value="employees">Expedientes</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Empleado</Label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
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
                  <Label>Tipo de Documento</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar documentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de documentos */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay documentos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza subiendo un documento para este empleado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              documents.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{doc.document_name}</h3>
                          <p className="text-sm text-gray-500">
                            {getEmployeeName(doc.employee_id)} • {documentTypes.find(t => t.value === doc.document_type)?.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            Subido el {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={doc.is_required ? 'destructive' : 'secondary'}>
                          {doc.is_required ? 'Requerido' : 'Opcional'}
                        </Badge>
                        <Badge variant="outline">
                          {doc.visibility === 'private' ? 'Privado' : 'Público'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteDocument(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="grid gap-4">
            {transformedEmployees.map(employee => (
              <Card key={employee.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {employee.first_name[0]}{employee.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.first_name} {employee.last_name}</h3>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                        <p className="text-xs text-gray-400">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={employee.status === 'Activo' ? 'default' : 'secondary'}>
                        {employee.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployeeId(employee.id);
                          // Cambiar a la pestaña de documentos
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Ver Docs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Documentos Requeridos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Contratos activos</span>
                    <Badge variant="default">{documents.filter(d => d.document_type === 'contract').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documentos de ID</span>
                    <Badge variant="default">{documents.filter(d => d.document_type === 'id').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Certificados</span>
                    <Badge variant="default">{documents.filter(d => d.document_type === 'certificate').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Estado de Cumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Empleados completos</span>
                    <Badge variant="default">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documentos pendientes</span>
                    <Badge variant="destructive">15</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Próximos a vencer</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Generar reporte de cumplimiento
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Notificar documentos pendientes
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Configurar alertas automáticas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <EmployeeEditForm
        employee={selectedEmployee}
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSave={() => refetchEmployees()}
      />
    </div>
  );
}
