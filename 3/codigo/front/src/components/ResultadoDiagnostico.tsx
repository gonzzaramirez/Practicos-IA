import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, Brain, Zap, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { ProbabilidadesChart } from './ProbabilidadesChart';
import type { ResultadoDiagnostico } from '@/types';

interface ResultadoDiagnosticoProps {
  resultado: ResultadoDiagnostico;
  tipo: 'deterministico' | 'probabilistico' | 'difuso';
}

const tipoLabels = {
  deterministico: 'Determinístico',
  probabilistico: 'Probabilístico',
  difuso: 'Difuso',
};

const tipoIcons = {
  deterministico: Brain,
  probabilistico: Activity,
  difuso: Zap,
};

const tipoColors = {
  deterministico: 'bg-blue-500 hover:bg-blue-600',
  probabilistico: 'bg-purple-500 hover:bg-purple-600',
  difuso: 'bg-green-500 hover:bg-green-600',
};

export function ResultadoDiagnosticoCard({ resultado, tipo }: ResultadoDiagnosticoProps) {
  const Icon = tipoIcons[tipo];
  
  const getDiagnosticoColor = (diagnostico: string) => {
    if (diagnostico.toLowerCase().includes('dengue')) {
      return 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950';
    }
    if (diagnostico.toLowerCase().includes('covid')) {
      return 'bg-red-500 hover:bg-red-600 text-red-950';
    }
    return 'bg-gray-500 hover:bg-gray-600';
  };

  const getDiagnosticoIcon = (diagnostico: string) => {
    if (diagnostico.toLowerCase().includes('dengue') || diagnostico.toLowerCase().includes('covid')) {
      return <AlertCircle className="w-4 h-4 mr-2" />;
    }
    return <CheckCircle2 className="w-4 h-4 mr-2" />;
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${tipoColors[tipo]} text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">{tipoLabels[tipo]}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Sistema basado en {tipoLabels[tipo].toLowerCase()}
              </CardDescription>
            </div>
          </div>
          <Badge className={tipoColors[tipo]} variant="default">
            {tipoLabels[tipo]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
          <div className={`p-3 rounded-full ${getDiagnosticoColor(resultado.diagnostico)} text-white`}>
            {getDiagnosticoIcon(resultado.diagnostico)}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Diagnóstico</p>
            <p className="text-lg font-semibold">{resultado.diagnostico}</p>
          </div>
        </div>

        {resultado.metrica && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-muted-foreground mb-1">Métrica</p>
            <p className="text-sm font-medium">{resultado.metrica}</p>
          </div>
        )}

        {tipo === 'probabilistico' && (
          <ProbabilidadesChart resultado={resultado} />
        )}

        {resultado.razonamiento && resultado.razonamiento.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Razonamiento
            </h4>
            <div className="space-y-2">
              {resultado.razonamiento.map((razon, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-muted/30 rounded-md border-l-2 border-primary/50 text-sm text-muted-foreground transition-all hover:bg-muted/50"
                >
                  <span className="text-primary font-bold mt-0.5">{index + 1}.</span>
                  <span>{razon}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {resultado.intermedio && Object.keys(resultado.intermedio).length > 0 && tipo !== 'probabilistico' && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Datos Intermedios</h4>
            <div className="bg-muted/50 p-4 rounded-lg border overflow-auto max-h-48">
              <pre className="text-xs text-muted-foreground">
                {JSON.stringify(resultado.intermedio, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultadoError({ error, tipo }: { error: string; tipo: string }) {
  return (
    <Alert variant="destructive" className="transition-all duration-300">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Error en {tipo}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

