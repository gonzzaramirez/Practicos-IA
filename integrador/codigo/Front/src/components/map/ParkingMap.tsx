import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { MapController } from "./MapController";
import { MapClickHandler } from "./MapClickHandler";
import { createUserIcon, createParkingIcon, createAllParkingIcon } from "./leafletIcons";
import { MapPin } from "lucide-react";
import type { ParkingResult, AllParkingItem } from "../../types/parking";

interface ParkingMapProps {
  center: [number, number];
  userLocation: [number, number] | null;
  results: ParkingResult[];
  allParking: AllParkingItem[];
  maxRadius: number;
  onMapClick: (lat: number, lon: number) => void;
  onResultClick: (lat: number, lon: number) => void;
}

export function ParkingMap({
  center,
  userLocation,
  results,
  allParking,
  maxRadius,
  onMapClick,
  onResultClick,
}: ParkingMapProps) {
  return (
    <div className="flex-1 relative">
      <MapContainer center={center} zoom={15} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController center={center} />
        <MapClickHandler onClick={onMapClick} />

        {/* Círculo del radio de búsqueda */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={maxRadius}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6, 8",
            }}
          />
        )}

        {/* Marcador del usuario */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()}>
            <Popup>
              <div className="text-center">
                <p className="font-medium text-sm">Tu ubicación</p>
                <p className="text-xs text-gray-500">
                  {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de todos los estacionamientos */}
        {allParking.map((parking) => {
          // No mostrar si ya está en los resultados (para evitar duplicados)
          const isInResults = results.some((r) => r.gid === parking.gid);
          if (isInResults) return null;

          return (
            <Marker
              key={`all-${parking.gid}`}
              position={[parking.lat, parking.lon]}
              icon={createAllParkingIcon()}
              eventHandlers={{
                click: () => onResultClick(parking.lat, parking.lon),
              }}
            >
              <Popup>
                <div>
                  <p className="font-medium">Estacionamiento #{parking.gid}</p>
                  {parking.lugares_disponibles > 0 && (
                    <p className="text-sm text-gray-400">
                      Lugares: {parking.lugares_disponibles}
                    </p>
                  )}
                  {parking.garage > 0 && (
                    <p className="text-sm text-blue-400">Tiene garage</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marcadores de resultados recomendados */}
        {results.map((result, index) => (
          <Marker
            key={result.gid}
            position={[result.lat, result.lon]}
            icon={createParkingIcon(index + 1)}
            eventHandlers={{
              click: () => onResultClick(result.lat, result.lon),
            }}
          >
            <Popup>
              <div>
                <p className="font-medium">Estacionamiento #{result.gid}</p>
                <p className="text-sm text-gray-400">
                  Distancia: {Math.round(result.distance_m)}m
                </p>
                {result.lugares_disponibles > 0 && (
                  <p className="text-sm text-gray-400">
                    Lugares: {result.lugares_disponibles}
                  </p>
                )}
                {result.garage > 0 && (
                  <p className="text-sm text-blue-400">Tiene garage</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Instrucciones overlay */}
      {!userLocation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur px-5 py-2.5 rounded-full border border-gray-700 shadow-xl flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-300">
            Clic en el mapa para seleccionar ubicación
          </span>
        </div>
      )}
    </div>
  );
}

