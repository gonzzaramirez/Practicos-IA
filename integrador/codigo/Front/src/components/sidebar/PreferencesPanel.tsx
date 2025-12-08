import { Slider } from "../ui/slider";

interface PreferencesPanelProps {
  weightDistance: number;
  weightLugares: number;
  weightGarage: number;
  maxRadius: number;
  onWeightDistanceChange: (value: number) => void;
  onWeightLugaresChange: (value: number) => void;
  onWeightGarageChange: (value: number) => void;
  onMaxRadiusChange: (value: number) => void;
}

export function PreferencesPanel({
  weightDistance,
  weightLugares,
  weightGarage,
  maxRadius,
  onWeightDistanceChange,
  onWeightLugaresChange,
  onWeightGarageChange,
  onMaxRadiusChange,
}: PreferencesPanelProps) {
  const total = weightDistance + weightLugares + weightGarage;
  const distancePercent =
    total > 0 ? Math.round((weightDistance / total) * 100) : 0;
  const lugaresPercent =
    total > 0 ? Math.round((weightLugares / total) * 100) : 0;
  const garagePercent =
    total > 0 ? Math.round((weightGarage / total) * 100) : 0;

  return (
    <div className="p-4 border-b border-border space-y-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Preferencias
      </h3>

      {/* Cercanía */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground">Prioridad: Cercanía</span>
          <span className="text-muted-foreground font-mono">
            {distancePercent}%
          </span>
        </div>
        <Slider
          value={[weightDistance]}
          onValueChange={(values) => onWeightDistanceChange(values[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Qué tan importante es estar cerca
        </p>
      </div>

      {/* Lugares disponibles */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground">
            Prioridad: Lugares disponibles
          </span>
          <span className="text-muted-foreground font-mono">
            {lugaresPercent}%
          </span>
        </div>
        <Slider
          value={[weightLugares]}
          onValueChange={(values) => onWeightLugaresChange(values[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Qué tan importante es tener más lugares libres
        </p>
      </div>

      {/* Garage */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground">Prioridad: Tiene garage</span>
          <span className="text-muted-foreground font-mono">
            {garagePercent}%
          </span>
        </div>
        <Slider
          value={[weightGarage]}
          onValueChange={(values) => onWeightGarageChange(values[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Qué tan importante es que tenga garage
        </p>
      </div>

      {/* Radio */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-foreground">Radio de búsqueda</span>
          <span className="text-muted-foreground font-mono">{maxRadius}m</span>
        </div>
        <Slider
          value={[maxRadius]}
          onValueChange={(values) => onMaxRadiusChange(values[0])}
          min={200}
          max={2000}
          step={100}
          className="w-full"
        />
      </div>
    </div>
  );
}
