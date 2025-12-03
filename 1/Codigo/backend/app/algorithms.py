"""
Implementación de algoritmos de búsqueda de rutas: Dijkstra y A*
"""
import heapq
import time
from typing import Iterator, Dict, Any, List, Tuple, Optional
import networkx as nx
from .utils import haversine_m


def reconstruct_path(
    G: nx.MultiDiGraph, 
    orig: int, 
    dest: int, 
    prev: Dict[int, Optional[int]]
) -> Tuple[List[Tuple[int, int, int]], float]:
    """
    Reconstruye la ruta desde el diccionario de predecesores.
    
    Args:
        G: Grafo de NetworkX
        orig: Nodo de origen
        dest: Nodo de destino
        prev: Diccionario de predecesores (nodo -> predecesor)
    
    Returns:
        Tupla con (lista de aristas como (u, v, k), distancia total en km)
    """
    path = []
    curr = dest
    total_length = 0.0
    
    while curr and curr != orig:
        p = prev.get(curr)
        if p is None:
            break
        
        # Elegir la mejor clave (mínimo peso) entre múltiples aristas
        best_k = None
        best_w = float('inf')
        
        for k, attr in G[p][curr].items():
            w = attr.get('weight', float('inf'))
            if w < best_w:
                best_w = w
                best_k = k
        
        if best_k is None:
            break
        
        path.append((p, curr, best_k))
        total_length += G.edges[p, curr, best_k]['length']
        curr = p
    
    path.reverse()
    return path, total_length / 1000.0


def compute_max_speed_from_graph(G: nx.MultiDiGraph, default_speed_kmh: float = 40.0) -> float:
    """
    Calcula la velocidad máxima del grafo para usar en la heurística de A*.
    
    Args:
        G: Grafo de NetworkX
        default_speed_kmh: Velocidad por defecto si no se encuentra ninguna
    
    Returns:
        Velocidad máxima en m/s
    """
    speeds = []
    for _, _, _, d in G.edges(keys=True, data=True):
        s = d.get('speed_kph')
        if s:
            try:
                speeds.append(float(s))
            except (ValueError, TypeError):
                pass
    
    if not speeds:
        return default_speed_kmh / 3.6
    
    return max(speeds) / 3.6


def dijkstra_stream(
    G: nx.MultiDiGraph, 
    orig: int, 
    dest: int, 
    decimate: int = 1, 
    progress_every: int = 500
) -> Iterator[Dict[str, Any]]:
    """
    Implementación de Dijkstra que emite eventos durante la ejecución.
    
    Args:
        G: Grafo de NetworkX
        orig: Nodo de origen
        dest: Nodo de destino
        decimate: Factor de decimación para eventos 'visited' (1 = todos, 10 = cada décimo)
        progress_every: Frecuencia de eventos de progreso (cada N nodos explorados)
    
    Yields:
        Eventos del algoritmo en formato dict
    """
    t0 = time.time()
    dist = {n: float('inf') for n in G.nodes}
    prev = {n: None for n in G.nodes}
    visited = set()
    dist[orig] = 0
    pq = [(0, orig)]
    nodes_explored = 0
    
    yield {
        'type': 'status',
        'msg': 'started',
        'algorithm': 'dijkstra',
        'orig': orig,
        'dest': dest
    }
    
    i = 0
    while pq:
        d, node = heapq.heappop(pq)
        
        if node in visited:
            continue
        
        visited.add(node)
        nodes_explored += 1
        
        if node == dest:
            yield {'type': 'status', 'msg': 'reached_dest', 'node': node}
            break
        
        # Explorar vecinos
        for u, v, k, data in G.out_edges(node, keys=True, data=True):
            w = data['weight']
            new_dist = dist[node] + w
            
            if new_dist < dist[v]:
                dist[v] = new_dist
                prev[v] = node
                heapq.heappush(pq, (dist[v], v))
                
                # Emitir evento de arista visitada (con decimación)
                if i % decimate == 0:
                    # Incluir coordenadas para visualización
                    u_node = G.nodes[u]
                    v_node = G.nodes[v]
                    yield {
                        'type': 'visited',
                        'edge_id': f"{u}|{v}|{k}",
                        'u': u,
                        'v': v,
                        'k': k,
                        'weight': w,
                        'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
                    }
                i += 1
        
        # Emitir evento de progreso periódicamente
        if nodes_explored % progress_every == 0:
            yield {'type': 'progress', 'explored': nodes_explored}
    
    elapsed = time.time() - t0
    path_edges, total_km = reconstruct_path(G, orig, dest, prev)
    
    # Emitir aristas de la ruta final
    for order, (u, v, k) in enumerate(path_edges):
        # Incluir coordenadas para visualización
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        yield {
            'type': 'path',
            'edge_id': f"{u}|{v}|{k}",
            'u': u,
            'v': v,
            'k': k,
            'order': order,
            'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
        }
    
    # Evento final
    yield {
        'type': 'done',
        'nodes_explored': nodes_explored,
        'time_s': elapsed,
        'distance_km': total_km
    }


def astar_stream(
    G: nx.MultiDiGraph, 
    orig: int, 
    dest: int, 
    decimate: int = 1, 
    progress_every: int = 500
) -> Iterator[Dict[str, Any]]:
    """
    Implementación de A* que emite eventos durante la ejecución.
    
    Args:
        G: Grafo de NetworkX
        orig: Nodo de origen
        dest: Nodo de destino
        decimate: Factor de decimación para eventos 'visited'
        progress_every: Frecuencia de eventos de progreso
    
    Yields:
        Eventos del algoritmo en formato dict
    """
    t0 = time.time()
    dest_lat, dest_lon = G.nodes[dest]['y'], G.nodes[dest]['x']
    max_speed = compute_max_speed_from_graph(G)
    
    # Función heurística: distancia haversine / velocidad máxima
    def h(node: int) -> float:
        lat, lon = G.nodes[node]['y'], G.nodes[node]['x']
        return haversine_m(lat, lon, dest_lat, dest_lon) / max_speed
    
    g_score = {n: float('inf') for n in G.nodes}
    f_score = {n: float('inf') for n in G.nodes}
    prev = {n: None for n in G.nodes}
    closed = set()
    
    g_score[orig] = 0
    f_score[orig] = h(orig)
    pq = [(f_score[orig], orig)]
    nodes_explored = 0
    
    yield {
        'type': 'status',
        'msg': 'started',
        'algorithm': 'astar',
        'orig': orig,
        'dest': dest
    }
    
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
            
            if tentative_g < g_score[v]:
                prev[v] = node
                g_score[v] = tentative_g
                f_score[v] = tentative_g + h(v)
                heapq.heappush(pq, (f_score[v], v))
                
                # Emitir evento de arista visitada (con decimación)
                if i % decimate == 0:
                    # Incluir coordenadas para visualización
                    u_node = G.nodes[u]
                    v_node = G.nodes[v]
                    yield {
                        'type': 'visited',
                        'edge_id': f"{u}|{v}|{k}",
                        'u': u,
                        'v': v,
                        'k': k,
                        'weight': data['weight'],
                        'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
                    }
                i += 1
        
        # Emitir evento de progreso periódicamente
        if nodes_explored % progress_every == 0:
            yield {'type': 'progress', 'explored': nodes_explored}
    
    elapsed = time.time() - t0
    path_edges, total_km = reconstruct_path(G, orig, dest, prev)
    
    # Emitir aristas de la ruta final
    for order, (u, v, k) in enumerate(path_edges):
        # Incluir coordenadas para visualización
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        yield {
            'type': 'path',
            'edge_id': f"{u}|{v}|{k}",
            'u': u,
            'v': v,
            'k': k,
            'order': order,
            'coords': [[u_node['y'], u_node['x']], [v_node['y'], v_node['x']]]
        }
    
    # Evento final
    yield {
        'type': 'done',
        'nodes_explored': nodes_explored,
        'time_s': elapsed,
        'distance_km': total_km
    }

