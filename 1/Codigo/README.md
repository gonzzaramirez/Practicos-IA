# 🗺️ Visualizador de Rutas en Tiempo Real

Sistema full-stack para visualizar en tiempo real la ejecución de algoritmos de búsqueda de rutas (Dijkstra y A\*) sobre mapas de OpenStreetMap.

## 📋 Descripción

Este proyecto permite visualizar paso a paso cómo funcionan los algoritmos de búsqueda de rutas sobre un grafo real de calles. El backend utiliza FastAPI con WebSockets para transmitir eventos en tiempo real, mientras que el frontend en React + TypeScript muestra la visualización interactiva sobre un mapa de Leaflet.

## 🏗️ Arquitectura del Sistema

El proyecto está dividido en dos componentes principales:

### Backend (FastAPI)

- **Framework**: FastAPI con WebSocket support
- **Lenguaje**: Python 3.11
- **Bibliotecas principales**: NetworkX, OSMnx, Shapely
- **Comunicación**: WebSocket para streaming en tiempo real

### Frontend (React + TypeScript)

- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Mapa**: React Leaflet (Leaflet.js)
- **Estado**: React Hooks (useState, useEffect, useMemo)
- **Comunicación**: WebSocket nativo + Axios para REST API

## 📁 Estructura del Proyecto

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Aplicación FastAPI y endpoints
│   │   ├── graph.py             # Carga y procesamiento de grafos OSM
│   │   ├── algorithms.py        # Implementación de Dijkstra y A*
│   │   ├── utils.py             # Utilidades (haversine, async adapter)
│   │   └── tests/
│   │       ├── __init__.py
│   │       └── test_algorithms.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ControlPanel.tsx     # Panel de control
│   │   │   └── MapViewer.tsx        # Componente del mapa
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts      # Hook para WebSocket
│   │   │   └── useApi.ts            # Hook para llamadas REST
│   │   ├── types.ts                 # Definiciones de tipos TypeScript
│   │   ├── App.tsx                  # Componente principal
│   │   ├── main.tsx                 # Punto de entrada
│   │   └── index.css                # Tailwind CSS
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## 🔧 Cómo Funciona el Código

### Backend

#### 1. Carga del Grafo (`backend/app/graph.py`)

El sistema utiliza OSMnx para descargar y procesar grafos de OpenStreetMap:

```python
def load_or_download_graph():
    # 1. Intenta cargar desde caché (pickle)
    # 2. Si no existe, descarga de OSM
    # 3. Procesa aristas: calcula pesos (tiempo en segundos)
    # 4. Guarda en caché para próximas ejecuciones
```

**Características importantes:**

- **Caché**: El grafo se guarda en `graph_cache_corrientes.pkl` para evitar descargas repetidas
- **Pesos**: Se calculan como tiempo de viaje (distancia / velocidad)
- **Velocidades**: Se normalizan a un rango válido (0-200 km/h), usando 40 km/h por defecto

#### 2. Algoritmos de Búsqueda (`backend/app/algorithms.py`)

**Dijkstra (`dijkstra_stream`):**

- Usa una cola de prioridad (heap) para explorar nodos
- Emite eventos cada vez que visita una arista (con decimación opcional)
- Reconstruye la ruta final usando el diccionario de predecesores

**A\* (`astar_stream`):**

- Similar a Dijkstra pero con heurística
- La heurística usa distancia de Haversine hasta el destino
- Normalizada por la velocidad máxima del grafo para consistencia

**Eventos emitidos:**

- `status`: Inicio del algoritmo, llegada al destino
- `visited`: Cada arista explorada (decimada)
- `progress`: Cada N nodos explorados (cada 500 por defecto)
- `path`: Aristas que forman la ruta final (en orden)
- `done`: Resultados finales (nodos explorados, tiempo, distancia)

#### 3. WebSocket Endpoint (`backend/app/main.py`)

```python
@app.websocket('/ws/run')
async def ws_run(ws: WebSocket):
    # 1. Recibe parámetros JSON del cliente
    # 2. Valida nodos y algoritmo
    # 3. Ejecuta el generador del algoritmo
    # 4. Usa run_sync_generator_async para convertir sync->async
    # 5. Envía cada evento como JSON al cliente
```

**Adaptador Async (`backend/app/utils.py`):**

- Convierte generadores síncronos en async iterables
- Permite control de velocidad (throttling)

### Frontend

#### 1. Gestión de Estado (`frontend/src/App.tsx`)

El componente principal orquesta:

- **Conexión WebSocket**: A través del hook `useWebSocket`
- **Datos del grafo**: Carga inicial de aristas para mostrar el mapa
- **Selección de nodos**: Permite hacer clic en el mapa o ingresar IDs manualmente
- **Visualización**: Pasa mensajes y coordenadas al componente `MapViewer`

#### 2. Hook de WebSocket (`frontend/src/hooks/useWebSocket.ts`)

```typescript
function useWebSocket() {
  // 1. Crea conexión WebSocket al iniciar
  // 2. Maneja eventos: open, message, error, close
  // 3. Acumula mensajes en estado
  // 4. Expone función send() para enviar comandos
}
```

**Características:**

- Reintento automático en caso de desconexión
- Manejo de errores robusto
- Estado de conexión visible en la UI

#### 3. Componente del Mapa (`frontend/src/components/MapViewer.tsx`)

```typescript
// Procesa mensajes para extraer:
// - Aristas visitadas (naranja)
// - Ruta final (verde)
// - Dibuja todo sobre el mapa de Leaflet
```

**Capas del mapa:**

1. **Base**: Todas las aristas del grafo (gris claro, opacidad baja)
2. **Visitadas**: Aristas exploradas por el algoritmo (naranja, opacidad media)
3. **Ruta final**: Camino óptimo encontrado (verde, ancho, opacidad completa)

#### 4. Panel de Control (`frontend/src/components/ControlPanel.tsx`)

Permite configurar:

- **Algoritmo**: Dijkstra o A\*
- **Nodos**: Origen y destino (por ID o selección en mapa)
- **Decimación**: Factor para reducir número de eventos (1 = todos, 10 = cada décima)
- **Velocidad**: Factor de aceleración (0.1x a 10x)

## 🚀 Instalación y Uso

### Opción 1: Desarrollo Local

#### Backend

```bash
cd backend
python -m venv .venv

# En Windows:
.venv\Scripts\activate
# En Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Opción 2: Docker Compose

```bash
docker-compose up --build
```

Esto levantará ambos servicios automáticamente.

## 📡 API Endpoints

### REST Endpoints

#### `GET /api/graph-meta`

Retorna metadatos del grafo cargado:

```json
{
  "place": "Corrientes, Corrientes, Argentina",
  "radius_m": 9000,
  "nodes_total": 12345,
  "edges_total": 23456,
  "bbox": [-27.5, -58.9, -27.4, -58.7],
  "graph_cache_version": "v1"
}
```

#### `GET /api/edges-sample?decimate=10`

Retorna una muestra de aristas para visualización inicial:

```json
{
  "edges": {
    "123|456|0": [[-27.47, -58.83], [-27.47, -58.82]],
    ...
  }
}
```

#### `GET /api/find-nearest?lat=-27.47&lon=-58.83`

Encuentra el nodo más cercano a las coordenadas dadas:

```json
{
  "node_id": 12345,
  "lat": -27.4701,
  "lon": -58.8302
}
```

### WebSocket Endpoint

#### `WS /ws/run`

**Mensaje del Cliente → Servidor:**

```json
{
  "alg": "astar",
  "orig": 12345,
  "dest": 67890,
  "params": {
    "decimate": 1,
    "speed": 2.0
  }
}
```

**Mensajes del Servidor → Cliente:**

Evento `status` (inicio):

```json
{
  "type": "status",
  "msg": "started",
  "algorithm": "astar",
  "orig": 12345,
  "dest": 67890
}
```

Evento `visited` (cada arista explorada):

```json
{
  "type": "visited",
  "edge_id": "123|456|0",
  "u": 123,
  "v": 456,
  "k": 0,
  "weight": 10.5
}
```

Evento `path` (cada arista de la ruta final):

```json
{
  "type": "path",
  "edge_id": "123|456|0",
  "u": 123,
  "v": 456,
  "k": 0,
  "order": 0
}
```

Evento `done` (finalización):

```json
{
  "type": "done",
  "nodes_explored": 5432,
  "time_s": 0.123,
  "distance_km": 5.67
}
```

## 🧪 Testing

Para ejecutar los tests del backend:

```bash
cd backend
.venv/bin/activate  # o .venv\Scripts\activate en Windows
pytest
```

Los tests verifican:

- Que Dijkstra encuentra rutas correctamente
- Que A\* encuentra rutas correctamente
- Que la reconstrucción de rutas funciona

## 🎨 Características de UI

### Diseño Moderno

- Panel lateral con glassmorphism (backdrop blur)
- Colores vibrantes para indicar estados
- Animaciones suaves en transiciones
- Responsive y adaptable

### Colores del Mapa

- **Gris claro**: Aristas base del grafo
- **Naranja (#ff6b35)**: Aristas visitadas/exploradas
- **Verde (#00ff88)**: Ruta final óptima
- **Azul**: Marcadores de origen/destino

### Interactividad

- Click en mapa para seleccionar origen/destino
- Input manual de IDs de nodo
- Control de velocidad de visualización
- Control de decimación para performance

## 🔍 Detalles Técnicos

### Optimizaciones

1. **Decimación**: Reduce el número de eventos enviados al frontend

   - Útil para grafos grandes
   - Mejora performance sin perder mucha información visual

2. **Caché del Grafo**:

   - Evita descargas repetidas de OSM
   - El grafo se guarda en formato pickle

3. **Batching de Mensajes**:

   - Frontend procesa eventos en lotes para mejor performance

4. **Lazy Loading**:
   - Solo carga muestra inicial de aristas
   - Carga completa solo durante la búsqueda

### Limitaciones

- El grafo está limitado a un área específica (Corrientes, Argentina)
- La búsqueda del nodo más cercano es lineal (O(n))
- No hay soporte para múltiples búsquedas simultáneas
- No hay autenticación/autorización (desarrollo)

### Mejoras Futuras

- [ ] Búsqueda del nodo más cercano con R-tree (O(log n))
- [ ] Soporte para múltiples búsquedas simultáneas
- [ ] Autenticación y rate limiting
- [ ] Persistencia de resultados
- [ ] Comparación lado a lado de algoritmos
- [ ] Exportación de rutas (GPX, KML)

## 🐛 Troubleshooting

### Error: "Grafo no cargado"

- Verifica que el backend esté corriendo
- Revisa los logs del backend para errores de descarga

### Error: "orig o dest no están en el grafo"

- Verifica que los IDs de nodo sean válidos
- Usa el endpoint `/api/find-nearest` para obtener IDs válidos

### El mapa no carga

- Verifica que Leaflet CSS esté cargado
- Revisa la consola del navegador para errores de CORS

### WebSocket no conecta

- Verifica que el backend esté en el puerto 8000
- Revisa la configuración de CORS en el backend
- En producción, configura correctamente la URL del WebSocket

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y personal.

## 👨‍💻 Autor

Desarrollado siguiendo buenas prácticas de desarrollo full-stack.

---

**¡Disfruta visualizando algoritmos de búsqueda en acción! 🚀**
