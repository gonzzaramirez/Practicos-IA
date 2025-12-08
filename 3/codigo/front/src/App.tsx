import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PacienteForm } from '@/components/PacienteForm';
import { ResultadoDiagnosticoCard, ResultadoError } from '@/components/ResultadoDiagnostico';
import { ResumenDiagnosticos } from '@/components/ResumenDiagnosticos';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Brain, Zap, BarChart3 } from 'lucide-react';
import type { DatosPaciente, ResultadoDiagnostico, ResultadosTodos } from '@/types';
import { api } from '@/services/api';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultadoDeterministico, setResultadoDeterministico] = useState<ResultadoDiagnostico | null>(null);
  const [resultadoProbabilistico, setResultadoProbabilistico] = useState<ResultadoDiagnostico | null>(null);
  const [resultadoDifuso, setResultadoDifuso] = useState<ResultadoDiagnostico | null>(null);
  const [resultadosTodos, setResultadosTodos] = useState<ResultadosTodos | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnostico = async (datos: DatosPaciente, tipo: 'deterministico' | 'probabilistico' | 'difuso' | 'todos') => {
    setIsLoading(true);
    setError(null);

    try {
      if (tipo === 'todos') {
        const resultados = await api.diagnosticoTodos(datos);
        setResultadosTodos(resultados);
        // También actualizar los resultados individuales si no hay error
        if (!('error' in resultados.deterministico)) {
          setResultadoDeterministico(resultados.deterministico);
        }
        if (!('error' in resultados.probabilistico)) {
          setResultadoProbabilistico(resultados.probabilistico);
        }
        if (!('error' in resultados.difuso)) {
          setResultadoDifuso(resultados.difuso);
        }
      } else if (tipo === 'deterministico') {
        const resultado = await api.diagnosticoDeterministico(datos);
        setResultadoDeterministico(resultado);
      } else if (tipo === 'probabilistico') {
        const resultado = await api.diagnosticoProbabilistico(datos);
        setResultadoProbabilistico(resultado);
      } else if (tipo === 'difuso') {
        const resultado = await api.diagnosticoDifuso(datos);
        setResultadoDifuso(resultado);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-primary/10 rounded-full mb-3 sm:mb-4">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
            Sistema Experto Médico
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Diagnóstico de Dengue y COVID-19 usando IA Simbólica
          </p>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Formulario */}
          <div className="order-2 xl:order-1">
            <PacienteForm
              onSubmit={(datos) => handleDiagnostico(datos, 'todos')}
              isLoading={isLoading}
            />
          </div>

          {/* Resultados */}
          <div className="order-1 xl:order-2">
            <Tabs defaultValue="todos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="todos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Todos</span>
                  <span className="sm:hidden">Resumen</span>
                </TabsTrigger>
                <TabsTrigger value="deterministico" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Determinístico</span>
                  <span className="sm:hidden">Det.</span>
                </TabsTrigger>
                <TabsTrigger value="probabilistico" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Probabilístico</span>
                  <span className="sm:hidden">Prob.</span>
                </TabsTrigger>
                <TabsTrigger value="difuso" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Difuso</span>
                  <span className="sm:hidden">Dif.</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todos" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {resultadosTodos ? (
                  <ResumenDiagnosticos resultados={resultadosTodos} />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 sm:py-16">
                      <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground opacity-50" />
                        <div>
                          <p className="text-muted-foreground text-base sm:text-lg font-medium mb-1">
                            No hay resultados aún
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Complete el formulario y haga clic en "Realizar Diagnóstico"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="deterministico" className="space-y-4 mt-4 sm:mt-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {resultadoDeterministico ? (
                  <ResultadoDiagnosticoCard
                    resultado={resultadoDeterministico}
                    tipo="deterministico"
                  />
                ) : resultadosTodos && 'error' in resultadosTodos.deterministico ? (
                  <ResultadoError
                    error={resultadosTodos.deterministico.error}
                    tipo="Determinístico"
                  />
                ) : resultadosTodos && !('error' in resultadosTodos.deterministico) ? (
                  <ResultadoDiagnosticoCard
                    resultado={resultadosTodos.deterministico}
                    tipo="deterministico"
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 sm:py-16">
                      <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground opacity-50" />
                        <div>
                          <p className="text-muted-foreground text-base sm:text-lg font-medium mb-1">
                            No hay resultados aún
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Complete el formulario y haga clic en "Realizar Diagnóstico"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="probabilistico" className="space-y-4 mt-4 sm:mt-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {resultadoProbabilistico ? (
                  <ResultadoDiagnosticoCard
                    resultado={resultadoProbabilistico}
                    tipo="probabilistico"
                  />
                ) : resultadosTodos && 'error' in resultadosTodos.probabilistico ? (
                  <ResultadoError
                    error={resultadosTodos.probabilistico.error}
                    tipo="Probabilístico"
                  />
                ) : resultadosTodos && !('error' in resultadosTodos.probabilistico) ? (
                  <ResultadoDiagnosticoCard
                    resultado={resultadosTodos.probabilistico}
                    tipo="probabilistico"
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 sm:py-16">
                      <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground opacity-50" />
                        <div>
                          <p className="text-muted-foreground text-base sm:text-lg font-medium mb-1">
                            No hay resultados aún
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Complete el formulario y haga clic en "Realizar Diagnóstico"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="difuso" className="space-y-4 mt-4 sm:mt-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {resultadoDifuso ? (
                  <ResultadoDiagnosticoCard
                    resultado={resultadoDifuso}
                    tipo="difuso"
                  />
                ) : resultadosTodos && 'error' in resultadosTodos.difuso ? (
                  <ResultadoError
                    error={resultadosTodos.difuso.error}
                    tipo="Difuso"
                  />
                ) : resultadosTodos && !('error' in resultadosTodos.difuso) ? (
                  <ResultadoDiagnosticoCard
                    resultado={resultadosTodos.difuso}
                    tipo="difuso"
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 sm:py-16">
                      <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground opacity-50" />
                        <div>
                          <p className="text-muted-foreground text-base sm:text-lg font-medium mb-1">
                            No hay resultados aún
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Complete el formulario y haga clic en "Realizar Diagnóstico"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
