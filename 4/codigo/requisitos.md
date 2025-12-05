Trabajo Práctico 5: Inteligencia Artificial Conexionista (RNA)
Este proyecto implementa y valida modelos de Redes Neuronales Artificiales (RNA) para resolver un problema de clasificación utilizando datasets estándar (Titanic o Iris).

📋 Requisitos Técnicos
Lenguaje y Entorno

Lenguaje: Python.

Entorno recomendado: Jupyter Notebook / Google Colab o Scripts de Python.

Frameworks y Librerías:

Scikit-learn: Para la implementación de modelos MLPClassifier, preprocesamiento y métricas.

Pandas: Manipulación y análisis de datos.

NumPy: Cálculo numérico.

Matplotlib / Seaborn: Visualización de datos y gráficas de métricas.

(Opcional) PyTorch o TensorFlow-Keras si se requieren modelos de Deep Learning más complejos.

Dataset

Fuente: Repositorio UCI Machine Learning o Kaggle.

Selección: Dataset TITANIC o IRIS.

Tipo de problema: Clasificación.

⚙️ Requerimientos del Código
El código debe estar estructurado siguiendo un pipeline de flujo de trabajo de Machine Learning, cubriendo las siguientes fases:

1. Fase de Preprocesamiento
   El código debe incluir funciones para limpiar y preparar los datos antes del entrenamiento:

Carga de datos: Importación del dataset seleccionado.

Limpieza: Detección y tratamiento de valores nulos/faltantes y outliers.

Transformación:

Codificación de variables categóricas/nominales (One-Hot Encoding o asignación numérica).

Escalado y normalización de datos (StandardScaler o MinMaxScaler) .

Balanceo de clases: Implementación de técnicas de Over-Sampling o Under-Sampling si el dataset está desequilibrado.

División de datos: Separación del conjunto en Training, Validation y Test (o uso de Cross-Validation con k-folds).

2. Fase de Procesamiento (Modelado)
   Se debe implementar la construcción y entrenamiento de mínimo 3 modelos distintos de RNA.

Configuración de los Modelos (Hiperparámetros): El código debe permitir variar y experimentar con los siguientes parámetros para cada modelo:

Arquitectura:

Número de capas ocultas.

Número de neuronas por capa.

Algoritmos de optimización (Solvers): Comparar entre l-bfgs, sgd, y adam.

Funciones de activación: (ej. ReLU, Tanh, Logistic).

Parámetros de entrenamiento:

Epochs: Número de iteraciones durante el entrenamiento.

Learning Rate (Tasa de aprendizaje): Velocidad de modificación de pesos.

Intervalo de iteraciones: Control del estado del entrenamiento.

3. Fase de Posprocesamiento y Evaluación
   El código debe generar resultados cuantificables para comparar los modelos diseñados.

Métricas requeridas: Para cada modelo, se deben calcular e imprimir :

Matriz de Confusión.

Accuracy (Exactitud).

Precision (Precisión).

Recall (Sensibilidad).

F1-Score.

Análisis Comparativo:

El script debe permitir comparar métricas de Entrenamiento vs. Validación para detectar Overfitting (Sobreajuste) o Underfitting (Subajuste).

Medición del tiempo de ejecución de cada entrenamiento.

🚀 Ejecución
El entregable debe ser capaz de ejecutar el flujo completo:

Ingesta y limpieza de datos.

Entrenamiento de los 3 modelos configurados.

Impresión en consola o visualización gráfica de la tabla comparativa de métricas para determinar el mejor modelo.
