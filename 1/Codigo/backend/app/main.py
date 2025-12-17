"""
Aplicación FastAPI del Visualizador de Rutas en Tiempo Real
Implementa algoritmos de búsqueda: Dijkstra y A* sobre grafos de OpenStreetMap

Conceptos de IA aplicados:
- Dijkstra: Búsqueda de costo uniforme, garantiza camino óptimo
- A*: Búsqueda informada con heurística admisible (distancia haversine / velocidad máxima)
- Heurística admisible: nunca sobreestima el costo real, garantizando optimalidad
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
import math
import asyncio
import heapq
import time
import os
import pickle
from pathlib import Path
from typing import Optional, Iterator, Dict, Any, List, Tuple
import networkx as nx # mapa convertido en grafo
import osmnx as # mapa de corrientes


# =============================================================================
# CONFIGURACIÓN Y CONSTANTES
# =============================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CACHE_FILE = Path('graph_cache_corrientes.pkl')
PLACE = 'Corrientes, Corrientes, Argentina'
RADIUS = 9000
DEFAULT_SPEED_KMH = 40

# Colores para visualización
COLOR_UNVISITED = "#444444"  # Calles sin explorar


# =============================================================================
# UTILIDADES
# =============================================================================
def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula la distancia en metros entre dos puntos geográficos usando la fórmula de Haversine.
    Esencial para la heurística de A* y búsqueda del nodo más cercano.
    """
    R = 6371000.0  # Radio de la Tierra en metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))


async def run_sync_generator_async(gen: Iterator[Dict[str, Any]], speed: float = 1.0):
    """
    Adaptador para iterar un generador síncrono y emitir items de forma asíncrona.
    Soporta throttling ajustable mediante el parámetro speed.
    """
    for item in gen:
        yield item
        await asyncio.sleep(max(0.0, 0.001 / max(0.01, speed)))


# =============================================================================
# GESTIÓN DEL GRAFO
# =============================================================================
def load_or_download_graph(
    place: str = PLACE, 
    radius: int = RADIUS, 
    cache_file: str = str(CACHE_FILE)
) -> nx.MultiDiGraph:
    """
    Carga el grafo desde caché si existe, o lo descarga y procesa desde OpenStreetMap.
    Calcula pesos de aristas basados en tiempo (distancia / velocidad).
    """
    if os.path.exists(cache_file):
        print(f"Cargando grafo desde caché: {cache_file}")
        with open(cache_file, 'rb') as f:
            G = pickle.load(f)
        print(f"Grafo cargado: {len(G.nodes)} nodos, {len(G.edges)} aristas")
        return G
    
    print(f"Descargando grafo para {place} (radio: {radius}m)...")
    gdf = ox.geocode_to_gdf(place)
    center_point = (gdf.geometry.centroid.y.iloc[0], gdf.geometry.centroid.x.iloc[0])
    G = ox.graph_from_point(center_point, dist=radius, network_type='drive', simplify=True)
    
    # Procesar aristas: calcular pesos (tiempo en segundos)
    print("Procesando aristas y calculando pesos...")
    for u, v, k, data in G.edges(keys=True, data=True):
        length = float(data.get('length', 50.0))
        speed = float(data.get('speed_kph', DEFAULT_SPEED_KMH)) if data.get('speed_kph') else DEFAULT_SPEED_KMH
        if speed <= 0 or speed > 200:
            speed = DEFAULT_SPEED_KMH
        data['weight'] = length / (speed / 3.6)
        data['length'] = length
        data.setdefault('color', COLOR_UNVISITED)
        data.setdefault('alpha', 0.25)
        data.setdefault('linewidth', 0.6)
    
    print(f"Guardando grafo en caché: {cache_file}")
    with open(cache_file, 'wb') as f:
        pickle.dump(G, f)
    
    print(f"Grafo procesado: {len(G.nodes)} nodos, {len(G.edges)} aristas")
    return G


def get_edge_sample(G: nx.MultiDiGraph, decimate: int = 10) -> Dict[str, List[Tuple[float, float]]]:
    """Obtiene una muestra de aristas del grafo para visualización inicial."""
    out = {}
    i = 0
    for u, v, k in G.edges(keys=True):
        if i % decimate != 0:
            i += 1
            continue
        u_node, v_node = G.nodes[u], G.nodes[v]
        out[f"{u}|{v}|{k}"] = [(u_node['y'], u_node['x']), (v_node['y'], v_node['x'])]
        i += 1
    return out


def find_nearest_node(G: nx.MultiDiGraph, lat: float, lon: float) -> Optional[int]:
    """Encuentra el nodo más cercano a las coordenadas dadas usando distancia Haversine."""
    if len(G.nodes) == 0:
        return None
    min_dist, nearest = float('inf'), None
    for node_id, data in G.nodes(data=True):
        dist = haversine_m(lat, lon, data['y'], data['x'])
        if dist < min_dist:
            min_dist, nearest = dist, node_id
    return nearest


# =============================================================================
# ALGORITMOS DE BÚSQUEDA (Conceptos de IA)
# =============================================================================
def reconstruct_path(
    G: nx.MultiDiGraph, 
    orig: int, 
    dest: int, 
    prev: Dict[int, Optional[int]]
) -> Tuple[List[Tuple[int, int, int]], float]:
    """Reconstruye la ruta desde el diccionario de predecesores."""
    path, curr, total_length = [], dest, 0.0
    
    while curr and curr != orig:
        p = prev.get(curr)
        if p is None:
            break
        # Elegir la mejor clave (mínimo peso) entre múltiples aristas
        best_k, best_w = None, float('inf')
        for k, attr in G[p][curr].items():
            w = attr.get('weight', float('inf'))
            if w < best_w:
                best_w, best_k = w, k
        if best_k is None:
            break
        path.append((p, curr, best_k))
        total_length += G.edges[p, curr, best_k]['length']
        curr = p
    
    path.reverse()
    return path, total_length / 1000.0


def compute_max_speed(G: nx.MultiDiGraph, default_speed_kmh: float = 40.0) -> float:
    """
    Calcula la velocidad máxima del grafo para usar en la heurística de A*.
    Esto asegura que la heurística sea ADMISIBLE (nunca sobreestima el costo real).
    """
    speeds = []
    for _, _, _, d in G.edges(keys=True, data=True):
        s = d.get('speed_kph')
        if s:
            try:
                speeds.append(float(s))
            except (ValueError, TypeError):
                pass
    return (max(speeds) if speeds else default_speed_kmh) / 3.6


def dijkstra_stream(
    G: nx.MultiDiGraph, 
    orig: int, 
    dest: int, 
    decimate: int = 1, 
    progress_every: int = 500
) -> Iterator[Dict[str, Any]]:
    """
    ALGORITMO DE DIJKSTRA (Búsqueda de Costo Uniforme)
    
    Concepto IA: Expande siempre el nodo con menor costo acumulado g(n).
    Garantiza encontrar el camino óptimo (menor costo total).
    
    Complejidad: O((V + E) log V) con cola de prioridad.
    """
    t0 = time.time()
    dist = {n: float('inf') for n in G.nodes}
    prev = {n: None for n in G.nodes}
    visited = set()
    dist[orig] = 0
    pq = [(0, orig)]  # Cola de prioridad: (distancia, nodo)
    nodes_explored = 0
    
    yield {'type': 'status', 'msg': 'started', 'algorithm': 'dijkstra', 'orig': orig, 'dest': dest}
    
    i = 0
    while pq: #seleccionar de la cola de prioridad el nodo con menor distancia
        d, node = heapq.heappop(pq)
        
        if node in visited:
            continue
        
        visited.add(node)
        nodes_explored += 1
        
        if node == dest:
            yield {'type': 'status', 'msg': 'reached_dest', 'node': node}
            break
        
        # Explorar vecinos (expansión del nodo)
        for u, v, k, data in G.out_edges(node, keys=True, data=True):
            w = data['weight']
            new_dist = dist[node] + w
            
            # Relajación de arista: actualizar si encontramos camino más corto
            if new_dist < dist[v]:
                dist[v] = new_dist
                prev[v] = node
                heapq.heappush(pq, (dist[v], v))
                
                if i % decimate == 0:
                    u_node, v_node = G.nodes[u], G.nodes[v]
                    yield {
                        'type': 'visited', 'edge_id': f"{u}|{v}|{k}",
                        'u': u, 'v': v, 'k': k, 'weight': w,
                        'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
                    }
                i += 1
        
        if nodes_explored % progress_every == 0:
            yield {'type': 'progress', 'explored': nodes_explored}
    
    elapsed = time.time() - t0
    path_edges, total_km = reconstruct_path(G, orig, dest, prev)
    
    for order, (u, v, k) in enumerate(path_edges):
        u_node, v_node = G.nodes[u], G.nodes[v]
        yield {
            'type': 'path', 'edge_id': f"{u}|{v}|{k}",
            'u': u, 'v': v, 'k': k, 'order': order,
            'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
        }
    
    yield {'type': 'done', 'nodes_explored': nodes_explored, 'time_s': elapsed, 'distance_km': total_km}


def astar_stream(
    G: nx.MultiDiGraph, 
    orig: int, 
    dest: int, 
    decimate: int = 1, 
    progress_every: int = 500
) -> Iterator[Dict[str, Any]]:
    """
    ALGORITMO A* (Búsqueda Informada)
    
    Concepto IA: Usa función de evaluación f(n) = g(n) + h(n)
    - g(n): costo real desde origen hasta n
    - h(n): heurística (estimación del costo de n al destino)
    
    Heurística: distancia_haversine / velocidad_máxima
    - Es ADMISIBLE: nunca sobreestima (distancia recta ≤ distancia real,
      dividida por velocidad máxima ≤ tiempo real)
    - Garantiza encontrar el camino óptimo
    
    Ventaja sobre Dijkstra: explora menos nodos al guiarse hacia el destino.
    """
    t0 = time.time()
    dest_lat, dest_lon = G.nodes[dest]['y'], G.nodes[dest]['x']
    max_speed = compute_max_speed(G)
    
    # Función heurística admisible
    def h(node: int) -> float:
        lat, lon = G.nodes[node]['y'], G.nodes[node]['x']
        return haversine_m(lat, lon, dest_lat, dest_lon) / max_speed
    
    g_score = {n: float('inf') for n in G.nodes}
    f_score = {n: float('inf') for n in G.nodes}
    prev = {n: None for n in G.nodes}
    closed = set()
    
    g_score[orig] = 0
    f_score[orig] = h(orig)
    pq = [(f_score[orig], orig)]  # Cola de prioridad: (f_score, nodo)
    nodes_explored = 0
    
    yield {'type': 'status', 'msg': 'started', 'algorithm': 'astar', 'orig': orig, 'dest': dest}
    
    i = 0
    while pq:
        _, node = heapq.heappop(pq)
        
        if node in closed:
            continue
        
        closed.add(node)
        nodes_explored += 1
        
        if node == dest:
            yield {'type': 'status', 'msg': 'reached_dest', 'node': node}
            break
        
        # Explorar vecinos
        for u, v, k, data in G.out_edges(node, keys=True, data=True):
            if v in closed:
                continue
            
            tentative_g = g_score[node] + data['weight']
            
            # Relajación de arista con heurística
            if tentative_g < g_score[v]:
                prev[v] = node
                g_score[v] = tentative_g
                f_score[v] = tentative_g + h(v)  # f(n) = g(n) + h(n)
                heapq.heappush(pq, (f_score[v], v))
                
                if i % decimate == 0:
                    u_node, v_node = G.nodes[u], G.nodes[v]
                    yield {
                        'type': 'visited', 'edge_id': f"{u}|{v}|{k}",
                        'u': u, 'v': v, 'k': k, 'weight': data['weight'],
                        'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
                    }
                i += 1
        
        if nodes_explored % progress_every == 0:
            yield {'type': 'progress', 'explored': nodes_explored}
    
    elapsed = time.time() - t0
    path_edges, total_km = reconstruct_path(G, orig, dest, prev)
    
    for order, (u, v, k) in enumerate(path_edges):
        u_node, v_node = G.nodes[u], G.nodes[v]
        yield {
            'type': 'path', 'edge_id': f"{u}|{v}|{k}",
            'u': u, 'v': v, 'k': k, 'order': order,
            'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
        }
    
    yield {'type': 'done', 'nodes_explored': nodes_explored, 'time_s': elapsed, 'distance_km': total_km}


# =============================================================================
# APLICACIÓN FASTAPI
# =============================================================================
app = FastAPI(
    title='Realtime Route Visualizer',
    description='Visualizador en tiempo real de algoritmos de búsqueda de rutas (Dijkstra, A*)',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GRAPH: Optional[nx.MultiDiGraph] = None


@app.on_event("startup")
async def startup_event():
    """Inicializa el grafo al arrancar la aplicación"""
    global GRAPH
    try:
        logger.info("Cargando grafo...")
        GRAPH = load_or_download_graph()
        logger.info(f"Grafo cargado: {len(GRAPH.nodes)} nodos, {len(GRAPH.edges)} aristas")
    except Exception as e:
        logger.error(f"Error al cargar el grafo: {e}")
        raise


@app.get('/')
async def root():
    """Endpoint raíz"""
    return {
        "message": "Realtime Route Visualizer API",
        "version": "1.0.0",
        "endpoints": {
            "graph_meta": "/api/graph-meta",
            "edges_sample": "/api/edges-sample?decimate=10",
            "find_nearest": "/api/find-nearest?lat=-27.47&lon=-58.83",
            "websocket": "/ws/run"
        }
    }


@app.get('/api/graph-meta')
async def graph_meta():
    """Retorna metadatos del grafo cargado."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Grafo no cargado")
    
    lats = [n['y'] for _, n in GRAPH.nodes(data=True)]
    lons = [n['x'] for _, n in GRAPH.nodes(data=True)]
    
    return JSONResponse(content={
        'place': PLACE,
        'radius_m': RADIUS,
        'nodes_total': len(GRAPH.nodes),
        'edges_total': len(GRAPH.edges),
        'bbox': [min(lats), min(lons), max(lats), max(lons)],
        'graph_cache_version': 'v1'
    })


@app.get('/api/edges-sample')
async def edges_sample(decimate: int = Query(10, ge=1, le=1000)):
    """Retorna una muestra de aristas del grafo para visualización inicial."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Grafo no cargado")
    return JSONResponse(content={'edges': get_edge_sample(GRAPH, decimate=decimate)})


@app.get('/api/find-nearest')
async def find_nearest(lat: float = Query(...), lon: float = Query(...)):
    """Encuentra el nodo más cercano a las coordenadas dadas."""
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Grafo no cargado")
    
    nearest = find_nearest_node(GRAPH, lat, lon)
    if nearest is None:
        raise HTTPException(status_code=404, detail="No se encontró ningún nodo")
    
    node_data = GRAPH.nodes[nearest]
    return JSONResponse(content={'node_id': nearest, 'lat': node_data['y'], 'lon': node_data['x']})


@app.websocket('/ws/run')
async def ws_run(ws: WebSocket):
    """
    WebSocket para ejecutar algoritmos de búsqueda en tiempo real.
    
    Protocolo:
        Cliente envía: {"alg": "dijkstra"|"astar", "orig": node_id, "dest": node_id, "params": {...}}
        Servidor emite: {"type": "status"|"visited"|"path"|"progress"|"done"|"error", ...}
    """
    await ws.accept()
    
    try:
        raw = await ws.receive_text()
        
        try:
            params = json.loads(raw)
        except json.JSONDecodeError:
            await ws.send_text(json.dumps({'type': 'error', 'msg': 'JSON inválido'}))
            await ws.close()
            return
        
        alg = params.get('alg', 'dijkstra')
        orig = params.get('orig')
        dest = params.get('dest')
        decimate = params.get('params', {}).get('decimate', 1)
        speed = params.get('params', {}).get('speed', 1.0)
        
        if GRAPH is None:
            await ws.send_text(json.dumps({'type': 'error', 'msg': 'Grafo no cargado'}))
            await ws.close()
            return
        
        if orig is None or dest is None:
            await ws.send_text(json.dumps({'type': 'error', 'msg': 'orig y dest son requeridos'}))
            await ws.close()
            return
        
        if orig not in GRAPH.nodes or dest not in GRAPH.nodes:
            await ws.send_text(json.dumps({'type': 'error', 'msg': 'orig o dest no están en el grafo'}))
            await ws.close()
            return
        
        if alg not in ['dijkstra', 'astar']:
            await ws.send_text(json.dumps({'type': 'error', 'msg': f'Algoritmo desconocido: {alg}'}))
            await ws.close()
            return
        
        logger.info(f"Ejecutando {alg} desde {orig} hasta {dest}")
        
        gen = dijkstra_stream(GRAPH, orig, dest, decimate=decimate) if alg == 'dijkstra' \
              else astar_stream(GRAPH, orig, dest, decimate=decimate)
        
        async for event in run_sync_generator_async(gen, speed=speed):
            await ws.send_text(json.dumps(event))
        
        await ws.close()
    
    except WebSocketDisconnect:
        logger.info("Cliente desconectado")
    except Exception as e:
        logger.error(f"Error en WebSocket: {e}", exc_info=True)
        try:
            await ws.send_text(json.dumps({'type': 'error', 'msg': str(e)}))
        except:
            pass
        finally:
            try:
                await ws.close()
            except:
                pass
