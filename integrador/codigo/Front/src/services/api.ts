import type { RecommendResponse, ParkingResult } from "../types/parking";

const API_URL = "http://localhost:8000";

export interface RecommendRequest {
  lat: number;
  lon: number;
  weight_distance: number;
  weight_lugares: number;
  weight_garage: number;
  max_radius: number;
}

export async function getRecommendations(
  request: RecommendRequest
): Promise<RecommendResponse> {
  const response = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Error al obtener recomendaciones");
  }

  return response.json();
}
