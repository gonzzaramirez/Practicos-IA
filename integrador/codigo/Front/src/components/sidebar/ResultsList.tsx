import { Loader2, AlertCircle, Info } from "lucide-react";
import { ResultCard } from "./ResultCard";
import type { ParkingResult } from "../../types/parking";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface ResultsListProps {
  results: ParkingResult[];
  totalCandidates: number;
  loading: boolean;
  error: string | null;
  userLocation: [number, number] | null;
  onResultClick: (lat: number, lon: number) => void;
}

export function ResultsList({
  results,
  totalCandidates,
  loading,
  error,
  userLocation,
  onResultClick,
}: ResultsListProps) {
  return (
    <div>
      <div className="p-4 pb-2 flex items-center justify-between border-b border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Resultados
        </h3>
        {totalCandidates > 0 && (
          <span className="text-xs text-muted-foreground">
            {totalCandidates} en zona
          </span>
        )}
      </div>

      <div className="px-4 pb-4 space-y-2">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Verifica que el backend esté activo
              </p>
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground mt-2">Buscando...</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && userLocation && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Sin resultados</AlertTitle>
            <AlertDescription>
              No hay estacionamientos en este radio. Intenta ampliarlo.
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && results.length === 0 && !userLocation && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Selecciona ubicación</AlertTitle>
            <AlertDescription>
              Selecciona una ubicación para ver recomendaciones.
            </AlertDescription>
          </Alert>
        )}

        {results.map((result, index) => (
          <ResultCard
            key={result.gid}
            result={result}
            index={index}
            onClick={() => onResultClick(result.lat, result.lon)}
          />
        ))}
      </div>
    </div>
  );
}
