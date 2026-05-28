"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Encuesta, PaginatedResponse } from "@/types";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface EstadisticasEncuesta {
  total_encuestas: number;
  promedios?: {
    facilidad_uso: number;
    utilidad_sistema: number;
    precision_sensores: number;
    interfaz_clara: number;
    mejora_aprendizaje: number;
    general: number;
  };
  recomendaciones?: {
    total: number;
    porcentaje: number;
  };
}

function Stars({ value }: { value: number }) {
  const v = Math.min(Math.max(Math.round(value || 0), 0), 5);
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(v)}
      {"☆".repeat(5 - v)}
    </span>
  );
}

const METRICAS = [
  { label: "Facilidad de uso", key: "facilidad_uso" },
  { label: "Utilidad del sistema", key: "utilidad_sistema" },
  { label: "Precisión sensores", key: "precision_sensores" },
  { label: "Interfaz clara", key: "interfaz_clara" },
  { label: "Mejora aprendizaje", key: "mejora_aprendizaje" },
  { label: "Promedio general", key: "general" },
];

export default function EncuestasPage() {
  const [data, setData] = useState<PaginatedResponse<Encuesta> | null>(null);
  const [stats, setStats] = useState<EstadisticasEncuesta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/api/profesor/encuestas/", { params: { page } }),
      api.get("/api/profesor/encuestas/estadisticas/"),
    ])
      .then(([listRes, statsRes]) => {
        setData(listRes.data);
        setStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = data ? Math.ceil(data.count / 20) : 1;
  const hayEncuestas = (data?.count ?? 0) > 0;

  return (
    <>
      <TopBar
        title="Encuestas del sistema"
        subtitle="Retroalimentación de los estudiantes"
      />

      {/* Resumen estadístico — solo si hay encuestas */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-slate-300
            border-t-slate-700 rounded-full" />
        </div>
      ) : !hayEncuestas ? (
        <Card className="mb-5">
          <p className="text-sm text-slate-400 text-center py-6">
            No hay encuestas registradas aún.
          </p>
        </Card>
      ) : (
        <>
          {/* Stats */}
          {stats?.promedios && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {METRICAS.map(({ label, key }) => {
                const valor = stats.promedios?.[key as keyof typeof stats.promedios] ?? 0;
                return (
                  <Card key={key}>
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {valor.toFixed(1)}
                    </p>
                    <div className="mt-1">
                      <Stars value={valor} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Recomendaciones */}
          {stats?.recomendaciones && (
            <Card className="mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    ¿Recomendarían el sistema?
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {stats.recomendaciones.total} de {stats.total_encuestas} estudiantes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-800">
                    {stats.recomendaciones.porcentaje.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">recomiendan</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${stats.recomendaciones.porcentaje}%`,
                  }}
                />
              </div>
            </Card>
          )}

          {/* Tabla */}
          <Card padding={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Estudiante",
                    "Fecha",
                    "Puntuación",
                    "Recomienda",
                    "Aspectos positivos",
                    "Sugerencias",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-500 px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.results.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">
                        {e.estudiante_nombre}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(e.fecha_respuesta).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">
                          {(e.puntuacion_promedio ?? 0).toFixed(1)}
                        </span>
                        <Stars value={e.puntuacion_promedio ?? 0} />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={e.recomendaria ? "green" : "red"}>
                        {e.recomendaria ? "Sí" : "No"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {e.aspectos_positivos || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {e.sugerencias || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3
                border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200
                      text-slate-600 hover:bg-slate-50 disabled:opacity-40
                      disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200
                      text-slate-600 hover:bg-slate-50 disabled:opacity-40
                      disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}