"""
Gestión del grafo: carga, descarga y procesamiento de grafos de OpenStreetMap
"""
import os
import pickle
from pathlib import Path
import networkx as nx
import osmnx as ox
from typing import Optional, Dict, Tuple, List


# Constantes de configuración (basadas en example.py)
CACHE_FILE = Path('graph_cache_corrientes.pkl')
PLACE = 'Corrientes, Corrientes, Argentina'
RADIUS = 9000
DEFAULT_SPEED_KMH = 40

# Colores para visualización (matching example.py)
COLOR_UNVISITED = "#444444"  # Calles sin explorar (gris)
COLOR_VISITED = "#ff6b35"    # Calles exploradas (naranja)
COLOR_PATH_D = "#00c2ff"     # Ruta Dijkstra (azul)
COLOR_PATH_A = "#00ff88"     # Ruta A* (verde neón)


def load_or_download_graph(
    place: str = PLACE, 
    radius: int = RADIUS, 
    cache_file: str = str(CACHE_FILE)
) -> nx.MultiDiGraph:
    """
    Carga el grafo desde caché si existe, o lo descarga y procesa desde OpenStreetMap.
    
    Args:
        place: Nombre del lugar para geocodificar
        radius: Radio en metros para el área del grafo
        cache_file: Ruta al archivo de caché
    
    Returns:
        Grafo de NetworkX con pesos calculados
    """
    # Intentar cargar desde caché
    if os.path.exists(cache_file):
        print(f"Cargando grafo desde caché: {cache_file}")
        with open(cache_file, 'rb') as f:
            G = pickle.load(f)
        print(f"Grafo cargado: {len(G.nodes)} nodos, {len(G.edges)} aristas")
        return G
    
    # Descargar y procesar el grafo
    print(f"Descargando grafo para {place} (radio: {radius}m)...")
    gdf = ox.geocode_to_gdf(place)
    center_point = (gdf.geometry.centroid.y.iloc[0], gdf.geometry.centroid.x.iloc[0])
    G = ox.graph_from_point(center_point, dist=radius, network_type='drive', simplify=True)
    
    # Procesar aristas: calcular pesos (tiempo en segundos) y normalizar velocidades
    print("Procesando aristas y calculando pesos...")
    for u, v, k, data in G.edges(keys=True, data=True):
        length = float(data.get('length', 50.0))
        speed = float(data.get('speed_kph', DEFAULT_SPEED_KMH)) if data.get('speed_kph') else DEFAULT_SPEED_KMH
        
        # Validar velocidad
        if speed <= 0 or speed > 200:
            speed = DEFAULT_SPEED_KMH
        
        # Peso = tiempo en segundos (distancia / velocidad)
        data['weight'] = length / (speed / 3.6)
        data['length'] = length
        data.setdefault('color', COLOR_UNVISITED)
        data.setdefault('alpha', 0.25)
        data.setdefault('linewidth', 0.6)
    
    # Guardar en caché
    print(f"Guardando grafo en caché: {cache_file}")
    with open(cache_file, 'wb') as f:
        pickle.dump(G, f)
    
    print(f"Grafo procesado: {len(G.nodes)} nodos, {len(G.edges)} aristas")
    return G


def get_edge_sample(G: nx.MultiDiGraph, decimate: int = 10) -> Dict[str, List[Tuple[float, float]]]:
    """
    Obtiene una muestra de aristas del grafo para visualización inicial.
    
    Args:
        G: Grafo de NetworkX
        decimate: Factor de decimación (1 = todas las aristas, 10 = cada décima)
    
    Returns:
        Diccionario mapeando edge_id -> [[lat, lon], [lat, lon]]
    """
    out = {}
    i = 0
    for u, v, k in G.edges(keys=True):
        if i % decimate != 0:
            i += 1
            continue
        
        # Obtener coordenadas de los nodos
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        coords = [
            (u_node['y'], u_node['x']),
            (v_node['y'], v_node['x'])
        ]
        
        edge_id = f"{u}|{v}|{k}"
        out[edge_id] = coords
        i += 1
    
    return out


def find_nearest_node(G: nx.MultiDiGraph, lat: float, lon: float) -> Optional[int]:
    """
    Encuentra el nodo más cercano a las coordenadas dadas usando la fórmula de Haversine.
    
    Args:
        G: Grafo de NetworkX
        lat: Latitud
        lon: Longitud
    
    Returns:
        ID del nodo más cercano o None si el grafo está vacío
    """
    from .utils import haversine_m
    
    if len(G.nodes) == 0:
        return None
    
    min_dist = float('inf')
    nearest = None
    
    for node_id, data in G.nodes(data=True):
        node_lat, node_lon = data['y'], data['x']
        # Usar haversine para calcular distancia real en metros
        dist = haversine_m(lat, lon, node_lat, node_lon)
        
        if dist < min_dist:
            min_dist = dist
            nearest = node_id
    
    return nearest

