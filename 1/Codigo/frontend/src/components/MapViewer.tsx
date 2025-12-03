/**
 * Componente del mapa con visualización de rutas en tiempo real
 */
import { useMemo, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { WSMessage, EdgeCoords } from "../types";

// Fix para los iconos de Leaflet en producción
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewerProps {
  edgeCoords: EdgeCoords | null;
  messages: WSMessage[];
  center: [number, number];
  zoom: number;
  onMapClick?: (lat: number, lon: number) => void;
  selectedOrigin?: { lat: number; lon: number; nodeId?: number };
  selectedDest?: { lat: number; lon: number; nodeId?: number };
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapViewer({
  edgeCoords,
  messages,
  center,
  zoom,
  onMapClick,
  selectedOrigin,
  selectedDest,
}: MapViewerProps) {
  const [allEdgeCoords, setAllEdgeCoords] = useState<EdgeCoords>(
    edgeCoords || {}
  );

  useEffect(() => {
    if (edgeCoords) {
      setAllEdgeCoords((prev) => ({ ...prev, ...edgeCoords }));
    }
  }, [edgeCoords]);

  useEffect(() => {
    const newCoords: EdgeCoords = { ...allEdgeCoords };
    let updated = false;

    for (const msg of messages) {
      if (
        (msg.type === "visited" || msg.type === "path") &&
        msg.edge_id &&
        msg.coords
      ) {
        if (!newCoords[msg.edge_id]) {
          newCoords[msg.edge_id] = msg.coords;
          updated = true;
        }
      }
    }

    if (updated) {
      setAllEdgeCoords(newCoords);
    }
  }, [messages, allEdgeCoords]);

  const { visitedEdges, pathEdges, algorithm } = useMemo(() => {
    const visited: string[] = [];
    const path: string[] = [];
    let algo: "dijkstra" | "astar" = "astar";

    for (const msg of messages) {
      if (msg.type === "visited" && msg.edge_id) {
        if (!visited.includes(msg.edge_id)) {
          visited.push(msg.edge_id);
        }
      } else if (msg.type === "path" && msg.edge_id) {
        path.push(msg.edge_id);
      } else if (msg.type === "status" && msg.algorithm) {
        algo = msg.algorithm;
      }
    }

    return {
      visitedEdges: visited,
      pathEdges: path,
      algorithm: algo,
    };
  }, [messages]);

  const pathColor = algorithm === "dijkstra" ? "#00c2ff" : "#00ff88";

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapClickHandler onMapClick={onMapClick || undefined} />

      {Object.entries(allEdgeCoords).map(([edgeId, coords]) => (
        <Polyline
          key={`base-${edgeId}`}
          positions={coords}
          pathOptions={{
            color: "#444444",
            weight: 0.8,
            opacity: 0.25,
          }}
        />
      ))}

      {visitedEdges.map((edgeId) => {
        const coords = allEdgeCoords[edgeId];
        if (!coords) return null;
        const isInPath = pathEdges.includes(edgeId);

        return (
          <Polyline
            key={`visited-${edgeId}`}
            positions={coords}
            pathOptions={{
              color: "#ff6b35",
              weight: 2.5,
              opacity: isInPath ? 0.3 : 0.9,
            }}
          />
        );
      })}

      {pathEdges
        .sort((a, b) => {
          const msgA = messages.find(
            (m) => m.type === "path" && m.edge_id === a
          );
          const msgB = messages.find(
            (m) => m.type === "path" && m.edge_id === b
          );
          const orderA = msgA?.order ?? 0;
          const orderB = msgB?.order ?? 0;
          return orderA - orderB;
        })
        .map((edgeId) => {
          const coords = allEdgeCoords[edgeId];
          if (!coords) return null;

          return (
            <Polyline
              key={`path-${edgeId}`}
              positions={coords}
              pathOptions={{
                color: pathColor,
                weight: 5,
                opacity: 1,
              }}
            />
          );
        })}

      {selectedOrigin && (
        <Marker
          position={[selectedOrigin.lat, selectedOrigin.lon]}
          icon={L.icon({
            iconUrl:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25">
                <circle cx="12.5" cy="12.5" r="10" fill="#00ff88" stroke="#ffffff" stroke-width="2"/>
                <text x="12.5" y="17" font-size="12" fill="#000000" text-anchor="middle" font-weight="bold">S</text>
              </svg>
            `),
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5],
          })}
        >
          <Popup>
            <strong>📍 Origen</strong>
            {selectedOrigin.nodeId && <p>Nodo: {selectedOrigin.nodeId}</p>}
          </Popup>
        </Marker>
      )}

      {selectedDest && (
        <Marker
          position={[selectedDest.lat, selectedDest.lon]}
          icon={L.icon({
            iconUrl:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25">
                <circle cx="12.5" cy="12.5" r="10" fill="#ff6b35" stroke="#ffffff" stroke-width="2"/>
                <text x="12.5" y="17" font-size="12" fill="#ffffff" text-anchor="middle" font-weight="bold">E</text>
              </svg>
            `),
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5],
          })}
        >
          <Popup>
            <strong>🎯 Destino</strong>
            {selectedDest.nodeId && <p>Nodo: {selectedDest.nodeId}</p>}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
