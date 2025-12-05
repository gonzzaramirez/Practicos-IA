"""
Sistema Experto Probabilistico basado en Red Bayesiana
Utiliza pgmpy para modelar dependencias causales e inferencia probabilistica
"""

from pgmpy.models import BayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
from typing import Dict, List, Any
import numpy as np


def crear_red_bayesiana():
    """
    Construye la red bayesiana para diagnostico de Dengue y COVID-19
    
    Estructura del grafo (dependencias causales):
    - Viaje -> Dengue
    - Contacto_Dengue -> Dengue
    - Brote -> Dengue
    - Temporada -> Dengue
    - Fiebre <- Dengue, COVID
    - Tos <- Dengue, COVID
    - Dolor_Garganta <- COVID
    - Contacto_COVID -> COVID
    """
    
    # Definir estructura de la red (arcos dirigidos)
    modelo = BayesianNetwork([
        # Factores de riesgo -> Enfermedades
        ('Viaje', 'Dengue'),
        ('Contacto_Dengue', 'Dengue'),
        ('Brote', 'Dengue'),
        ('Temporada', 'Dengue'),
        ('Contacto_COVID', 'COVID'),
        # Enfermedades -> Sintomas
        ('Dengue', 'Fiebre'),
        ('COVID', 'Fiebre'),
        ('Dengue', 'Tos'),
        ('COVID', 'Tos'),
        ('COVID', 'Dolor_Garganta'),
        ('Dengue', 'Dolor_Muscular'),
    ])
    
    # === CPDs (Tablas de Probabilidad Condicional) ===
    
    # Nodos raiz (probabilidades a priori)
    cpd_viaje = TabularCPD('Viaje', 2, [[0.9], [0.1]])  # 10% viaja a zona endemica
    cpd_contacto_dengue = TabularCPD('Contacto_Dengue', 2, [[0.95], [0.05]])
    cpd_brote = TabularCPD('Brote', 2, [[0.85], [0.15]])  # 15% hay brote activo
    cpd_temporada = TabularCPD('Temporada', 2, [[0.5], [0.5]])  # 50% es verano
    cpd_contacto_covid = TabularCPD('Contacto_COVID', 2, [[0.9], [0.1]])
    
    # P(Dengue | Viaje, Contacto, Brote, Temporada)
    # Estados: 0=No, 1=Si
    cpd_dengue = TabularCPD(
        'Dengue', 2,
        [
            # P(Dengue=No | combinaciones de padres)
            [0.99, 0.95, 0.90, 0.80, 0.85, 0.70, 0.60, 0.40,
             0.80, 0.60, 0.50, 0.30, 0.40, 0.25, 0.15, 0.05],
            # P(Dengue=Si | combinaciones)
            [0.01, 0.05, 0.10, 0.20, 0.15, 0.30, 0.40, 0.60,
             0.20, 0.40, 0.50, 0.70, 0.60, 0.75, 0.85, 0.95]
        ],
        evidence=['Viaje', 'Contacto_Dengue', 'Brote', 'Temporada'],
        evidence_card=[2, 2, 2, 2]
    )
    
    # P(COVID | Contacto_COVID)
    cpd_covid = TabularCPD(
        'COVID', 2,
        [[0.92, 0.30],   # P(COVID=No)
         [0.08, 0.70]],  # P(COVID=Si)
        evidence=['Contacto_COVID'],
        evidence_card=[2]
    )
    
    # P(Fiebre | Dengue, COVID)
    cpd_fiebre = TabularCPD(
        'Fiebre', 2,
        [[0.95, 0.15, 0.20, 0.05],  # P(Fiebre=No)
         [0.05, 0.85, 0.80, 0.95]], # P(Fiebre=Si)
        evidence=['Dengue', 'COVID'],
        evidence_card=[2, 2]
    )
    
    # P(Tos | Dengue, COVID)
    cpd_tos = TabularCPD(
        'Tos', 2,
        [[0.90, 0.70, 0.25, 0.15],  # P(Tos=No)
         [0.10, 0.30, 0.75, 0.85]], # P(Tos=Si)
        evidence=['Dengue', 'COVID'],
        evidence_card=[2, 2]
    )
    
    # P(Dolor_Garganta | COVID)
    cpd_dolor_garganta = TabularCPD(
        'Dolor_Garganta', 2,
        [[0.95, 0.30],  # P(Dolor=No)
         [0.05, 0.70]], # P(Dolor=Si)
        evidence=['COVID'],
        evidence_card=[2]
    )
    
    # P(Dolor_Muscular | Dengue)
    cpd_dolor_muscular = TabularCPD(
        'Dolor_Muscular', 2,
        [[0.92, 0.15],  # P(Dolor=No)
         [0.08, 0.85]], # P(Dolor=Si)
        evidence=['Dengue'],
        evidence_card=[2]
    )
    
    # Agregar todas las CPDs al modelo
    modelo.add_cpds(
        cpd_viaje, cpd_contacto_dengue, cpd_brote, cpd_temporada,
        cpd_contacto_covid, cpd_dengue, cpd_covid,
        cpd_fiebre, cpd_tos, cpd_dolor_garganta, cpd_dolor_muscular
    )
    
    # Verificar consistencia del modelo
    assert modelo.check_model(), "Error en la estructura de la red bayesiana"
    
    return modelo


def ejecutar_diagnostico(datos: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ejecuta inferencia bayesiana con la evidencia del paciente
    
    Proceso:
    1. Crear red bayesiana
    2. Construir diccionario de evidencia
    3. Ejecutar inferencia con eliminacion de variables
    4. Calcular P(Dengue|evidencia) y P(COVID|evidencia)
    """
    
    modelo = crear_red_bayesiana()
    inferencia = VariableElimination(modelo)
    
    razonamiento = []
    
    # Construir evidencia a partir de los datos del paciente
    evidencia = {}
    
    if datos.get('viaje_reciente'):
        evidencia['Viaje'] = 1
        razonamiento.append("Evidencia: Viaje reciente a zona endemica")
    else:
        evidencia['Viaje'] = 0
    
    if datos.get('contacto_dengue'):
        evidencia['Contacto_Dengue'] = 1
        razonamiento.append("Evidencia: Contacto con caso de Dengue")
    else:
        evidencia['Contacto_Dengue'] = 0
    
    if datos.get('brote_dengue_zona'):
        evidencia['Brote'] = 1
        razonamiento.append("Evidencia: Brote activo en la zona")
    else:
        evidencia['Brote'] = 0
    
    if datos.get('temporada_verano'):
        evidencia['Temporada'] = 1
        razonamiento.append("Evidencia: Temporada de verano (alta actividad mosquitos)")
    else:
        evidencia['Temporada'] = 0
    
    if datos.get('contacto_covid'):
        evidencia['Contacto_COVID'] = 1
        razonamiento.append("Evidencia: Contacto con caso de COVID-19")
    else:
        evidencia['Contacto_COVID'] = 0
    
    if datos.get('fiebre'):
        evidencia['Fiebre'] = 1
        razonamiento.append("Sintoma observado: Fiebre")
    
    if datos.get('tos'):
        evidencia['Tos'] = 1
        razonamiento.append("Sintoma observado: Tos")
    
    if datos.get('dolor_garganta'):
        evidencia['Dolor_Garganta'] = 1
        razonamiento.append("Sintoma observado: Dolor de garganta")
    
    if datos.get('dolor_muscular'):
        evidencia['Dolor_Muscular'] = 1
        razonamiento.append("Sintoma observado: Dolor muscular")
    
    # Realizar inferencia
    try:
        prob_dengue = inferencia.query(['Dengue'], evidence=evidencia)
        prob_covid = inferencia.query(['COVID'], evidence=evidencia)
        
        p_dengue = float(prob_dengue.values[1])  # P(Dengue=Si)
        p_covid = float(prob_covid.values[1])    # P(COVID=Si)
        
    except Exception as e:
        # Fallback si hay error en la inferencia
        p_dengue = 0.5
        p_covid = 0.5
        razonamiento.append(f"Advertencia: Error en inferencia - {str(e)}")
    
    # Determinar diagnostico
    if p_dengue > 0.7:
        diagnostico = "ALTA PROBABILIDAD DE DENGUE"
    elif p_dengue > 0.5:
        diagnostico = "PROBABILIDAD MODERADA DE DENGUE"
    elif p_covid > 0.7:
        diagnostico = "ALTA PROBABILIDAD DE COVID-19"
    elif p_covid > 0.5:
        diagnostico = "PROBABILIDAD MODERADA DE COVID-19"
    elif p_dengue > p_covid:
        diagnostico = "SOSPECHA LEVE DE DENGUE"
    elif p_covid > p_dengue:
        diagnostico = "SOSPECHA LEVE DE COVID-19"
    else:
        diagnostico = "INDETERMINADO - Se requieren mas datos"
    
    # Agregar explicacion del cambio de probabilidad
    razonamiento.append(f"P(Dengue|evidencia) = {p_dengue:.2%}")
    razonamiento.append(f"P(COVID|evidencia) = {p_covid:.2%}")
    
    return {
        "tipo": "probabilistico",
        "diagnostico": diagnostico,
        "razonamiento": razonamiento,
        "intermedio": {
            "probabilidad_dengue": round(p_dengue, 4),
            "probabilidad_covid": round(p_covid, 4),
            "evidencia_utilizada": evidencia
        },
        "metrica": f"P(Dengue)={p_dengue:.1%} | P(COVID)={p_covid:.1%}"
    }

