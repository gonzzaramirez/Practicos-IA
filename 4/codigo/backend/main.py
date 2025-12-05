"""
API Flask para el pipeline de clasificacion RNA
"""

from flask import Flask, jsonify
from flask_cors import CORS
from ml_pipeline import MLPipeline

app = Flask(__name__)
CORS(app)

# Instancia global del pipeline
pipeline = None
results_cache = None


@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    return jsonify({"status": "ok"})


@app.route('/api/train', methods=['POST'])
def train():
    """Ejecuta el pipeline completo de entrenamiento"""
    global pipeline, results_cache
    
    try:
        pipeline = MLPipeline()
        results_cache = pipeline.run_pipeline()
        return jsonify({
            "success": True,
            "data": results_cache
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/results', methods=['GET'])
def get_results():
    """Obtiene los resultados del ultimo entrenamiento"""
    global results_cache
    
    if results_cache is None:
        return jsonify({
            "success": False,
            "error": "No hay resultados. Ejecute primero el entrenamiento."
        }), 404
    
    return jsonify({
        "success": True,
        "data": results_cache
    })


@app.route('/api/models', methods=['GET'])
def get_models():
    """Obtiene la lista de modelos disponibles"""
    if results_cache is None:
        return jsonify({
            "success": False,
            "error": "No hay modelos entrenados."
        }), 404
    
    return jsonify({
        "success": True,
        "models": results_cache["models"]
    })


@app.route('/api/best', methods=['GET'])
def get_best():
    """Obtiene el mejor modelo"""
    if results_cache is None:
        return jsonify({
            "success": False,
            "error": "No hay modelos entrenados."
        }), 404
    
    return jsonify({
        "success": True,
        "best_model": results_cache["best_model"]
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)

