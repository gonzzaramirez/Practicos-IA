# Librerías y Plan de Desarrollo por Enfoque

**Trabajo Práctico – Sistemas Expertos (Determinístico / Probabilístico / Difuso)**

---

# 1. Librerías por Enfoque

## ✔ Enfoque Determinístico — **PyKnow** (o **Experta**)

**Motivo:**

- Framework diseñado específicamente para sistemas expertos basados en reglas.
- Permite declarar reglas SI–ENTONCES, manejar hechos (_facts_) y ejecutar encadenamiento hacia adelante.
- Representa fielmente el paradigma clásico de IA simbólica.

---

## ✔ Enfoque Probabilístico — **pgmpy**

**Motivo:**

- Librería estándar para modelos gráficos probabilísticos.
- Permite definir redes bayesianas, probabilidades condicionales e inferencia exacta y aproximada.
- Maneja incertidumbre mejor que sistemas determinísticos basados en reglas duras.

---

## ✔ Enfoque Difuso — **scikit-fuzzy**

**Motivo:**

- Implementa lógica difusa estándar (fuzzificación, reglas y defuzzificación).
- Permite crear funciones de pertenencia triangulares, trapezoidales o gaussianas.
- Ideal para síntomas "vagos" como _fiebre alta_ o _tos fuerte_ (grados 0–1).

---

# 2. Stack Frontend (React + Vite + shadcn/ui)

- **React + Vite:** modularidad, velocidad y excelente DX.
- **shadcn/ui:** componentes limpios y profesionales.
- **Recharts:** visualización simple (probabilidades, funciones difusas).
- **Zustand:** manejo de estado liviano y escalable.

---

# 3. Plan por Enfoque (Qué + Cómo + Defensa Teórica)

---

# 🟥 Enfoque 1 — Sistema Experto Determinístico

**Librería:** PyKnow / Experta

## 🔹 Qué vas a hacer

- Definir hechos del paciente (síntomas, viajes, antecedentes).
- Crear reglas determinísticas SI–ENTONCES basadas en el caso del TP.
- Implementar el motor de inferencia y ejecutar encadenamiento hacia adelante.
- Retornar diagnóstico + reglas activadas al frontend.

## 🔹 Cómo hacerlo (conceptualmente)

- Crear clase `Paciente` como conjunto de hechos.
- Crear clase `DiagnosticoDengueCovid` como sistema experto.
- Incluir tipos de reglas:
  - De síntomas
  - Epidemiológicas
  - Contextuales
  - De ajuste del diagnóstico
- Ejecutar el motor.

### Backend (FastAPI)

Endpoint: `/diagnostico/deterministico`  
Flujo:

1. Parsear JSON.
2. Inyectar hechos en el motor.
3. Ejecutar sistema experto.
4. Retornar:
   - diagnóstico final
   - reglas activadas
   - trazabilidad del razonamiento

## 🔹 Defensa teórica

- Librería diseñada para IA simbólica pura.
- Basada en CLIPS, motor de inferencia clásico.
- Permite razonamiento explicable: reglas explícitas → conclusiones explicables.

**Frase para el final:**

> “Elegimos PyKnow porque permite expresar reglas semánticas de forma declarativa, manteniendo el espíritu de la IA simbólica clásica, donde el conocimiento está explícito y el motor de inferencia lo procesa mediante encadenamiento hacia adelante.”

---

# 🟦 Enfoque 2 — Red Bayesiana (Probabilístico)

**Librería:** pgmpy

## 🔹 Qué vas a hacer

- Definir variables: síntomas, viaje, contacto, prevalencia, brote.
- Construir una red bayesiana (grafo).
- Crear CPDs y cargar evidencia.
- Calcular P(Dengue) y P(COVID).
- Retornar probabilidades al frontend.

## 🔹 Cómo hacerlo (conceptualmente)

- Identificar dependencias causales:
  - Viaje → aumenta P(Dengue)
  - Contacto → aumenta P(Dengue)
  - Brote → aumenta P(Dengue)
  - Fiebre / tos → afectan ambas enfermedades
- Crear CPDs iniciales.
- Ingresar evidencia del paciente.
- Ejecutar inferencia bayesiana.

### Retorno del endpoint

- Probabilidad final.
- CPDs resultantes.
- Evidencia utilizada.
- Explicación del cambio de probabilidad.

## 🔹 Defensa teórica

- Modelo matemático para la incertidumbre.
- pgmpy es la librería estándar en Python para gráficos probabilísticos.
- Permite inferencias exactas o por sampling.

**Frase para el final:**

> “pgmpy nos permite formalizar la incertidumbre inherente al caso clínico. Las múltiples fuentes de evidencia parcial hacen que un modelo probabilístico sea más adecuado que reglas rígidas.”

---

# 🟨 Enfoque 3 — Lógica Difusa

**Librería:** scikit-fuzzy

## 🔹 Qué vas a hacer

- Definir variables lingüísticas:
  - fiebre: baja / moderada / alta
  - tos: leve / moderada / fuerte
  - sospecha_dengue: baja / media / alta
- Crear funciones de pertenencia.
- Definir reglas difusas tipo:  
  “Si fiebre es alta y viaje es reciente → riesgo dengue es alto.”
- Aplicar inferencia difusa y defuzzificación.

## 🔹 Cómo hacerlo (conceptualmente)

- Crear universos de fiebre, tos, etc.
- Crear funciones triangulares/trapezoidales.
- Aplicar sistema de control difuso.
- Defuzzificar por centroide.
- Retornar al frontend:
  - grados de pertenencia
  - reglas activadas
  - resultado crisp

## 🔹 Defensa teórica

- scikit-fuzzy es estándar en lógica difusa.
- Ideal para síntomas imprecisos.
- Permite razonar con gradualidad (0–1).

**Frase para el final:**

> “Usamos scikit-fuzzy porque el caso clínico contiene variables imprecisas. La lógica difusa modela la gradualidad de síntomas como fiebre o tos, representando mejor el razonamiento humano.”

---

# 4. Plan de Integración Backend–Frontend

## 🔹 Flujo General

1. React captura datos del paciente.
2. Envia JSON al backend.
3. FastAPI ejecuta uno o los tres enfoques.
4. Devuelve resultados unificados.
5. React visualiza resultados con shadcn/ui + Recharts.

---

## 🔹 Endpoints FastAPI

- `/diagnostico/deterministico`
- `/diagnostico/probabilistico`
- `/diagnostico/difuso`
- `/diagnostico/todos` (opcional)

---

## 🔹 Estructura unificada de la respuesta

```json
{
  "diagnostico": "...",
  "razonamiento": "...",
  "intermedio": {},
  "metrica": "...",
  "tipo": "deterministico/probabilistico/difuso"
}
🔹 Frontend

##Formulario de datos del paciente.

Tabs para cada enfoque.

Cards con resultados.

Gráficos:

probabilidades

funciones de membresía

reglas activadas
```
