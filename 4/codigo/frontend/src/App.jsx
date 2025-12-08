import { useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runTraining = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/train", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error de conexion con el servidor");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-gray-950 via-gray-900 to-black text-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-50 mb-2">
            Clasificador RNA
          </h1>
          <p className="text-gray-400">
            Redes Neuronales Artificiales - Dataset Titanic
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Ejecuta el pipeline completo: preprocesado, entrenamiento y
            evaluacion con varias arquitecturas para comparar su desempeno en
            supervivencia del Titanic.
          </p>
        </header>

        {/* Boton de entrenamiento */}
        <div className="flex flex-col items-center mb-10 gap-2">
          <button
            onClick={runTraining}
            disabled={loading}
            className="px-8 py-3 bg-gray-200 text-gray-900 hover:bg-white/80 disabled:bg-gray-700
                       font-semibold rounded-lg transition-all duration-200 border border-gray-300
                       shadow-lg shadow-black/40"
          >
            {loading ? "Entrenando..." : "Iniciar Entrenamiento"}
          </button>
          <p className="text-xs text-gray-500">
            Lanza el entrenamiento desde cero y actualiza todas las metricas.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-gray-900/70 border border-gray-700 text-gray-200 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Resultados */}
        {results && !loading && (
          <div className="space-y-8">
            {/* Info del dataset */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-100">Dataset</h2>
                <p className="text-sm text-gray-500">
                  Division en subconjuntos para entrenar, validar y probar la
                  generalizacion.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-950/60 p-4 rounded">
                  <p className="text-2xl font-bold text-white">
                    {results.data_info.train_size}
                  </p>
                  <p className="text-gray-400 text-sm">Training</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Datos usados para ajustar los pesos del modelo.
                  </p>
                </div>
                <div className="bg-gray-950/60 p-4 rounded">
                  <p className="text-2xl font-bold text-white">
                    {results.data_info.val_size}
                  </p>
                  <p className="text-gray-400 text-sm">Validation</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Conjunto para calibrar hiperparametros sin sesgo.
                  </p>
                </div>
                <div className="bg-gray-950/60 p-4 rounded">
                  <p className="text-2xl font-bold text-white">
                    {results.data_info.test_size}
                  </p>
                  <p className="text-gray-400 text-sm">Test</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Medicion final de rendimiento en datos no vistos.
                  </p>
                </div>
              </div>
            </div>

            {/* Mejor modelo */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-1">
                    Mejor Modelo
                  </h2>
                  <p className="text-sm text-gray-500">
                    Seleccion por mayor F1 en validacion: balance entre
                    precision y recall.
                  </p>
                </div>
              </div>
              <p className="text-white text-lg mt-4">
                {results.best_model.name}
              </p>
              <p className="text-gray-300 mt-2">
                F1-Score (Validation):{" "}
                <span className="text-gray-100 font-bold">
                  {results.best_model.metrics.validation.f1_score}
                </span>
              </p>
            </div>

            {/* Tabla de resultados */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-3 p-6 pb-4">
                <h2 className="text-xl font-semibold text-gray-100">
                  Comparacion de Modelos
                </h2>
                <p className="text-sm text-gray-500">
                  Mide velocidad y calidad en train/val/test para detectar
                  equilibrio y overfitting.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-950/60">
                    <tr className="text-gray-300">
                      <th className="px-4 py-3 text-left">Modelo</th>
                      <th className="px-4 py-3 text-center">Tiempo</th>
                      <th className="px-4 py-3 text-center">Acc Train</th>
                      <th className="px-4 py-3 text-center">Acc Val</th>
                      <th className="px-4 py-3 text-center">Acc Test</th>
                      <th className="px-4 py-3 text-center">Precision</th>
                      <th className="px-4 py-3 text-center">Recall</th>
                      <th className="px-4 py-3 text-center">F1-Score</th>
                      <th className="px-4 py-3 text-center">Overfit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.results).map(([name, metrics]) => {
                      const isBest = name === results.best_model.name;
                      return (
                        <tr
                          key={name}
                          className={`border-t border-gray-800 text-gray-200 hover:bg-gray-800/40 ${
                            isBest ? "bg-gray-800/60" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-100">
                            <div className="flex items-center gap-2">
                              <span>{name}</span>
                              {isBest && (
                                <span className="text-[10px] uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full">
                                  Mejor
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {metrics.training_time}s
                          </td>
                          <td className="px-4 py-3 text-center">
                            {metrics.train.accuracy}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {metrics.validation.accuracy}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {metrics.test.accuracy}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {metrics.test.precision}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {metrics.test.recall}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-white">
                            {metrics.test.f1_score}
                          </td>
                          <td
                            className={`px-4 py-3 text-center ${
                              metrics.overfitting_gap > 0.1
                                ? "text-gray-100"
                                : "text-gray-500"
                            }`}
                          >
                            {metrics.overfitting_gap}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrices de confusion */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-100">
                  Matrices de Confusion (Test)
                </h2>
                <p className="text-sm text-gray-500">
                  Desglosan aciertos y errores binarios: TN/FP/FN/TP para cada
                  modelo.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(results.results).map(([name, metrics]) => (
                  <div key={name} className="bg-gray-950/60 p-4 rounded-lg">
                    <p className="text-gray-200 text-sm mb-3 truncate">
                      {name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-800/80 p-3 rounded">
                        <p className="text-xs text-gray-500">TN</p>
                        <p className="text-xl font-bold text-white">
                          {metrics.confusion_matrix[0][0]}
                        </p>
                      </div>
                      <div className="bg-gray-800/80 p-3 rounded">
                        <p className="text-xs text-gray-500">FP</p>
                        <p className="text-xl font-bold text-white">
                          {metrics.confusion_matrix[0][1]}
                        </p>
                      </div>
                      <div className="bg-gray-800/80 p-3 rounded">
                        <p className="text-xs text-gray-500">FN</p>
                        <p className="text-xl font-bold text-white">
                          {metrics.confusion_matrix[1][0]}
                        </p>
                      </div>
                      <div className="bg-gray-800/80 p-3 rounded">
                        <p className="text-xs text-gray-500">TP</p>
                        <p className="text-xl font-bold text-white">
                          {metrics.confusion_matrix[1][1]}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      TN/TP muestran aciertos; FP/FN revelan errores que
                      impactan precision y recall.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross Validation */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <h2 className="text-xl font-semibold text-gray-100">
                  Cross-Validation (5-Fold)
                </h2>
                <p className="text-sm text-gray-500">
                  Media y variacion de desempeno al rotar los folds; refleja
                  estabilidad.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(results.results).map(([name, metrics]) => (
                  <div key={name} className="bg-gray-950/60 p-4 rounded-lg">
                    <p className="text-gray-200 text-sm mb-2 truncate">
                      {name}
                    </p>
                    <p className="text-white">
                      Media:{" "}
                      <span className="font-bold">{metrics.cv_mean}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        (+/- {metrics.cv_std})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cuanto menor la variacion, mas consistente el modelo entre
                      particiones.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
