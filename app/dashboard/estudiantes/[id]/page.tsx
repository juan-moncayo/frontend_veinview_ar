"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { Estudiante } from "@/types";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

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
  fecha_practica: string;
}

interface PracticaEstudiante {
  id: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  tiempo_transcurrido: number;
  numero_intentos: number;
  precision_promedio: number;
  duracion_total_segundos: number;
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
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(valor, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium w-10 text-right ${text}`}>
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

export default function EstudianteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [practicas, setPracticas] = useState<PracticaEstudiante[]>([]);
  const [resumenes, setResumenes] = useState<ResumenEstudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"practicas" | "resumenes">("practicas");
  const [recalculando, setRecalculando] = useState<number | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [estRes, pracRes, resRes] = await Promise.all([
        api.get(`/api/estudiantes/${id}/`),
        api.get(`/api/placa/practicas/`, { params: { estudiante: id, page_size: 100 } }),
        api.get(`/api/profesor/resumenes/`, { params: { page_size: 100 } }),
      ]);

      setEstudiante(estRes.data);

      const todasPracticas: PracticaEstudiante[] =
        pracRes.data.results ?? pracRes.data ?? [];
      setPracticas(todasPracticas);

      const idsPracticas = new Set(todasPracticas.map((p) => p.id));
      const misResumenes = (resRes.data.results ?? []).filter(
        (r: ResumenEstudiante) => idsPracticas.has(r.practica)
      );
      setResumenes(misResumenes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  async function recalcular(resumenId: number) {
    setRecalculando(resumenId);
    try {
      await api.post(`/api/profesor/resumenes/${resumenId}/recalcular/`);
      fetchData();
    } finally {
      setRecalculando(null);
    }
  }

  if (loading || !estudiante)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300
          border-t-slate-700 rounded-full" />
      </div>
    );

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

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/estudiantes"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <TopBar
          title={estudiante.nombre_completo}
          subtitle={`${estudiante.codigo_estudiante} · ${estudiante.programa} · Semestre ${estudiante.semestre}`}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Prácticas realizadas",
            value: finalizadas.length,
            sub: `${practicas.length} en total`,
          },
          {
            label: "Precisión promedio",
            value: `${precisionPromedio.toFixed(1)}%`,
            sub: "de todas las prácticas",
          },
          {
            label: "Calificación prom.",
            value: calificacionPromedio
              ? `${calificacionPromedio.toFixed(2)} / 5`
              : "—",
            sub: "escala 0 – 5",
          },
          {
            label: "Estado",
            value: (
              <Badge color={estudiante.activo ? "green" : "gray"}>
                {estudiante.activo ? "Activo" : "Inactivo"}
              </Badge>
            ),
            sub: estudiante.correo,
          },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-semibold text-slate-800 mt-0.5">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
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
            {t === "practicas" ? "Prácticas" : "Resúmenes"}
          </button>
        ))}
      </div>

      {/* Tab prácticas */}
      {tab === "practicas" && (
        <Card padding={false}>
          {practicas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">
                Este estudiante no tiene prácticas registradas.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["ID", "Fecha", "Duración", "Precisión", "Intentos", "Estado"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-medium text-slate-500 px-5 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {practicas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">
                      #{p.id}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(p.fecha_inicio).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDuracion(p.tiempo_transcurrido)}
                    </td>
                    <td className="px-5 py-3 min-w-[120px]">
                      {p.estado === "finalizada" ? (
                        <BarraPrecision valor={p.precision_promedio ?? 0} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-center">
                      {p.numero_intentos}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/practicas/${p.id}`}>
                        <Badge color={estadoColor[p.estado] ?? "gray"}>
                          {p.estado}
                        </Badge>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Tab resúmenes */}
      {tab === "resumenes" && (
        <Card padding={false}>
          {resumenes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">
                No hay resúmenes generados para este estudiante.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Fecha",
                    "Precisión",
                    "Intentos",
                    "Ángulo prom.",
                    "Fuerza prom.",
                    "Calificación",
                    "Técnica",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-500 px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {resumenes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.fecha_practica).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <BarraPrecision valor={r.precision_porcentaje ?? 0} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-700 font-medium">
                        {r.numero_intentos}
                      </span>
                      {r.intentos_exitosos > 0 && (
                        <span className="text-xs text-green-600 ml-1">
                          ({r.intentos_exitosos} ✓)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.inclinacion_promedio !== null
                        ? `${r.inclinacion_promedio?.toFixed(1)}°`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.fuerza_promedio !== null
                        ? `${r.fuerza_promedio?.toFixed(0)} g`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.calificacion !== null ? (
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
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={r.tecnica_correcta ? "green" : "red"}>
                        {r.tecnica_correcta ? "Correcta" : "Incorrecta"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => recalcular(r.id)}
                        disabled={recalculando === r.id}
                        title="Recalcular estadísticas"
                        className="text-slate-400 hover:text-slate-600 transition-colors
                          disabled:opacity-40 p-1 rounded hover:bg-slate-100"
                      >
                        <RefreshCw
                          size={13}
                          className={recalculando === r.id ? "animate-spin" : ""}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </>
  );
}