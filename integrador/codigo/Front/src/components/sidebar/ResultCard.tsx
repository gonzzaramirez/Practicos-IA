import type { ParkingResult } from "../../types/parking";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface ResultCardProps {
  result: ParkingResult;
  index: number;
  onClick: () => void;
}

export function ResultCard({ result, index, onClick }: ResultCardProps) {
  const isTopResult = index === 0;

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all ${
        isTopResult
          ? "bg-primary/10 border-primary/50 hover:bg-primary/15"
          : "hover:bg-accent"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-semibold text-sm shrink-0 ${
              isTopResult
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-sm text-card-foreground">
                Estacionamiento #{result.gid}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {(result.score * 100).toFixed(0)} pts
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge variant="outline" className="text-xs">
                {Math.round(result.distance_m)}m
              </Badge>
              {result.lugares_disponibles > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {result.lugares_disponibles} lugares
                </Badge>
              )}
              {result.garage > 0 && (
                <Badge variant="default" className="text-xs">
                  Garage
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {result.explanation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
