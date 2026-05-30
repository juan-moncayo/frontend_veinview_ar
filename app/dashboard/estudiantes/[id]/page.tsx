"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, RefreshCw, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Estudiante } from "@/types";
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
  tipo: string;
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
    valor >= 80 ? "#22c55e"
    : valor >= 60 ? "#f59e0b"
    : valor >= 30 ? "#f97316"
    : "#ef4444";
  const textColor =
    valor >= 80 ? "#86efac"
    : valor >= 60 ? "#fcd34d"
    : valor >= 30 ? "#fdba74"
    : "#fca5a5";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{
        flex: 1, height: "4px",
        background: "rgba(255,255,255,.1)",
        borderRadius: "2px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: "2px",
          background: color,
          width: `${Math.min(valor, 100)}%`,
          transition: "width .5s ease",
        }}/>
      </div>
      <span style={{
        color: textColor, fontSize: "11px",
        fontWeight: 600, minWidth: "36px", textAlign: "right",
      }}>
        {(valor ?? 0).toFixed(1)}%
      </span>
    </div>
  );
}

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
      const todasPracticas: PracticaEstudiante[] = pracRes.data.results ?? pracRes.data ?? [];
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

  useEffect(() => { fetchData(); }, [id]);

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

  const finalizadas = practicas.filter((p) => p.estado === "finalizada");
  const precisionPromedio =
    resumenes.length > 0
      ? resumenes.reduce((acc, r) => acc + (r.precision_porcentaje ?? 0), 0) / resumenes.length
      : 0;
  const calificacionPromedio =
    resumenes.filter((r) => r.calificacion !== null).length > 0
      ? resumenes.filter((r) => r.calificacion !== null)
          .reduce((acc, r) => acc + (r.calificacion ?? 0), 0) /
        resumenes.filter((r) => r.calificacion !== null).length
      : null;

  const inicial = estudiante.nombre_completo?.charAt(0) ?? "?";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .vv-s1 { animation: fadeUp .4s ease both; }
        .vv-s2 { animation: fadeUp .4s .08s ease both; }
        .vv-s3 { animation: fadeUp .4s .16s ease both; }
        .vv-s4 { animation: fadeUp .4s .24s ease both; }
        .vv-s5 { animation: fadeUp .4s .32s ease both; }

        .vv-practica-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          text-decoration: none;
          transition: background .15s;
          gap: 12px;
        }
        .vv-practica-row:hover { background: rgba(255,255,255,.05); }
        .vv-practica-row:last-child { border-bottom: none; }

        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .vv-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .vv-resumen-detail { display: none; }
        }
      `}</style>

      {/* Header */}
      <div className="vv-s1" style={{
        display: "flex", alignItems: "center",
        gap: "14px", marginBottom: "24px", flexWrap: "wrap",
      }}>
        <Link
          href="/dashboard/estudiantes"
          style={{
            width: "34px", height: "34px",
            borderRadius: "10px",
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.12)",
            display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
            color: "rgba(200,215,255,.7)",
            textDecoration: "none",
            transition: "background .15s",
          }}
        >
          <ArrowLeft size={16}/>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "50%",
            background: "rgba(59,130,246,.2)",
            border: "2px solid rgba(59,130,246,.4)",
            display: "flex", alignItems: "center",
            justifyContent: "center",
            fontSize: "18px", fontWeight: 700,
            color: "#93c5fd", flexShrink: 0,
          }}>
            {inicial}
          </div>
          <div>
            <h1 style={{
              color: "white", fontSize: "18px",
              fontWeight: 700, margin: 0, letterSpacing: "-.4px",
            }}>
              {estudiante.nombre_completo}
            </h1>
            <p style={{
              color: "rgba(180,200,255,.65)",
              fontSize: "12px", margin: "3px 0 0",
            }}>
              {estudiante.codigo_estudiante} · {estudiante.programa} · Sem. {estudiante.semestre}
            </p>
          </div>
        </div>

        <span style={{
          background: estudiante.activo
            ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.06)",
          border: `1px solid ${estudiante.activo
            ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.12)"}`,
          color: estudiante.activo ? "#6ee7b7" : "rgba(200,215,255,.5)",
          fontSize: "11px", padding: "5px 12px",
          borderRadius: "20px", fontWeight: 500,
        }}>
          {estudiante.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Stats */}
      <div className="vv-stats-grid">
        {[
          {
            label: "Prácticas realizadas",
            value: finalizadas.length,
            sub: `${practicas.length} en total`,
            accent: "rgba(59,130,246,.15)",
            border: "rgba(59,130,246,.3)",
          },
          {
            label: "Precisión promedio",
            value: `${precisionPromedio.toFixed(1)}%`,
            sub: "todas las prácticas",
            accent: "rgba(52,211,153,.12)",
            border: "rgba(52,211,153,.28)",
          },
          {
            label: "Calificación prom.",
            value: calificacionPromedio ? `${calificacionPromedio.toFixed(2)} / 5` : "—",
            sub: "escala 0 – 5",
            accent: "rgba(139,92,246,.12)",
            border: "rgba(139,92,246,.28)",
          },
          {
            label: "Correo",
            value: "📧",
            sub: estudiante.correo,
            accent: "rgba(251,191,36,.1)",
            border: "rgba(251,191,36,.25)",
          },
        ].map(({ label, value, sub, accent, border }, i) => (
          <div
            key={label}
            className={`vv-s${i + 2}`}
            style={{
              background: accent,
              border: `1px solid ${border}`,
              borderRadius: "14px", padding: "14px",
            }}
          >
            <p style={{
              color: "rgba(200,215,255,.7)",
              fontSize: "10px", margin: "0 0 8px",
              textTransform: "uppercase", letterSpacing: ".06em",
            }}>
              {label}
            </p>
            <p style={{
              color: "white", fontSize: "18px",
              fontWeight: 700, margin: "0 0 4px",
              letterSpacing: "-.3px",
            }}>
              {value}
            </p>
            <p style={{
              color: "rgba(180,200,255,.6)",
              fontSize: "10px", margin: 0,
              whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="vv-s5" style={{
        display: "flex", gap: "4px",
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: "12px", padding: "4px",
        width: "fit-content", marginBottom: "16px",
      }}>
        {(["practicas", "resumenes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px",
              borderRadius: "9px",
              border: "none",
              background: tab === t ? "rgba(59,130,246,.25)" : "transparent",
              color: tab === t ? "#93c5fd" : "rgba(200,215,255,.6)",
              fontSize: "13px",
              fontWeight: tab === t ? 600 : 400,
              cursor: "pointer",
              transition: "all .15s",
              outline: tab === t ? "1px solid rgba(59,130,246,.35)" : "none",
            }}
          >
            {t === "practicas" ? "Prácticas" : "Resúmenes"}
          </button>
        ))}
      </div>

      {/* Tab prácticas */}
      {tab === "practicas" && (
        <div style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "16px", overflow: "hidden",
        }}>
          {practicas.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{
                color: "rgba(180,200,255,.5)",
                fontSize: "13px", margin: 0,
              }}>
                Este estudiante no tiene prácticas registradas.
              </p>
            </div>
          ) : (
            practicas.map((p) => {
              const estadoColor =
                p.estado === "iniciada"
                  ? { bg: "rgba(52,211,153,.15)", border: "rgba(52,211,153,.3)", text: "#6ee7b7" }
                  : p.estado === "pausada"
                  ? { bg: "rgba(251,191,36,.12)", border: "rgba(251,191,36,.28)", text: "#fcd34d" }
                  : { bg: "rgba(255,255,255,.07)", border: "rgba(255,255,255,.13)", text: "rgba(200,215,255,.6)" };

              return (
                <Link
                  key={p.id}
                  href={`/dashboard/practicas/${p.id}`}
                  className="vv-practica-row"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "8px", marginBottom: "4px", flexWrap: "wrap",
                    }}>
                      <span style={{
                        color: "rgba(180,200,255,.55)",
                        fontSize: "10px", fontFamily: "monospace",
                      }}>
                        #{p.id}
                      </span>
                      <span style={{
                        background: estadoColor.bg,
                        border: `1px solid ${estadoColor.border}`,
                        color: estadoColor.text,
                        fontSize: "10px", padding: "2px 8px",
                        borderRadius: "20px", fontWeight: 500,
                      }}>
                        {p.estado}
                      </span>
                      {p.tipo && (
                        <span style={{
                          background: "rgba(99,102,241,.15)",
                          border: "1px solid rgba(99,102,241,.3)",
                          color: "#a5b4fc",
                          fontSize: "10px", padding: "2px 8px",
                          borderRadius: "20px",
                        }}>
                          {p.tipo}
                        </span>
                      )}
                    </div>
                    <p style={{
                      color: "rgba(180,200,255,.6)",
                      fontSize: "11px", margin: 0,
                    }}>
                      {new Date(p.fecha_inicio).toLocaleDateString("es-CO", {
                        day: "2-digit", month: "short",
                        year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                      {" · "}{formatDuracion(p.tiempo_transcurrido)}
                    </p>
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: "12px", flexShrink: 0,
                  }}>
                    {p.estado === "finalizada" && (
                      <div style={{ width: "80px" }}>
                        <BarraPrecision valor={p.precision_promedio ?? 0}/>
                      </div>
                    )}
                    <ChevronRight size={14} color="rgba(180,200,255,.45)"/>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Tab resúmenes */}
      {tab === "resumenes" && (
        <div style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "16px", overflow: "hidden",
        }}>
          {resumenes.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{
                color: "rgba(180,200,255,.5)",
                fontSize: "13px", margin: 0,
              }}>
                No hay resúmenes generados para este estudiante.
              </p>
            </div>
          ) : (
            resumenes.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "16px",
                  borderBottom: "1px solid rgba(255,255,255,.07)",
                }}
              >
                {/* Fila top */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px", flexWrap: "wrap", gap: "8px",
                }}>
                  <p style={{
                    color: "rgba(180,200,255,.7)",
                    fontSize: "12px", margin: 0,
                  }}>
                    {new Date(r.fecha_practica).toLocaleDateString("es-CO", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                    {" · "}{formatDuracion(r.tiempo_canalizacion)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {r.calificacion !== null && (
                      <span style={{
                        background: r.calificacion >= 3.5
                          ? "rgba(52,211,153,.15)"
                          : r.calificacion >= 2.5
                          ? "rgba(251,191,36,.12)"
                          : "rgba(239,68,68,.12)",
                        border: `1px solid ${r.calificacion >= 3.5
                          ? "rgba(52,211,153,.3)"
                          : r.calificacion >= 2.5
                          ? "rgba(251,191,36,.28)"
                          : "rgba(239,68,68,.28)"}`,
                        color: r.calificacion >= 3.5 ? "#6ee7b7"
                          : r.calificacion >= 2.5 ? "#fcd34d"
                          : "#fca5a5",
                        fontSize: "11px", fontWeight: 600,
                        padding: "4px 10px", borderRadius: "20px",
                      }}>
                        {r.calificacion.toFixed(1)} / 5
                      </span>
                    )}
                    <button
                      onClick={() => recalcular(r.id)}
                      disabled={recalculando === r.id}
                      title="Recalcular"
                      style={{
                        background: "rgba(255,255,255,.07)",
                        border: "1px solid rgba(255,255,255,.12)",
                        borderRadius: "8px", padding: "5px",
                        cursor: "pointer",
                        color: "rgba(200,215,255,.7)",
                        display: "flex", alignItems: "center",
                        opacity: recalculando === r.id ? .4 : 1,
                      }}
                    >
                      <RefreshCw
                        size={12}
                        style={{
                          animation: recalculando === r.id
                            ? "spin .8s linear infinite" : "none",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Precisión */}
                <div style={{ marginBottom: "10px" }}>
                  <BarraPrecision valor={r.precision_porcentaje ?? 0}/>
                </div>

                {/* Criterios */}
                <div style={{
                  display: "flex", gap: "6px",
                  flexWrap: "wrap", marginBottom: "10px",
                }}>
                  {[
                    { label: "Técnica", ok: r.tecnica_correcta },
                    { label: "Ángulo",  ok: r.angulo_adecuado },
                    { label: "Presión", ok: r.presion_controlada },
                  ].map(({ label, ok }) => (
                    <span key={label} style={{
                      background: ok ? "rgba(52,211,153,.12)" : "rgba(239,68,68,.1)",
                      border: `1px solid ${ok ? "rgba(52,211,153,.28)" : "rgba(239,68,68,.22)"}`,
                      color: ok ? "#6ee7b7" : "#fca5a5",
                      fontSize: "11px", padding: "3px 10px",
                      borderRadius: "20px", fontWeight: 500,
                    }}>
                      {ok ? "✓" : "✗"} {label}
                    </span>
                  ))}
                </div>

                {/* Métricas detalle */}
                <div
                  className="vv-resumen-detail"
                  style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
                >
                  {[
                    {
                      label: "Intentos",
                      value: `${r.numero_intentos}${r.intentos_exitosos > 0 ? ` (${r.intentos_exitosos} ✓)` : ""}`,
                    },
                    {
                      label: "Ángulo prom.",
                      value: r.inclinacion_promedio !== null
                        ? `${r.inclinacion_promedio?.toFixed(1)}°` : "—",
                    },
                    {
                      label: "Fuerza prom.",
                      value: r.fuerza_promedio !== null
                        ? `${r.fuerza_promedio?.toFixed(0)} g` : "—",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{
                        color: "rgba(200,215,255,.6)",
                        fontSize: "10px", margin: "0 0 2px",
                        textTransform: "uppercase", letterSpacing: ".06em",
                      }}>
                        {label}
                      </p>
                      <p style={{
                        color: "white",
                        fontSize: "13px", fontWeight: 600, margin: 0,
                      }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}