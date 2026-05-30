"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Filter, Trophy, Calendar, BarChart2 } from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";

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

const inputDateStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontSize: "13px",
  outline: "none",
  colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(200,215,255,.7)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  display: "block",
  marginBottom: "5px",
};

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

      type EstudianteAcum = {
        nombre: string; codigo: string;
        precisiones: number[]; total: number;
      };
      const porEstudiante: Record<string, EstudianteAcum> = {};
      todosResumenes.forEach((r) => {
        const key = r.estudiante_codigo;
        if (!porEstudiante[key]) {
          porEstudiante[key] = {
            nombre: r.estudiante_nombre, codigo: r.estudiante_codigo,
            precisiones: [], total: 0,
          };
        }
        porEstudiante[key].precisiones.push(r.precision_porcentaje ?? 0);
        porEstudiante[key].total++;
      });

      const mejores: MejorEstudiante[] = Object.values(porEstudiante)
        .map((e) => ({
          nombre: e.nombre, codigo: e.codigo,
          precision: e.precisiones.reduce((a, b) => a + b, 0) / e.precisiones.length,
          total_practicas: e.total,
        }))
        .sort((a, b) => b.precision - a.precision)
        .slice(0, 5);

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
          mes, total: datos.total,
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

  useEffect(() => { fetchReporteGeneral(); }, [fetchReporteGeneral]);

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
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "center", height: "60vh",
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: "26px", height: "26px",
          border: "2px solid rgba(255,255,255,.1)",
          borderTopColor: "#3b82f6", borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }}/>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .vv-s1 { animation: fadeUp .4s ease both; }
        .vv-s2 { animation: fadeUp .4s .08s ease both; }
        .vv-s3 { animation: fadeUp .4s .16s ease both; }
        .vv-s4 { animation: fadeUp .4s .24s ease both; }
        .vv-s5 { animation: fadeUp .4s .32s ease both; }
        .vv-s6 { animation: fadeUp .4s .40s ease both; }

        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .vv-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        .vv-estado-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
        }

        @media (max-width: 768px) {
          .vv-stats-grid  { grid-template-columns: repeat(2,1fr); gap:10px; }
          .vv-cards-grid  { grid-template-columns: 1fr; }
          .vv-estado-grid { grid-template-columns: repeat(3,1fr); gap:8px; }
          .vv-header-actions { flex-wrap: wrap; }
          .vv-filtro-row { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>

      {/* Header */}
      <div className="vv-s1" style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "24px", gap: "12px", flexWrap: "wrap",
      }}>
        <div>
          <p style={{
            color: "rgba(180,200,255,.65)",
            fontSize: "11px", margin: "0 0 2px",
            letterSpacing: ".05em", textTransform: "uppercase",
          }}>
            Análisis
          </p>
          <h1 style={{
            color: "white", fontSize: "20px",
            fontWeight: 700, margin: 0, letterSpacing: "-.4px",
          }}>
            Reportes
          </h1>
          <p style={{
            color: "rgba(180,200,255,.6)",
            fontSize: "12px", margin: "3px 0 0",
          }}>
            Estadísticas generales de todas las prácticas
          </p>
        </div>
        <div className="vv-header-actions" style={{ display: "flex", gap: "8px" }}>
          <Button variant="secondary" icon={<RefreshCw size={13}/>}
            onClick={fetchReporteGeneral}>
            Actualizar
          </Button>
          <Button variant="secondary" icon={<Filter size={13}/>}
            onClick={() => setMostrarFiltro((v) => !v)}>
            Período
          </Button>
        </div>
      </div>

      {/* Filtro colapsable */}
      {mostrarFiltro && (
        <div className="vv-s1" style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "16px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <p style={{
            color: "white",
            fontSize: "13px", fontWeight: 500, margin: "0 0 14px",
          }}>
            Guardar reporte por período
          </p>
          <div
            className="vv-filtro-row"
            style={{
              display: "flex", alignItems: "flex-end",
              gap: "12px", flexWrap: "wrap",
            }}
          >
            <div>
              <label style={labelStyle}>Desde</label>
              <input
                type="date"
                value={filtro.desde}
                onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })}
                style={inputDateStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Hasta</label>
              <input
                type="date"
                value={filtro.hasta}
                onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })}
                style={inputDateStyle}
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
        </div>
      )}

      {reporte && (
        <>
          {/* Stats */}
          <div className="vv-stats-grid vv-s2">
            {[
              {
                label: "Prácticas finalizadas",
                value: reporte.total_practicas,
                accent: "rgba(52,211,153,.15)",
                border: "rgba(52,211,153,.3)",
              },
              {
                label: "Estudiantes activos",
                value: reporte.total_estudiantes,
                accent: "rgba(59,130,246,.15)",
                border: "rgba(59,130,246,.3)",
              },
              {
                label: "Precisión promedio",
                value: `${reporte.promedio_precision.toFixed(1)}%`,
                accent: "rgba(139,92,246,.12)",
                border: "rgba(139,92,246,.28)",
              },
              {
                label: "Calificación prom.",
                value: reporte.promedio_calificacion > 0
                  ? `${reporte.promedio_calificacion.toFixed(2)} / 5` : "—",
                accent: "rgba(251,191,36,.12)",
                border: "rgba(251,191,36,.28)",
              },
            ].map(({ label, value, accent, border }) => (
              <div key={label} style={{
                background: accent,
                border: `1px solid ${border}`,
                borderRadius: "14px", padding: "16px",
              }}>
                <p style={{
                  color: "rgba(200,215,255,.7)",
                  fontSize: "10px", margin: "0 0 10px",
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>
                  {label}
                </p>
                <p style={{
                  color: "white", fontSize: "24px",
                  fontWeight: 700, margin: 0, letterSpacing: "-.5px",
                }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Cards grid */}
          <div className="vv-cards-grid">

            {/* Mejores estudiantes */}
            <div className="vv-s3" style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "16px", padding: "18px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: "8px", marginBottom: "16px",
              }}>
                <Trophy size={14} color="#fcd34d"/>
                <h3 style={{
                  color: "white",
                  fontSize: "13px", fontWeight: 500, margin: 0,
                }}>
                  Mejor desempeño
                </h3>
              </div>

              {reporte.mejores_estudiantes.length === 0 ? (
                <p style={{
                  color: "rgba(180,200,255,.45)",
                  fontSize: "13px", textAlign: "center",
                  padding: "20px 0", margin: 0,
                }}>
                  Sin datos aún
                </p>
              ) : (
                reporte.mejores_estudiantes.map((e, i) => {
                  const medalColor =
                    i === 0
                      ? { bg: "rgba(251,191,36,.18)", border: "rgba(251,191,36,.35)", text: "#fcd34d" }
                      : i === 1
                      ? { bg: "rgba(200,215,255,.1)", border: "rgba(200,215,255,.2)", text: "rgba(200,215,255,.85)" }
                      : i === 2
                      ? { bg: "rgba(251,146,60,.15)", border: "rgba(251,146,60,.28)", text: "#fdba74" }
                      : { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.1)", text: "rgba(200,215,255,.6)" };

                  const precColor =
                    e.precision >= 80 ? "#6ee7b7"
                    : e.precision >= 60 ? "#fcd34d"
                    : "#fca5a5";

                  return (
                    <div key={e.codigo} style={{
                      display: "flex", alignItems: "center",
                      gap: "10px", padding: "9px 0",
                      borderBottom: i < reporte.mejores_estudiantes.length - 1
                        ? "1px solid rgba(255,255,255,.07)" : "none",
                    }}>
                      <div style={{
                        width: "24px", height: "24px",
                        borderRadius: "50%",
                        background: medalColor.bg,
                        border: `1px solid ${medalColor.border}`,
                        display: "flex", alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px", fontWeight: 700,
                        color: medalColor.text, flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          color: "white",
                          fontSize: "13px", fontWeight: 500,
                          margin: 0, whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {e.nombre}
                        </p>
                        <p style={{
                          color: "rgba(180,200,255,.6)",
                          fontSize: "10px", margin: "2px 0 0",
                        }}>
                          {e.codigo} · {e.total_practicas} práctica
                          {e.total_practicas !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span style={{
                        color: precColor,
                        fontSize: "13px", fontWeight: 700, flexShrink: 0,
                      }}>
                        {e.precision.toFixed(1)}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actividad por mes */}
            <div className="vv-s4" style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "16px", padding: "18px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: "8px", marginBottom: "16px",
              }}>
                <Calendar size={14} color="#93c5fd"/>
                <h3 style={{
                  color: "white",
                  fontSize: "13px", fontWeight: 500, margin: 0,
                }}>
                  Actividad por mes
                </h3>
              </div>

              {reporte.practicas_por_mes.length === 0 ? (
                <p style={{
                  color: "rgba(180,200,255,.45)",
                  fontSize: "13px", textAlign: "center",
                  padding: "20px 0", margin: 0,
                }}>
                  Sin datos aún
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {reporte.practicas_por_mes.map((m) => {
                    const [anio, mes] = m.mes.split("-");
                    const nombreMes = new Date(
                      parseInt(anio), parseInt(mes) - 1
                    ).toLocaleDateString("es-CO", {
                      month: "long", year: "numeric",
                    });
                    const maxTotal = Math.max(
                      ...reporte.practicas_por_mes.map((x) => x.total)
                    );
                    const precColor =
                      m.precision_promedio >= 80 ? "#6ee7b7"
                      : m.precision_promedio >= 60 ? "#fcd34d"
                      : "#fca5a5";

                    return (
                      <div key={m.mes} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                      }}>
                        <p style={{
                          color: "rgba(180,200,255,.7)",
                          fontSize: "11px", margin: 0,
                          width: "90px", flexShrink: 0,
                          textTransform: "capitalize",
                          whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {nombreMes}
                        </p>
                        <div style={{
                          flex: 1, height: "4px",
                          background: "rgba(255,255,255,.1)",
                          borderRadius: "2px", overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: "2px",
                            background: "rgba(59,130,246,.7)",
                            width: `${(m.total / maxTotal) * 100}%`,
                            transition: "width .5s ease",
                          }}/>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center",
                          gap: "6px", flexShrink: 0,
                        }}>
                          <span style={{
                            color: "white",
                            fontSize: "12px", fontWeight: 600,
                          }}>
                            {m.total}
                          </span>
                          <span style={{ color: precColor, fontSize: "11px", fontWeight: 500 }}>
                            {m.precision_promedio.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Estado prácticas */}
          <div className="vv-s5" style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "16px",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              gap: "8px", marginBottom: "14px",
            }}>
              <BarChart2 size={14} color="rgba(180,200,255,.6)"/>
              <h3 style={{
                color: "white",
                fontSize: "13px", fontWeight: 500, margin: 0,
              }}>
                Estado general de prácticas
              </h3>
            </div>
            <div className="vv-estado-grid">
              {[
                {
                  label: "Finalizadas",
                  value: reporte.practicas_por_estado.finalizada,
                  accent: "rgba(52,211,153,.15)",
                  border: "rgba(52,211,153,.3)",
                  color: "#6ee7b7",
                },
                {
                  label: "En curso",
                  value: reporte.practicas_por_estado.iniciada,
                  accent: "rgba(251,191,36,.12)",
                  border: "rgba(251,191,36,.28)",
                  color: "#fcd34d",
                },
                {
                  label: "Pausadas",
                  value: reporte.practicas_por_estado.pausada,
                  accent: "rgba(255,255,255,.06)",
                  border: "rgba(255,255,255,.12)",
                  color: "rgba(200,215,255,.7)",
                },
              ].map(({ label, value, accent, border, color }) => (
                <div key={label} style={{
                  background: accent,
                  border: `1px solid ${border}`,
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                }}>
                  <p style={{
                    color: "rgba(200,215,255,.7)",
                    fontSize: "10px", margin: "0 0 6px",
                    textTransform: "uppercase", letterSpacing: ".06em",
                  }}>
                    {label}
                  </p>
                  <p style={{
                    color, fontSize: "28px",
                    fontWeight: 700, margin: 0, letterSpacing: "-1px",
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reportes guardados */}
          {reportesGuardados.length > 0 && (
            <div className="vv-s6">
              <p style={{
                color: "white",
                fontSize: "13px", fontWeight: 500, margin: "0 0 12px",
              }}>
                Reportes guardados por período
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {reportesGuardados.map((r) => (
                  <div key={r.id} style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap", gap: "10px",
                  }}>
                    <div>
                      <p style={{
                        color: "white",
                        fontSize: "13px", fontWeight: 500, margin: 0,
                      }}>
                        {r.titulo}
                      </p>
                      <p style={{
                        color: "rgba(180,200,255,.65)",
                        fontSize: "11px", margin: "3px 0 0",
                      }}>
                        {r.periodo}
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "8px", flexWrap: "wrap",
                    }}>
                      {[
                        `${r.total_practicas} prácticas`,
                        `${r.total_estudiantes} estudiantes`,
                        r.promedio_precision > 0
                          ? `${r.promedio_precision.toFixed(1)}% precisión`
                          : "sin datos",
                      ].map((txt) => (
                        <span key={txt} style={{
                          background: "rgba(255,255,255,.07)",
                          border: "1px solid rgba(255,255,255,.12)",
                          borderRadius: "20px",
                          padding: "3px 10px",
                          color: "rgba(200,215,255,.75)",
                          fontSize: "11px",
                        }}>
                          {txt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}