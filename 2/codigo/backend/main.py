"""
Agente Inteligente - Chatbot Informativo de Carreras de FACENA
===============================================================
Este agente implementa el modelo PAMA (Percepcion, Accion, Modelo, Actuador):
- Percepcion: Recibe preguntas del usuario via API REST
- Accion: Procesa la intencion y busca la mejor coincidencia
- Meta(Medios-fines): Responder correctamente la consulta Medios: Base de Conocimiento Declarativa
- Ambiente: Entorno inicial donde trabaja el agente. Se define como un entorno web, donde interactúan los usuarios y el sistema.

"""

import json
import unicodedata
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rapidfuzz import fuzz, process

# --- Configuracion de la aplicacion ---
app = FastAPI(
    title="Agente Informativo de Carreras FACENA",
    description="Chatbot inteligente para consultas sobre carreras de FACENA - UNNE",
    version="1.0.0"
)

# Permitir CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Carga de la base de conocimiento ---
DATA_PATH = Path(__file__).parent / "carreras.json"

def cargar_carreras():
    """Carga las fichas de carreras desde el archivo JSON."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

CARRERAS = cargar_carreras()

# --- Normalización y mapeo de nombres ---
def normalizar_nombre(texto: str) -> str:
    """
    Normaliza un texto para matching:
    - Convierte a minúsculas
    - Quita tildes y caracteres especiales
    """
    # Normalizar a NFD (Normalization Form Decomposed) para separar caracteres base de diacríticos
    texto_nfd = unicodedata.normalize('NFD', texto.lower())
    # Filtrar solo caracteres que no son marcas diacríticas (tildes, etc.)
    texto_sin_tildes = ''.join(
        char for char in texto_nfd 
        if unicodedata.category(char) != 'Mn'
    )
    return texto_sin_tildes

# Crear mapeo de nombres normalizados a fichas originales
MAPEO_CARRERAS = {}
for carrera in CARRERAS:
    nombre_normalizado = normalizar_nombre(carrera["nombre"])
    # Almacenar la ficha original usando el nombre normalizado como clave
    MAPEO_CARRERAS[nombre_normalizado] = carrera
    # También mapear por ID normalizado
    id_normalizado = normalizar_nombre(carrera["id"])
    MAPEO_CARRERAS[id_normalizado] = carrera
    # Si tiene título, también mapearlo
    if "titulo" in carrera:
        titulo_normalizado = normalizar_nombre(carrera["titulo"])
        MAPEO_CARRERAS[titulo_normalizado] = carrera

# --- Modelos Pydantic para validacion ---
class MensajeUsuario(BaseModel):
    message: str

class RespuestaChat(BaseModel):
    answer: str
    career_id: Optional[str] = None
    career_name: Optional[str] = None
    field: Optional[str] = None
    source: Optional[str] = None
    confidence: float = 0.0

class FeedbackRequest(BaseModel):
    session_id: str
    message_id: str
    rating: int  # 1-5

# --- Mapeo de campos e intenciones ---
CAMPOS_INFO = {
    "campo_profesional": ["campo", "profesional", "trabajo", "trabajar", "laboral", "empleo", "salida", "donde trabaja", "que hace", "ejercer", "desempenar"],
    "perfil_graduado": ["perfil", "graduado", "egresado", "competencias", "habilidades", "capacidades", "que sabe", "formacion"],
    "alcances_titulo": ["alcance", "titulo", "habilita", "puede hacer", "incumbencias", "matricula", "actividades"],
    "duracion": ["duracion", "cuanto dura", "anos", "tiempo", "cuantos anos", "cuanto tiempo"],
    "modalidad": ["modalidad", "presencial", "virtual", "distancia", "como se cursa"]
}

# Palabras clave relacionadas con carreras y educacion
KEYWORDS_EDUCACION = [
    "carrera", "carreras", "estudiar", "estudia", "estudio", "universidad", "facultad",
    "ingenieria", "licenciatura", "profesorado", "titulo", "graduado", "egresado",
    "perfil", "campo", "laboral", "profesional", "duracion", "anos", "modalidad",
    "bioquimica", "fisica", "quimica", "matematica", "biologia", "sistemas", "informatica",
    "electronica", "electrica", "agrimensura", "facena", "unne", "plan", "alcance",
    "inscripcion", "materias", "curriculum", "cursar", "cursa", "profesor", "docente"
]

SALUDOS = ["hola", "buenas", "buen dia", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal", "hi", "hello"]
DESPEDIDAS = ["chau", "adios", "hasta luego", "nos vemos", "gracias", "bye", "hasta pronto"]
AGRADECIMIENTOS = ["gracias", "muchas gracias", "te agradezco", "muy amable"]

# --- Funciones del Agente ---

def es_consulta_relacionada(mensaje: str) -> bool:
    """Detecta si la consulta esta relacionada con carreras/educacion."""
    mensaje_normalizado = normalizar_nombre(mensaje)
    
    # Verificar si contiene palabras clave de educacion
    for keyword in KEYWORDS_EDUCACION:
        if normalizar_nombre(keyword) in mensaje_normalizado:
            return True
    
    # Verificar si menciona alguna carrera por nombre (usando nombres normalizados)
    for nombre_normalizado in MAPEO_CARRERAS.keys():
        # Buscar partes del nombre de la carrera
        palabras_nombre = nombre_normalizado.split()
        for palabra in palabras_nombre:
            if len(palabra) > 3 and palabra in mensaje_normalizado:
                return True
    
    return False

def detectar_saludo(mensaje: str) -> bool:
    """Detecta si el mensaje es un saludo."""
    mensaje_lower = mensaje.lower().strip()
    # Solo es saludo si es corto y contiene saludo
    if len(mensaje_lower.split()) <= 4:
        return any(saludo in mensaje_lower for saludo in SALUDOS)
    return False

def detectar_despedida(mensaje: str) -> bool:
    """Detecta si el mensaje es una despedida."""
    mensaje_lower = mensaje.lower().strip()
    return any(despedida in mensaje_lower for despedida in DESPEDIDAS)

def detectar_agradecimiento(mensaje: str) -> bool:
    """Detecta si el mensaje es un agradecimiento."""
    mensaje_lower = mensaje.lower().strip()
    return any(agradecimiento in mensaje_lower for agradecimiento in AGRADECIMIENTOS)

def detectar_listado(mensaje: str) -> bool:
    """Detecta si el usuario quiere ver todas las carreras."""
    keywords = ["carreras", "todas", "listado", "cuales hay", "que carreras", "oferta", "opciones", "lista", "disponibles"]
    mensaje_lower = mensaje.lower()
    return any(kw in mensaje_lower for kw in keywords)

def encontrar_carrera(mensaje: str) -> Optional[dict]:
    """
    Usa fuzzy matching para encontrar la carrera mas relevante.
    Retorna la carrera con mejor coincidencia o None.
    Utiliza nombres normalizados para matching y recupera la ficha original mediante el mapeo.
    """
    mensaje_normalizado = normalizar_nombre(mensaje)
    
    # Crear lista de nombres normalizados de carreras para matching
    nombres_carreras_normalizados = [
        normalizar_nombre(c["nombre"]) for c in CARRERAS
    ]
    
    # Buscar coincidencia fuzzy con umbral mas alto (usando nombres normalizados)
    resultado = process.extractOne(
        mensaje_normalizado,
        nombres_carreras_normalizados,
        scorer=fuzz.partial_ratio,
        score_cutoff=55
    )
    
    if resultado:
        nombre_match_normalizado, score, _ = resultado
        # Recuperar la ficha original usando el mapeo
        carrera = MAPEO_CARRERAS.get(nombre_match_normalizado)
        if carrera:
            return {"carrera": carrera, "score": score}
    
    # Buscar por ID normalizado exacto (usando el mapeo)
    id_normalizado = mensaje_normalizado.strip()
    carrera = MAPEO_CARRERAS.get(id_normalizado)
    if carrera:
        return {"carrera": carrera, "score": 80}
    
    # Buscar por ID contenido en el mensaje (para casos como "ing_agrimensura")
    for carrera in CARRERAS:
        id_normalizado = normalizar_nombre(carrera["id"])
        if id_normalizado in mensaje_normalizado:
            return {"carrera": carrera, "score": 80}
    
    # Buscar por titulo normalizado
    for carrera in CARRERAS:
        if "titulo" in carrera:
            titulo_normalizado = normalizar_nombre(carrera["titulo"])
            if fuzz.partial_ratio(mensaje_normalizado, titulo_normalizado) > 70:
                return {"carrera": carrera, "score": 70}
    
    # Búsqueda adicional: verificar si alguna parte del mensaje coincide directamente con un nombre normalizado
    palabras_mensaje = mensaje_normalizado.split()
    for palabra in palabras_mensaje:
        if len(palabra) > 4:  # Solo palabras significativas
            # Buscar coincidencias parciales en los nombres normalizados
            for nombre_normalizado, carrera in MAPEO_CARRERAS.items():
                if palabra in nombre_normalizado or nombre_normalizado in palabra:
                    # Verificar que sea una coincidencia relevante
                    if fuzz.partial_ratio(palabra, nombre_normalizado) > 60:
                        return {"carrera": carrera, "score": 60}
    
    return None

def detectar_campo_intencion(mensaje: str) -> Optional[str]:
    """Detecta que campo de informacion busca el usuario."""
    mensaje_lower = mensaje.lower()
    
    for campo, keywords in CAMPOS_INFO.items():
        for keyword in keywords:
            if keyword in mensaje_lower:
                return campo
    
    return None

def resumir_texto(texto: str, max_chars: int = 500) -> str:
    """Resume un texto largo manteniendo oraciones completas."""
    if len(texto) <= max_chars:
        return texto
    
    # Cortar en el ultimo punto antes del limite
    texto_cortado = texto[:max_chars]
    ultimo_punto = texto_cortado.rfind('.')
    
    if ultimo_punto > max_chars // 2:
        return texto_cortado[:ultimo_punto + 1]
    
    return texto_cortado + "..."

def generar_respuesta(carrera: dict, campo: Optional[str]) -> str:
    """Genera una respuesta natural basada en la carrera y campo detectado."""
    nombre = carrera["nombre"]
    
    if campo and campo in carrera:
        valor = carrera[campo]
        
        # Si el valor es muy largo, resumir
        if len(valor) > 600:
            valor = resumir_texto(valor, 500)
        
        prefijos = {
            "campo_profesional": f"El campo profesional de {nombre}:\n\n",
            "perfil_graduado": f"El perfil del graduado de {nombre}:\n\n",
            "alcances_titulo": f"El titulo de {nombre} habilita para:\n\n",
            "duracion": f"La carrera de {nombre} tiene una duracion de ",
            "modalidad": f"La modalidad de {nombre} es "
        }
        
        prefijo = prefijos.get(campo, f"Sobre {nombre}:\n\n")
        return prefijo + valor
    
    # Respuesta general con informacion basica
    duracion = carrera.get('duracion', '5 anos')
    modalidad = carrera.get('modalidad', 'Presencial')
    titulo = carrera.get('titulo', nombre)
    
    campo_prof = carrera.get('campo_profesional', '')
    campo_resumido = resumir_texto(campo_prof, 200) if campo_prof else "Consulta para mas detalles."

    return (
        f"{nombre}\n\n"
        f"Titulo: {titulo}\n"
        f"Duracion: {duracion}\n"
        f"Modalidad: {modalidad}\n\n"
        f"Campo profesional: {campo_resumido}"
    )

def listar_carreras() -> str:
    """Genera un listado de todas las carreras disponibles."""
    lista = "Carreras disponibles en FACENA - UNNE:\n\n"
    
    # Agrupar por tipo
    ingenierias = []
    licenciaturas = []
    profesorados = []
    otras = []
    
    for carrera in CARRERAS:
        nombre = carrera['nombre']
        duracion = carrera.get('duracion', '')
        
        if 'ingenieria' in nombre.lower() or 'ingenier' in nombre.lower():
            ingenierias.append(f"- {nombre} ({duracion})")
        elif 'licenciatura' in nombre.lower():
            licenciaturas.append(f"- {nombre} ({duracion})")
        elif 'profesorado' in nombre.lower():
            profesorados.append(f"- {nombre} ({duracion})")
        else:
            otras.append(f"- {nombre} ({duracion})")
    
    if ingenierias:
        lista += "Ingenierias:\n" + "\n".join(ingenierias) + "\n\n"
    if licenciaturas:
        lista += "Licenciaturas:\n" + "\n".join(licenciaturas) + "\n\n"
    if profesorados:
        lista += "Profesorados:\n" + "\n".join(profesorados) + "\n\n"
    if otras:
        lista += "Otras:\n" + "\n".join(otras) + "\n\n"
    
    lista += "Podes preguntarme sobre cualquiera de ellas: perfil, duracion, campo laboral, alcances del titulo, etc."
    return lista

def respuesta_fuera_contexto() -> str:
    """Genera respuesta cuando la consulta no esta relacionada con carreras."""
    return (
        "Lo siento, solo puedo brindarte informacion sobre las carreras de "
        "la Facultad de Ciencias Exactas y Naturales y Agrimensura (FACENA) de la UNNE.\n\n"
        "Podes preguntarme sobre:\n"
        "- Carreras disponibles\n"
        "- Perfil del graduado\n"
        "- Campo profesional y laboral\n"
        "- Duracion y modalidad\n"
        "- Alcances del titulo\n\n"
        "Escribe 'carreras' para ver el listado completo."
    )

# --- Endpoints de la API ---

@app.get("/")
async def root():
    """Endpoint de bienvenida."""
    return {
        "message": "Agente Informativo de Carreras FACENA - UNNE",
        "version": "1.0.0",
        "endpoints": ["/api/chat", "/api/careers", "/api/career/{id}"]
    }

@app.post("/api/chat", response_model=RespuestaChat)
async def chat(request: MensajeUsuario):
    """
    Endpoint principal del chatbot.
    Procesa el mensaje del usuario y devuelve una respuesta relevante.
    """
    mensaje = request.message.strip()
    
    if not mensaje:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacio")
    
    # Detectar saludos
    if detectar_saludo(mensaje):
        return RespuestaChat(
            answer=(
                "Hola! Soy el asistente de carreras de FACENA (UNNE). "
                "Puedo ayudarte con informacion sobre nuestras carreras de grado: "
                "ingenierias, licenciaturas y profesorados.\n\n"
                "Preguntame sobre perfil, campo laboral, duracion o alcances del titulo."
            ),
            confidence=1.0
        )
    
    # Detectar agradecimientos
    if detectar_agradecimiento(mensaje) and len(mensaje.split()) <= 5:
        return RespuestaChat(
            answer="De nada! Si tenes mas consultas sobre las carreras de FACENA, estoy para ayudarte.",
            confidence=1.0
        )
    
    # Detectar despedidas
    if detectar_despedida(mensaje):
        return RespuestaChat(
            answer="Hasta luego! Si tenes mas preguntas sobre las carreras de FACENA, no dudes en volver.",
            confidence=1.0
        )
    
    # Detectar solicitud de listado
    if detectar_listado(mensaje):
        return RespuestaChat(
            answer=listar_carreras(),
            confidence=0.95
        )
    
    # Verificar si la consulta esta relacionada con carreras
    if not es_consulta_relacionada(mensaje):
        return RespuestaChat(
            answer=respuesta_fuera_contexto(),
            confidence=0.1
        )
    
    # Buscar carrera relevante
    resultado = encontrar_carrera(mensaje)
    
    if resultado:
        carrera = resultado["carrera"]
        score = resultado["score"]
        campo = detectar_campo_intencion(mensaje)
        
        respuesta = generar_respuesta(carrera, campo)
        
        return RespuestaChat(
            answer=respuesta,
            career_id=carrera["id"],
            career_name=carrera["nombre"],
            field=campo,
            source=carrera.get("source_url", ""),
            confidence=score / 100
        )
    
    # Respuesta por defecto si no se encuentra coincidencia
    return RespuestaChat(
        answer=(
            "No encontre informacion especifica sobre esa carrera. "
            "Puedo ayudarte con las carreras de FACENA - UNNE:\n\n"
            "- Ingenierias: Agrimensura, Electrica, Electronica\n"
            "- Licenciaturas: Sistemas, Biologia, Fisica, Quimica, Matematica\n"
            "- Profesorados: Biologia, Quimica, Fisica, Matematica, Informatica\n"
            "- Bioquimica\n\n"
            "Escribe 'carreras' para ver el listado completo."
        ),
        confidence=0.3
    )

@app.get("/api/careers")
async def get_careers():
    """Devuelve el listado de todas las carreras con informacion basica."""
    return [
        {
            "id": c["id"],
            "nombre": c["nombre"],
            "duracion": c.get("duracion", ""),
            "modalidad": c.get("modalidad", ""),
            "titulo": c.get("titulo", c["nombre"])
        }
        for c in CARRERAS
    ]

@app.get("/api/career/{career_id}")
async def get_career(career_id: str):
    """Devuelve la ficha completa de una carrera especifica."""
    for carrera in CARRERAS:
        if carrera["id"] == career_id:
            return carrera
    
    raise HTTPException(status_code=404, detail=f"Carrera '{career_id}' no encontrada")

@app.post("/api/feedback")
async def feedback(request: FeedbackRequest):
    """Recibe feedback del usuario sobre las respuestas."""
    return {
        "status": "ok",
        "message": "Gracias por tu feedback"
    }

# --- Punto de entrada ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
