import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  center: [number, number];
  zoom?: number;
}

export function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  
  return null;
}

