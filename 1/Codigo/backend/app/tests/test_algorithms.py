"""
Tests para los algoritmos de búsqueda de rutas
"""
import networkx as nx
from app.algorithms import dijkstra_stream, astar_stream, reconstruct_path


def make_simple_graph():
    """
    Crea un grafo simple para testing
    """
    G = nx.MultiDiGraph()
    
    # Agregar nodos con coordenadas
    G.add_node(1, x=-58.83, y=-27.47)
    G.add_node(2, x=-58.82, y=-27.47)
    G.add_node(3, x=-58.82, y=-27.46)
    
    # Agregar aristas con pesos y longitudes
    G.add_edge(1, 2, key=0, length=1000, weight=10, speed_kph=36)
    G.add_edge(2, 3, key=0, length=1000, weight=10, speed_kph=36)
    G.add_edge(1, 3, key=0, length=2500, weight=30, speed_kph=30)
    
    return G


def test_dijkstra_finds_path():
    """Test que Dijkstra encuentra una ruta"""
    G = make_simple_graph()
    gen = dijkstra_stream(G, 1, 3, decimate=1)
    events = list(gen)
    
    # Debe haber un evento 'done'
    done_events = [e for e in events if e['type'] == 'done']
    assert len(done_events) == 1, "Debe haber exactamente un evento 'done'"
    
    # El evento done debe tener los campos esperados
    done = done_events[0]
    assert 'nodes_explored' in done
    assert 'time_s' in done
    assert 'distance_km' in done


def test_astar_finds_path():
    """Test que A* encuentra una ruta"""
    G = make_simple_graph()
    gen = astar_stream(G, 1, 3, decimate=1)
    events = list(gen)
    
    # Debe haber un evento 'done'
    done_events = [e for e in events if e['type'] == 'done']
    assert len(done_events) == 1, "Debe haber exactamente un evento 'done'"
    
    # El evento done debe tener los campos esperados
    done = done_events[0]
    assert 'nodes_explored' in done
    assert 'time_s' in done
    assert 'distance_km' in done


def test_reconstruct_path():
    """Test de reconstrucción de ruta"""
    G = make_simple_graph()
    prev = {1: None, 2: 1, 3: 2}
    
    path_edges, distance = reconstruct_path(G, 1, 3, prev)
    
    assert len(path_edges) > 0, "Debe haber aristas en la ruta"
    assert distance >= 0, "La distancia debe ser no negativa"

