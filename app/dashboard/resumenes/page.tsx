"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { ResumenPractica, PaginatedResponse } from "@/types";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function formatDuracion(s: number) {
  if (!s) return "0 min";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function BarraPrecision({ valor }: { valor: number }) {
  const color =
    valor >= 80
      ? "bg-green-500"
      : valor >= 60
      ? "bg-amber-400"
      : valor >= 30
      ? "bg-orange-400"
      : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(valor, 100)}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium w-10 text-right ${
          valor >= 80
            ? "text-green-600"
            : valor >= 60
            ? "text-amber-600"
            : valor >= 30
            ? "text-orange-600"
            : "text-red-600"
        }`}
      >
        {(valor ?? 0).toFixed(1)}%
      </span>
    </div>
  );
}

export default function ResumenesPage() {
  const [data, setData] = useState<PaginatedResponse<ResumenPractica> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [recalculando, setRecalculando] = useState<number | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api
      .get("/api/profesor/resumenes/", { params: { page } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function recalcular(id: number) {
    setRecalculando(id);
    try {
      await api.post(`/api/profesor/resumenes/${id}/recalcular/`);
      fetchData();
    } finally {
      setRecalculando(null);
    }
  }

  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <>
      <TopBar
        title="Resúmenes de prácticas"
        subtitle="Se generan automáticamente al finalizar cada práctica"
      />

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300
              border-t-slate-700 rounded-full" />
          </div>
        ) : data?.results.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">
              No hay resúmenes aún. Se generan automáticamente al finalizar prácticas.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Estudiante",
                    "Fecha",
                    "Duración",
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
                {data?.results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-sm">
                        {r.estudiante_nombre}
                      </p>
                      <p className="text-xs text-slate-400">{r.estudiante_codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.fecha_practica).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDuracion(r.tiempo_canalizacion)}
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
                        <div className="flex flex-col gap-0.5">
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
                        </div>
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
                        title="Recalcular con rangos actuales"
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
          </>
        )}
      </Card>
    </>
  );
}