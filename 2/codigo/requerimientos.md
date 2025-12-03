1. Resumen del enfoque (1 frase)

Chatbot informativo REST con FastAPI que carga un JSON con las 13 fichas, usa fuzzy matching + reglas simples para detectar intención y devuelve el fragmento relevante (1–3 oraciones) y link a la ficha completa.

2. Stack simple y por qué (rápido)

FastAPI — rápido de desarrollar, docs automáticos, ideal para prototipo backend.

Uvicorn — ASGI server para ejecutar FastAPI.

python-dotenv — variables de entorno (opcional).

rapidfuzz — fuzzy string matching (rápido, ligero) para encontrar la mejor ficha/respuesta sin modelos pesados.

pydantic (viene con FastAPI) — validación de schemas (JSON).

uvicorn[standard] — para desarrollo/auto-reload.

pytest — tests simples.

aiofiles (opcional) — leer JSON async si lo prefieres.

Opción upgrade (si querés semántico más adelante): sentence-transformers + faiss-cpu. Pero para prototipo rápido no lo necesitas.

3. Esquema de datos (JSON) — plantilla

Guarda un archivo carreras.json con lista de fichas. Ejemplo de esquema y ejemplo real:

{
"id": "ing_software",
"nombre": "Ingeniería en Software",
"campo_profesional": "Desarrollo de software, sistemas embebidos, consultoría tecnológica...",
"perfil_graduado": "Capacidad de diseñar, implementar y mantener sistemas de software...",
"formacion_practica": "Pasantías en empresas, proyectos integradores, laboratorios de software...",
"alcances_titulo": "Habilita a desempeñarse como ingeniero en empresas privadas y públicas...",
"source_url": "https://facultad.edu/carreras/ing_software"
}

4. Lógica general del agente (PAMA aplicado)

Percepción (P): texto del usuario (mensaje).

Procesamiento/Modelo (A): detector de intención por keywords + fuzzy match en campos de cada ficha.

Acción (M): devuelve texto resumido (1–3 oraciones) + link y opción “ver ficha completa”.

Medida de rendimiento: Precision@1 (manual con set de 25 preguntas), Coverage (% preguntas respondidas), sat. del usuario.

5. Endpoint mínimo (FastAPI)

POST /api/chat — { "message": "¿Cuál es el perfil de Ingeniería en Software?" } → responde { "answer": "...", "career_id": "...", "field": "perfil_graduado", "source": "..." }

GET /api/career/{id} — devuelve ficha completa JSON.

POST /api/feedback — {session, message_id, rating} (opcional)

9. MVP mínimo para el TP (qué presentar)

carreras.json con las 13 fichas completas.

Backend FastAPI funcionando y endpoint /api/chat.

3–5 screenshots del chat respondiendo preguntas tipo.

Archivo README.md con cómo correr localmente.

Infografía 1 página: problema, PAMA (diagrama), arquitectura (foto del endpoint + flow), métricas objetivo.

Resultados de evaluación: tabla con 25-35 preguntas de prueba y % respuestas correctas (manual).

11. Justificación teórica (texto listo para tu TP)

Problema: los estudiantes y público no localizan rápidamente información estandarizada sobre las 13 carreras.

Agente diseñado: agente informativo (tipo: agente de consulta/híbrido) que percibe preguntas, usa un modelo simple de NLU (reglas + fuzzy matching) y actúa entregando fragmentos de las fichas oficiales.

Por qué cumple TP: permite definir sensores (chat input), actuadores (respuesta + link), modelo (JSON index), y medidas de rendimiento (precision, coverage), además de construir un prototipo funcional y justificable teóricamente con PAMA/REAS.

Limitaciones y mitigación: matching fuzzy puede fallar con preguntas muy abiertas — opción de mejora: embeddings + FAISS o integrar pequeñas reglas de clarificación.
