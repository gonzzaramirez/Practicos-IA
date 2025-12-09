import { Car } from "lucide-react";
import { LocationButton } from "./LocationButton";
import { PreferencesPanel } from "./PreferencesPanel";
import { ResultsList } from "./ResultsList";
import type { ParkingResult } from "../../types/parking";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";

interface SidebarProps {
  gettingLocation: boolean;
  weightDistance: number;
  weightLugares: number;
  weightGarage: number;
  maxRadius: number;
  results: ParkingResult[];
  totalCandidates: number;
  loading: boolean;
  error: string | null;
  userLocation: [number, number] | null;
  onGetLocation: () => void;
  onWeightDistanceChange: (value: number) => void;
  onWeightLugaresChange: (value: number) => void;
  onWeightGarageChange: (value: number) => void;
  onMaxRadiusChange: (value: number) => void;
  onResultClick: (lat: number, lon: number) => void;
}

export function Sidebar({
  gettingLocation,
  weightDistance,
  weightLugares,
  weightGarage,
  maxRadius,
  results,
  totalCandidates,
  loading,
  error,
  userLocation,
  onGetLocation,
  onWeightDistanceChange,
  onWeightLugaresChange,
  onWeightGarageChange,
  onMaxRadiusChange,
  onResultClick,
}: SidebarProps) {
  return (
    <Card className="w-80 flex flex-col border-r rounded-none h-screen">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Estacionamientos</CardTitle>
            <CardDescription className="text-xs">
              Corrientes, Argentina
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 overflow-y-auto">
        {/* Ubicación */}
        <LocationButton
          gettingLocation={gettingLocation}
          onGetLocation={onGetLocation}
        />

        {/* Preferencias */}
        <PreferencesPanel
          weightDistance={weightDistance}
          weightLugares={weightLugares}
          weightGarage={weightGarage}
          maxRadius={maxRadius}
          onWeightDistanceChange={onWeightDistanceChange}
          onWeightLugaresChange={onWeightLugaresChange}
          onWeightGarageChange={onWeightGarageChange}
          onMaxRadiusChange={onMaxRadiusChange}
        />

        {/* Resultados */}
        <ResultsList
          results={results}
          totalCandidates={totalCandidates}
          loading={loading}
          error={error}
          userLocation={userLocation}
          onResultClick={onResultClick}
        />
      </CardContent>
    </Card>
  );
}
