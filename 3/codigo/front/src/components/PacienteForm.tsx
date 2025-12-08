import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { User, FileText, Loader2, Stethoscope } from 'lucide-react';
import type { DatosPaciente } from '@/types';
import { api } from '@/services/api';

interface PacienteFormProps {
  onSubmit: (datos: DatosPaciente) => void;
  isLoading?: boolean;
}

const valoresIniciales: DatosPaciente = {
  fiebre: false,
  tos: false,
  dolor_garganta: false,
  dolor_muscular: false,
  dolor_cabeza: false,
  edad: 35,
  sexo: 'masculino',
  region: 'corrientes',
  asma: false,
  medicacion_presion: false,
  viaje_reciente: false,
  destino_viaje: null,
  contacto_dengue: false,
  contacto_covid: false,
  temporada_verano: true,
  brote_dengue_zona: false,
  covid_activo_region: true,
  temperatura: 37.0,
  intensidad_tos: 0.0,
  dias_sintomas: 1,
};

export function PacienteForm({ onSubmit, isLoading = false }: PacienteFormProps) {
  const [datos, setDatos] = useState<DatosPaciente>(valoresIniciales);

  const cargarCasoEjemplo = async () => {
    try {
      const caso = await api.getCasoEjemplo();
      setDatos(caso.datos);
    } catch (error) {
      console.error('Error al cargar caso ejemplo:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(datos);
  };

  const handleChange = (field: keyof DatosPaciente, value: any) => {
    setDatos((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Datos del Paciente</CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Complete la información del paciente para el diagnóstico
              </CardDescription>
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={cargarCasoEjemplo} 
            disabled={isLoading}
            className="transition-all hover:scale-105 w-full sm:w-auto text-xs sm:text-sm"
            size="sm"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Caso Ejemplo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Síntomas */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Síntomas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="fiebre"
                  checked={datos.fiebre}
                  onCheckedChange={(checked) => handleChange('fiebre', checked)}
                />
                <Label htmlFor="fiebre" className="cursor-pointer">Fiebre</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="tos"
                  checked={datos.tos}
                  onCheckedChange={(checked) => handleChange('tos', checked)}
                />
                <Label htmlFor="tos" className="cursor-pointer">Tos</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="dolor_garganta"
                  checked={datos.dolor_garganta}
                  onCheckedChange={(checked) => handleChange('dolor_garganta', checked)}
                />
                <Label htmlFor="dolor_garganta" className="cursor-pointer">Dolor de Garganta</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="dolor_muscular"
                  checked={datos.dolor_muscular}
                  onCheckedChange={(checked) => handleChange('dolor_muscular', checked)}
                />
                <Label htmlFor="dolor_muscular" className="cursor-pointer">Dolor Muscular</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="dolor_cabeza"
                  checked={datos.dolor_cabeza}
                  onCheckedChange={(checked) => handleChange('dolor_cabeza', checked)}
                />
                <Label htmlFor="dolor_cabeza" className="cursor-pointer">Dolor de Cabeza</Label>
              </div>
            </div>
          </div>

          {/* Datos Personales */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Datos Personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  type="number"
                  value={datos.edad}
                  onChange={(e) => handleChange('edad', parseInt(e.target.value) || 0)}
                  min="0"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select value={datos.sexo} onValueChange={(value) => handleChange('sexo', value)}>
                  <SelectTrigger id="sexo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Select value={datos.region} onValueChange={(value) => handleChange('region', value)}>
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrientes">Corrientes</SelectItem>
                    <SelectItem value="buenos_aires">Buenos Aires</SelectItem>
                    <SelectItem value="cordoba">Córdoba</SelectItem>
                    <SelectItem value="mendoza">Mendoza</SelectItem>
                    <SelectItem value="otra">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Antecedentes */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Antecedentes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="asma"
                  checked={datos.asma}
                  onCheckedChange={(checked) => handleChange('asma', checked)}
                />
                <Label htmlFor="asma">Asma</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medicacion_presion"
                  checked={datos.medicacion_presion}
                  onCheckedChange={(checked) => handleChange('medicacion_presion', checked)}
                />
                <Label htmlFor="medicacion_presion">Medicación Presión</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="viaje_reciente"
                  checked={datos.viaje_reciente}
                  onCheckedChange={(checked) => handleChange('viaje_reciente', checked)}
                />
                <Label htmlFor="viaje_reciente">Viaje Reciente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contacto_dengue"
                  checked={datos.contacto_dengue}
                  onCheckedChange={(checked) => handleChange('contacto_dengue', checked)}
                />
                <Label htmlFor="contacto_dengue">Contacto Dengue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contacto_covid"
                  checked={datos.contacto_covid}
                  onCheckedChange={(checked) => handleChange('contacto_covid', checked)}
                />
                <Label htmlFor="contacto_covid">Contacto COVID</Label>
              </div>
            </div>
            {datos.viaje_reciente && (
              <div className="space-y-2">
                <Label htmlFor="destino_viaje">Destino del Viaje</Label>
                <Input
                  id="destino_viaje"
                  value={datos.destino_viaje || ''}
                  onChange={(e) => handleChange('destino_viaje', e.target.value || null)}
                  placeholder="Ej: Brasil, Paraguay..."
                />
              </div>
            )}
          </div>

          {/* Datos Epidemiológicos */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Datos Epidemiológicos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temporada_verano"
                  checked={datos.temporada_verano}
                  onCheckedChange={(checked) => handleChange('temporada_verano', checked)}
                />
                <Label htmlFor="temporada_verano">Temporada Verano</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="brote_dengue_zona"
                  checked={datos.brote_dengue_zona}
                  onCheckedChange={(checked) => handleChange('brote_dengue_zona', checked)}
                />
                <Label htmlFor="brote_dengue_zona">Brote Dengue Zona</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="covid_activo_region"
                  checked={datos.covid_activo_region}
                  onCheckedChange={(checked) => handleChange('covid_activo_region', checked)}
                />
                <Label htmlFor="covid_activo_region">COVID Activo Región</Label>
              </div>
            </div>
          </div>

          {/* Valores Numéricos (para enfoque difuso) */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Valores Numéricos (Enfoque Difuso)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperatura">Temperatura (°C)</Label>
                <Input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  value={datos.temperatura}
                  onChange={(e) => handleChange('temperatura', parseFloat(e.target.value) || 0)}
                  min="35"
                  max="42"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intensidad_tos">Intensidad Tos (0-10)</Label>
                <Input
                  id="intensidad_tos"
                  type="number"
                  step="0.1"
                  value={datos.intensidad_tos}
                  onChange={(e) => handleChange('intensidad_tos', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dias_sintomas">Días de Síntomas</Label>
                <Input
                  id="dias_sintomas"
                  type="number"
                  value={datos.dias_sintomas}
                  onChange={(e) => handleChange('dias_sintomas', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full transition-all hover:scale-[1.02] shadow-md" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4 mr-2" />
                Realizar Diagnóstico
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

