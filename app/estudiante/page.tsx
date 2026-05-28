"use client";
import { useEffect, useState } from "react";
import { getEstudiante } from "@/lib/auth";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface PracticaEstudiante {
  id: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_total_segundos: number;
  tiempo_transcurrido: number;
  numero_intentos: number;
  precision_promedio: number;
}

interface ResumenEstudiante {
  id: number;
  practica: number;
  precision_porcentaje: number;
  numero_intentos: number;
  intentos_exitosos: number;
  calificacion: number | null;
  tecnica_correcta: boolean;
  angulo_adecuado: boolean;
  presion_controlada: boolean;
  inclinacion_promedio: number | null;
  fuerza_promedio: number | null;
  tiempo_canalizacion: number;
  fecha_evaluacion: string;
  fecha_practica: string;
}

function formatDuracion(s: number) {
  if (!s) return "0 min";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function BarraPrecision({ valor }: { valor: number }) {
  const color =
    valor >= 80 ? "bg-green-500"
    : valor >= 60 ? "bg-amber-400"
    : valor >= 30 ? "bg-orange-400"
    : "bg-red-400";
  const text =
    valor >= 80 ? "text-green-600"
    : valor >= 60 ? "text-amber-600"
    : valor >= 30 ? "text-orange-600"
    : "text-red-600";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(valor, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-9 text-right ${text}`}>
        {(valor ?? 0).toFixed(1)}%
      </span>
    </div>
  );
}

const estadoColor: Record<string, "green" | "yellow" | "gray"> = {
  iniciada: "green",
  pausada: "yellow",
  finalizada: "gray",
};

export default function EstudiantePage() {
  const estudiante = getEstudiante();
  const [practicas, setPracticas] = useState<PracticaEstudiante[]>([]);
  const [resumenes, setResumenes] = useState<ResumenEstudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"practicas" | "resumenes">("practicas");

  useEffect(() => {
    if (!estudiante) return;
    Promise.all([
      api.get("/api/estudiantes/mis_practicas/"),
      api.get("/api/profesor/resumenes/", {
        params: { page_size: 100 },
      }),
    ])
      .then(([pRes, rRes]) => {
        const todasPracticas: PracticaEstudiante[] =
          pRes.data.practicas ?? pRes.data ?? [];
        setPracticas(todasPracticas);

        // Filtrar solo resúmenes de prácticas de este estudiante
        const idsPracticas = new Set(todasPracticas.map((p) => p.id));
        const misResumenes = (rRes.data.results ?? []).filter(
          (r: ResumenEstudiante) => idsPracticas.has(r.practica)
        );
        setResumenes(misResumenes);
      })
      .finally(() => setLoading(false));
  }, []);

  // Estadísticas generales
  const finalizadas = practicas.filter((p) => p.estado === "finalizada");
  const precisionPromedio =
    resumenes.length > 0
      ? resumenes.reduce((acc, r) => acc + (r.precision_porcentaje ?? 0), 0) /
        resumenes.length
      : 0;
  const calificacionPromedio =
    resumenes.filter((r) => r.calificacion !== null).length > 0
      ? resumenes
          .filter((r) => r.calificacion !== null)
          .reduce((acc, r) => acc + (r.calificacion ?? 0), 0) /
        resumenes.filter((r) => r.calificacion !== null).length
      : null;
  const mejorPrecision =
    resumenes.length > 0
      ? Math.max(...resumenes.map((r) => r.precision_porcentaje ?? 0))
      : 0;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300
          border-t-slate-700 rounded-full" />
      </div>
    );

  return (
    <>
      {/* Saludo */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Hola, {estudiante?.nombre_completo.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {estudiante?.programa} · Semestre {estudiante?.semestre}
        </p>
      </div>

      {/* Stats generales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Prácticas realizadas",
            value: finalizadas.length,
            sub: `${practicas.length} en total`,
          },
          {
            label: "Precisión promedio",
            value: `${precisionPromedio.toFixed(1)}%`,
            sub: "de todas tus prácticas",
          },
          {
            label: "Mejor precisión",
            value: `${mejorPrecision.toFixed(1)}%`,
            sub: "tu mejor sesión",
          },
          {
            label: "Calificación prom.",
            value: calificacionPromedio
              ? `${calificacionPromedio.toFixed(2)} / 5`
              : "—",
            sub: "escala 0 – 5",
          },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-semibold text-slate-800 mt-0.5">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
        {(["practicas", "resumenes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                tab === t
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {t === "practicas" ? "Mis prácticas" : "Mis resúmenes"}
          </button>
        ))}
      </div>

      {/* Tab prácticas */}
      {tab === "practicas" && (
        <div className="flex flex-col gap-3">
          {practicas.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-400 text-center py-6">
                Aún no tienes prácticas registradas.
              </p>
            </Card>
          ) : (
            practicas.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-400">
                        #{p.id}
                      </span>
                      <Badge color={estadoColor[p.estado] ?? "gray"}>
                        {p.estado}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(p.fecha_inicio).toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Duración: {formatDuracion(p.tiempo_transcurrido)}
                    </p>
                  </div>

                  {p.estado === "finalizada" && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">Precisión</p>
                      <p
                        className={`text-lg font-semibold ${
                          p.precision_promedio >= 80
                            ? "text-green-600"
                            : p.precision_promedio >= 60
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {(p.precision_promedio ?? 0).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.numero_intentos} intentos
                      </p>
                    </div>
                  )}
                </div>

                {p.estado === "finalizada" && p.precision_promedio > 0 && (
                  <BarraPrecision valor={p.precision_promedio ?? 0} />
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab resúmenes */}
      {tab === "resumenes" && (
        <div className="flex flex-col gap-3">
          {resumenes.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-400 text-center py-6">
                Tus resúmenes aparecerán aquí cuando el profesor los genere.
              </p>
            </Card>
          ) : (
            resumenes.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {new Date(r.fecha_practica).toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Duración: {formatDuracion(r.tiempo_canalizacion)}
                    </p>
                  </div>
                  {r.calificacion !== null && (
                    <Badge
                      color={
                        r.calificacion >= 3.5
                          ? "green"
                          : r.calificacion >= 2.5
                          ? "yellow"
                          : "red"
                      }
                    >
                      {r.calificacion.toFixed(1)} / 5
                    </Badge>
                  )}
                </div>

                {/* Precisión */}
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">Precisión técnica</p>
                  <BarraPrecision valor={r.precision_porcentaje ?? 0} />
                </div>

                {/* Criterios */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Técnica", ok: r.tecnica_correcta },
                    { label: "Ángulo", ok: r.angulo_adecuado },
                    { label: "Presión", ok: r.presion_controlada },
                  ].map(({ label, ok }) => (
                    <div
                      key={label}
                      className={`rounded-lg px-3 py-2 text-center
                        ${ok ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <p className="text-xs font-medium
                        ${ok ? 'text-green-700' : 'text-red-700'}">
                        {label}
                      </p>
                      <p
                        className={`text-lg font-semibold mt-0.5 ${
                          ok ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {ok ? "✓" : "✗"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500
                  border-t border-slate-100 pt-3">
                  <span>
                    Intentos:{" "}
                    <span className="font-medium text-slate-700">
                      {r.numero_intentos}
                    </span>
                    {r.intentos_exitosos > 0 && (
                      <span className="text-green-600 ml-1">
                        ({r.intentos_exitosos} ✓)
                      </span>
                    )}
                  </span>
                  {r.inclinacion_promedio !== null && (
                    <span>
                      Ángulo prom.:{" "}
                      <span className="font-medium text-slate-700">
                        {r.inclinacion_promedio?.toFixed(1)}°
                      </span>
                    </span>
                  )}
                  {r.fuerza_promedio !== null && (
                    <span>
                      Fuerza prom.:{" "}
                      <span className="font-medium text-slate-700">
                        {r.fuerza_promedio?.toFixed(0)} g
                      </span>
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </>
  );
}