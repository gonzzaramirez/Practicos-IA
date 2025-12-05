"""
API REST para Sistema Experto de Diagnostico Medico
Implementa tres enfoques de IA simbolica: Deterministico, Probabilistico y Difuso
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from models import DatosPaciente, ResultadoDiagnostico
from enfoques import deterministico, probabilistico, difuso

app = FastAPI(
    title="Sistema Experto Medico",
    description="API para diagnostico de Dengue y COVID-19 usando IA simbolica",
    version="1.0.0"
)

# Configurar CORS para permitir requests del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Endpoint de bienvenida"""
    return {
        "mensaje": "Sistema Experto Medico - IA Simbolica",
        "enfoques_disponibles": ["deterministico", "probabilistico", "difuso"],
        "documentacion": "/docs"
    }


@app.post("/diagnostico/deterministico", response_model=ResultadoDiagnostico)
async def diagnostico_deterministico(paciente: DatosPaciente):
    """
    Ejecuta diagnostico usando sistema basado en reglas (Experta/PyKnow)
    
    Proceso:
    - Inyecta hechos del paciente en el motor de inferencia
    - Ejecuta encadenamiento hacia adelante
    - Retorna reglas activadas y diagnostico
    """
    try:
        datos = paciente.model_dump()
        resultado = deterministico.ejecutar_diagnostico(datos)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/diagnostico/probabilistico", response_model=ResultadoDiagnostico)
async def diagnostico_probabilistico(paciente: DatosPaciente):
    """
    Ejecuta diagnostico usando Red Bayesiana (pgmpy)
    
    Proceso:
    - Construye red bayesiana con CPDs
    - Ingresa evidencia del paciente
    - Calcula P(Dengue|evidencia) y P(COVID|evidencia)
    """
    try:
        datos = paciente.model_dump()
        resultado = probabilistico.ejecutar_diagnostico(datos)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/diagnostico/difuso", response_model=ResultadoDiagnostico)
async def diagnostico_difuso(paciente: DatosPaciente):
    """
    Ejecuta diagnostico usando Logica Difusa (scikit-fuzzy)
    
    Proceso:
    - Fuzzifica entradas (temperatura, tos, riesgo)
    - Evalua reglas difusas
    - Defuzzifica mediante centroide
    """
    try:
        datos = paciente.model_dump()
        resultado = difuso.ejecutar_diagnostico(datos)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/diagnostico/todos")
async def diagnostico_todos(paciente: DatosPaciente):
    """
    Ejecuta los tres enfoques simultaneamente para comparacion
    """
    datos = paciente.model_dump()
    
    resultados = {}
    
    try:
        resultados["deterministico"] = deterministico.ejecutar_diagnostico(datos)
    except Exception as e:
        resultados["deterministico"] = {"error": str(e)}
    
    try:
        resultados["probabilistico"] = probabilistico.ejecutar_diagnostico(datos)
    except Exception as e:
        resultados["probabilistico"] = {"error": str(e)}
    
    try:
        resultados["difuso"] = difuso.ejecutar_diagnostico(datos)
    except Exception as e:
        resultados["difuso"] = {"error": str(e)}
    
    return resultados


@app.get("/caso-ejemplo")
async def caso_ejemplo():
    """
    Retorna el caso de ejemplo del trabajo practico para testing
    """
    return {
        "descripcion": "Paciente del caso planteado en el TP",
        "datos": {
            "fiebre": True,
            "tos": True,
            "dolor_garganta": True,
            "dolor_muscular": False,
            "dolor_cabeza": False,
            "edad": 35,
            "sexo": "masculino",
            "region": "corrientes",
            "asma": True,
            "medicacion_presion": True,
            "viaje_reciente": True,
            "destino_viaje": "brasil",
            "contacto_dengue": True,
            "contacto_covid": False,
            "temporada_verano": True,
            "brote_dengue_zona": True,
            "covid_activo_region": True,
            "temperatura": 38.5,
            "intensidad_tos": 5,
            "dias_sintomas": 3
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

