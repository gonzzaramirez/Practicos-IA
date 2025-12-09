import { MapPin, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface AllParkingToggleProps {
  showAllParking: boolean;
  loading: boolean;
  onToggle: () => void;
}

export function AllParkingToggle({
  showAllParking,
  loading,
  onToggle,
}: AllParkingToggleProps) {
  return (
    <div className="p-4 border-b border-border">
      <Button
        onClick={onToggle}
        disabled={loading}
        variant={showAllParking ? "default" : "outline"}
        className="w-full justify-start gap-2"
        size="default"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </>
        ) : showAllParking ? (
          <>
            <EyeOff className="w-4 h-4" />
            Ocultar todos los estacionamientos
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            Ver todos los estacionamientos
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3" />
        {showAllParking
          ? "Mostrando todos los estacionamientos en Corrientes"
          : "Muestra todos los estacionamientos disponibles en el mapa"}
      </p>
    </div>
  );
}

