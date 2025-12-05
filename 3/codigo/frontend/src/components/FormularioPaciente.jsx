import { useStore } from '../store'

export default function FormularioPaciente() {
  const { paciente, updatePaciente } = useStore()

  const Checkbox = ({ name, label }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={paciente[name]}
        onChange={(e) => updatePaciente(name, e.target.checked)}
        className="checkbox-custom"
      />
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </label>
  )

  return (
    <div className="space-y-6">
      {/* Sintomas */}
      <section>
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">Sintomas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Checkbox name="fiebre" label="Fiebre" />
          <Checkbox name="tos" label="Tos" />
          <Checkbox name="dolor_garganta" label="Dolor de Garganta" />
          <Checkbox name="dolor_muscular" label="Dolor Muscular" />
          <Checkbox name="dolor_cabeza" label="Dolor de Cabeza" />
        </div>
      </section>

      {/* Datos Personales */}
      <section>
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">Datos Personales</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Edad</label>
            <input
              type="number"
              value={paciente.edad}
              onChange={(e) => updatePaciente('edad', parseInt(e.target.value))}
              className="input-field"
              min="0"
              max="120"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sexo</label>
            <select
              value={paciente.sexo}
              onChange={(e) => updatePaciente('sexo', e.target.value)}
              className="input-field"
            >
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
        </div>
      </section>

      {/* Antecedentes */}
      <section>
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">Antecedentes</h3>
        <div className="grid grid-cols-2 gap-3">
          <Checkbox name="asma" label="Asma" />
          <Checkbox name="medicacion_presion" label="Medicacion Presion" />
        </div>
      </section>

      {/* Factores Epidemiologicos */}
      <section>
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">Factores Epidemiologicos</h3>
        <div className="space-y-3">
          <Checkbox name="viaje_reciente" label="Viaje reciente a zona endemica" />
          
          {paciente.viaje_reciente && (
            <div className="ml-8 animate-fadeIn">
              <label className="block text-xs text-slate-400 mb-1">Destino del viaje</label>
              <select
                value={paciente.destino_viaje}
                onChange={(e) => updatePaciente('destino_viaje', e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                <option value="brasil">Brasil</option>
                <option value="paraguay">Paraguay</option>
                <option value="bolivia">Bolivia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          )}
          
          <Checkbox name="contacto_dengue" label="Contacto con caso de Dengue" />
          <Checkbox name="contacto_covid" label="Contacto con caso de COVID-19" />
          <Checkbox name="temporada_verano" label="Temporada de verano" />
          <Checkbox name="brote_dengue_zona" label="Brote de Dengue en la zona" />
          <Checkbox name="covid_activo_region" label="COVID activo en la region" />
        </div>
      </section>

      {/* Variables para Enfoque Difuso */}
      <section>
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">Valores Numericos (Difuso)</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Temperatura</span>
              <span className="text-white font-mono">{paciente.temperatura}°C</span>
            </div>
            <input
              type="range"
              min="35"
              max="42"
              step="0.1"
              value={paciente.temperatura}
              onChange={(e) => updatePaciente('temperatura', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Intensidad de Tos</span>
              <span className="text-white font-mono">{paciente.intensidad_tos}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={paciente.intensidad_tos}
              onChange={(e) => updatePaciente('intensidad_tos', parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

