import { Navigation, Loader2, Crosshair } from "lucide-react";
import { Button } from "../ui/button";

interface LocationButtonProps {
  gettingLocation: boolean;
  onGetLocation: () => void;
}

export function LocationButton({
  gettingLocation,
  onGetLocation,
}: LocationButtonProps) {
  return (
    <div className="p-4 border-b border-border">
      <Button
        onClick={onGetLocation}
        disabled={gettingLocation}
        className="w-full"
        size="default"
      >
        {gettingLocation ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Obteniendo...
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4" />
            Usar mi ubicación
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-1">
        <Crosshair className="w-3 h-3" />O clic en el mapa
      </p>
    </div>
  );
}
