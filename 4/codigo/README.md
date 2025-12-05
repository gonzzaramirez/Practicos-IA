# Clasificador RNA - Trabajo Practico 5

Sistema de clasificacion utilizando Redes Neuronales Artificiales (MLPClassifier) sobre el dataset Titanic.

---

## Estructura del Proyecto

```
codigo/
├── backend/
│   ├── main.py           # API Flask
│   ├── ml_pipeline.py    # Pipeline de ML
│   └── requirements.txt  # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Componente principal
│   │   ├── main.jsx      # Entry point
│   │   └── index.css     # Estilos Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## Backend

### Tecnologias
- Python 3.9+
- Flask (API REST)
- Scikit-learn (MLPClassifier)
- Pandas / NumPy
- imbalanced-learn (SMOTE)

### Pipeline de ML (`ml_pipeline.py`)

#### 1. Preprocesamiento
- **Carga de datos**: Dataset Titanic desde repositorio remoto
- **Limpieza**: Tratamiento de valores nulos (Age con mediana, Embarked con moda)
- **Transformacion**: 
  - LabelEncoder para variable Sex
  - One-Hot Encoding para Embarked
- **Balanceo**: SMOTE para oversampling de clase minoritaria
- **Escalado**: StandardScaler para normalizacion
- **Division**: 60% train / 20% validation / 20% test

#### 2. Modelos Implementados

| Modelo | Arquitectura | Activacion | Solver | Learning Rate |
|--------|--------------|------------|--------|---------------|
| Modelo 1 | (64, 32) | ReLU | Adam | 0.001 |
| Modelo 2 | (128, 64, 32) | Tanh | SGD | 0.01 (adaptive) |
| Modelo 3 | (50,) | Logistic | L-BFGS | default |

#### 3. Metricas Evaluadas
- Accuracy (Train/Validation/Test)
- Precision
- Recall
- F1-Score
- Matriz de Confusion
- Cross-Validation (5-Fold)
- Gap de Overfitting (Acc Train - Acc Val)

### API Endpoints

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/health` | Estado del servidor |
| POST | `/api/train` | Ejecuta pipeline completo |
| GET | `/api/results` | Obtiene ultimos resultados |
| GET | `/api/best` | Obtiene mejor modelo |

### Respuesta de `/api/train`

```json
{
  "success": true,
  "data": {
    "data_info": {
      "train_size": 856,
      "val_size": 143,
      "test_size": 179
    },
    "models": ["Modelo 1 - Adam/ReLU", "..."],
    "results": {
      "Modelo 1 - Adam/ReLU": {
        "training_time": 0.45,
        "train": {"accuracy": 0.89, "precision": 0.87, "recall": 0.91, "f1_score": 0.89},
        "validation": {"accuracy": 0.82, "..."},
        "test": {"accuracy": 0.80, "..."},
        "confusion_matrix": [[90, 15], [20, 54]],
        "cv_mean": 0.81,
        "cv_std": 0.03,
        "overfitting_gap": 0.07
      }
    },
    "best_model": {"name": "Modelo 1 - Adam/ReLU", "metrics": {...}}
  }
}
```

---

## Frontend

### Tecnologias
- Vite 5
- React 18
- Tailwind CSS 3

### Funcionalidades
- Boton para iniciar entrenamiento
- Visualizacion de metricas por modelo
- Tabla comparativa
- Matrices de confusion
- Indicador de overfitting
- Resultados de cross-validation

---

## Ejecucion Local

### Requisitos
- Python 3.9+
- Node.js 18+

### 1. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
venv\Scripts\activate

# Activar entorno (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python main.py
```

El servidor inicia en `http://localhost:5000`

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicacion inicia en `http://localhost:3000`

### 3. Uso

1. Abrir `http://localhost:3000` en el navegador
2. Click en "Iniciar Entrenamiento"
3. Esperar a que se complete el pipeline
4. Revisar resultados y metricas

---

## Ejecucion Solo Backend (Consola)

Para ejecutar el pipeline sin frontend:

```bash
cd backend
python ml_pipeline.py
```

Imprime resultados directamente en consola.

---

## Criterio de Seleccion del Mejor Modelo

El mejor modelo se selecciona basado en el **F1-Score de validacion**, ya que:
- Balancea precision y recall
- Es robusto ante clases desbalanceadas
- Usar validacion evita sesgo por overfitting

---

## Notas Tecnicas

- Early stopping habilitado para modelos Adam y SGD
- SMOTE aplicado solo sobre datos de entrenamiento
- Cross-validation ejecutado post-entrenamiento para validacion adicional
- El gap de overfitting se considera alto si supera 0.1

