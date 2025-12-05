import { create } from 'zustand'

const API_URL = 'http://localhost:8000'

const initialPaciente = {
  fiebre: false,
  tos: false,
  dolor_garganta: false,
  dolor_muscular: false,
  dolor_cabeza: false,
  edad: 35,
  sexo: 'masculino',
  region: 'corrientes',
  asma: false,
  medicacion_presion: false,
  viaje_reciente: false,
  destino_viaje: '',
  contacto_dengue: false,
  contacto_covid: false,
  temporada_verano: true,
  brote_dengue_zona: false,
  covid_activo_region: true,
  temperatura: 37.0,
  intensidad_tos: 0,
  dias_sintomas: 1
}

export const useStore = create((set, get) => ({
  // Estado del paciente
  paciente: { ...initialPaciente },
  
  // Resultados de diagnostico
  resultados: null,
  
  // Estado de carga
  loading: false,
  error: null,
  
  // Tab activa
  activeTab: 'todos',
  
  // Actualizar campo del paciente
  updatePaciente: (field, value) => {
    set((state) => ({
      paciente: { ...state.paciente, [field]: value }
    }))
  },
  
  // Resetear paciente
  resetPaciente: () => {
    set({ paciente: { ...initialPaciente }, resultados: null, error: null })
  },
  
  // Cargar caso ejemplo
  cargarCasoEjemplo: async () => {
    try {
      const response = await fetch(`${API_URL}/caso-ejemplo`)
      const data = await response.json()
      set({ paciente: data.datos })
    } catch (error) {
      set({ error: 'Error al cargar caso ejemplo' })
    }
  },
  
  // Cambiar tab
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Ejecutar diagnostico
  ejecutarDiagnostico: async (tipo = 'todos') => {
    set({ loading: true, error: null })
    
    try {
      const { paciente } = get()
      const endpoint = tipo === 'todos' 
        ? `${API_URL}/diagnostico/todos`
        : `${API_URL}/diagnostico/${tipo}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paciente)
      })
      
      if (!response.ok) {
        throw new Error('Error en el servidor')
      }
      
      const data = await response.json()
      set({ resultados: tipo === 'todos' ? data : { [tipo]: data }, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  }
}))

