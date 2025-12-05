import { useStore } from '../store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function ResultadosDiagnostico() {
  const { resultados, activeTab, setActiveTab } = useStore()

  if (!resultados) {
    return (
      <div className="card h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center text-slate-400">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <Info className="w-8 h-8" />
          </div>
          <p>Complete los datos del paciente y ejecute el diagnostico</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'todos', label: 'Comparativa' },
    { id: 'deterministico', label: 'Deterministico' },
    { id: 'probabilistico', label: 'Probabilistico' },
    { id: 'difuso', label: 'Difuso' }
  ]

  return (
    <div className="card animate-fadeIn">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn whitespace-nowrap ${
              activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === 'todos' ? (
        <ComparativaResultados resultados={resultados} />
      ) : (
        resultados[activeTab] && <DetalleEnfoque resultado={resultados[activeTab]} />
      )}
    </div>
  )
}

function ComparativaResultados({ resultados }) {
  // Preparar datos para el grafico
  const chartData = []
  
  if (resultados.deterministico?.intermedio) {
    const det = resultados.deterministico.intermedio
    chartData.push({
      enfoque: 'Deterministico',
      dengue: det.puntaje_dengue || 0,
      covid: det.puntaje_covid || 0
    })
  }
  
  if (resultados.probabilistico?.intermedio) {
    const prob = resultados.probabilistico.intermedio
    chartData.push({
      enfoque: 'Probabilistico',
      dengue: Math.round((prob.probabilidad_dengue || 0) * 100),
      covid: Math.round((prob.probabilidad_covid || 0) * 100)
    })
  }
  
  if (resultados.difuso?.intermedio) {
    const dif = resultados.difuso.intermedio
    chartData.push({
      enfoque: 'Difuso',
      dengue: Math.round(dif.sospecha_dengue || 0),
      covid: Math.round(dif.sospecha_covid || 0)
    })
  }

  return (
    <div className="space-y-6">
      {/* Cards de diagnostico */}
      <div className="grid gap-4">
        {Object.entries(resultados).map(([tipo, res]) => (
          res && !res.error && (
            <DiagnosticoCard key={tipo} tipo={tipo} resultado={res} />
          )
        ))}
      </div>

      {/* Grafico comparativo */}
      {chartData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Comparativa de Resultados</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis type="category" dataKey="enfoque" tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="dengue" name="Dengue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="covid" name="COVID" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs text-slate-400">Dengue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-xs text-slate-400">COVID-19</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DiagnosticoCard({ tipo, resultado }) {
  const [expanded, setExpanded] = useState(false)
  
  const tipoLabels = {
    deterministico: { label: 'Deterministico', color: 'amber' },
    probabilistico: { label: 'Probabilistico', color: 'blue' },
    difuso: { label: 'Difuso', color: 'emerald' }
  }

  const config = tipoLabels[tipo]
  const isDengue = resultado.diagnostico?.toLowerCase().includes('dengue')
  
  const bgColors = {
    amber: 'bg-amber-500/10 border-amber-500/30',
    blue: 'bg-blue-500/10 border-blue-500/30',
    emerald: 'bg-emerald-500/10 border-emerald-500/30'
  }

  return (
    <div className={`p-4 rounded-lg border ${bgColors[config.color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider text-${config.color}-400`}>
              {config.label}
            </span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-400 font-mono">{resultado.metrica}</span>
          </div>
          <div className="flex items-center gap-2">
            {isDengue ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-400" />
            )}
            <span className="font-semibold text-white">{resultado.diagnostico}</span>
          </div>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-600/50 animate-fadeIn">
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Razonamiento</h4>
          <ul className="space-y-1">
            {resultado.razonamiento?.map((r, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-cyan-500 mt-1">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DetalleEnfoque({ resultado }) {
  return (
    <div className="space-y-6">
      {/* Diagnostico principal */}
      <div className="text-center py-6 border-b border-slate-700/50">
        <p className="text-sm text-slate-400 mb-2">Diagnostico</p>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          {resultado.diagnostico}
        </h2>
        <p className="text-slate-400 mt-2 font-mono">{resultado.metrica}</p>
      </div>

      {/* Razonamiento */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Proceso de Razonamiento</h3>
        <div className="space-y-2">
          {resultado.razonamiento?.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
              <span className="text-cyan-500 font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm text-slate-300">{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Datos intermedios */}
      {resultado.intermedio && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Datos Intermedios</h3>
          <pre className="p-4 bg-slate-900/50 rounded-lg overflow-auto text-xs font-mono text-slate-300">
            {JSON.stringify(resultado.intermedio, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

