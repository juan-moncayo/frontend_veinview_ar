export interface Profesor {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  cedula: string;
  correo: string;
  telefono: string;
  especialidad: string;
  activo: boolean;
  fecha_registro: string;
  total_estudiantes: number;
  practicas_hoy: number;
}

export interface Estudiante {
  id: number;
  codigo_estudiante: string;
  nombre_completo: string;
  correo: string;
  programa: string;
  semestre: number;
  telefono: string;
  activo: boolean;
  fecha_registro: string;
  profesor_nombre: string;
  total_practicas: number;
  practicas_finalizadas: number;
}

export interface Practica {
  id: number;
  estudiante: {
    id: number;
    codigo_estudiante: string;
    nombre_completo: string;
  };
  estado: "iniciada" | "pausada" | "finalizada";
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_total_segundos: number;
  tiempo_transcurrido: number;
}

export interface DatosSensor {
  id: number;
  practica: number;
  dispositivo: number;
  aceleracion_x: number;
  aceleracion_y: number;
  aceleracion_z: number;
  giroscopio_x: number;
  giroscopio_y: number;
  giroscopio_z: number;
  angulo_pitch: number;
  angulo_roll: number;
  angulo_yaw: number;
  fuerza: number;
  presion: number | null;
  timestamp: string;
  tecnica_correcta: boolean;
}

export interface ResumenPractica {
  id: number;
  practica: number;
  profesor: number;
  profesor_nombre: string;
  estudiante_nombre: string;
  estudiante_codigo: string;
  fecha_practica: string;
  total_datos_capturados: number;
  inclinacion_promedio: number | null;
  fuerza_promedio: number | null;
  fuerza_maxima: number | null;
  fuerza_minima: number | null;
  numero_intentos: number;
  intentos_exitosos: number;
  precision_porcentaje: number;
  tiempo_canalizacion: number;
  duracion_minutos: number;
  calificacion: number | null;
  observaciones: string;
  tecnica_correcta: boolean;
  angulo_adecuado: boolean;
  presion_controlada: boolean;
  fecha_evaluacion: string;
}

export interface Encuesta {
  id: number;
  estudiante: number;
  estudiante_nombre: string;
  facilidad_uso: number;
  utilidad_sistema: number;
  precision_sensores: number;
  interfaz_clara: number;
  mejora_aprendizaje: number;
  aspectos_positivos: string;
  aspectos_negativos: string;
  sugerencias: string;
  recomendaria: boolean;
  puntuacion_promedio: number;
  fecha_respuesta: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  profesor: Profesor;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}