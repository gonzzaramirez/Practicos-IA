/**
 * Tipos TypeScript para la aplicación
 */

export interface GraphMeta {
  place: string
  radius_m: number
  nodes_total: number
  edges_total: number
  bbox: [number, number, number, number]
  graph_cache_version: string
}

export interface EdgeCoords {
  [edgeId: string]: [number, number][]
}

export interface VisitedEdge {
  edge_id: string
  u: number
  v: number
  k: number
  weight: number
}

export interface PathEdge {
  edge_id: string
  u: number
  v: number
  k: number
  order: number
}

export interface WSMessage {
  type: 'status' | 'visited' | 'path' | 'progress' | 'done' | 'error'
  msg?: string
  algorithm?: 'dijkstra' | 'astar'
  orig?: number
  dest?: number
  node?: number
  edge_id?: string
  u?: number
  v?: number
  k?: number
  weight?: number
  order?: number
  explored?: number
  nodes_explored?: number
  time_s?: number
  distance_km?: number
  coords?: [number, number][] // Coordenadas [[lat, lon], [lat, lon]]
}

export interface WSRequest {
  alg: 'dijkstra' | 'astar'
  orig: number
  dest: number
  params: {
    decimate: number
    speed: number
  }
}

export interface AlgorithmStats {
  algorithm: 'dijkstra' | 'astar'
  nodes_explored: number
  time_s: number
  distance_km: number
  orig: number
  dest: number
}

export interface AlgorithmComparison {
  dijkstra: AlgorithmStats | null
  astar: AlgorithmStats | null
  orig: number | null
  dest: number | null
}
