import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Eye, Download, Search, User, StickyNote, Clock, Users, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeEditForm } from '@/components/rrhh/EmployeeEditForm';
import { DocumentUpload } from '@/components/rrhh/DocumentUpload';
import { EmployeeNotes } from '@/components/rrhh/EmployeeNotes';
import { AttendanceRegister } from '@/components/rrhh/AttendanceRegister';
import { AttendanceAdminView } from '@/components/rrhh/AttendanceAdminView';
import { AttendanceEmployeeView } from '@/components/rrhh/AttendanceEmployeeView';
import { OrganizationalChart } from '@/components/rrhh/OrganizationalChart';
import type { Employee as RRHHEmployee } from '@/types/rrhh';

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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  status: string;
  employment_type: string;
  hire_date: string;
}

export default function Expedientes() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<RRHHEmployee | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Nuevos estados para las funcionalidades
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [selectedEmployeeForUpload, setSelectedEmployeeForUpload] = useState<Employee | null>(null);
  const [isAttendanceRegisterOpen, setIsAttendanceRegisterOpen] = useState(false);
  const [selectedEmployeeForAttendance, setSelectedEmployeeForAttendance] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDocuments();
    loadEmployees();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_employee_documents')
        .select(`
          *,
          rrhh_employees_master!employee_id(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedDocuments = (data || []).map(doc => ({
        ...doc,
        employee: doc.rrhh_employees_master ? {
          first_name: doc.rrhh_employees_master.first_name,
          last_name: doc.rrhh_employees_master.last_name,
          email: doc.rrhh_employees_master.email
        } : undefined
      }));
      
      setDocuments(transformedDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('rrhh_employees_master')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    const rrhhEmployee: RRHHEmployee = {
      ...employee,
      status: employee.status as 'Activo' | 'Inactivo' | 'Vacaciones' | 'Licencia' | 'Suspendido',
      phone: '',
      department: '',
      salary: 0,
      birth_date: '',
      name: `${employee.first_name} ${employee.last_name}`
    };
    setSelectedEmployee(rrhhEmployee);
    setIsEditFormOpen(true);
  };

  const handleSaveEmployee = () => {
    loadEmployees();
  };

  const handleUploadDocument = (employee: Employee) => {
    setSelectedEmployeeForUpload(employee);
    setIsDocumentUploadOpen(true);
  };

  const handleRegisterAttendance = (employee: Employee) => {
    setSelectedEmployeeForAttendance(employee);
    setIsAttendanceRegisterOpen(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeDocuments = (employeeId: string) => {
    return documents.filter(doc => doc.employee_id === employeeId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Expedientes</h1>
        <div className="text-center py-8">Cargando expedientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expedientes</h1>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="employees">Empleados</TabsTrigger>
          <TabsTrigger value="attendance-admin">Validar Jornada</TabsTrigger>
          <TabsTrigger value="attendance-employee">Mi Jornada</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="orgchart">Organigrama</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Buscar Empleado</CardTitle>
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee) => {
                  const employeeDocs = getEmployeeDocuments(employee.id);
                  return (
                    <Card key={employee.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">{employee.position}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Documentos:</span>
                            <Badge variant="outline">{employeeDocs.length}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Estado:</span>
                            <Badge variant={employee.status === 'Activo' ? 'default' : 'secondary'}>
                              {employee.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <User className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadDocument(employee)}
                            className="text-cyan-600 hover:text-cyan-700"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Documento
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegisterAttendance(employee)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Jornada
                          </Button>
                        </div>

                        {/* Sección de notas para este empleado */}
                        <div className="mt-4">
                          <EmployeeNotes 
                            employeeId={employee.id} 
                            employeeName={`${employee.first_name} ${employee.last_name}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance-admin" className="space-y-4">
          <AttendanceAdminView />
        </TabsContent>

        <TabsContent value="attendance-employee" className="space-y-4">
          <AttendanceEmployeeView />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay documentos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Los documentos aparecerán aquí cuando se suban desde la pestaña de empleados.
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
                            {doc.employee?.first_name} {doc.employee?.last_name} • {doc.document_type}
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="orgchart" className="space-y-4">
          <OrganizationalChart employees={employees} />
        </TabsContent>
      </Tabs>

      {/* Diálogos modales */}
      <EmployeeEditForm
        employee={selectedEmployee}
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSave={handleSaveEmployee}
      />

      {selectedEmployeeForUpload && (
        <DocumentUpload
          employeeId={selectedEmployeeForUpload.id}
          employeeName={`${selectedEmployeeForUpload.first_name} ${selectedEmployeeForUpload.last_name}`}
          isOpen={isDocumentUploadOpen}
          onClose={() => {
            setIsDocumentUploadOpen(false);
            setSelectedEmployeeForUpload(null);
          }}
          onSuccess={() => {
            loadDocuments();
          }}
        />
      )}

      {selectedEmployeeForAttendance && (
        <AttendanceRegister
          employeeId={selectedEmployeeForAttendance.id}
          employeeName={`${selectedEmployeeForAttendance.first_name} ${selectedEmployeeForAttendance.last_name}`}
          selectedDate={selectedDate}
          isOpen={isAttendanceRegisterOpen}
          onClose={() => {
            setIsAttendanceRegisterOpen(false);
            setSelectedEmployeeForAttendance(null);
          }}
          onSuccess={() => {
            // Recargar datos si es necesario
          }}
        />
      )}
    </div>
  );
}
