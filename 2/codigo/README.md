# Agente Inteligente - Chatbot Informativo de Carreras Universitarias

## Descripcion del Proyecto

Este proyecto implementa un **Agente Inteligente** diseñado para resolver una problematica en el dominio de la educacion superior: la dificultad de los estudiantes y publico general para localizar rapidamente informacion estandarizada sobre las carreras universitarias disponibles.

## Problema Identificado

Los estudiantes que buscan orientacion vocacional enfrentan:

- Informacion dispersa en multiples paginas web
- Dificultad para comparar carreras
- Tiempo excesivo buscando datos especificos (duracion, perfil, campo laboral)

## Solucion Propuesta

Un chatbot conversacional que actua como agente de consulta, capaz de responder preguntas naturales sobre las 13 carreras de la facultad y entregar informacion precisa en segundos.

---

## Fundamento Teorico: Modelo PAMA

El agente esta diseñado siguiendo el modelo **PAMA** (Percepcion, Accion, Modelo, Actuador):

| Componente         | Implementacion                                                         |
| ------------------ | ---------------------------------------------------------------------- |
| **Percepcion (P)** | Recepcion del mensaje del usuario via API REST                         |
| **Modelo (A)**     | Base de conocimiento JSON con 13 fichas de carreras                    |
| **Accion (M)**     | Procesamiento con fuzzy matching + deteccion de intencion por keywords |
| **Actuador (A)**   | Respuesta estructurada con texto relevante y link a ficha completa     |

### Tipo de Agente

- **Clasificacion**: Agente reactivo basado en reglas con modelo interno
- **Caracteristica**: Hibrido (combina reglas simples con matching aproximado)

---

## Arquitectura del Sistema

```
Usuario <--> Frontend (Vite + React) <--> Backend (FastAPI) <--> Base de Conocimiento (JSON)
```

### Componentes

1. **Frontend**: Interfaz de chat desarrollada con Vite, React y Tailwind CSS
2. **Backend**: API REST con FastAPI que implementa la logica del agente
3. **Motor de NLU**: Fuzzy matching con RapidFuzz para tolerancia a errores de escritura
4. **Base de Conocimiento**: Archivo JSON estructurado con las 13 fichas de carreras

### Endpoints API

| Metodo | Ruta               | Descripcion                            |
| ------ | ------------------ | -------------------------------------- |
| POST   | `/api/chat`        | Procesa mensaje y devuelve respuesta   |
| GET    | `/api/careers`     | Lista todas las carreras               |
| GET    | `/api/career/{id}` | Devuelve ficha completa de una carrera |

---

## Stack Tecnologico

**Backend:**

- FastAPI - Framework web asincrono
- Uvicorn - Servidor ASGI
- RapidFuzz - Algoritmos de fuzzy string matching
- Pydantic - Validacion de datos

**Frontend:**

- Vite - Build tool rapido
- React 18 - Biblioteca UI
- Tailwind CSS - Framework de estilos

---

## Instrucciones de Ejecucion

### Requisitos

- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

El servidor iniciara en `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicacion estara disponible en `http://localhost:5173`

---

## Metricas de Rendimiento

Para evaluar el agente se proponen las siguientes metricas:

| Metrica             | Descripcion                          | Objetivo |
| ------------------- | ------------------------------------ | -------- |
| Precision@1         | Respuesta correcta en primer intento | > 80%    |
| Coverage            | Porcentaje de preguntas respondidas  | > 90%    |
| Tiempo de respuesta | Latencia del sistema                 | < 200ms  |

---

## Limitaciones y Trabajo Futuro

**Limitaciones actuales:**

- El fuzzy matching puede fallar con preguntas muy abiertas o ambiguas
- No maneja contexto conversacional (cada mensaje es independiente)

**Mejoras posibles:**

- Implementar embeddings semanticos con sentence-transformers
- Agregar indice vectorial con FAISS para busqueda semantica
- Incorporar manejo de sesion y contexto

---

## Estructura del Proyecto

```
proyecto/
├── backend/
│   ├── main.py           # Logica del agente y API
│   ├── carreras.json     # Base de conocimiento
│   └── requirements.txt  # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Componente principal del chat
│   │   ├── main.jsx      # Punto de entrada
│   │   └── index.css     # Estilos globales
│   ├── package.json      # Dependencias Node
│   └── vite.config.js    # Configuracion Vite
└── README.md
```

---

## Autor

Trabajo Practico - Inteligencia Artificial
