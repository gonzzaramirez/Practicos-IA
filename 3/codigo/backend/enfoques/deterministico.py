"""
Sistema Experto Deterministico basado en reglas SI-ENTONCES
Implementacion propia de motor de inferencia con encadenamiento hacia adelante
"""

from typing import Dict, List, Any, Callable


class Regla:
    """Representa una regla SI-ENTONCES"""
    def __init__(self, nombre: str, condicion: Callable, accion: Callable, descripcion: str):
        self.nombre = nombre
        self.condicion = condicion
        self.accion = accion
        self.descripcion = descripcion


class MotorInferencia:
    """
    Motor de inferencia con encadenamiento hacia adelante (forward chaining)
    Evalua reglas en orden y ejecuta las que cumplan sus condiciones
    """
    
    def __init__(self):
        self.reglas: List[Regla] = []
        self.hechos: Dict[str, Any] = {}
        self.reglas_activadas: List[str] = []
        self.razonamiento: List[str] = []
        self.diagnosticos = {"dengue": 0, "covid": 0}
    
    def agregar_regla(self, regla: Regla):
        self.reglas.append(regla)
    
    def declarar_hechos(self, hechos: Dict[str, Any]):
        self.hechos = hechos
    
    def ejecutar(self):
        """Ejecuta encadenamiento hacia adelante"""
        for regla in self.reglas:
            if regla.condicion(self.hechos):
                regla.accion(self)
                self.reglas_activadas.append(regla.nombre)
                self.razonamiento.append(regla.descripcion)


def crear_motor_diagnostico() -> MotorInferencia:
    """
    Crea el motor con todas las reglas del sistema experto
    """
    motor = MotorInferencia()
    
    # === REGLAS DE SINTOMAS ===
    
    motor.agregar_regla(Regla(
        "R1: Fiebre detectada",
        lambda h: h.get('fiebre', False),
        lambda m: (m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 1, 
                                          "covid": m.diagnosticos["covid"] + 1})),
        "Fiebre es sintoma comun de Dengue y COVID-19"
    ))
    
    motor.agregar_regla(Regla(
        "R2: Tos detectada",
        lambda h: h.get('tos', False),
        lambda m: (m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 1,
                                          "covid": m.diagnosticos["covid"] + 2})),
        "Tos tiene mayor peso para COVID-19"
    ))
    
    motor.agregar_regla(Regla(
        "R3: Dolor de garganta",
        lambda h: h.get('dolor_garganta', False),
        lambda m: m.diagnosticos.update({"covid": m.diagnosticos["covid"] + 2}),
        "Dolor de garganta es mas comun en COVID-19"
    ))
    
    motor.agregar_regla(Regla(
        "R4: Dolor muscular",
        lambda h: h.get('dolor_muscular', False),
        lambda m: (m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 2,
                                          "covid": m.diagnosticos["covid"] + 1})),
        "Dolor muscular/articular es caracteristico del Dengue"
    ))
    
    motor.agregar_regla(Regla(
        "R5: Dolor de cabeza",
        lambda h: h.get('dolor_cabeza', False),
        lambda m: (m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 1,
                                          "covid": m.diagnosticos["covid"] + 1})),
        "Cefalea presente en ambas enfermedades"
    ))
    
    # === REGLAS EPIDEMIOLOGICAS ===
    
    motor.agregar_regla(Regla(
        "R6: Viaje a zona endemica",
        lambda h: h.get('viaje_reciente', False) and h.get('destino_viaje', '').lower() in ['brasil', 'paraguay', 'bolivia'],
        lambda m: m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 3}),
        "Viaje a zona endemica AUMENTA probabilidad de Dengue"
    ))
    
    motor.agregar_regla(Regla(
        "R7: Contacto con caso Dengue",
        lambda h: h.get('contacto_dengue', False),
        lambda m: m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 3}),
        "Contacto con caso confirmado es factor de riesgo importante"
    ))
    
    motor.agregar_regla(Regla(
        "R8: Contacto con caso COVID",
        lambda h: h.get('contacto_covid', False),
        lambda m: m.diagnosticos.update({"covid": m.diagnosticos["covid"] + 3}),
        "Contacto con caso de COVID aumenta sospecha"
    ))
    
    motor.agregar_regla(Regla(
        "R9: Temporada de verano",
        lambda h: h.get('temporada_verano', False),
        lambda m: m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 2}),
        "Verano aumenta transmision de Dengue por mosquitos"
    ))
    
    motor.agregar_regla(Regla(
        "R10: Brote activo Dengue",
        lambda h: h.get('brote_dengue_zona', False),
        lambda m: m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 3}),
        "Brote local incrementa significativamente el riesgo"
    ))
    
    motor.agregar_regla(Regla(
        "R11: COVID circulante",
        lambda h: h.get('covid_activo_region', False),
        lambda m: m.diagnosticos.update({"covid": m.diagnosticos["covid"] + 1}),
        "Circulacion activa de COVID-19 en la region"
    ))
    
    # === REGLAS COMBINADAS (mayor especificidad) ===
    
    motor.agregar_regla(Regla(
        "R12: TRIADA DENGUE",
        lambda h: h.get('fiebre', False) and h.get('viaje_reciente', False) and h.get('contacto_dengue', False),
        lambda m: m.diagnosticos.update({"dengue": m.diagnosticos["dengue"] + 5}),
        "Triada: fiebre + viaje + contacto = ALTA sospecha Dengue"
    ))
    
    motor.agregar_regla(Regla(
        "R13: SINTOMAS RESPIRATORIOS",
        lambda h: h.get('fiebre', False) and h.get('tos', False) and h.get('dolor_garganta', False),
        lambda m: m.diagnosticos.update({"covid": m.diagnosticos["covid"] + 4}),
        "Sintomas respiratorios combinados sugieren COVID-19"
    ))
    
    motor.agregar_regla(Regla(
        "R14: Asma como comorbilidad",
        lambda h: h.get('asma', False),
        lambda m: None,  # Solo informativo
        "Asma es comorbilidad de riesgo para COVID-19 grave"
    ))
    
    return motor


def ejecutar_diagnostico(datos: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ejecuta el motor de inferencia con los datos del paciente
    
    Proceso:
    1. Crear motor con reglas definidas
    2. Declarar hechos del paciente
    3. Ejecutar encadenamiento hacia adelante
    4. Retornar diagnostico basado en puntuacion
    """
    
    motor = crear_motor_diagnostico()
    motor.declarar_hechos(datos)
    motor.ejecutar()
    
    dengue_score = motor.diagnosticos["dengue"]
    covid_score = motor.diagnosticos["covid"]
    
    # Determinar diagnostico final
    if dengue_score > covid_score:
        if dengue_score >= 8:
            diagnostico = "ALTA SOSPECHA DE DENGUE"
        elif dengue_score >= 5:
            diagnostico = "SOSPECHA MODERADA DE DENGUE"
        else:
            diagnostico = "SOSPECHA LEVE DE DENGUE"
    elif covid_score > dengue_score:
        if covid_score >= 8:
            diagnostico = "ALTA SOSPECHA DE COVID-19"
        elif covid_score >= 5:
            diagnostico = "SOSPECHA MODERADA DE COVID-19"
        else:
            diagnostico = "SOSPECHA LEVE DE COVID-19"
    else:
        diagnostico = "SOSPECHA INDETERMINADA - Se requieren estudios adicionales"
    
    return {
        "tipo": "deterministico",
        "diagnostico": diagnostico,
        "razonamiento": motor.razonamiento,
        "intermedio": {
            "reglas_activadas": motor.reglas_activadas,
            "puntaje_dengue": dengue_score,
            "puntaje_covid": covid_score
        },
        "metrica": f"Dengue: {dengue_score} pts | COVID: {covid_score} pts"
    }
