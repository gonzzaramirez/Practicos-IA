import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResultadoDiagnosticoCard,
  ResultadoError,
} from "./ResultadoDiagnostico";

import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ResultadosTodos } from "@/types";

interface ResumenDiagnosticosProps {
  resultados: ResultadosTodos;
}

export function ResumenDiagnosticos({ resultados }: ResumenDiagnosticosProps) {
  const getDiagnostico = (
    resultado: ResultadosTodos["deterministico"]
  ): string => {
    if ("error" in resultado) return "Error";
    return resultado.diagnostico;
  };

  const getProbabilidad = (
    resultado: ResultadosTodos["probabilistico"]
  ): number => {
    if ("error" in resultado) return 0;
    const intermedio = resultado.intermedio || {};

    // Buscar probabilidades en diferentes formatos
    if (intermedio.probabilidades) {
      const prob = intermedio.probabilidades;
      const dengue = prob.dengue || prob.Dengue || 0;
      const covid = prob.covid || prob.COVID || prob.COVID19 || 0;
      return Math.max(dengue, covid) * 100;
    }

    if (intermedio.P_Dengue !== undefined || intermedio.P_COVID !== undefined) {
      return Math.max(
        (intermedio.P_Dengue || 0) * 100,
        (intermedio.P_COVID || 0) * 100
      );
    }

    return 0;
  };

  const deterministico = getDiagnostico(resultados.deterministico);
  const probabilistico = getDiagnostico(resultados.probabilistico);
  const difuso = getDiagnostico(resultados.difuso);
  const probabilidad = getProbabilidad(resultados.probabilistico);

  // Contar diagnósticos
  const diagnosticos = [deterministico, probabilistico, difuso].filter(
    (d) => d !== "Error"
  );
  const dengueCount = diagnosticos.filter((d) =>
    d.toLowerCase().includes("dengue")
  ).length;
  const covidCount = diagnosticos.filter((d) =>
    d.toLowerCase().includes("covid")
  ).length;
  const ningunoCount = diagnosticos.filter(
    (d) =>
      !d.toLowerCase().includes("dengue") && !d.toLowerCase().includes("covid")
  ).length;

  const diagnosticoFinal =
    dengueCount > covidCount
      ? "Dengue"
      : covidCount > dengueCount
      ? "COVID-19"
      : dengueCount === covidCount && dengueCount > 0
      ? "Ambos posibles"
      : "Sin diagnóstico claro";

  const getConsensoColor = () => {
    if (dengueCount >= 2 || covidCount >= 2) return "bg-green-500";
    if (dengueCount === 1 && covidCount === 1) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Resumen Principal */}
      <Card className="border-2">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Diagnóstico Final */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Diagnóstico Final</h3>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Badge
                  className={`${getConsensoColor()} text-white text-lg px-4 py-2`}
                >
                  {diagnosticoFinal}
                </Badge>
              </div>
              {probabilidad > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confianza</span>
                    <span className="font-semibold">
                      {probabilidad.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={probabilidad} className="h-2" />
                </div>
              )}
            </div>

            {/* Consenso */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  {dengueCount >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">Dengue</span>
                </div>
                <Badge variant="outline" className="text-lg">
                  {dengueCount}/3
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  {covidCount >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">COVID-19</span>
                </div>
                <Badge variant="outline" className="text-lg">
                  {covidCount}/3
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Otros</span>
                </div>
                <Badge variant="outline" className="text-lg">
                  {ningunoCount}/3
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}

      {/* Detalles Expandibles */}
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="deterministico" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Determinístico</span>
              <Badge
                variant={deterministico === "Error" ? "destructive" : "default"}
              >
                {deterministico}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {"error" in resultados.deterministico ? (
              <ResultadoError
                error={resultados.deterministico.error}
                tipo="Determinístico"
              />
            ) : (
              <ResultadoDiagnosticoCard
                resultado={resultados.deterministico}
                tipo="deterministico"
              />
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="probabilistico" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Probabilístico</span>
              <Badge
                variant={probabilistico === "Error" ? "destructive" : "default"}
              >
                {probabilistico}
              </Badge>
              {probabilidad > 0 && (
                <Badge variant="outline" className="text-xs">
                  {probabilidad.toFixed(1)}%
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {"error" in resultados.probabilistico ? (
              <ResultadoError
                error={resultados.probabilistico.error}
                tipo="Probabilístico"
              />
            ) : (
              <ResultadoDiagnosticoCard
                resultado={resultados.probabilistico}
                tipo="probabilistico"
              />
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="difuso" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Difuso</span>
              <Badge variant={difuso === "Error" ? "destructive" : "default"}>
                {difuso}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {"error" in resultados.difuso ? (
              <ResultadoError error={resultados.difuso.error} tipo="Difuso" />
            ) : (
              <ResultadoDiagnosticoCard
                resultado={resultados.difuso}
                tipo="difuso"
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
