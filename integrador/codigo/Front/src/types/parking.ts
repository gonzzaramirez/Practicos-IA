export interface ParkingResult {
  gid: number;
  score: number;
  distance_m: number;
  lugares_disponibles: number;
  garage: number;
  altura: number;
  lat: number;
  lon: number;
  explanation: string;
}

export interface RecommendResponse {
  results: ParkingResult[];
  total_candidates: number;
}

