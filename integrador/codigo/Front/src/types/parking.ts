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

export interface AllParkingItem {
  gid: number;
  lat: number;
  lon: number;
  lugares_disponibles: number;
  garage: number;
  altura: number;
}

