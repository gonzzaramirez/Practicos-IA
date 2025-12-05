import { useState } from 'react'

function App() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const runTraining = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/train', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setResults(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error de conexion con el servidor')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            Clasificador RNA
          </h1>
          <p className="text-slate-400">
            Redes Neuronales Artificiales - Dataset Titanic
          </p>
        </header>

        {/* Boton de entrenamiento */}
        <div className="flex justify-center mb-10">
          <button
            onClick={runTraining}
            disabled={loading}
            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 
                       text-white font-semibold rounded-lg transition-all duration-200
                       shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            {loading ? 'Entrenando...' : 'Iniciar Entrenamiento'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Resultados */}
        {results && !loading && (
          <div className="space-y-8">
            {/* Info del dataset */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">Dataset</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900/50 p-4 rounded">
                  <p className="text-2xl font-bold text-white">{results.data_info.train_size}</p>
                  <p className="text-slate-400 text-sm">Training</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded">
                  <p className="text-2xl font-bold text-white">{results.data_info.val_size}</p>
                  <p className="text-slate-400 text-sm">Validation</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded">
                  <p className="text-2xl font-bold text-white">{results.data_info.test_size}</p>
                  <p className="text-slate-400 text-sm">Test</p>
                </div>
              </div>
            </div>

            {/* Mejor modelo */}
            <div className="bg-emerald-900/30 border border-emerald-500 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-emerald-400 mb-2">Mejor Modelo</h2>
              <p className="text-white text-lg">{results.best_model.name}</p>
              <p className="text-slate-300 mt-2">
                F1-Score (Validation): <span className="text-emerald-400 font-bold">
                  {results.best_model.metrics.validation.f1_score}
                </span>
              </p>
            </div>

            {/* Tabla de resultados */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <h2 className="text-xl font-semibold text-cyan-400 p-6 pb-4">Comparacion de Modelos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/50">
                    <tr className="text-slate-300">
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
                    {Object.entries(results.results).map(([name, metrics]) => (
                      <tr key={name} className="border-t border-slate-700 text-slate-200 hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium text-cyan-300">{name}</td>
                        <td className="px-4 py-3 text-center">{metrics.training_time}s</td>
                        <td className="px-4 py-3 text-center">{metrics.train.accuracy}</td>
                        <td className="px-4 py-3 text-center">{metrics.validation.accuracy}</td>
                        <td className="px-4 py-3 text-center">{metrics.test.accuracy}</td>
                        <td className="px-4 py-3 text-center">{metrics.test.precision}</td>
                        <td className="px-4 py-3 text-center">{metrics.test.recall}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-400">{metrics.test.f1_score}</td>
                        <td className={`px-4 py-3 text-center ${metrics.overfitting_gap > 0.1 ? 'text-red-400' : 'text-green-400'}`}>
                          {metrics.overfitting_gap}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrices de confusion */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-6">Matrices de Confusion (Test)</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(results.results).map(([name, metrics]) => (
                  <div key={name} className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-cyan-300 text-sm mb-3 truncate">{name}</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-emerald-600/30 p-3 rounded">
                        <p className="text-xs text-slate-400">TN</p>
                        <p className="text-xl font-bold text-white">{metrics.confusion_matrix[0][0]}</p>
                      </div>
                      <div className="bg-red-600/30 p-3 rounded">
                        <p className="text-xs text-slate-400">FP</p>
                        <p className="text-xl font-bold text-white">{metrics.confusion_matrix[0][1]}</p>
                      </div>
                      <div className="bg-red-600/30 p-3 rounded">
                        <p className="text-xs text-slate-400">FN</p>
                        <p className="text-xl font-bold text-white">{metrics.confusion_matrix[1][0]}</p>
                      </div>
                      <div className="bg-emerald-600/30 p-3 rounded">
                        <p className="text-xs text-slate-400">TP</p>
                        <p className="text-xl font-bold text-white">{metrics.confusion_matrix[1][1]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross Validation */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">Cross-Validation (5-Fold)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(results.results).map(([name, metrics]) => (
                  <div key={name} className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-cyan-300 text-sm mb-2 truncate">{name}</p>
                    <p className="text-white">
                      Media: <span className="font-bold">{metrics.cv_mean}</span>
                      <span className="text-slate-400 text-sm ml-2">(+/- {metrics.cv_std})</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

