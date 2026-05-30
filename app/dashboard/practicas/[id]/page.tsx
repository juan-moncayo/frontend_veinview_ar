"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Play, Pause, Square, Activity } from "lucide-react";
import api from "@/lib/api";
import { Practica, DatosSensor } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface MetricasRT {
  practica_id: number;
  estudiante_nombre: string;
  estado: string;
  tiempo_transcurrido: number;
  numero_intentos: number;
  precision_actual: number;
  angulo_actual: number;
  fuerza_actual: number;
}

function formatDuracion(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${sec}s`;
}

function BarraSensor({ valor, max, color }: { valor: number; max: number; color: string }) {
  return (
    <div style={{
      height: "4px",
      background: "rgba(255,255,255,.1)",
      borderRadius: "2px",
      overflow: "hidden",
      marginTop: "10px",
    }}>
      <div style={{
        height: "100%", borderRadius: "2px",
        background: color,
        width: `${Math.min((valor / max) * 100, 100)}%`,
        transition: "width .5s ease",
      }}/>
    </div>
  );
}

export default function PracticaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [practica, setPractica] = useState<Practica | null>(null);
  const [metricas, setMetricas] = useState<MetricasRT | null>(null);
  const [datos, setDatos] = useState<DatosSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  async function fetchAll() {
    const [pRes, mRes, dRes] = await Promise.all([
      api.get(`/api/placa/practicas/${id}/`),
      api.get(`/api/profesor/metricas-tiempo-real/?practica_id=${id}`),
      api.get(`/api/placa/datos-sensores/?practica=${id}&limit=20`),
    ]);
    setPractica(pRes.data);
    setMetricas(mRes.data);
    setDatos(dRes.data.results ?? dRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      if (practica?.estado === "iniciada") fetchAll();
    }, 3000);
    return () => clearInterval(interval);
  }, [id, practica?.estado]);

  async function cambiarEstado(nuevo: string) {
    if (!practica) return;
    setChanging(true);
    await api.patch(`/api/placa/practicas/${practica.id}/`, { estado: nuevo });
    await fetchAll();
    setChanging(false);
  }

  if (loading || !practica)
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

  const estado = practica.estado;
  const inicial = practica.estudiante.nombre_completo?.charAt(0) ?? "?";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.75); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .vv-s1 { animation: fadeUp .4s ease both; }
        .vv-s2 { animation: fadeUp .4s .08s ease both; }
        .vv-s3 { animation: fadeUp .4s .16s ease both; }
        .vv-s4 { animation: fadeUp .4s .24s ease both; }

        .vv-dato-row {
          display: grid;
          grid-template-columns: 80px 60px 60px 70px 80px;
          gap: 8px;
          padding: 9px 16px;
          border-bottom: 1px solid rgba(255,255,255,.05);
          align-items: center;
          transition: background .15s;
        }
        .vv-dato-row:hover { background: rgba(255,255,255,.04); }
        .vv-dato-row:last-child { border-bottom: none; }

        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .vv-sensor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .vv-stats-grid  { grid-template-columns: repeat(2,1fr); gap:10px; }
          .vv-sensor-grid { grid-template-columns: 1fr; }
          .vv-dato-col-roll { display:none; }
          .vv-actions { flex-wrap: wrap; }
        }
      `}</style>

      {/* Header */}
      <div className="vv-s1" style={{
        display: "flex", alignItems: "center",
        gap: "14px", marginBottom: "24px", flexWrap: "wrap",
      }}>
        <Link
          href="/dashboard/practicas"
          style={{
            width: "34px", height: "34px",
            borderRadius: "10px",
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.12)",
            display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
            color: "rgba(200,215,255,.7)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16}/>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <div style={{
            width: "44px", height: "44px",
            borderRadius: "50%",
            background: "rgba(59,130,246,.2)",
            border: "2px solid rgba(59,130,246,.4)",
            display: "flex", alignItems: "center",
            justifyContent: "center",
            fontSize: "16px", fontWeight: 700,
            color: "#93c5fd", flexShrink: 0,
          }}>
            {inicial}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{
                color: "white", fontSize: "18px",
                fontWeight: 700, margin: 0, letterSpacing: "-.4px",
              }}>
                Práctica #{practica.id}
              </h1>
              {estado === "iniciada" && (
                <div style={{
                  width: "7px", height: "7px",
                  borderRadius: "50%", background: "#34d399",
                  animation: "dotPulse 2s ease-in-out infinite",
                }}/>
              )}
            </div>
            <p style={{
              color: "rgba(180,200,255,.65)",
              fontSize: "12px", margin: "3px 0 0",
            }}>
              {practica.estudiante.nombre_completo}
            </p>
          </div>
        </div>

        <div className="vv-actions" style={{ display: "flex", gap: "8px" }}>
          {estado === "iniciada" && (
            <>
              <Button variant="secondary" icon={<Pause size={13}/>}
                loading={changing} onClick={() => cambiarEstado("pausada")}>
                Pausar
              </Button>
              <Button variant="danger" icon={<Square size={13}/>}
                loading={changing} onClick={() => cambiarEstado("finalizada")}>
                Finalizar
              </Button>
            </>
          )}
          {estado === "pausada" && (
            <>
              <Button icon={<Play size={13}/>}
                loading={changing} onClick={() => cambiarEstado("iniciada")}>
                Reanudar
              </Button>
              <Button variant="danger" icon={<Square size={13}/>}
                loading={changing} onClick={() => cambiarEstado("finalizada")}>
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {metricas && (
        <div className="vv-stats-grid vv-s2">
          {[
            {
              label: "Estado",
              value: <Badge color={
                estado === "iniciada" ? "green"
                : estado === "pausada" ? "yellow" : "gray"
              }>{estado}</Badge>,
              accent: "rgba(255,255,255,.06)",
              border: "rgba(255,255,255,.1)",
            },
            {
              label: "Duración",
              value: formatDuracion(metricas.tiempo_transcurrido),
              accent: "rgba(59,130,246,.12)",
              border: "rgba(59,130,246,.28)",
            },
            {
              label: "Precisión",
              value: `${metricas.precision_actual.toFixed(1)}%`,
              accent: metricas.precision_actual >= 70
                ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.1)",
              border: metricas.precision_actual >= 70
                ? "rgba(52,211,153,.28)" : "rgba(251,191,36,.22)",
            },
            {
              label: "Intentos",
              value: metricas.numero_intentos,
              accent: "rgba(139,92,246,.12)",
              border: "rgba(139,92,246,.28)",
            },
          ].map(({ label, value, accent, border }) => (
            <div key={label} style={{
              background: accent,
              border: `1px solid ${border}`,
              borderRadius: "14px", padding: "14px",
            }}>
              <p style={{
                color: "rgba(200,215,255,.7)",
                fontSize: "10px", margin: "0 0 8px",
                textTransform: "uppercase", letterSpacing: ".06em",
              }}>
                {label}
              </p>
              <p style={{
                color: "white", fontSize: "18px",
                fontWeight: 700, margin: 0, letterSpacing: "-.3px",
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Sensores RT */}
      {metricas && estado !== "finalizada" && (
        <div className="vv-sensor-grid vv-s3">
          <div style={{
            background: "rgba(59,130,246,.12)",
            border: "1px solid rgba(59,130,246,.28)",
            borderRadius: "16px", padding: "16px",
          }}>
            <p style={{
              color: "rgba(147,197,253,.8)",
              fontSize: "10px", margin: "0 0 6px",
              textTransform: "uppercase", letterSpacing: ".1em",
            }}>
              Ángulo pitch
            </p>
            <p style={{
              color: "white", fontSize: "32px",
              fontWeight: 700, margin: 0, letterSpacing: "-1px",
            }}>
              {metricas.angulo_actual.toFixed(1)}°
            </p>
            <BarraSensor valor={Math.abs(metricas.angulo_actual)} max={45} color="#3b82f6"/>
            <p style={{
              color: "rgba(147,197,253,.6)",
              fontSize: "10px", margin: "6px 0 0",
            }}>
              Óptimo: −30° a −8°
            </p>
          </div>

          <div style={{
            background: "rgba(139,92,246,.12)",
            border: "1px solid rgba(139,92,246,.28)",
            borderRadius: "16px", padding: "16px",
          }}>
            <p style={{
              color: "rgba(196,181,253,.8)",
              fontSize: "10px", margin: "0 0 6px",
              textTransform: "uppercase", letterSpacing: ".1em",
            }}>
              Fuerza aplicada
            </p>
            <p style={{
              color: "white", fontSize: "32px",
              fontWeight: 700, margin: 0, letterSpacing: "-1px",
            }}>
              {metricas.fuerza_actual.toFixed(0)} g
            </p>
            <BarraSensor valor={metricas.fuerza_actual} max={400} color="#8b5cf6"/>
            <p style={{
              color: "rgba(196,181,253,.6)",
              fontSize: "10px", margin: "6px 0 0",
            }}>
              Óptimo: 50 – 300 g
            </p>
          </div>
        </div>
      )}

      {/* Tabla lecturas */}
      <div className="vv-s4" style={{
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: "16px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={14} color="rgba(180,200,255,.6)"/>
            <p style={{
              color: "white",
              fontSize: "13px", fontWeight: 500, margin: 0,
            }}>
              Últimas lecturas de sensores
            </p>
          </div>
          {estado === "iniciada" && (
            <div style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "rgba(52,211,153,.12)",
              border: "1px solid rgba(52,211,153,.28)",
              borderRadius: "20px", padding: "3px 10px",
            }}>
              <div style={{
                width: "5px", height: "5px",
                borderRadius: "50%", background: "#34d399",
                animation: "dotPulse 2s ease-in-out infinite",
              }}/>
              <span style={{ color: "#6ee7b7", fontSize: "10px", fontWeight: 500 }}>
                En vivo
              </span>
            </div>
          )}
        </div>

        {/* Cabecera columnas */}
        <div className="vv-dato-row" style={{
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.03)",
        }}>
          {["Hora", "Pitch", "Roll", "Fuerza", "Técnica"].map((h, i) => (
            <span
              key={h}
              className={i === 2 ? "vv-dato-col-roll" : ""}
              style={{
                color: "rgba(200,215,255,.6)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: ".07em",
                fontWeight: 500,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {datos.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{
              color: "rgba(180,200,255,.45)",
              fontSize: "13px", margin: 0,
            }}>
              Sin lecturas aún
            </p>
          </div>
        ) : (
          datos.slice(0, 15).map((d) => (
            <div key={d.id} className="vv-dato-row">
              <span style={{
                color: "rgba(180,200,255,.6)",
                fontSize: "11px", fontFamily: "monospace",
              }}>
                {new Date(d.timestamp).toLocaleTimeString("es-CO", {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </span>
              <span style={{ color: "white", fontSize: "12px", fontWeight: 500 }}>
                {d.angulo_pitch.toFixed(1)}°
              </span>
              <span
                className="vv-dato-col-roll"
                style={{ color: "white", fontSize: "12px", fontWeight: 500 }}
              >
                {d.angulo_roll.toFixed(1)}°
              </span>
              <span style={{ color: "white", fontSize: "12px", fontWeight: 500 }}>
                {d.fuerza.toFixed(0)} g
              </span>
              <span style={{
                background: d.tecnica_correcta
                  ? "rgba(52,211,153,.15)" : "rgba(239,68,68,.12)",
                border: `1px solid ${d.tecnica_correcta
                  ? "rgba(52,211,153,.3)" : "rgba(239,68,68,.25)"}`,
                color: d.tecnica_correcta ? "#6ee7b7" : "#fca5a5",
                fontSize: "10px", padding: "2px 8px",
                borderRadius: "20px",
                display: "inline-block", fontWeight: 500,
              }}>
                {d.tecnica_correcta ? "✓ OK" : "✗ Ajustar"}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}