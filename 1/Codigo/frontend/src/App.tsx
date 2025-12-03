/**
 * Componente principal de la aplicación
 */
import { useState, useEffect, useMemo } from "react";
import MapViewer from "./components/MapViewer";
import ControlPanel from "./components/ControlPanel";
import { useWebSocket } from "./hooks/useWebSocket";
import { useEdgesSample } from "./hooks/useApi";
import { findNearestNode } from "./hooks/useApi";
import { WSRequest, AlgorithmStats, AlgorithmComparison } from "./types";

// Coordenadas por defecto (Corrientes, Argentina)
const DEFAULT_CENTER: [number, number] = [-27.47, -58.83];
const DEFAULT_ZOOM = 13;

function App() {
  const {
    connected,
    send,
    messages,
    error: wsError,
    clearMessages,
  } = useWebSocket();
  const { edges: edgeCoords, loading: edgesLoading } = useEdgesSample(2);
  const [selectedOrigin, setSelectedOrigin] = useState<{
    lat: number;
    lon: number;
    nodeId?: number;
  }>();
  const [selectedDest, setSelectedDest] = useState<{
    lat: number;
    lon: number;
    nodeId?: number;
  }>();
  const [isRunning, setIsRunning] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<WSRequest | null>(null);

  // Almacenar estadísticas de ambos algoritmos
  const [statsHistory, setStatsHistory] = useState<{
    dijkstra: Map<string, AlgorithmStats>;
    astar: Map<string, AlgorithmStats>;
  }>({
    dijkstra: new Map(),
    astar: new Map(),
  });

  // Extraer estadísticas del algoritmo actual
  const currentStats = useMemo<AlgorithmStats | null>(() => {
    const doneMessage = messages.find((m) => m.type === "done");
    const startMessage = messages.find(
      (m) => m.type === "status" && m.msg === "started"
    );

    if (!doneMessage || !startMessage || !currentRequest) return null;

    const key = `${currentRequest.orig}-${currentRequest.dest}`;
    const stats: AlgorithmStats = {
      algorithm: currentRequest.alg,
      nodes_explored: doneMessage.nodes_explored || 0,
      time_s: doneMessage.time_s || 0,
      distance_km: doneMessage.distance_km || 0,
      orig: currentRequest.orig,
      dest: currentRequest.dest,
    };

    // Guardar en el historial
    setStatsHistory((prev) => {
      const newHistory = {
        dijkstra: new Map(prev.dijkstra),
        astar: new Map(prev.astar),
      };

      if (stats.algorithm === "dijkstra") {
        newHistory.dijkstra.set(key, stats);
      } else {
        newHistory.astar.set(key, stats);
      }

      return newHistory;
    });

    return stats;
  }, [messages, currentRequest]);

  // Comparación entre algoritmos para los mismos puntos
  const comparison = useMemo<AlgorithmComparison | null>(() => {
    if (!currentStats) return null;

    const key = `${currentStats.orig}-${currentStats.dest}`;
    const dijkstra = statsHistory.dijkstra.get(key) || null;
    const astar = statsHistory.astar.get(key) || null;

    // Solo mostrar comparación si tenemos ambos algoritmos para los mismos puntos
    if (dijkstra && astar) {
      return {
        dijkstra,
        astar,
        orig: currentStats.orig,
        dest: currentStats.dest,
      };
    }

    return null;
  }, [currentStats, statsHistory]);

  // Detectar cuando el algoritmo termina
  useEffect(() => {
    const doneMessage = messages.find(
      (m) => m.type === "done" || m.type === "error"
    );
    if (doneMessage) {
      setIsRunning(false);
    }
  }, [messages]);

  const handleStart = (request: WSRequest) => {
    setIsRunning(true);
    setCurrentRequest(request);
    clearMessages();
    send(request);
  };

  const handleMapClick = async (lat: number, lon: number) => {
    if (isRunning) return;

    try {
      const response = await findNearestNode(lat, lon);
      const { node_id, lat: nodeLat, lon: nodeLon } = response.data;

      // Alternar entre origen y destino
      if (!selectedOrigin) {
        setSelectedOrigin({ lat: nodeLat, lon: nodeLon, nodeId: node_id });
      } else if (!selectedDest) {
        setSelectedDest({ lat: nodeLat, lon: nodeLon, nodeId: node_id });
      } else {
        // Si ambos están seleccionados, reiniciar con el nuevo punto como origen
        setSelectedOrigin({ lat: nodeLat, lon: nodeLon, nodeId: node_id });
        setSelectedDest(undefined);
      }
    } catch (err) {
      console.error("Error al encontrar nodo más cercano:", err);
    }
  };

  const handleClear = () => {
    clearMessages();
    setSelectedOrigin(undefined);
    setSelectedDest(undefined);
    setCurrentRequest(null);
    setIsRunning(false);
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-gray-50">
      <ControlPanel
        onStart={handleStart}
        onClear={handleClear}
        connected={connected}
        stats={currentStats}
        comparison={comparison}
        isRunning={isRunning}
        selectedOriginNodeId={selectedOrigin?.nodeId}
        selectedDestNodeId={selectedDest?.nodeId}
        hasMessages={messages.length > 0}
      />

      {wsError && (
        <div className="absolute top-5 right-5 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[2000] font-medium text-sm">
          Error: {wsError}
        </div>
      )}

      {edgesLoading ? (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col justify-center items-center z-[3000]">
          <div className="inline-block relative w-20 h-20">
            <div className="absolute w-16 h-16 m-2 border-8 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <div
              className="absolute w-16 h-16 m-2 border-8 border-blue-500 rounded-full animate-spin border-t-transparent"
              style={{ animationDelay: "-0.45s" }}
            ></div>
            <div
              className="absolute w-16 h-16 m-2 border-8 border-blue-500 rounded-full animate-spin border-t-transparent"
              style={{ animationDelay: "-0.3s" }}
            ></div>
          </div>
          <p className="mt-8 text-lg text-gray-700 font-medium">
            Cargando grafo...
          </p>
        </div>
      ) : (
        <MapViewer
          edgeCoords={edgeCoords || {}}
          messages={messages}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          onMapClick={handleMapClick}
          selectedOrigin={selectedOrigin}
          selectedDest={selectedDest}
        />
      )}
    </div>
  );
}

export default App;
