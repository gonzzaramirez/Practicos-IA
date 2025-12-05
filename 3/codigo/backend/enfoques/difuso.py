"""
Sistema Experto Difuso basado en Logica Fuzzy
Implementacion propia de funciones de membresia e inferencia difusa
"""

import numpy as np
from typing import Dict, Any, List, Tuple


def trimf(x: float, params: List[float]) -> float:
    """
    Funcion de membresia triangular
    params = [a, b, c] donde a <= b <= c
    """
    a, b, c = params
    if x <= a or x >= c:
        return 0.0
    elif a < x <= b:
        return (x - a) / (b - a)
    elif b < x < c:
        return (c - x) / (c - b)
    return 0.0


def trapmf(x: float, params: List[float]) -> float:
    """
    Funcion de membresia trapezoidal
    params = [a, b, c, d] donde a <= b <= c <= d
    """
    a, b, c, d = params
    if x <= a or x >= d:
        return 0.0
    elif a < x < b:
        return (x - a) / (b - a)
    elif b <= x <= c:
        return 1.0
    elif c < x < d:
        return (d - x) / (d - c)
    return 0.0


class VariableDifusa:
    """Variable linguistica con sus conjuntos difusos"""
    
    def __init__(self, nombre: str, rango: Tuple[float, float]):
        self.nombre = nombre
        self.rango = rango
        self.conjuntos: Dict[str, Tuple[str, List[float]]] = {}
    
    def agregar_conjunto(self, etiqueta: str, tipo: str, params: List[float]):
        """tipo: 'triangular' o 'trapezoidal'"""
        self.conjuntos[etiqueta] = (tipo, params)
    
    def fuzzificar(self, valor: float) -> Dict[str, float]:
        """Retorna grado de pertenencia a cada conjunto"""
        resultado = {}
        for etiqueta, (tipo, params) in self.conjuntos.items():
            if tipo == 'triangular':
                resultado[etiqueta] = trimf(valor, params)
            else:
                resultado[etiqueta] = trapmf(valor, params)
        return resultado


class SistemaDifuso:
    """Sistema de inferencia difuso Mamdani"""
    
    def __init__(self):
        self.variables_entrada: Dict[str, VariableDifusa] = {}
        self.variables_salida: Dict[str, VariableDifusa] = {}
        self.reglas: List[Dict] = []
    
    def agregar_entrada(self, var: VariableDifusa):
        self.variables_entrada[var.nombre] = var
    
    def agregar_salida(self, var: VariableDifusa):
        self.variables_salida[var.nombre] = var
    
    def agregar_regla(self, antecedentes: Dict[str, str], consecuentes: Dict[str, str]):
        """
        antecedentes: {'temperatura': 'alta', 'tos': 'fuerte'}
        consecuentes: {'sospecha_dengue': 'alta'}
        """
        self.reglas.append({'si': antecedentes, 'entonces': consecuentes})
    
    def inferir(self, entradas: Dict[str, float]) -> Dict[str, float]:
        """Ejecuta inferencia difusa"""
        
        # 1. Fuzzificar entradas
        grados_entrada = {}
        for nombre, valor in entradas.items():
            if nombre in self.variables_entrada:
                grados_entrada[nombre] = self.variables_entrada[nombre].fuzzificar(valor)
        
        # 2. Evaluar reglas y agregar consecuentes
        activaciones_salida = {nombre: [] for nombre in self.variables_salida}
        
        for regla in self.reglas:
            # Calcular activacion del antecedente (AND = minimo)
            activacion = 1.0
            for var_nombre, conjunto in regla['si'].items():
                if var_nombre in grados_entrada:
                    grado = grados_entrada[var_nombre].get(conjunto, 0)
                    activacion = min(activacion, grado)
            
            # Aplicar activacion a consecuentes
            if activacion > 0:
                for var_salida, conjunto in regla['entonces'].items():
                    if var_salida in activaciones_salida:
                        activaciones_salida[var_salida].append((conjunto, activacion))
        
        # 3. Defuzzificar (centroide simplificado)
        resultados = {}
        for nombre, activaciones in activaciones_salida.items():
            if not activaciones:
                resultados[nombre] = 50.0  # Valor por defecto
                continue
            
            var = self.variables_salida[nombre]
            
            # Calcular centroide ponderado
            numerador = 0.0
            denominador = 0.0
            
            for conjunto, activacion in activaciones:
                if conjunto in var.conjuntos:
                    tipo, params = var.conjuntos[conjunto]
                    # Centro del conjunto
                    if tipo == 'triangular':
                        centro = params[1]  # Pico del triangulo
                    else:
                        centro = (params[1] + params[2]) / 2  # Centro del trapecio
                    
                    numerador += centro * activacion
                    denominador += activacion
            
            if denominador > 0:
                resultados[nombre] = numerador / denominador
            else:
                resultados[nombre] = 50.0
        
        return resultados


def crear_sistema_difuso() -> SistemaDifuso:
    """Crea el sistema difuso para diagnostico medico"""
    
    sistema = SistemaDifuso()
    
    # === VARIABLES DE ENTRADA ===
    
    # Temperatura (35-42 grados)
    temp = VariableDifusa('temperatura', (35, 42))
    temp.agregar_conjunto('baja', 'triangular', [35, 35, 36.5])
    temp.agregar_conjunto('normal', 'triangular', [36, 36.8, 37.5])
    temp.agregar_conjunto('febril', 'triangular', [37.2, 38, 39])
    temp.agregar_conjunto('alta', 'triangular', [38.5, 40, 42])
    sistema.agregar_entrada(temp)
    
    # Intensidad de tos (0-10)
    tos = VariableDifusa('intensidad_tos', (0, 10))
    tos.agregar_conjunto('leve', 'triangular', [0, 0, 4])
    tos.agregar_conjunto('moderada', 'triangular', [2, 5, 8])
    tos.agregar_conjunto('fuerte', 'triangular', [6, 10, 10])
    sistema.agregar_entrada(tos)
    
    # Riesgo epidemiologico (0-10)
    riesgo = VariableDifusa('riesgo_epidemio', (0, 10))
    riesgo.agregar_conjunto('bajo', 'triangular', [0, 0, 4])
    riesgo.agregar_conjunto('medio', 'triangular', [2, 5, 8])
    riesgo.agregar_conjunto('alto', 'triangular', [6, 10, 10])
    sistema.agregar_entrada(riesgo)
    
    # Factor respiratorio (0-10)
    resp = VariableDifusa('factor_respiratorio', (0, 10))
    resp.agregar_conjunto('bajo', 'triangular', [0, 0, 4])
    resp.agregar_conjunto('medio', 'triangular', [2, 5, 8])
    resp.agregar_conjunto('alto', 'triangular', [6, 10, 10])
    sistema.agregar_entrada(resp)
    
    # === VARIABLES DE SALIDA ===
    
    # Sospecha Dengue (0-100)
    dengue = VariableDifusa('sospecha_dengue', (0, 100))
    dengue.agregar_conjunto('baja', 'triangular', [0, 0, 40])
    dengue.agregar_conjunto('media', 'triangular', [25, 50, 75])
    dengue.agregar_conjunto('alta', 'triangular', [60, 100, 100])
    sistema.agregar_salida(dengue)
    
    # Sospecha COVID (0-100)
    covid = VariableDifusa('sospecha_covid', (0, 100))
    covid.agregar_conjunto('baja', 'triangular', [0, 0, 40])
    covid.agregar_conjunto('media', 'triangular', [25, 50, 75])
    covid.agregar_conjunto('alta', 'triangular', [60, 100, 100])
    sistema.agregar_salida(covid)
    
    # === REGLAS ===
    
    # Reglas para Dengue
    sistema.agregar_regla(
        {'temperatura': 'alta', 'riesgo_epidemio': 'alto'},
        {'sospecha_dengue': 'alta'}
    )
    sistema.agregar_regla(
        {'temperatura': 'febril', 'riesgo_epidemio': 'medio'},
        {'sospecha_dengue': 'media'}
    )
    sistema.agregar_regla(
        {'temperatura': 'febril', 'riesgo_epidemio': 'alto'},
        {'sospecha_dengue': 'alta'}
    )
    sistema.agregar_regla(
        {'temperatura': 'normal', 'riesgo_epidemio': 'bajo'},
        {'sospecha_dengue': 'baja'}
    )
    
    # Reglas para COVID
    sistema.agregar_regla(
        {'intensidad_tos': 'fuerte', 'factor_respiratorio': 'alto'},
        {'sospecha_covid': 'alta'}
    )
    sistema.agregar_regla(
        {'temperatura': 'alta', 'intensidad_tos': 'moderada'},
        {'sospecha_covid': 'media'}
    )
    sistema.agregar_regla(
        {'temperatura': 'febril', 'factor_respiratorio': 'alto'},
        {'sospecha_covid': 'alta'}
    )
    sistema.agregar_regla(
        {'temperatura': 'normal', 'intensidad_tos': 'leve'},
        {'sospecha_covid': 'baja'}
    )
    
    # Reglas combinadas
    sistema.agregar_regla(
        {'temperatura': 'alta', 'riesgo_epidemio': 'alto'},
        {'sospecha_dengue': 'alta', 'sospecha_covid': 'media'}
    )
    sistema.agregar_regla(
        {'temperatura': 'normal', 'riesgo_epidemio': 'bajo'},
        {'sospecha_dengue': 'baja', 'sospecha_covid': 'baja'}
    )
    
    return sistema


def calcular_riesgo_epidemiologico(datos: Dict[str, Any]) -> float:
    """Calcula valor numerico de riesgo epidemiologico para Dengue"""
    riesgo = 0
    if datos.get('viaje_reciente'):
        riesgo += 3
    if datos.get('contacto_dengue'):
        riesgo += 3
    if datos.get('brote_dengue_zona'):
        riesgo += 2.5
    if datos.get('temporada_verano'):
        riesgo += 1.5
    return min(riesgo, 10)


def calcular_factor_respiratorio(datos: Dict[str, Any]) -> float:
    """Calcula valor numerico para factores respiratorios (COVID)"""
    factor = 0
    if datos.get('dolor_garganta'):
        factor += 3
    if datos.get('contacto_covid'):
        factor += 4
    if datos.get('tos'):
        factor += 2
    if datos.get('asma'):
        factor += 1
    return min(factor, 10)


def ejecutar_diagnostico(datos: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ejecuta el sistema de inferencia difusa
    
    Proceso:
    1. Fuzzificar entradas
    2. Evaluar reglas difusas
    3. Agregar consecuentes
    4. Defuzzificar por centroide
    """
    
    sistema = crear_sistema_difuso()
    razonamiento = []
    
    # Obtener valores de entrada
    temp = datos.get('temperatura', 37.0)
    tos = datos.get('intensidad_tos', 0)
    riesgo_epidemio = calcular_riesgo_epidemiologico(datos)
    factor_resp = calcular_factor_respiratorio(datos)
    
    # Ajustes si hay valores booleanos pero no numericos
    if datos.get('fiebre') and temp < 37.5:
        temp = 38.5
    if datos.get('tos') and tos == 0:
        tos = 5
    
    razonamiento.append(f"Temperatura entrada: {temp}C")
    razonamiento.append(f"Intensidad tos: {tos}/10")
    razonamiento.append(f"Riesgo epidemiologico calculado: {riesgo_epidemio}/10")
    razonamiento.append(f"Factor respiratorio calculado: {factor_resp}/10")
    
    # Ejecutar inferencia
    entradas = {
        'temperatura': temp,
        'intensidad_tos': tos,
        'riesgo_epidemio': riesgo_epidemio,
        'factor_respiratorio': factor_resp
    }
    
    resultados = sistema.inferir(entradas)
    
    sospecha_dengue = resultados.get('sospecha_dengue', 50)
    sospecha_covid = resultados.get('sospecha_covid', 50)
    
    # Calcular grados de pertenencia para explicacion
    grados_temp = sistema.variables_entrada['temperatura'].fuzzificar(temp)
    grados_pertenencia = {f'temp_{k}': round(v, 2) for k, v in grados_temp.items() if v > 0.1}
    
    # Determinar diagnostico
    if sospecha_dengue > 70:
        diagnostico = "ALTA SOSPECHA DE DENGUE"
    elif sospecha_dengue > 50:
        diagnostico = "SOSPECHA MODERADA DE DENGUE"
    elif sospecha_covid > 70:
        diagnostico = "ALTA SOSPECHA DE COVID-19"
    elif sospecha_covid > 50:
        diagnostico = "SOSPECHA MODERADA DE COVID-19"
    elif sospecha_dengue > sospecha_covid:
        diagnostico = "SOSPECHA LEVE DE DENGUE"
    elif sospecha_covid > sospecha_dengue:
        diagnostico = "SOSPECHA LEVE DE COVID-19"
    else:
        diagnostico = "INDETERMINADO - Sintomas no concluyentes"
    
    razonamiento.append(f"Sospecha Dengue (defuzzificado): {sospecha_dengue:.1f}%")
    razonamiento.append(f"Sospecha COVID (defuzzificado): {sospecha_covid:.1f}%")
    
    return {
        "tipo": "difuso",
        "diagnostico": diagnostico,
        "razonamiento": razonamiento,
        "intermedio": {
            "sospecha_dengue": round(sospecha_dengue, 2),
            "sospecha_covid": round(sospecha_covid, 2),
            "grados_pertenencia": grados_pertenencia,
            "entradas": entradas
        },
        "metrica": f"Dengue={sospecha_dengue:.0f}% | COVID={sospecha_covid:.0f}%"
    }
