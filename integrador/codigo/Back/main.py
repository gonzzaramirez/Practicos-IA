from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import json
from shapely.geometry import shape, Point
from scipy.spatial import cKDTree
from math import radians, sin, cos, sqrt, atan2

app = FastAPI(title="Parking Recommender API", version="1.0.0")

# CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables globales para los datos procesados
parking_data = None
kdtree = None
coords_radians = None


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula distancia en metros entre dos puntos usando Haversine."""
    R = 6371000  # Radio de la Tierra en metros
    
    lat1_rad, lat2_rad = radians(lat1), radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def load_and_process_data():
    """Carga y procesa el CSV de estacionamientos."""
    global parking_data, kdtree, coords_radians
    
    df = pd.read_csv("Data/Estacionamiento-medido.csv")
    
    processed = []
    for _, row in df.iterrows():
        try:
            geojson = json.loads(row['st_asgeojson'])
            geom = shape(geojson)
            centroid = geom.centroid
            
            # Extraer valores, manejando NaN
            lugares = row['lugares_disponibles'] if pd.notna(row['lugares_disponibles']) else 0
            garage = row['garage'] if pd.notna(row['garage']) else 0
            altura = row['altura'] if pd.notna(row['altura']) else 0
            
            processed.append({
                'gid': int(row['gid']),
                'altura': int(altura) if altura else 0,
                'lugares_disponibles': int(lugares) if lugares else 0,
                'garage': int(garage) if garage else 0,
                'is_garage': 1 if garage and garage > 0 else 0,
                'lat': centroid.y,
                'lon': centroid.x,
                'length_m': geom.length * 111000  # Aproximación en metros
            })
        except Exception as e:
            print(f"Error procesando fila {row['gid']}: {e}")
            continue
    
    parking_data = pd.DataFrame(processed)
    
    # Normalizar lugares_disponibles para la función de utilidad (0-1)
    max_lugares = parking_data['lugares_disponibles'].max()
    if max_lugares > 0:
        parking_data['lugares_norm'] = parking_data['lugares_disponibles'] / max_lugares
    else:
        parking_data['lugares_norm'] = 0
    
    # Crear KDTree para búsqueda espacial rápida (usando coordenadas en radianes)
    coords = parking_data[['lat', 'lon']].values
    coords_radians = np.radians(coords)
    kdtree = cKDTree(coords_radians)
    
    print(f"Datos cargados: {len(parking_data)} estacionamientos")
    return parking_data


class RecommendRequest(BaseModel):
    lat: float
    lon: float
    weight_distance: float = 0.5
    weight_lugares: float = 0.3
    weight_garage: float = 0.2
    max_radius: float = 1500  # metros


class ParkingResult(BaseModel):
    gid: int
    score: float
    distance_m: float
    lugares_disponibles: int
    garage: int
    altura: int
    lat: float
    lon: float
    explanation: str


class RecommendResponse(BaseModel):
    results: list[ParkingResult]
    total_candidates: int


@app.on_event("startup")
async def startup_event():
    """Carga los datos al iniciar el servidor."""
    load_and_process_data()


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "records": len(parking_data) if parking_data is not None else 0}


@app.get("/metadata")
async def metadata():
    """Devuelve metadatos del dataset."""
    if parking_data is None:
        raise HTTPException(status_code=500, detail="Datos no cargados")
    
    return {
        "total_records": len(parking_data),
        "total_lugares": int(parking_data['lugares_disponibles'].sum()),
        "avg_lugares": float(parking_data['lugares_disponibles'].mean()),
        "with_garage": int(parking_data['is_garage'].sum()),
        "bounds": {
            "min_lat": float(parking_data['lat'].min()),
            "max_lat": float(parking_data['lat'].max()),
            "min_lon": float(parking_data['lon'].min()),
            "max_lon": float(parking_data['lon'].max()),
        }
    }


@app.get("/all-parking")
async def get_all_parking():
    """Devuelve todos los estacionamientos para mostrar en el mapa."""
    if parking_data is None:
        raise HTTPException(status_code=500, detail="Datos no cargados")
    
    return parking_data[['gid', 'lat', 'lon', 'lugares_disponibles', 'garage', 'altura']].to_dict(orient='records')


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    """
    Devuelve los 3 mejores estacionamientos según la función de utilidad.
    
    La función de utilidad es:
    U = w1 * f_distance + w2 * f_lugares + w3 * f_garage
    
    Donde:
    - f_distance = 1 / (1 + d/100) - Decae con la distancia
    - f_lugares = lugares_norm (normalizado 0-1)
    - f_garage = 1 si tiene garage, 0 si no
    """
    if parking_data is None or kdtree is None:
        raise HTTPException(status_code=500, detail="Datos no cargados")
    
    # Normalizar pesos para que sumen 1
    total_weight = request.weight_distance + request.weight_lugares + request.weight_garage
    if total_weight == 0:
        total_weight = 1
    
    w_dist = request.weight_distance / total_weight
    w_lug = request.weight_lugares / total_weight
    w_gar = request.weight_garage / total_weight
    
    # Buscar candidatos dentro del radio usando KDTree
    user_point_rad = np.radians([[request.lat, request.lon]])
    
    # Convertir radio de metros a radianes (aproximación)
    radius_rad = request.max_radius / 6371000
    
    # Buscar índices de puntos cercanos
    indices = kdtree.query_ball_point(user_point_rad[0], radius_rad)
    
    if not indices:
        return RecommendResponse(results=[], total_candidates=0)
    
    candidates = parking_data.iloc[indices].copy()
    
    # Calcular distancia real en metros para cada candidato
    candidates['distance_m'] = candidates.apply(
        lambda row: haversine_distance(request.lat, request.lon, row['lat'], row['lon']),
        axis=1
    )
    
    # Filtrar por radio máximo (verificación adicional)
    candidates = candidates[candidates['distance_m'] <= request.max_radius]
    
    if candidates.empty:
        return RecommendResponse(results=[], total_candidates=0)
    
    # Calcular función de utilidad
    # f_distance: decae exponencialmente con la distancia (más cerca = mejor)
    candidates['f_distance'] = 1 / (1 + candidates['distance_m'] / 100)
    
    # f_lugares: ya normalizado
    candidates['f_lugares'] = candidates['lugares_norm']
    
    # f_garage: binario
    candidates['f_garage'] = candidates['is_garage']
    
    # Score final
    candidates['score'] = (
        w_dist * candidates['f_distance'] +
        w_lug * candidates['f_lugares'] +
        w_gar * candidates['f_garage']
    )
    
    # Ordenar por score y tomar top 3
    top3 = candidates.nlargest(3, 'score')
    
    results = []
    for _, row in top3.iterrows():
        # Generar explicación
        factors = []
        if w_dist > 0:
            factors.append(f"distancia {int(w_dist*100)}%")
        if w_lug > 0:
            factors.append(f"lugares {int(w_lug*100)}%")
        if w_gar > 0:
            factors.append(f"garage {int(w_gar*100)}%")
        
        explanation = f"Elegido por: {' · '.join(factors)}. "
        explanation += f"A {int(row['distance_m'])}m"
        if row['lugares_disponibles'] > 0:
            explanation += f", {int(row['lugares_disponibles'])} lugares"
        if row['is_garage']:
            explanation += ", tiene garage"
        
        results.append(ParkingResult(
            gid=int(row['gid']),
            score=round(float(row['score']), 3),
            distance_m=round(float(row['distance_m']), 1),
            lugares_disponibles=int(row['lugares_disponibles']),
            garage=int(row['garage']),
            altura=int(row['altura']),
            lat=float(row['lat']),
            lon=float(row['lon']),
            explanation=explanation
        ))
    
    return RecommendResponse(results=results, total_candidates=len(candidates))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

