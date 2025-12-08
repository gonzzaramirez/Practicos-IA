import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { ParkingMap } from "./components/map/ParkingMap";
import { getRecommendations } from "./services/api";
import { normalizeWeights } from "./utils/weights";
import type { ParkingResult } from "./types/parking";
import { CORRIENTES_CENTER } from "./constants/location";

function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [mapCenter, setMapCenter] =
    useState<[number, number]>(CORRIENTES_CENTER);
  const [results, setResults] = useState<ParkingResult[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Pesos de la función de utilidad (porcentajes que se normalizan)
  const [weightDistance, setWeightDistance] = useState(50);
  const [weightLugares, setWeightLugares] = useState(30);
  const [weightGarage, setWeightGarage] = useState(20);
  const [maxRadius, setMaxRadius] = useState(1000);

  const fetchRecommendations = useCallback(
    async (lat: number, lon: number) => {
      setLoading(true);
      setError(null);

      const normalized = normalizeWeights(
        weightDistance,
        weightLugares,
        weightGarage
      );

      try {
        const data = await getRecommendations({
          lat,
          lon,
          weight_distance: normalized.dist,
          weight_lugares: normalized.lug,
          weight_garage: normalized.gar,
          max_radius: maxRadius,
        });

        setResults(data.results);
        setTotalCandidates(data.total_candidates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [weightDistance, weightLugares, weightGarage, maxRadius]
  );

  const handleGetLocation = () => {
    setGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocalización no soportada");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(loc);
        setMapCenter(loc);
        setGettingLocation(false);
        fetchRecommendations(loc[0], loc[1]);
      },
      (err) => {
        console.warn(
          "Geolocalización falló, usando centro de Corrientes:",
          err.message
        );
        setUserLocation(CORRIENTES_CENTER);
        setMapCenter(CORRIENTES_CENTER);
        setGettingLocation(false);
        fetchRecommendations(CORRIENTES_CENTER[0], CORRIENTES_CENTER[1]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (lat: number, lon: number) => {
    const loc: [number, number] = [lat, lon];
    setUserLocation(loc);
    fetchRecommendations(lat, lon);
  };

  const handleResultClick = (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
  };

  // Cuando cambian los pesos, recalcular si hay ubicación
  useEffect(() => {
    if (userLocation) {
      const timeout = setTimeout(() => {
        fetchRecommendations(userLocation[0], userLocation[1]);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [
    weightDistance,
    weightLugares,
    weightGarage,
    maxRadius,
    userLocation,
    fetchRecommendations,
  ]);

  return (
    <div className="h-screen flex bg-background">
      <Sidebar
        gettingLocation={gettingLocation}
        weightDistance={weightDistance}
        weightLugares={weightLugares}
        weightGarage={weightGarage}
        maxRadius={maxRadius}
        results={results}
        totalCandidates={totalCandidates}
        loading={loading}
        error={error}
        userLocation={userLocation}
        onGetLocation={handleGetLocation}
        onWeightDistanceChange={setWeightDistance}
        onWeightLugaresChange={setWeightLugares}
        onWeightGarageChange={setWeightGarage}
        onMaxRadiusChange={setMaxRadius}
        onResultClick={handleResultClick}
      />

      <ParkingMap
        center={mapCenter}
        userLocation={userLocation}
        results={results}
        maxRadius={maxRadius}
        onMapClick={handleMapClick}
        onResultClick={handleResultClick}
      />
    </div>
  );
}

export default App;
