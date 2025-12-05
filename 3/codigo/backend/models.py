from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DatosPaciente(BaseModel):
    # Sintomas
    fiebre: bool = False
    tos: bool = False
    dolor_garganta: bool = False
    dolor_muscular: bool = False
    dolor_cabeza: bool = False
    
    # Datos personales
    edad: int = 35
    sexo: str = "masculino"
    region: str = "corrientes"
    
    # Antecedentes
    asma: bool = False
    medicacion_presion: bool = False
    viaje_reciente: bool = False
    destino_viaje: Optional[str] = None
    contacto_dengue: bool = False
    contacto_covid: bool = False
    
    # Datos epidemiologicos
    temporada_verano: bool = True
    brote_dengue_zona: bool = False
    covid_activo_region: bool = True

    # Para enfoque difuso - valores numericos
    temperatura: float = 37.0  # grados celsius
    intensidad_tos: float = 0.0  # 0-10
    dias_sintomas: int = 1


class ResultadoDiagnostico(BaseModel):
    tipo: str  # deterministico, probabilistico, difuso
    diagnostico: str
    razonamiento: List[str]
    intermedio: Dict[str, Any]
    metrica: Optional[str] = None

