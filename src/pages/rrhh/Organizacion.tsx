
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Crown,
  UserCheck
} from "lucide-react";
import { useRRHHData } from "@/hooks/useRRHHData";
import type { Employee } from "@/types/rrhh";

interface Department {
  id: string;
  name: string;
  manager: string;
  employees: Employee[];
  isExpanded?: boolean;
}

export default function Organizacion() {
  const { employees, isLoading } = useRRHHData();
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (employees.length > 0) {
      const deptMap = new Map<string, Department>();
      
      employees.forEach((employee: Employee) => {
        const deptName = typeof employee.department === 'string' 
          ? employee.department 
          : employee.department?.name || 'Sin departamento';
          
        if (!deptMap.has(deptName)) {
          deptMap.set(deptName, {
            id: deptName.toLowerCase().replace(/\s+/g, '-'),
            name: deptName,
            manager: employee.position.toLowerCase().includes('manager') || 
                     employee.position.toLowerCase().includes('director') || 
                     employee.position.toLowerCase().includes('jefe') 
                     ? (employee.name || `${employee.first_name} ${employee.last_name}`) 
                     : 'Sin asignar',
            employees: [],
            isExpanded: true
          });
        }
        deptMap.get(deptName)!.employees.push(employee);
      });

      setDepartments(Array.from(deptMap.values()));
    }
  }, [employees]);

  const toggleDepartment = (deptId: string) => {
    setDepartments(prev => prev.map(dept => 
      dept.id === deptId ? { ...dept, isExpanded: !dept.isExpanded } : dept
    ));
  };

  const filteredDepartments = departments.map(dept => ({
    ...dept,
    employees: dept.employees.filter((emp: Employee) => {
      const employeeName = emp.name || `${emp.first_name} ${emp.last_name}`;
      return employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    })
  })).filter(dept => dept.employees.length > 0 || !searchTerm);

  const totalEmployees = employees.length;
  const totalDepartments = departments.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando organigrama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organigrama Empresarial</h1>
          <p className="text-gray-600 mt-2">Estructura organizacional y jerarquía de la empresa</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Departamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Empleados</p>
                <p className="text-2xl font-bold text-blue-900">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Departamentos</p>
                <p className="text-2xl font-bold text-green-900">{totalDepartments}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Promedio por Depto</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar empleados por nombre o posición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart */}
      <div className="space-y-4">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleDepartment(department.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {department.isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <Building2 className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Manager: {department.manager}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {department.employees.length} empleados
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            {department.isExpanded && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-8">
                  {department.employees.map((employee: Employee) => {
                    const employeeName = employee.name || `${employee.first_name} ${employee.last_name}`;
                    
                    return (
                      <div
                        key={employee.id}
                        className="flex items-center gap-3 p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {employeeName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{employeeName}</h4>
                          <p className="text-sm text-gray-600 truncate">{employee.position}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge 
                            className={`text-xs ${
                              employee.status === 'Activo' ? 'bg-green-100 text-green-800' :
                              employee.status === 'Vacaciones' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {employee.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {department.employees.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron empleados que coincidan con la búsqueda
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron departamentos</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "Intenta ajustar el término de búsqueda"
                : "Comienza creando la estructura organizacional"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Company Hierarchy Overview */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            Vista Jerárquica
          </CardTitle>
          <CardDescription>
            Estructura organizacional de la empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Dirección General</span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-300"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="text-center">
                  <div className="bg-white border-2 border-cyan-200 rounded-lg p-4 shadow-sm">
                    <Building2 className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{dept.manager}</p>
                    <Badge variant="outline" className="mt-2">
                      {dept.employees.length} empleados
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
