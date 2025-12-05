# Trabajo Práctico Nº4 – Inteligencia Artificial Simbólica

**FaCENA – UNNE**

## Objetivo General

Construcción y validación de un artefacto representativo de la IA simbólica, identificando:

- Elementos constitutivos
- Mecanismo de inferencia
- Integración de conocimientos y metodologías
- Uso de vocabulario específico  
  Aplicado a un problema abstraído de la realidad.

---

## Competencias Asociadas

- **CE1:** Especificación, proyección y desarrollo de sistemas de información, comunicación y software con impacto crítico.
- **CGT1:** Identificación, formulación y resolución de problemas informáticos.
- **CGT4:** Uso de técnicas y herramientas propias de la informática.
- **CGS1:** Fundamentos para el trabajo en equipo.
- **CGS2:** Fundamentos para la comunicación efectiva.
- **CGS5:** Fundamentos para el aprendizaje continuo.

---

## Actividades Generalizadas

- Trabajo en equipo (3–4 integrantes).
- Revisión de contenidos de clases, material de la asignatura y bibliografía específica.
- Diseño del agente inteligente utilizando el descriptor **Percepción & Acción (P&A)**.
- Desarrollo del agente para el caso planteado.
- Validación y exposición del proceso y producto final.

---

# Contexto del Problema

Un paciente llega al centro de emergencias con los siguientes síntomas y antecedentes:

### **Síntomas y datos clínicos**

- Fiebre
- Tos
- Dolor de garganta

### **Datos personales**

- 35 años
- Sexo masculino
- Reside en Corrientes (Argentina)

### **Antecedentes**

- Asma
- Toma medicación para presión arterial
- Viajó a Brasil hace dos semanas
- Contacto con familiar enfermo de Dengue

### **Evaluación inicial del agente médico infectólogo**

1. Clasificación preliminar: **sospechoso de Dengue y/o COVID-19**.
2. Ajustes de clasificación:
   - Aumenta probabilidad de **Dengue** por viaje reciente y contacto estrecho.
   - Reduce probabilidad de **COVID-19**.
3. Datos epidemiológicos relevantes:
   - Alta prevalencia de Dengue en verano.
   - COVID-19 circula activamente en la región.
   - Brote reciente de Dengue próximo al centro de emergencias.
4. Conclusión: **Se incrementa aún más la probabilidad de Dengue** en el diagnóstico preliminar.

---

# Tipos de Sistemas Expertos a Desarrollar

Se presentan tres enfoques distintos. Cada equipo abordará uno de ellos.

---

# 1. Enfoque Determinístico (Basado en Reglas)

### Objetivos

- Especificar todas las **reglas del problema** según el caso planteado.
- Representar gráficamente el conjunto de reglas (P&A).
- Construir un **prototipo de agente inteligente** usando una plataforma seleccionada.
- Validar su funcionamiento.
- Exponer el proceso y producto final.

### Consideraciones

- Identificar condiciones directas: síntomas, antecedentes, epidemiología.
- Construir reglas IF–THEN claras y determinísticas.

---

# 2. Enfoque Probabilístico

### Objetivos

- Transformar el enfoque determinístico en un enfoque probabilístico.
- Identificar los **beneficios del modelo probabilístico**:
  - Manejo de incertidumbre
  - Ajuste dinámico de probabilidades
  - Integración de múltiples fuentes (clínicas + epidemiológicas)
- Prototipar o modificar el sistema experto.
- Justificar los cambios introducidos.
- Validar el sistema probabilístico.
- Exponer el proceso y producto final.

### Consideraciones

- Reemplazo de reglas duras por probabilidades.
- Evidencia incorporada mediante _likelihoods_ o inferencia probabilística.

---

# 3. Enfoque Difuso (Lógica Difusa)

### Objetivos

- Reformular el problema desde un enfoque de lógica difusa.
- Aplicar P&A desde esta perspectiva.
- Prototipar o ajustar el agente inteligente para operar con:
  - Grados de pertenencia
  - Variables lingüísticas (p. ej., “fiebre alta”, “riesgo medio”, etc.)
- Indicar los cambios realizados.
- Validar el comportamiento del sistema difuso.
- Exponer proceso y producto.

### Consideraciones

- El razonamiento difuso permite manejar imprecisiones propias del contexto médico.
- Se modelan niveles intermedios de riesgo sin reglas estrictas ni probabilidades exactas.

---

# Entregables Esperados

1. Descripción del enfoque asignado (determinístico, probabilístico o difuso).
2. Modelo P&A correspondiente.
3. Prototipo funcional del agente inteligente.
4. Validación o tests.
5. Informe o presentación que explique:
   - Proceso
   - Decisiones de diseño
   - Resultados
   - Conclusiones sobre el enfoque elegido

---

# Fin del Documento
