import type { DatosPaciente, ResultadoDiagnostico, ResultadosTodos, CasoEjemplo } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  async getCasoEjemplo(): Promise<CasoEjemplo> {
    return fetchAPI<CasoEjemplo>('/caso-ejemplo');
  },

  async diagnosticoDeterministico(paciente: DatosPaciente): Promise<ResultadoDiagnostico> {
    return fetchAPI<ResultadoDiagnostico>('/diagnostico/deterministico', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
  },

  async diagnosticoProbabilistico(paciente: DatosPaciente): Promise<ResultadoDiagnostico> {
    return fetchAPI<ResultadoDiagnostico>('/diagnostico/probabilistico', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
  },

  async diagnosticoDifuso(paciente: DatosPaciente): Promise<ResultadoDiagnostico> {
    return fetchAPI<ResultadoDiagnostico>('/diagnostico/difuso', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
  },

  async diagnosticoTodos(paciente: DatosPaciente): Promise<ResultadosTodos> {
    return fetchAPI<ResultadosTodos>('/diagnostico/todos', {
      method: 'POST',
      body: JSON.stringify(paciente),
    });
  },
};

