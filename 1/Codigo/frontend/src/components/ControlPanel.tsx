/**
 * Panel de control para configurar y ejecutar algoritmos con comparación
 */
import { useState, useEffect } from "react";
import { WSRequest, AlgorithmStats, AlgorithmComparison } from "../types";
import { useGraphMeta } from "../hooks/useApi";

interface ControlPanelProps {
  onStart: (request: WSRequest) => void;
  onClear: () => void;
  connected: boolean;
  stats: AlgorithmStats | null;
  comparison: AlgorithmComparison | null;
  isRunning: boolean;
  selectedOriginNodeId?: number;
  selectedDestNodeId?: number;
  hasMessages: boolean;
}

export default function ControlPanel({
  onStart,
  onClear,
  connected,
  stats,
  comparison,
  isRunning,
  selectedOriginNodeId,
  selectedDestNodeId,
  hasMessages,
}: ControlPanelProps) {
  const { meta } = useGraphMeta();
  const [algorithm, setAlgorithm] = useState<"dijkstra" | "astar">("astar");
  const [originNode, setOriginNode] = useState<string>("");
  const [destNode, setDestNode] = useState<string>("");
  const [decimate, setDecimate] = useState<number>(1);
  const [speed, setSpeed] = useState<number>(1.0);

  useEffect(() => {
    if (selectedOriginNodeId) {
      setOriginNode(selectedOriginNodeId.toString());
    }
  }, [selectedOriginNodeId]);

  useEffect(() => {
    if (selectedDestNodeId) {
      setDestNode(selectedDestNodeId.toString());
    }
  }, [selectedDestNodeId]);

  const handleStart = () => {
    const orig = parseInt(originNode);
    const dest = parseInt(destNode);

    if (isNaN(orig) || isNaN(dest)) {
      alert("Por favor ingresa IDs de nodo válidos");
      return;
    }

    onStart({
      alg: algorithm,
      orig,
      dest,
      params: {
        decimate,
        speed,
      },
    });
  };

  const calculateDifference = (
    d: number,
    a: number
  ): { value: number; percent: number; isBetter: boolean } => {
    if (a === 0) return { value: 0, percent: 0, isBetter: false };
    const diff = d - a;
    const percent = (diff / d) * 100;
    const isBetter = diff < 0;
    return { value: diff, percent: Math.abs(percent), isBetter };
  };

  return (
    <div className="absolute top-5 left-5 w-[380px] max-h-[calc(100vh-40px)] bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg z-[1000] overflow-y-auto border border-gray-200">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Visualizador de Rutas
        </h2>
        <div
          className={`text-xs font-medium px-2.5 py-1 rounded ${
            connected
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {connected ? "Conectado" : "Desconectado"}
        </div>
      </div>

      {meta && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm border border-gray-100">
          <p className="flex justify-between mb-1.5 text-gray-700">
            <strong className="text-gray-900">Lugar:</strong>{" "}
            <span>{meta.place}</span>
          </p>
          <p className="flex justify-between mb-1.5 text-gray-700">
            <strong className="text-gray-900">Nodos:</strong>{" "}
            <span>{meta.nodes_total.toLocaleString()}</span>
          </p>
          <p className="flex justify-between text-gray-700">
            <strong className="text-gray-900">Aristas:</strong>{" "}
            <span>{meta.edges_total.toLocaleString()}</span>
          </p>
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="algorithm"
          className="block mb-1.5 text-sm font-medium text-gray-700"
        >
          Algoritmo
        </label>
        <select
          id="algorithm"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as "dijkstra" | "astar")}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-70"
        >
          <option value="astar">A* (Heurística)</option>
          <option value="dijkstra">Dijkstra</option>
        </select>
      </div>

      <div className="mb-4">
        <label
          htmlFor="origin"
          className="block mb-1.5 text-sm font-medium text-gray-700"
        >
          Nodo Origen
        </label>
        <input
          id="origin"
          type="number"
          value={originNode}
          onChange={(e) => setOriginNode(e.target.value)}
          placeholder="ID del nodo"
          disabled={isRunning}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-70"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="dest"
          className="block mb-1.5 text-sm font-medium text-gray-700"
        >
          Nodo Destino
        </label>
        <input
          id="dest"
          type="number"
          value={destNode}
          onChange={(e) => setDestNode(e.target.value)}
          placeholder="ID del nodo"
          disabled={isRunning}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-70"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="decimate"
          className="block mb-1.5 text-sm font-medium text-gray-700"
        >
          Decimación: {decimate}
        </label>
        <input
          id="decimate"
          type="range"
          min="1"
          max="50"
          value={decimate}
          onChange={(e) => setDecimate(parseInt(e.target.value))}
          disabled={isRunning}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
        <small className="block text-xs text-gray-500 mt-1">
          Cada {decimate} arista visitada
        </small>
      </div>

      <div className="mb-4">
        <label
          htmlFor="speed"
          className="block mb-1.5 text-sm font-medium text-gray-700"
        >
          Velocidad: {speed.toFixed(1)}x
        </label>
        <input
          id="speed"
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          disabled={isRunning}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleStart}
        disabled={!connected || isRunning || !originNode || !destNode}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isRunning ? "Ejecutando..." : "Iniciar Búsqueda"}
      </button>

      {(hasMessages || stats || selectedOriginNodeId || selectedDestNodeId) && (
        <button
          onClick={onClear}
          disabled={isRunning}
          className="w-full py-2 mt-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          Limpiar Mapa
        </button>
      )}

      {stats && (
        <div
          className={`mt-5 p-4 rounded-lg border-l-4 ${
            stats.algorithm === "astar"
              ? "bg-green-50 border-green-500"
              : "bg-blue-50 border-blue-500"
          }`}
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {stats.algorithm === "astar" ? "A*" : "Dijkstra"} - Resultados
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 mb-1">
                Nodos explorados
              </span>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {stats.nodes_explored.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 mb-1">Tiempo</span>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {stats.time_s.toFixed(3)}s
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 mb-1">Distancia</span>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {stats.distance_km.toFixed(2)} km
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 mb-1">Velocidad</span>
              <span className="text-sm font-semibold text-gray-900 font-mono">
                {(stats.nodes_explored / stats.time_s).toFixed(0)} nodos/s
              </span>
            </div>
          </div>
        </div>
      )}

      {comparison && comparison.dijkstra && comparison.astar && (
        <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">
            Comparación: {comparison.orig} → {comparison.dest}
          </h3>

          <div className="text-xs">
            <div className="grid grid-cols-4 gap-2 pb-2 mb-2 border-b-2 border-gray-300 font-semibold text-gray-700">
              <div>Métrica</div>
              <div className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-center font-mono">
                Dijkstra
              </div>
              <div className="bg-green-100 text-green-800 rounded px-2 py-1 text-center font-mono">
                A*
              </div>
              <div>Diferencia</div>
            </div>

            <div className="grid grid-cols-4 gap-2 py-2 border-b border-gray-200">
              <div className="text-gray-700 font-medium">Nodos explorados</div>
              <div className="bg-blue-50 text-blue-900 rounded px-2 py-1 text-center font-mono">
                {comparison.dijkstra.nodes_explored.toLocaleString()}
              </div>
              <div className="bg-green-50 text-green-900 rounded px-2 py-1 text-center font-mono">
                {comparison.astar.nodes_explored.toLocaleString()}
              </div>
              <div className="text-center">
                {(() => {
                  const diff = calculateDifference(
                    comparison.dijkstra.nodes_explored,
                    comparison.astar.nodes_explored
                  );
                  return (
                    <span
                      className={
                        diff.isBetter
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {diff.value > 0 ? "+" : ""}
                      {diff.value.toLocaleString()} ({diff.percent.toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 py-2 border-b border-gray-200">
              <div className="text-gray-700 font-medium">Tiempo</div>
              <div className="bg-blue-50 text-blue-900 rounded px-2 py-1 text-center font-mono">
                {comparison.dijkstra.time_s.toFixed(3)}s
              </div>
              <div className="bg-green-50 text-green-900 rounded px-2 py-1 text-center font-mono">
                {comparison.astar.time_s.toFixed(3)}s
              </div>
              <div className="text-center">
                {(() => {
                  const diff = calculateDifference(
                    comparison.dijkstra.time_s,
                    comparison.astar.time_s
                  );
                  return (
                    <span
                      className={
                        diff.isBetter
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {diff.value > 0 ? "+" : ""}
                      {(diff.value * 1000).toFixed(1)}ms (
                      {diff.percent.toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 py-2">
              <div className="text-gray-700 font-medium">Distancia</div>
              <div className="bg-blue-50 text-blue-900 rounded px-2 py-1 text-center font-mono">
                {comparison.dijkstra.distance_km.toFixed(2)} km
              </div>
              <div className="bg-green-50 text-green-900 rounded px-2 py-1 text-center font-mono">
                {comparison.astar.distance_km.toFixed(2)} km
              </div>
              <div className="text-center">
                {(() => {
                  const diff =
                    comparison.dijkstra.distance_km -
                    comparison.astar.distance_km;
                  if (Math.abs(diff) < 0.001) {
                    return <span className="text-gray-600">Igual</span>;
                  }
                  return (
                    <span className="text-amber-600">
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(3)} km
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
