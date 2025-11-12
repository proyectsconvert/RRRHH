import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { sendEvolutionMessage } from '@/utils/evolution-api';
import { Candidate } from '@/types/candidate';
import { getCandidateByCedula } from '@/services/candidate-service';

interface ValidationCode {
  code: string;
  expiresAt: number;
  cedula: string;
}

const StatusCheck = () => {
  const [cedula, setCedula] = useState('');
  const [step, setStep] = useState<'input' | 'code' | 'status'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'code' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStep('input');
            setError('El código ha expirado. Por favor, solicita uno nuevo.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const saveValidationCode = (code: string, cedula: string) => {
    const validationCode: ValidationCode = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      cedula
    };
    localStorage.setItem('statusCheckValidation', JSON.stringify(validationCode));
  };

  const getValidationCode = (): ValidationCode | null => {
    const stored = localStorage.getItem('statusCheckValidation');
    if (!stored) return null;
    return JSON.parse(stored);
  };

  const handleSendCode = async () => {
    if (!cedula.trim()) {
      setError('Por favor ingresa tu número de cédula');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Query candidate by cedula
      const candidateData = await getCandidateByCedula(cedula.trim());

      if (!candidateData) {
        throw new Error('No se encontró un candidato con esa cédula');
      }

      if (!candidateData.phone) {
        throw new Error('No se encontró un número de teléfono asociado a esta cédula');
      }

      // Generate and save validation code
      const code = generateCode();
      saveValidationCode(code, cedula.trim());

      // Send code via WhatsApp
      const message = `Tu código de validación para consultar el estado de tu postulación es: ${code}. Este código expira en 5 minutos.`;
      await sendEvolutionMessage(candidateData.phone, message);

      setCandidate(candidateData);
      setStep('code');
      setTimeLeft(300); // 5 minutes
      setSuccess('Código enviado exitosamente. Revisa tu WhatsApp.');

    } catch (err: any) {
      setError(err.message || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCode = () => {
    const validationCode = getValidationCode();

    if (!validationCode || validationCode.cedula !== cedula.trim()) {
      setError('Código inválido o expirado');
      return;
    }

    if (Date.now() > validationCode.expiresAt) {
      setError('El código ha expirado. Por favor, solicita uno nuevo.');
      setStep('input');
      return;
    }

    if (enteredCode !== validationCode.code) {
      setError('Código incorrecto');
      return;
    }

    // Code is valid, show status
    setStep('status');
    setError('');
    setSuccess('Código validado correctamente');
  };

  const handleResendCode = () => {
    setStep('input');
    setEnteredCode('');
    setTimeLeft(0);
    setError('');
    setSuccess('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'entrevista rc':
      case 'entrevista tecnica':
      case 'evaluacion':
        return 'text-blue-600';
      case 'aprobado':
      case 'approved':
        return 'text-green-600';
      case 'rechazado':
      case 'rejected':
        return 'text-red-600';
      case 'en revision':
      case 'in_review':
        return 'text-yellow-600';
      case 'contratado':
      case 'hired':
        return 'text-purple-600';
      case 'pendiente':
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status?: string) => {
    if (!status) return 'Pendiente';
    return status; // Mostrar el estado tal como viene de la base de datos
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-hrm-light-gray/30 to-white py-16">
      <div className="hrm-container">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-hrm-dark-cyan">
                Consultar Estado de Postulación
              </CardTitle>
              <CardDescription>
                Ingresa tu número de cédula para verificar el estado de tu postulación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {step === 'input' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Número de Cédula</Label>
                    <Input
                      id="cedula"
                      type="text"
                      placeholder="Ingresa tu número de cédula"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando código...
                      </>
                    ) : (
                      'Enviar Código de Validación'
                    )}
                  </Button>
                </>
              )}

              {step === 'code' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código de Validación</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Ingresa el código de 6 dígitos"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                      maxLength={6}
                    />
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Tiempo restante: {formatTime(timeLeft)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={handleValidateCode}
                      disabled={enteredCode.length !== 6}
                      className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                    >
                      Validar Código
                    </Button>
                    <Button
                      onClick={handleResendCode}
                      variant="outline"
                      className="w-full"
                    >
                      Solicitar Nuevo Código
                    </Button>
                  </div>
                </>
              )}

              {step === 'status' && candidate && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-hrm-dark-cyan">
                      Estado de tu Postulación
                    </h3>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Nombre:</span> {candidate.first_name} {candidate.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {candidate.email}
                      </div>
                      <div>
                        <span className="font-medium">Estado del Candidato:</span>
                        <span className={`ml-2 font-semibold ${getStatusColor(candidate.status)}`}>
                          {getStatusText(candidate.status)}
                        </span>
                      </div>
                      {candidate.applications && candidate.applications.length > 0 && (
                        <div>
                          <span className="font-medium">Vacantes aplicadas:</span>
                          <ul className="mt-1 ml-4 list-disc">
                            {candidate.applications.map((app, index) => (
                              <li key={index}>
                                {app.job_title} - {getStatusText(app.status)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setStep('input');
                      setCedula('');
                      setEnteredCode('');
                      setCandidate(null);
                      setError('');
                      setSuccess('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Consultar Otro Estado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatusCheck;