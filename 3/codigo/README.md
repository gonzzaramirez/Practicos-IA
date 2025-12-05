# Sistema Experto Medico - IA Simbolica

Sistema de diagnostico para Dengue y COVID-19 implementando tres enfoques de Inteligencia Artificial Simbolica.

---

## Descripcion General

Aplicacion web que permite ingresar datos de un paciente y obtener un diagnostico preliminar utilizando:

1. Sistema Deterministico (reglas SI-ENTONCES)
2. Red Bayesiana (probabilistico)
3. Logica Difusa

---

## Arquitectura

```
codigo/
├── backend/           # API REST con FastAPI
│   ├── main.py        # Endpoints y configuracion
│   ├── models.py      # Esquemas Pydantic
│   └── enfoques/
│       ├── deterministico.py
│       ├── probabilistico.py
│       └── difuso.py
└── frontend/          # Interfaz React + Vite
    └── src/
        ├── App.jsx
        ├── store.js   # Estado global (Zustand)
        └── components/
```

---

## Backend - Explicacion Tecnica

### Enfoque Deterministico

**Que hace:** Motor de inferencia basado en reglas explicitas SI-ENTONCES con encadenamiento hacia adelante.

**Como funciona:**

- Se declaran hechos del paciente (sintomas, antecedentes)
- El motor ejecuta encadenamiento hacia adelante (forward chaining)
- Las reglas que coinciden con los hechos se activan
- Cada regla suma puntos a Dengue o COVID

**Por que:** Implementacion propia inspirada en CLIPS. Permite razonamiento explicable: cada conclusion tiene una regla que la justifica.

```python
Regla("R6: Viaje zona endemica",
    condicion=lambda h: h.get('viaje_reciente') and h.get('destino_viaje') in ['brasil'],
    accion=lambda m: m.diagnosticos["dengue"] += 3,
    descripcion="Viaje aumenta probabilidad de Dengue")
```

### Enfoque Probabilistico (pgmpy)

**Que hace:** Red Bayesiana que modela dependencias causales entre variables. Calcula P(Enfermedad|Evidencia).

**Como funciona:**

- Se define un grafo dirigido aciclico (DAG) con nodos (variables) y arcos (dependencias)
- Cada nodo tiene una tabla CPD (probabilidad condicional)
- Al ingresar evidencia (sintomas observados), se ejecuta inferencia por eliminacion de variables
- Se obtienen probabilidades posteriores

**Por que:** Las redes bayesianas manejan incertidumbre de forma matematica. La evidencia parcial actualiza las probabilidades sin requerir reglas exactas.

```python
# Estructura: Viaje -> Dengue -> Fiebre
modelo = BayesianNetwork([
    ('Viaje', 'Dengue'),
    ('Dengue', 'Fiebre'),
])
```

### Enfoque Difuso (scikit-fuzzy)

**Que hace:** Sistema de control difuso que trabaja con variables linguisticas (fiebre "alta", tos "moderada").

**Como funciona:**

1. Fuzzificacion: valores crisp se convierten a grados de pertenencia (0-1)
2. Evaluacion de reglas: se combinan antecedentes difusos
3. Agregacion: se unen los consecuentes activados
4. Defuzzificacion: se obtiene valor final por metodo del centroide

**Por que:** Permite modelar imprecision. Un paciente con 38.2C no tiene fiebre "si" o "no", tiene un grado de pertenencia a cada categoria.

```python
# Funcion de membresia triangular
temp.agregar_conjunto('febril', 'triangular', [37.2, 38, 39])
```

---

## Frontend

Aplicacion React con:

- Zustand: estado global simple y reactivo
- Recharts: graficos comparativos
- Tailwind CSS: estilos utilitarios

El formulario captura datos del paciente y los envia al backend. Los resultados se muestran en tabs separadas con opcion de ver el razonamiento detallado.

---

## Instalacion y Ejecucion

### Requisitos

- Python 3.9+
- Node.js 18+

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
venv\Scripts\activate

# Activar entorno (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python main.py
```

El backend estara disponible en http://localhost:8000

Documentacion interactiva en http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend estara disponible en http://localhost:5173

---

## Endpoints API

| Metodo | Ruta                        | Descripcion                      |
| ------ | --------------------------- | -------------------------------- |
| POST   | /diagnostico/deterministico | Ejecuta sistema basado en reglas |
| POST   | /diagnostico/probabilistico | Ejecuta red bayesiana            |
| POST   | /diagnostico/difuso         | Ejecuta sistema difuso           |
| POST   | /diagnostico/todos          | Ejecuta los tres enfoques        |
| GET    | /caso-ejemplo               | Retorna datos del caso del TP    |

---

## Caso de Prueba

El endpoint /caso-ejemplo retorna el paciente del trabajo practico:

- Sintomas: fiebre, tos, dolor de garganta
- 35 anios, masculino, Corrientes
- Antecedentes: asma, medicacion para presion
- Viaje reciente a Brasil, contacto con caso de Dengue
- Brote activo de Dengue en la zona

Resultado esperado: Los tres enfoques deben indicar mayor sospecha de Dengue.

---

## Estructura de Respuesta

```json
{
  "tipo": "deterministico|probabilistico|difuso",
  "diagnostico": "ALTA SOSPECHA DE DENGUE",
  "razonamiento": ["Regla activada...", "Evidencia..."],
  "intermedio": { "datos_especificos_del_enfoque": "..." },
  "metrica": "Dengue: 12 pts | COVID: 5 pts"
}
```

---

## Tecnologias Utilizadas

**Backend:**

- FastAPI - Framework web asincrono
- Motor de reglas propio (encadenamiento hacia adelante)
- pgmpy - Modelos graficos probabilisticos
- Logica difusa implementacion propia

**Frontend:**

- React 18
- Vite
- Zustand - Estado global
- Recharts - Visualizaciones
- Tailwind CSS
