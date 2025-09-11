
import React, { useState, useEffect } from "react";
import { Clock, MapPin, Calendar, Download, Users, CheckCircle, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  location: string;
  status: 'complete' | 'incomplete' | 'late';
}

const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  { date: "2025-05-28", checkIn: "08:05", checkOut: "17:30", location: "Oficina Principal", status: "complete" },
  { date: "2025-05-27", checkIn: "08:15", checkOut: "17:25", location: "Oficina Principal", status: "late" },
  { date: "2025-05-26", checkIn: "08:00", checkOut: "", location: "Oficina Principal", status: "incomplete" },
];

export default function Asistencia() {
  const [currentLocation, setCurrentLocation] = useState<string>("Obteniendo ubicación...");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    // Simulate getting current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setCurrentLocation("Ubicación no disponible");
        }
      );
    }

    // Check if user is already checked in today
    const today = new Date().toISOString().split('T')[0];
    const record = SAMPLE_ATTENDANCE.find(r => r.date === today);
    if (record) {
      setTodayRecord(record);
      setIsCheckedIn(!!record.checkIn && !record.checkOut);
    }
  }, []);

  const handleCheckIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('es-ES', { hour12: false }).slice(0, 5);
    const date = now.toISOString().split('T')[0];
    
    const newRecord: AttendanceRecord = {
      date,
      checkIn: time,
      checkOut: "",
      location: "Oficina Principal",
      status: "incomplete"
    };
    
    setTodayRecord(newRecord);
    setIsCheckedIn(true);
  };

  const handleCheckOut = () => {
    if (todayRecord) {
      const now = new Date();
      const time = now.toLocaleTimeString('es-ES', { hour12: false }).slice(0, 5);
      
      const updatedRecord = {
        ...todayRecord,
        checkOut: time,
        status: "complete" as const
      };
      
      setTodayRecord(updatedRecord);
      setIsCheckedIn(false);
    }
  };

  const getTotalHours = () => {
    return SAMPLE_ATTENDANCE
      .filter(record => record.checkOut)
      .reduce((total, record) => {
        const checkIn = new Date(`2000-01-01 ${record.checkIn}`);
        const checkOut = new Date(`2000-01-01 ${record.checkOut}`);
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-7 w-7 text-cyan-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Asistencia</h1>
          <p className="text-gray-600">Control de jornada laboral con geolocalización</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas Esta Semana</p>
              <p className="text-2xl font-bold text-blue-600">{getTotalHours().toFixed(1)}h</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Días Trabajados</p>
              <p className="text-2xl font-bold text-green-600">{SAMPLE_ATTENDANCE.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Llegadas Tardías</p>
              <p className="text-2xl font-bold text-orange-600">
                {SAMPLE_ATTENDANCE.filter(r => r.status === 'late').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Asistencia</p>
              <p className="text-2xl font-bold text-purple-600">98%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Check In/Out Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registro de Jornada</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-900">Ubicación Actual</div>
                <div className="text-sm text-blue-700">{currentLocation}</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  isCheckedIn
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {isCheckedIn ? "Ya registraste entrada" : "Registrar Entrada"}
              </button>
              
              <button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !isCheckedIn
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                Registrar Salida
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Mi Jornada de Hoy</h4>
            {todayRecord ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrada:</span>
                  <span className="font-medium">{todayRecord.checkIn || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salida:</span>
                  <span className="font-medium">{todayRecord.checkOut || "--:--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="font-medium text-sm">{todayRecord.location}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No hay registro para hoy</p>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Historial de Asistencia</h3>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[todayRecord, ...SAMPLE_ATTENDANCE].filter(Boolean).map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record!.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record!.checkIn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record!.checkOut || "--:--"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record!.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record!.status === "complete" 
                        ? "bg-green-100 text-green-800"
                        : record!.status === "late"
                        ? "bg-orange-100 text-orange-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {record!.status === "complete" ? "Completo" : 
                       record!.status === "late" ? "Tardía" : "Incompleto"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-900">Nota para Administradores</h4>
            <p className="text-sm text-amber-700 mt-1">
              Los administradores y personal de RRHH pueden ver y exportar reportes completos de asistencia de todos los empleados desde el módulo de análisis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
