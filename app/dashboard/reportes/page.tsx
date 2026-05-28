"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Filter } from "lucide-react";
import api from "@/lib/api";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ReporteGuardado {
  id: number;
  titulo: string;
  periodo: string;
  total_estudiantes: number;
  total_practicas: number;
  promedio_precision: number;
  promedio_calificacion: number;
  fecha_generacion: string;
}

interface MejorEstudiante {
  nombre: string;
  codigo: string;
  precision: number;
  total_practicas: number;
}

interface PracticaPorMes {
  mes: string;
  total: number;
  precision_promedio: number;
}

interface ReporteGeneral {
  total_practicas: number;
  total_estudiantes: number;
  promedio_precision: number;
  promedio_calificacion: number;
  practicas_por_estado: {
    iniciada: number;
    pausada: number;
    finalizada: number;
  };
  mejores_estudiantes: MejorEstudiante[];
  practicas_por_mes: PracticaPorMes[];
}

interface ResumenRaw {
  estudiante_nombre: string;
  estudiante_codigo: string;
  precision_porcentaje: number;
  calificacion: number | null;
  fecha_practica: string;
}

interface PracticaRaw {
  estado: string;
}

function MetricaBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteGeneral | null>(null);
  const [reportesGuardados, setReportesGuardados] = useState<ReporteGuardado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [filtro, setFiltro] = useState({ desde: "", hasta: "" });

  const fetchReporteGeneral = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, practicasRes, resumenesRes, repsRes] = await Promise.all([
        api.get("/api/profesor/dashboard/"),
        api.get("/api/placa/practicas/", { params: { page_size: 200 } }),
        api.get("/api/profesor/resumenes/", { params: { page_size: 200 } }),
        api.get("/api/profesor/reportes/"),
      ]);

      const todasPracticas: PracticaRaw[] = practicasRes.data.results ?? [];
      const todosResumenes: ResumenRaw[] = resumenesRes.data.results ?? [];

      const finalizadas = todasPracticas.filter((p) => p.estado === "finalizada");

      const precisionTotal =
        todosResumenes.length > 0
          ? todosResumenes.reduce((acc, r) => acc + (r.precision_porcentaje ?? 0), 0) /
            todosResumenes.length
          : 0;

      const resumenesConCal = todosResumenes.filter((r) => r.calificacion !== null);
      const calificacionTotal =
        resumenesConCal.length > 0
          ? resumenesConCal.reduce((acc, r) => acc + (r.calificacion ?? 0), 0) /
            resumenesConCal.length
          : 0;

      // Agrupar por estudiante
      type EstudianteAcum = {
        nombre: string;
        codigo: string;
        precisiones: number[];
        total: number;
      };

      const porEstudiante: Record<string, EstudianteAcum> = {};
      todosResumenes.forEach((r) => {
        const key = r.estudiante_codigo;
        if (!porEstudiante[key]) {
          porEstudiante[key] = {
            nombre: r.estudiante_nombre,
            codigo: r.estudiante_codigo,
            precisiones: [],
            total: 0,
          };
        }
        porEstudiante[key].precisiones.push(r.precision_porcentaje ?? 0);
        porEstudiante[key].total++;
      });

      const mejores: MejorEstudiante[] = Object.values(porEstudiante)
        .map((e) => ({
          nombre: e.nombre,
          codigo: e.codigo,
          precision: e.precisiones.reduce((a, b) => a + b, 0) / e.precisiones.length,
          total_practicas: e.total,
        }))
        .sort((a, b) => b.precision - a.precision)
        .slice(0, 5);

      // Agrupar por mes
      type MesAcum = { total: number; precisiones: number[] };
      const porMes: Record<string, MesAcum> = {};
      todosResumenes.forEach((r) => {
        const fecha = new Date(r.fecha_practica);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
        if (!porMes[key]) porMes[key] = { total: 0, precisiones: [] };
        porMes[key].total++;
        porMes[key].precisiones.push(r.precision_porcentaje ?? 0);
      });

      const practicasPorMes: PracticaPorMes[] = Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, datos]) => ({
          mes,
          total: datos.total,
          precision_promedio:
            datos.precisiones.reduce((a, b) => a + b, 0) / datos.precisiones.length,
        }));

      setReporte({
        total_practicas: finalizadas.length,
        total_estudiantes: dashRes.data.total_estudiantes_activos,
        promedio_precision: precisionTotal,
        promedio_calificacion: calificacionTotal,
        practicas_por_estado: {
          iniciada: todasPracticas.filter((p) => p.estado === "iniciada").length,
          pausada: todasPracticas.filter((p) => p.estado === "pausada").length,
          finalizada: finalizadas.length,
        },
        mejores_estudiantes: mejores,
        practicas_por_mes: practicasPorMes,
      });

      setReportesGuardados(repsRes.data.results ?? repsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReporteGeneral();
  }, [fetchReporteGeneral]);

  async function generarReportePeriodo() {
    if (!filtro.desde || !filtro.hasta) return;
    setGenerando(true);
    try {
      await api.post("/api/profesor/reportes/", {
        titulo: `Reporte ${filtro.desde} — ${filtro.hasta}`,
        fecha_inicio: new Date(filtro.desde).toISOString(),
        fecha_fin: new Date(filtro.hasta + "T23:59:59").toISOString(),
      });
      setMostrarFiltro(false);
      setFiltro({ desde: "", hasta: "" });
      fetchReporteGeneral();
    } finally {
      setGenerando(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300
          border-t-slate-700 rounded-full" />
      </div>
    );

  return (
    <>
      <TopBar
        title="Reportes"
        subtitle="Estadísticas generales de todas las prácticas"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<RefreshCw size={14} />}
              onClick={fetchReporteGeneral}
            >
              Actualizar
            </Button>
            <Button
              variant="secondary"
              icon={<Filter size={14} />}
              onClick={() => setMostrarFiltro((v) => !v)}
            >
              Filtrar período
            </Button>
          </div>
        }
      />

      {/* Filtro colapsable */}
      {mostrarFiltro && (
        <Card className="mb-5">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Guardar reporte por período específico
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Desde</label>
              <input
                type="date"
                value={filtro.desde}
                onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white text-sm
                  text-slate-900 px-3 py-2 focus:outline-none focus:ring-2
                  focus:ring-slate-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Hasta</label>
              <input
                type="date"
                value={filtro.hasta}
                onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white text-sm
                  text-slate-900 px-3 py-2 focus:outline-none focus:ring-2
                  focus:ring-slate-300"
              />
            </div>
            <Button
              loading={generando}
              disabled={!filtro.desde || !filtro.hasta}
              onClick={generarReportePeriodo}
            >
              Guardar reporte
            </Button>
          </div>
        </Card>
      )}

      {reporte && (
        <>
          {/* Métricas generales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricaBox label="Prácticas finalizadas" value={reporte.total_practicas} />
            <MetricaBox label="Estudiantes activos" value={reporte.total_estudiantes} />
            <MetricaBox
              label="Precisión promedio"
              value={`${reporte.promedio_precision.toFixed(1)}%`}
              sub="de todas las prácticas"
            />
            <MetricaBox
              label="Calificación promedio"
              value={
                reporte.promedio_calificacion > 0
                  ? `${reporte.promedio_calificacion.toFixed(2)} / 5`
                  : "—"
              }
              sub="escala 0 – 5"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Mejores estudiantes */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Estudiantes con mejor desempeño
              </h3>
              {reporte.mejores_estudiantes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos aún</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {reporte.mejores_estudiantes.map((e, i) => (
                    <div
                      key={e.codigo}
                      className="flex items-center justify-between py-2
                        border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center
                            justify-center text-xs font-semibold shrink-0
                            ${i === 0 ? "bg-amber-100 text-amber-700"
                              : i === 1 ? "bg-slate-200 text-slate-600"
                              : i === 2 ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-500"}`}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{e.nombre}</p>
                          <p className="text-xs text-slate-400">
                            {e.codigo} · {e.total_practicas} práctica
                            {e.total_practicas !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          e.precision >= 80 ? "text-green-600"
                          : e.precision >= 60 ? "text-amber-600"
                          : "text-red-500"
                        }`}
                      >
                        {e.precision.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Actividad por mes */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Actividad por mes
              </h3>
              {reporte.practicas_por_mes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos aún</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {reporte.practicas_por_mes.map((m) => {
                    const [anio, mes] = m.mes.split("-");
                    const nombreMes = new Date(
                      parseInt(anio),
                      parseInt(mes) - 1
                    ).toLocaleDateString("es-CO", {
                      month: "long",
                      year: "numeric",
                    });
                    const maxTotal = Math.max(
                      ...reporte.practicas_por_mes.map((x) => x.total)
                    );
                    return (
                      <div key={m.mes} className="flex items-center gap-3">
                        <p className="text-xs text-slate-500 w-28 shrink-0 capitalize">
                          {nombreMes}
                        </p>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-700 rounded-full transition-all"
                            style={{ width: `${(m.total / maxTotal) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium text-slate-700">
                            {m.total}
                          </span>
                          <span
                            className={`text-xs ${
                              m.precision_promedio >= 80 ? "text-green-600"
                              : m.precision_promedio >= 60 ? "text-amber-600"
                              : "text-red-500"
                            }`}
                          >
                            {m.precision_promedio.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Estado de prácticas */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Estado general de prácticas
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Finalizadas",
                  value: reporte.practicas_por_estado.finalizada,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "En curso",
                  value: reporte.practicas_por_estado.iniciada,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Pausadas",
                  value: reporte.practicas_por_estado.pausada,
                  color: "text-slate-600",
                  bg: "bg-slate-100",
                },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl px-4 py-3`}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`text-2xl font-semibold mt-0.5 ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Reportes guardados */}
          {reportesGuardados.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Reportes guardados por período
              </h3>
              <div className="flex flex-col gap-3">
                {reportesGuardados.map((r) => (
                  <Card key={r.id}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.titulo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.periodo}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{r.total_practicas} prácticas</span>
                        <span>{r.total_estudiantes} estudiantes</span>
                        <span>
                          {r.promedio_precision > 0
                            ? `${r.promedio_precision.toFixed(1)}% precisión`
                            : "sin datos"}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}