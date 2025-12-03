"""
Aplicación principal FastAPI del visualizador de rutas en tiempo real
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
from typing import Optional
import networkx as nx

from .graph import load_or_download_graph, get_edge_sample, find_nearest_node
from .algorithms import dijkstra_stream, astar_stream
from .utils import run_sync_generator_async


# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title='Realtime Route Visualizer',
    description='Visualizador en tiempo real de algoritmos de búsqueda de rutas (Dijkstra, A*)',
    version='1.0.0'
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variable global para el grafo
GRAPH: Optional[nx.MultiDiGraph] = None


@app.on_event("startup")
async def startup_event():
    """Inicializa el grafo al arrancar la aplicación"""
    global GRAPH
    try:
        logger.info("Cargando grafo...")
        GRAPH = load_or_download_graph()
        logger.info(f"Grafo cargado exitosamente: {len(GRAPH.nodes)} nodos, {len(GRAPH.edges)} aristas")
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
    """
    Retorna metadatos del grafo cargado.
    
    Returns:
        Información sobre el grafo: lugar, radio, número de nodos/aristas, bounding box
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Grafo no cargado")
    
    G = GRAPH
    
    # Calcular bounding box
    lats = [n['y'] for _, n in G.nodes(data=True)]
    lons = [n['x'] for _, n in G.nodes(data=True)]
    
    meta = {
        'place': 'Corrientes, Corrientes, Argentina',
        'radius_m': 9000,
        'nodes_total': len(G.nodes),
        'edges_total': len(G.edges),
        'bbox': [
            min(lats),
            min(lons),
            max(lats),
            max(lons)
        ],
        'graph_cache_version': 'v1'
    }
    
    return JSONResponse(content=meta)


@app.get('/api/edges-sample')
async def edges_sample(decimate: int = Query(10, ge=1, le=1000, description="Factor de decimación para reducir número de aristas")):
    """
    Retorna una muestra de aristas del grafo para visualización inicial.
    
    Args:
        decimate: Factor de decimación (1 = todas, 10 = cada décima)
    
    Returns:
        Diccionario mapeando edge_id -> coordenadas [[lat, lon], [lat, lon]]
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Grafo no cargado")
    
    G = GRAPH
    sample = get_edge_sample(G, decimate=decimate)
    
    return JSONResponse(content={'edges': sample})


@app.get('/api/find-nearest')
async def find_nearest(
    lat: float = Query(..., description="Latitud"),
    lon: float = Query(..., description="Longitud")
):
    """
    Encuentra el nodo más cercano a las coordenadas dadas.
    
    Args:
        lat: Latitud
        lon: Longitud
    
    Returns:
        ID del nodo más cercano y sus coordenadas
    """
    if GRAPH is None:
        raise HTTPException(status_code=503, detail="Grafo no cargado")
    
    G = GRAPH
    nearest = find_nearest_node(G, lat, lon)
    
    if nearest is None:
        raise HTTPException(status_code=404, detail="No se encontró ningún nodo")
    
    node_data = G.nodes[nearest]
    
    return JSONResponse(content={
        'node_id': nearest,
        'lat': node_data['y'],
        'lon': node_data['x']
    })


@app.websocket('/ws/run')
async def ws_run(ws: WebSocket):
    """
    WebSocket endpoint para ejecutar algoritmos de búsqueda y recibir eventos en tiempo real.
    
    Protocolo:
        Cliente envía: {"alg": "dijkstra"|"astar", "orig": node_id, "dest": node_id, "params": {"decimate": 1, "speed": 1.0}}
        Servidor emite eventos: {"type": "status"|"visited"|"path"|"progress"|"done"|"error", ...}
    """
    await ws.accept()
    
    try:
        # Recibir parámetros iniciales
        raw = await ws.receive_text()
        
        try:
            params = json.loads(raw)
        except json.JSONDecodeError:
            await ws.send_text(json.dumps({
                'type': 'error',
                'msg': 'JSON inválido'
            }))
            await ws.close()
            return
        
        # Validar parámetros
        alg = params.get('alg', 'dijkstra')
        orig = params.get('orig')
        dest = params.get('dest')
        decimate = params.get('params', {}).get('decimate', 1)
        speed = params.get('params', {}).get('speed', 1.0)
        
        if GRAPH is None:
            await ws.send_text(json.dumps({
                'type': 'error',
                'msg': 'Grafo no cargado'
            }))
            await ws.close()
            return
        
        G = GRAPH
        
        # Validar nodos
        if orig is None or dest is None:
            await ws.send_text(json.dumps({
                'type': 'error',
                'msg': 'orig y dest son requeridos'
            }))
            await ws.close()
            return
        
        if orig not in G.nodes or dest not in G.nodes:
            await ws.send_text(json.dumps({
                'type': 'error',
                'msg': 'orig o dest no están en el grafo'
            }))
            await ws.close()
            return
        
        if alg not in ['dijkstra', 'astar']:
            await ws.send_text(json.dumps({
                'type': 'error',
                'msg': f'Algoritmo desconocido: {alg}'
            }))
            await ws.close()
            return
        
        # Ejecutar algoritmo
        logger.info(f"Ejecutando {alg} desde {orig} hasta {dest}")
        
        if alg == 'dijkstra':
            gen = dijkstra_stream(G, orig, dest, decimate=decimate)
        else:
            gen = astar_stream(G, orig, dest, decimate=decimate)
        
        # Stream eventos al cliente
        async for event in run_sync_generator_async(gen, speed=speed):
            await ws.send_text(json.dumps(event))
        
        await ws.close()
    
    except WebSocketDisconnect:
        logger.info("Cliente desconectado")
    except Exception as e:
        logger.error(f"Error en WebSocket: {e}", exc_info=True)
        try:
            await ws.send_text(json.dumps({
                'type': 'error',
                'msg': str(e)
            }))
        except:
            pass
        finally:
            try:
                await ws.close()
            except:
                pass

