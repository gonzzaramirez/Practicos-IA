# Backend - Visualizador de Rutas en Tiempo Real

## Arquitectura

Backend construido con **FastAPI** que procesa grafos de OpenStreetMap y ejecuta algoritmos de búsqueda de rutas (Dijkstra y A\*) emitiendo eventos en tiempo real mediante WebSocket.

## Estructura del Código

```
backend/
├── app/
│   ├── main.py          # FastAPI app y endpoints
│   ├── graph.py         # Carga y procesamiento de grafos OSM
│   ├── algorithms.py    # Implementación de Dijkstra y A*
│   └── utils.py         # Utilidades (haversine, async adapter)
```

## Funcionamiento del Sistema

### 1. Carga del Grafo (`graph.py`)

- Utiliza **OSMnx** para descargar grafos de OpenStreetMap
- Descarga el área alrededor de Corrientes, Argentina (radio 9km)
- Procesa cada arista:
  - Calcula peso como tiempo de viaje: `distancia / velocidad` (en segundos)
  - Normaliza velocidades (rango válido: 0-200 km/h)
  - Velocidad por defecto: 40 km/h
- Guarda el grafo en caché (`graph_cache_corrientes.pkl`) para evitar descargas repetidas

### 2. Algoritmos (`algorithms.py`)

#### Dijkstra

```python
1. Inicializa distancia[origen] = 0, resto = infinito
2. Usa cola de prioridad (heap) ordenada por distancia
3. Extrae nodo con menor distancia
4. Explora vecinos y actualiza distancias
5. Emite eventos 'visited' por cada arista explorada
6. Al llegar al destino, reconstruye la ruta
```

**Complejidad**: O(V log V + E) donde V=nodos, E=aristas

#### A\* (A-star)

```python
1. Similar a Dijkstra pero usa heurística
2. f(n) = g(n) + h(n)
   - g(n): costo real desde origen
   - h(n): estimación hasta destino (haversine / velocidad_max)
3. Prioriza nodos más cercanos al destino
4. Explora menos nodos que Dijkstra
```

**Ventaja**: Más eficiente, explora menos nodos al guiarse hacia el destino

### 3. Streaming de Eventos

Los algoritmos son **generadores** que emiten eventos:

- `status`: Inicio del algoritmo
- `visited`: Cada arista explorada (con decimación)
- `progress`: Progreso cada N nodos explorados
- `path`: Aristas de la ruta final (en orden)
- `done`: Resultados finales (nodos explorados, tiempo, distancia)

### 4. WebSocket Endpoint (`main.py`)

- Recibe parámetros JSON del cliente
- Valida nodos y algoritmo
- Ejecuta el generador del algoritmo
- Convierte generador síncrono → asíncrono con `run_sync_generator_async`
- Envía cada evento como JSON al cliente

### 5. Utilidades (`utils.py`)

- **haversine_m**: Calcula distancia entre dos puntos geográficos (fórmula de Haversine)
- **run_sync_generator_async**: Adaptador que convierte generadores síncronos en async iterables con control de velocidad

## Endpoints REST

- `GET /api/graph-meta`: Metadatos del grafo (nodos, aristas, bbox)
- `GET /api/edges-sample?decimate=10`: Muestra de aristas para visualización
- `GET /api/find-nearest?lat=X&lon=Y`: Encuentra nodo más cercano a coordenadas

## WebSocket

- `WS /ws/run`: Ejecuta algoritmo y emite eventos en tiempo real

## Optimizaciones

- **Caché del grafo**: Evita descargas repetidas
- **Decimación**: Reduce número de eventos 'visited' enviados
- **Pesos optimizados**: Pre-calculados en tiempo de carga
- **Velocidad ajustable**: Throttling de eventos para control de visualización

## Dependencias Principales

- `fastapi`: Framework web asíncrono
- `networkx`: Manipulación de grafos
- `osmnx`: Descarga de grafos de OpenStreetMap
- `shapely`: Operaciones geométricas
