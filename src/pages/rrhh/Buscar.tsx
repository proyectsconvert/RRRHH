
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { employeeService, type Employee, type Department, type WorkCenter } from "@/services/rrhh-employee-service";
import { 
  Search, Filter, Users, MapPin, Building2, 
  Mail, Calendar, User, Briefcase
} from "lucide-react";

export default function Buscar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [filters, setFilters] = useState({
    department: '',
    workCenter: '',
    status: '',
    position: ''
  });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [departmentsResult, workCentersResult] = await Promise.all([
        employeeService.getDepartments(),
        employeeService.getWorkCenters()
      ]);

      setDepartments(departmentsResult);
      setWorkCenters(workCentersResult);
    } catch (error) {
      console.error('Error loading filter data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos para los filtros",
        variant: "destructive"
      });
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim() && !filters.department && !filters.workCenter && !filters.status && !filters.position) {
      toast({
        title: "Información",
        description: "Ingresa un término de búsqueda o selecciona al menos un filtro",
        variant: "default"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Performing search with:', { searchTerm, filters });

      const results = await employeeService.searchEmployees(searchTerm, {
        department: filters.department || undefined,
        workCenter: filters.workCenter || undefined,
        status: filters.status || undefined,
        position: filters.position || undefined
      });

      setEmployees(results);
      setHasSearched(true);
      
      console.log(`Search completed. Found ${results.length} employees`);
    } catch (error) {
      console.error('Error performing search:', error);
      toast({
        title: "Error",
        description: "Error al realizar la búsqueda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({
      department: '',
      workCenter: '',
      status: '',
      position: ''
    });
    setEmployees([]);
    setHasSearched(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-red-100 text-red-800';
      case 'Vacaciones': return 'bg-blue-100 text-blue-800';
      case 'Licencia': return 'bg-yellow-100 text-yellow-800';
      case 'Suspendido': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-8 w-8" />
            Búsqueda Avanzada
          </h1>
          <p className="text-gray-600 mt-1">
            Encuentra empleados usando filtros inteligentes
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Criterios de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email, posición o departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filters.department} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, department: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.workCenter} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, workCenter: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Centro de trabajo" />
              </SelectTrigger>
              <SelectContent>
                {workCenters.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name} {center.country_code && `(${center.country_code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                <SelectItem value="Licencia">Licencia</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Posición específica"
              value={filters.position}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
            />
          </div>

          {/* Search Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={performSearch} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button variant="outline" onClick={clearSearch}>
                Limpiar
              </Button>
            </div>
            {hasSearched && (
              <p className="text-sm text-gray-600">
                {employees.length} resultado{employees.length !== 1 ? 's' : ''} encontrado{employees.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length > 0 ? (
            employees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => navigate(`/rrhh/personal/${employee.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {employee.first_name?.charAt(0) || 'U'}{employee.last_name?.charAt(0) || 'N'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                  
                  {employee.department && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{employee.department.name}</span>
                    </div>
                  )}
                  
                  {employee.work_center && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{employee.work_center.name}</span>
                    </div>
                  )}
                  
                  {employee.team && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{employee.team.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Desde {new Date(employee.hire_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  {employee.manager && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>
                        Reporta a: {employee.manager.first_name} {employee.manager.last_name}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-600">
                    Intenta ajustar los criterios de búsqueda o filtros
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Búsqueda Avanzada de Empleados</h3>
            <p className="text-gray-600">
              Utiliza los filtros de arriba para encontrar empleados específicos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
