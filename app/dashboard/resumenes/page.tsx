"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Award, TrendingUp, Target, Clock } from "lucide-react";
import api from "@/lib/api";
import { ResumenPractica, PaginatedResponse } from "@/types";

function formatDuracion(s: number) {
  if (!s) return "0 min";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function CirculoPrecision({ valor }: { valor: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(valor, 100) / 100;
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
    <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none"
          stroke="rgba(255,255,255,.12)" strokeWidth="5"/>
        <circle cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          color: textColor, fontSize: "13px",
          fontWeight: 700, lineHeight: 1,
        }}>
          {valor.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function BarraDetalle({
  label, valor, max, color, unit, rango,
}: {
  label: string;
  valor: number | null;
  max: number;
  color: string;
  unit: string;
  rango?: string;
}) {
  if (valor === null) return null;
  const pct = Math.min(Math.abs(valor) / max, 1) * 100;

  return (
    <div style={{
      background: "rgba(255,255,255,.06)",
      border: "1px solid rgba(255,255,255,.1)",
      borderRadius: "12px",
      padding: "12px 14px",
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "8px",
      }}>
        <p style={{
          color: "rgba(200,215,255,.7)",
          fontSize: "11px", margin: 0,
          textTransform: "uppercase", letterSpacing: ".06em",
        }}>
          {label}
        </p>
        <span style={{
          color: "white",
          fontSize: "15px", fontWeight: 700,
        }}>
          {valor % 1 === 0 ? valor.toFixed(0) : valor.toFixed(1)}{unit}
        </span>
      </div>
      <div style={{
        height: "6px",
        background: "rgba(255,255,255,.1)",
        borderRadius: "3px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: "3px",
          background: color,
          width: `${pct}%`,
          transition: "width .6s ease",
        }}/>
      </div>
      {rango && (
        <p style={{
          color: "rgba(180,200,255,.45)",
          fontSize: "10px", margin: "5px 0 0",
        }}>
          Óptimo: {rango}
        </p>
      )}
    </div>
  );
}

function ResumenCard({
  r,
  recalculando,
  onRecalcular,
}: {
  r: ResumenPractica;
  recalculando: number | null;
  onRecalcular: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const calColor =
    r.calificacion !== null
      ? r.calificacion >= 3.5 ? "#6ee7b7"
        : r.calificacion >= 2.5 ? "#fcd34d"
        : "#fca5a5"
      : "rgba(200,215,255,.5)";

  const calBg =
    r.calificacion !== null
      ? r.calificacion >= 3.5 ? "rgba(52,211,153,.15)"
        : r.calificacion >= 2.5 ? "rgba(251,191,36,.12)"
        : "rgba(239,68,68,.12)"
      : "rgba(255,255,255,.06)";

  const calBorder =
    r.calificacion !== null
      ? r.calificacion >= 3.5 ? "rgba(52,211,153,.3)"
        : r.calificacion >= 2.5 ? "rgba(251,191,36,.25)"
        : "rgba(239,68,68,.25)"
      : "rgba(255,255,255,.12)";

  return (
    <div style={{
      background: "rgba(255,255,255,.06)",
      border: `1px solid ${expanded
        ? "rgba(99,130,246,.35)" : "rgba(255,255,255,.1)"}`,
      borderRadius: "18px",
      marginBottom: "10px",
      overflow: "hidden",
      transition: "border-color .2s",
    }}>

      {/* ── Cabecera ── */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          padding: "16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <CirculoPrecision valor={r.precision_porcentaje ?? 0}/>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center",
            gap: "8px", marginBottom: "4px", flexWrap: "wrap",
          }}>
            <p style={{
              color: "white",
              fontSize: "14px", fontWeight: 600, margin: 0,
            }}>
              {r.estudiante_nombre}
            </p>
            <span style={{
              color: "rgba(180,200,255,.6)",
              fontSize: "10px", fontFamily: "monospace",
            }}>
              {r.estudiante_codigo}
            </span>
          </div>

          <p style={{
            color: "rgba(180,200,255,.65)",
            fontSize: "11px", margin: "0 0 8px",
          }}>
            {new Date(r.fecha_practica).toLocaleDateString("es-CO", {
              weekday: "short", day: "2-digit",
              month: "short", year: "numeric",
            })}
            {" · "}{formatDuracion(r.tiempo_canalizacion)}
          </p>

          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {[
              { label: "Técnica",  ok: r.tecnica_correcta },
              { label: "Ángulo",   ok: r.angulo_adecuado },
              { label: "Presión",  ok: r.presion_controlada },
            ].map(({ label, ok }) => (
              <span key={label} style={{
                background: ok
                  ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.12)",
                border: `1px solid ${ok
                  ? "rgba(52,211,153,.3)" : "rgba(239,68,68,.25)"}`,
                color: ok ? "#6ee7b7" : "#fca5a5",
                fontSize: "11px", padding: "3px 9px",
                borderRadius: "20px",
                display: "flex", alignItems: "center", gap: "4px",
                fontWeight: 500,
              }}>
                {ok ? "✓" : "✗"} {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "8px", flexShrink: 0,
        }}>
          <div style={{
            background: calBg,
            border: `1px solid ${calBorder}`,
            borderRadius: "12px",
            padding: "8px 12px",
            textAlign: "center",
            minWidth: "54px",
          }}>
            <p style={{
              color: "rgba(200,215,255,.6)",
              fontSize: "9px", margin: "0 0 2px",
              textTransform: "uppercase", letterSpacing: ".08em",
            }}>
              Cal.
            </p>
            <p style={{
              color: calColor,
              fontSize: "17px", fontWeight: 700,
              margin: 0, letterSpacing: "-.5px",
            }}>
              {r.calificacion !== null ? r.calificacion.toFixed(1) : "—"}
            </p>
          </div>
          {expanded
            ? <ChevronUp size={14} color="rgba(180,200,255,.5)"/>
            : <ChevronDown size={14} color="rgba(180,200,255,.5)"/>
          }
        </div>
      </div>

      {/* ── Detalle expandido ── */}
      {expanded && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,.08)",
          padding: "16px",
          background: "rgba(0,0,0,.15)",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>

          {/* Duración + Intentos */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}>
            <div style={{
              background: "rgba(59,130,246,.12)",
              border: "1px solid rgba(59,130,246,.25)",
              borderRadius: "12px", padding: "12px 14px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: "6px", marginBottom: "6px",
              }}>
                <Clock size={13} color="#93c5fd"/>
                <p style={{
                  color: "rgba(147,197,253,.8)",
                  fontSize: "10px", margin: 0,
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>
                  Duración
                </p>
              </div>
              <p style={{
                color: "white",
                fontSize: "17px", fontWeight: 700, margin: 0,
              }}>
                {formatDuracion(r.tiempo_canalizacion)}
              </p>
            </div>

            <div style={{
              background: "rgba(52,211,153,.12)",
              border: "1px solid rgba(52,211,153,.25)",
              borderRadius: "12px", padding: "12px 14px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                gap: "6px", marginBottom: "6px",
              }}>
                <RefreshCw size={13} color="#6ee7b7"/>
                <p style={{
                  color: "rgba(110,231,183,.8)",
                  fontSize: "10px", margin: 0,
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>
                  Intentos
                </p>
              </div>
              <p style={{
                color: "white",
                fontSize: "17px", fontWeight: 700, margin: 0,
              }}>
                {r.numero_intentos}
                {r.intentos_exitosos > 0 && (
                  <span style={{
                    color: "#6ee7b7", fontSize: "12px",
                    fontWeight: 500, marginLeft: "6px",
                  }}>
                    ({r.intentos_exitosos} ✓)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Barra ángulo */}
          <BarraDetalle
            label="Ángulo promedio"
            valor={r.inclinacion_promedio ?? null}
            max={45}
            color="#3b82f6"
            unit="°"
            rango="−30° a −8°"
          />

          {/* Barra fuerza */}
          <BarraDetalle
            label="Fuerza promedio"
            valor={r.fuerza_promedio ?? null}
            max={400}
            color="#8b5cf6"
            unit=" g"
            rango="50 – 300 g"
          />

          {/* Barra precisión */}
          <div style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: "12px",
            padding: "12px 14px",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: "8px",
            }}>
              <p style={{
                color: "rgba(200,215,255,.7)",
                fontSize: "11px", margin: 0,
                textTransform: "uppercase", letterSpacing: ".06em",
              }}>
                Precisión general
              </p>
              <span style={{
                color: r.precision_porcentaje >= 80 ? "#86efac"
                  : r.precision_porcentaje >= 60 ? "#fcd34d"
                  : "#fca5a5",
                fontSize: "15px", fontWeight: 700,
              }}>
                {(r.precision_porcentaje ?? 0).toFixed(1)}%
              </span>
            </div>
            <div style={{
              height: "7px",
              background: "rgba(255,255,255,.1)",
              borderRadius: "4px", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: "4px",
                background: r.precision_porcentaje >= 80 ? "#22c55e"
                  : r.precision_porcentaje >= 60 ? "#f59e0b"
                  : "#ef4444",
                width: `${Math.min(r.precision_porcentaje ?? 0, 100)}%`,
                transition: "width .6s ease",
              }}/>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginTop: "5px",
            }}>
              {[
                { v: "0%",  color: "rgba(200,215,255,.4)" },
                { v: "60%", color: "#fcd34d" },
                { v: "80%", color: "#86efac" },
                { v: "100%",color: "rgba(200,215,255,.4)" },
              ].map(({ v, color }) => (
                <span key={v} style={{ color, fontSize: "10px", fontWeight: 500 }}>
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Botón recalcular */}
          <button
            onClick={(e) => { e.stopPropagation(); onRecalcular(r.id); }}
            disabled={recalculando === r.id}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              alignSelf: "flex-start",
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "10px", padding: "8px 16px",
              color: "rgba(200,215,255,.8)", fontSize: "12px",
              cursor: recalculando === r.id ? "not-allowed" : "pointer",
              opacity: recalculando === r.id ? .4 : 1,
              transition: "background .15s",
              fontWeight: 500,
            }}
          >
            <RefreshCw
              size={12}
              style={{
                animation: recalculando === r.id
                  ? "spin .8s linear infinite" : "none",
              }}
            />
            Recalcular con rangos actuales
          </button>
        </div>
      )}
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

  useEffect(() => { fetchData(); }, [fetchData]);

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
  const resumenes = data?.results ?? [];

  const precisionProm = resumenes.length > 0
    ? resumenes.reduce((a, r) => a + (r.precision_porcentaje ?? 0), 0) /
      resumenes.length
    : 0;
  const calProm =
    resumenes.filter((r) => r.calificacion !== null).length > 0
      ? resumenes
          .filter((r) => r.calificacion !== null)
          .reduce((a, r) => a + (r.calificacion ?? 0), 0) /
        resumenes.filter((r) => r.calificacion !== null).length
      : 0;
  const correctas = resumenes.filter((r) => r.tecnica_correcta).length;

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
        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .vv-page-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.07);
          color: rgba(200,215,255,.75);
          font-size: 12px;
          cursor: pointer;
          transition: background .15s;
        }
        .vv-page-btn:hover:not(:disabled) { background: rgba(255,255,255,.12); }
        .vv-page-btn:disabled { opacity:.3; cursor:not-allowed; }
        @media (max-width: 640px) {
          .vv-stats-grid { grid-template-columns: repeat(2,1fr); gap:10px; }
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
            Evaluaciones
          </p>
          <h1 style={{
            color: "white", fontSize: "20px",
            fontWeight: 700, margin: 0, letterSpacing: "-.4px",
          }}>
            Resúmenes
          </h1>
          <p style={{
            color: "rgba(180,200,255,.6)",
            fontSize: "12px", margin: "3px 0 0",
          }}>
            Toca cada tarjeta para ver el detalle completo
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: "10px", padding: "8px 14px",
            color: "rgba(200,215,255,.8)", fontSize: "12px",
            cursor: "pointer", fontWeight: 500,
          }}
        >
          <RefreshCw size={13}/>
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", height: "40vh",
        }}>
          <div style={{
            width: "26px", height: "26px",
            border: "2px solid rgba(255,255,255,.1)",
            borderTopColor: "#3b82f6", borderRadius: "50%",
            animation: "spin .8s linear infinite",
          }}/>
        </div>
      ) : resumenes.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "16px", padding: "48px", textAlign: "center",
        }}>
          <p style={{ color: "rgba(180,200,255,.55)", fontSize: "13px", margin: 0 }}>
            No hay resúmenes aún. Se generan automáticamente al finalizar prácticas.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="vv-stats-grid vv-s2">
            {[
              {
                label: "Total",
                value: data?.count ?? 0,
                icon: <Award size={14} color="#93c5fd"/>,
                accent: "rgba(59,130,246,.15)",
                border: "rgba(59,130,246,.3)",
              },
              {
                label: "Precisión prom.",
                value: `${precisionProm.toFixed(1)}%`,
                icon: <TrendingUp size={14} color="#6ee7b7"/>,
                accent: "rgba(52,211,153,.12)",
                border: "rgba(52,211,153,.28)",
              },
              {
                label: "Calificación prom.",
                value: calProm > 0 ? `${calProm.toFixed(1)}/5` : "—",
                icon: <Award size={14} color="#fcd34d"/>,
                accent: "rgba(251,191,36,.12)",
                border: "rgba(251,191,36,.28)",
              },
              {
                label: "Técnica correcta",
                value: `${correctas}/${resumenes.length}`,
                icon: <Target size={14} color="#c4b5fd"/>,
                accent: "rgba(139,92,246,.12)",
                border: "rgba(139,92,246,.28)",
              },
            ].map(({ label, value, icon, accent, border }) => (
              <div key={label} style={{
                background: accent,
                border: `1px solid ${border}`,
                borderRadius: "14px", padding: "14px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: "10px",
                }}>
                  <p style={{
                    color: "rgba(200,215,255,.75)",
                    fontSize: "10px", margin: 0,
                    textTransform: "uppercase", letterSpacing: ".06em",
                  }}>
                    {label}
                  </p>
                  {icon}
                </div>
                <p style={{
                  color: "white", fontSize: "22px",
                  fontWeight: 700, margin: 0, letterSpacing: "-.4px",
                }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="vv-s3">
            {resumenes.map((r) => (
              <ResumenCard
                key={r.id}
                r={r}
                recalculando={recalculando}
                onRecalcular={recalcular}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              marginTop: "8px", padding: "12px 0",
              borderTop: "1px solid rgba(255,255,255,.08)",
            }}>
              <span style={{
                color: "rgba(180,200,255,.6)", fontSize: "11px",
              }}>
                Página {page} de {totalPages}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="vv-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </button>
                <button
                  className="vv-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}