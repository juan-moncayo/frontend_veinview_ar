import { Profesor } from "@/types";

export interface EstudianteAuth {
  id: number;
  nombre_completo: string;
  codigo_estudiante: string;
  correo: string;
  programa: string;
  semestre: number;
}

export function getProfesor(): Profesor | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("profesor");
  return data ? JSON.parse(data) : null;
}

export function getEstudiante(): EstudianteAuth | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("estudiante");
  return data ? JSON.parse(data) : null;
}

export function getRol(): "profesor" | "estudiante" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rol") as "profesor" | "estudiante" | null;
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("profesor");
  localStorage.removeItem("estudiante");
  localStorage.removeItem("rol");
  window.location.href = "/login";
}