import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Edit,
  Eye,
  UserCheck,
  Award,
  GraduationCap
} from "lucide-react";
import { useRRHHData } from "@/hooks/useRRHHData";
import { EmployeeEditForm } from "@/components/rrhh/EmployeeEditForm";
import type { Employee } from "@/types/rrhh";

export default function Personal() {
  const { employees, isLoading, error } = useRRHHData();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredEmployees = employees.filter((employee: Employee) => {
    const employeeName = employee.name || `${employee.first_name} ${employee.last_name}`;
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const employeeDepartment = typeof employee.department === 'string' ? employee.department : employee.department?.name || '';
    const matchesDepartment = departmentFilter === "all" || employeeDepartment === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const departments = ["all", ...new Set(employees.map((emp: Employee) => {
    if (typeof emp.department === 'string') return emp.department;
    if (emp.department && typeof emp.department === 'object') return emp.department.name;
    return 'Sin departamento';
  }).filter(Boolean))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-red-100 text-red-800';
      case 'Vacaciones': return 'bg-blue-100 text-blue-800';
      case 'Licencia': return 'bg-yellow-100 text-yellow-800';
      case 'Suspendido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando personal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error al cargar los datos del personal</div>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
          <p className="text-gray-600 mt-2">Administra los expedientes y datos de los empleados</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo empleado
              </DialogDescription>
            </DialogHeader>
            <EmployeeEditForm 
              employee={null}
              isOpen={true}
              onClose={() => {}}
              onSave={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Empleados</p>
                <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Empleados Activos</p>
                <p className="text-2xl font-bold text-green-900">
                  {employees.filter((emp: Employee) => emp.status === 'Activo').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Departamentos</p>
                <p className="text-2xl font-bold text-purple-900">{departments.length - 1}</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Nuevos Este Mes</p>
                <p className="text-2xl font-bold text-orange-900">
                  {employees.filter((emp: Employee) => {
                    if (!emp.hire_date) return false;
                    const hireDate = new Date(emp.hire_date);
                    const now = new Date();
                    return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Plus className="h-8 w-8 text-orange-600" />
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
                  placeholder="Buscar por nombre, email o posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {departments.map(dept => (
                  <option key={String(dept)} value={String(dept)}>
                    {dept === "all" ? "Todos los departamentos" : String(dept)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee: Employee) => {
          const employeeName = employee.name || `${employee.first_name} ${employee.last_name}`;
          const employeeDepartment = typeof employee.department === 'string' ? employee.department : employee.department?.name || 'Sin departamento';
          
          return (
            <Card key={String(employee.id)} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {employeeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employeeName}</h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{employee.phone || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{employeeDepartment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Desde {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('es-ES') : 'No especificado'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsViewDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsEditDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Employee Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalles del Empleado</DialogTitle>
            <DialogDescription>
              Información completa del expediente
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="work">Laboral</TabsTrigger>
                <TabsTrigger value="performance">Rendimiento</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                    <p className="text-gray-900">{selectedEmployee.name || `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-gray-900">{selectedEmployee.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <p className="text-gray-900">{selectedEmployee.birth_date || 'No especificado'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="work" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Posición</label>
                    <p className="text-gray-900">{selectedEmployee.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Departamento</label>
                    <p className="text-gray-900">{typeof selectedEmployee.department === 'string' ? selectedEmployee.department : selectedEmployee.department?.name || 'Sin departamento'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de Contratación</label>
                    <p className="text-gray-900">{selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString('es-ES') : 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Salario</label>
                    <p className="text-gray-900">{selectedEmployee.salary ? `$${selectedEmployee.salary.toLocaleString()}` : 'No especificado'}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Datos de rendimiento disponibles próximamente</p>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Documentos del empleado disponibles próximamente</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Employee Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>
              Actualiza la información del empleado
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeEditForm 
              employee={selectedEmployee}
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              onSave={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron empleados</h3>
            <p className="text-gray-600">
              {searchTerm || departmentFilter !== "all" 
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando tu primer empleado"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
