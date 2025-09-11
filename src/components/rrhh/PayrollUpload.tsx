
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface PayrollUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENCIES = [
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'MX', name: 'Peso Mexicano', symbol: '$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' }
];

const EXCHANGE_RATES = {
  COP: 1,      // Base currency
  MX: 0.054,   // 1 COP = 0.054 MX
  USD: 0.00025, // 1 COP = 0.00025 USD
  EUR: 0.00023  // 1 COP = 0.00023 EUR
};

export const PayrollUpload: React.FC<PayrollUploadProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('COP');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [uploading, setUploading] = useState(false);

  const generateTemplate = () => {
    const currency = CURRENCIES.find(c => c.code === selectedCurrency);
    const template = [
      {
        'ID Empleado': 'EMP001',
        'Nombre': 'Juan',
        'Apellidos': 'Pérez García',
        'Salario Base': selectedCurrency === 'COP' ? 3000000 : selectedCurrency === 'MX' ? 15000 : selectedCurrency === 'USD' ? 1200 : 1000,
        'Horas Extra': selectedCurrency === 'COP' ? 200000 : selectedCurrency === 'MX' ? 1000 : selectedCurrency === 'USD' ? 80 : 70,
        'Bonificaciones': selectedCurrency === 'COP' ? 500000 : selectedCurrency === 'MX' ? 2500 : selectedCurrency === 'USD' ? 200 : 180,
        'Deducciones': selectedCurrency === 'COP' ? 300000 : selectedCurrency === 'MX' ? 1500 : selectedCurrency === 'USD' ? 120 : 100,
        'Impuestos': selectedCurrency === 'COP' ? 450000 : selectedCurrency === 'MX' ? 2250 : selectedCurrency === 'USD' ? 180 : 160,
        'Salario Neto': selectedCurrency === 'COP' ? 2950000 : selectedCurrency === 'MX' ? 14750 : selectedCurrency === 'USD' ? 1180 : 1050,
        [`Moneda (${currency?.symbol})`]: selectedCurrency,
        'Período': '2024-01'
      },
      {
        'ID Empleado': 'EMP002',
        'Nombre': 'María',
        'Apellidos': 'González López',
        'Salario Base': selectedCurrency === 'COP' ? 3500000 : selectedCurrency === 'MX' ? 17500 : selectedCurrency === 'USD' ? 1400 : 1200,
        'Horas Extra': selectedCurrency === 'COP' ? 250000 : selectedCurrency === 'MX' ? 1250 : selectedCurrency === 'USD' ? 100 : 90,
        'Bonificaciones': selectedCurrency === 'COP' ? 600000 : selectedCurrency === 'MX' ? 3000 : selectedCurrency === 'USD' ? 240 : 220,
        'Deducciones': selectedCurrency === 'COP' ? 350000 : selectedCurrency === 'MX' ? 1750 : selectedCurrency === 'USD' ? 140 : 120,
        'Impuestos': selectedCurrency === 'COP' ? 525000 : selectedCurrency === 'MX' ? 2625 : selectedCurrency === 'USD' ? 210 : 190,
        'Salario Neto': selectedCurrency === 'COP' ? 3475000 : selectedCurrency === 'MX' ? 17375 : selectedCurrency === 'USD' ? 1390 : 1200,
        [`Moneda (${currency?.symbol})`]: selectedCurrency,
        'Período': '2024-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nómina');
    
    XLSX.writeFile(wb, `plantilla_nomina_${selectedCurrency}.xlsx`);
    
    toast({
      title: "Plantilla descargada",
      description: `Plantilla de nómina en ${selectedCurrency} descargada correctamente`
    });
  };

  const convertCurrency = (amount: number, from: string, to: string) => {
    const fromRate = EXCHANGE_RATES[from as keyof typeof EXCHANGE_RATES];
    const toRate = EXCHANGE_RATES[to as keyof typeof EXCHANGE_RATES];
    return (amount / fromRate) * toRate;
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Datos de nómina cargados:', jsonData);
        
        toast({
          title: "Nómina cargada",
          description: `Se procesaron ${jsonData.length} registros de nómina`
        });

        onSuccess();
        onClose();
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error('Error cargando nómina:', error);
      toast({
        title: "Error",
        description: "Error al procesar el archivo de nómina",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const exchangeRate = EXCHANGE_RATES[targetCurrency as keyof typeof EXCHANGE_RATES] / EXCHANGE_RATES[selectedCurrency as keyof typeof EXCHANGE_RATES];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Cargar Nómina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Moneda Principal</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Convertir a</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversión de moneda */}
          {selectedCurrency !== targetCurrency && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Tipo de Cambio</div>
              <div className="text-lg font-bold text-blue-700">
                1 {selectedCurrency} = {exchangeRate.toFixed(6)} {targetCurrency}
              </div>
            </div>
          )}

          {/* Plantilla descargable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plantilla de Nómina</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Descarga la plantilla de Excel para cargar los datos de nómina
              </p>
              <Button onClick={generateTemplate} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla ({selectedCurrency})
              </Button>
            </CardContent>
          </Card>

          {/* Carga de archivo */}
          <div>
            <Label>Cargar Archivo de Nómina</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Nómina
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
