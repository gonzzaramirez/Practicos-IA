"""
Utilidades generales del backend
"""
import math
import asyncio
from typing import Iterator, Any, Dict


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula la distancia en metros entre dos puntos geográficos usando la fórmula de Haversine.
    
    Args:
        lat1: Latitud del primer punto en grados
        lon1: Longitud del primer punto en grados
        lat2: Latitud del segundo punto en grados
        lon2: Longitud del segundo punto en grados
    
    Returns:
        Distancia en metros
    """
    R = 6371000.0  # Radio de la Tierra en metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2*R*math.asin(math.sqrt(a))


async def run_sync_generator_async(gen: Iterator[Dict[str, Any]], speed: float = 1.0):
    """
    Adaptador para iterar un generador síncrono y emitir items de forma asíncrona.
    Soporta throttling ajustable mediante el parámetro speed.
    
    Args:
        gen: Generador síncrono que produce eventos
        speed: Factor de velocidad (1.0 = ritmo normal, >1 más rápido, <1 más lento)
    
    Yields:
        Eventos del generador de forma asíncrona
    """
    for item in gen:
        yield item
        # Throttling: pausa ajustable por evento
        await asyncio.sleep(max(0.0, 0.001 / max(0.01, speed)))

