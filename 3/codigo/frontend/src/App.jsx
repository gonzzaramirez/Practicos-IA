import { useStore } from './store'
import FormularioPaciente from './components/FormularioPaciente'
import ResultadosDiagnostico from './components/ResultadosDiagnostico'
import { Activity, Brain, Zap } from 'lucide-react'

function App() {
  const { loading, error, ejecutarDiagnostico, cargarCasoEjemplo, resetPaciente } = useStore()

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Sistema Experto Medico
                </h1>
                <p className="text-xs text-slate-400">IA Simbolica - Dengue / COVID-19</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={cargarCasoEjemplo}
                className="px-4 py-2 text-sm bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                Caso Ejemplo
              </button>
              <button 
                onClick={resetPaciente}
                className="px-4 py-2 text-sm bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Panel Izquierdo - Formulario */}
          <div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Datos del Paciente
              </h2>
              <FormularioPaciente />
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
              
              <button 
                onClick={() => ejecutarDiagnostico('todos')}
                disabled={loading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Ejecutar Diagnostico
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel Derecho - Resultados */}
          <div>
            <ResultadosDiagnostico />
          </div>
        </div>

        {/* Footer con info de enfoques */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <InfoCard 
            titulo="Deterministico"
            descripcion="Sistema basado en reglas SI-ENTONCES con encadenamiento hacia adelante."
            color="amber"
          />
          <InfoCard 
            titulo="Probabilistico"
            descripcion="Red Bayesiana con inferencia de probabilidades condicionales."
            color="blue"
          />
          <InfoCard 
            titulo="Difuso"
            descripcion="Logica difusa con variables linguisticas y funciones de membresia."
            color="emerald"
          />
        </div>
      </main>
    </div>
  )
}

function InfoCard({ titulo, descripcion, color }) {
  const colors = {
    amber: 'from-amber-500/20 to-orange-600/20 border-amber-500/30',
    blue: 'from-blue-500/20 to-indigo-600/20 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30'
  }
  
  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br ${colors[color]} border backdrop-blur-sm`}>
      <h3 className="font-semibold mb-2">{titulo}</h3>
      <p className="text-sm text-slate-300">{descripcion}</p>
    </div>
  )
}

export default App

