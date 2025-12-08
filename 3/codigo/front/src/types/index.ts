export interface DatosPaciente {
  // Sintomas
  fiebre: boolean;
  tos: boolean;
  dolor_garganta: boolean;
  dolor_muscular: boolean;
  dolor_cabeza: boolean;
  
  // Datos personales
  edad: number;
  sexo: string;
  region: string;
  
  // Antecedentes
  asma: boolean;
  medicacion_presion: boolean;
  viaje_reciente: boolean;
  destino_viaje: string | null;
  contacto_dengue: boolean;
  contacto_covid: boolean;
  
  // Datos epidemiologicos
  temporada_verano: boolean;
  brote_dengue_zona: boolean;
  covid_activo_region: boolean;

  // Para enfoque difuso - valores numericos
  temperatura: number;
  intensidad_tos: number;
  dias_sintomas: number;
}

export interface ResultadoDiagnostico {
  tipo: string;
  diagnostico: string;
  razonamiento: string[];
  intermedio: Record<string, any>;
  metrica?: string | null;
}

export interface ResultadosTodos {
  deterministico: ResultadoDiagnostico | { error: string };
  probabilistico: ResultadoDiagnostico | { error: string };
  difuso: ResultadoDiagnostico | { error: string };
}

export interface CasoEjemplo {
  descripcion: string;
  datos: DatosPaciente;
}

