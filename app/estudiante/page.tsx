"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { getEstudiante } from "@/lib/auth";
import api from "@/lib/api";
import { Play, Square, Clock, RefreshCw } from "lucide-react";

interface PracticaEstudiante {
  id: number;
  estado: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_total_segundos: number;
  tiempo_transcurrido: number;
  numero_intentos: number;
  precision_promedio: number;
  ultima_actividad_sensor: string | null;
}

interface EstadoPractica {
  practica_activa: boolean;
  practica: PracticaEstudiante | null;
  segundos_inactividad: number | null;
  puede_enviar_datos: boolean;
  finalizada_por_inactividad?: boolean;
  mensaje?: string;
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
  fecha_practica: string;
}

function formatDuracion(s: number) {
  if (!s) return "0 min";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatTiempo(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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

const estadoColorMap: Record<string, { bg: string; border: string; text: string }> = {
  iniciada: { bg: "rgba(52,211,153,.15)", border: "rgba(52,211,153,.3)", text: "#6ee7b7" },
  pausada:  { bg: "rgba(251,191,36,.12)", border: "rgba(251,191,36,.28)", text: "#fcd34d" },
  finalizada:{ bg: "rgba(255,255,255,.07)", border: "rgba(255,255,255,.13)", text: "rgba(200,215,255,.6)" },
};

const tipoColorMap: Record<string, { bg: string; border: string; text: string }> = {
  examen: { bg: "rgba(59,130,246,.15)", border: "rgba(59,130,246,.3)", text: "#93c5fd" },
  prueba: { bg: "rgba(255,255,255,.07)", border: "rgba(255,255,255,.12)", text: "rgba(200,215,255,.6)" },
};

function BadgePill({ bg, border, text, children }: { bg:string; border:string; text:string; children: React.ReactNode }) {
  return (
    <span style={{
      background: bg, border: `1px solid ${border}`,
      color: text, fontSize: "10px", padding: "2px 9px",
      borderRadius: "20px", fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

export default function EstudiantePage() {
  const estudiante = getEstudiante();
  const [practicas, setPracticas] = useState<PracticaEstudiante[]>([]);
  const [resumenes, setResumenes] = useState<ResumenEstudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"practicas" | "resumenes">("practicas");

  const [estadoPractica, setEstadoPractica] = useState<EstadoPractica | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [errorPractica, setErrorPractica] = useState("");
  const [mensajeInactividad, setMensajeInactividad] = useState("");

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEstadoPractica = useCallback(async () => {
    try {
      const res = await api.get("/api/placa/mi-practica/");
      setEstadoPractica(res.data);
      if (res.data.finalizada_por_inactividad) {
        setMensajeInactividad(res.data.mensaje || "La práctica fue finalizada por inactividad.");
        fetchHistorial();
      }
    } catch { /* silencioso */ }
  }, []);

  const fetchHistorial = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.get("/api/estudiantes/mis_practicas/"),
        api.get("/api/profesor/resumenes/", { params: { page_size: 100 } }),
      ]);
      const todasPracticas: PracticaEstudiante[] = pRes.data.practicas ?? pRes.data ?? [];
      setPracticas(todasPracticas);
      const idsPracticas = new Set(todasPracticas.map((p) => p.id));
      const misResumenes = (rRes.data.results ?? []).filter(
        (r: ResumenEstudiante) => idsPracticas.has(r.practica)
      );
      setResumenes(misResumenes);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!estudiante) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchEstadoPractica(), fetchHistorial()]);
      setLoading(false);
    };
    init();
    pollingRef.current = setInterval(fetchEstadoPractica, 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // Polling corto: consulta el estado cada 1s hasta que el predicado sea true (máx `intentos`)
  async function esperarEstado(
    predicado: (e: EstadoPractica) => boolean,
    intentos = 8
  ): Promise<void> {
    for (let i = 0; i < intentos; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await api.get("/api/placa/mi-practica/");
        setEstadoPractica(res.data);
        if (predicado(res.data)) return;
      } catch { /* silencioso */ }
    }
  }

  async function iniciarPrueba() {
    setIniciando(true);
    setErrorPractica("");
    setMensajeInactividad("");
    try {
      await api.post("/api/placa/prueba/iniciar/", {});
      // Reflejo optimista: mostramos "en curso" de inmediato mientras llega la confirmación
      setEstadoPractica((prev) => ({
        ...(prev ?? { segundos_inactividad: null, puede_enviar_datos: true }),
        practica_activa: true,
        practica: prev?.practica ?? null,
      }));
      // Espera hasta que el backend confirme practica_activa === true
      await esperarEstado((e) => e.practica_activa === true);
      await fetchHistorial();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setErrorPractica(e?.response?.data?.error || "No se pudo iniciar la práctica.");
      // Si falló, revertir el estado optimista
      await fetchEstadoPractica();
    } finally {
      setIniciando(false);
    }
  }

  async function finalizarPrueba() {
    if (!estadoPractica?.practica) return;
    setFinalizando(true);
    setErrorPractica("");
    try {
      await api.post("/api/placa/prueba/finalizar/", { practica_id: estadoPractica.practica.id });
      // Reflejo optimista
      setEstadoPractica((prev) => ({
        ...(prev ?? { segundos_inactividad: null, puede_enviar_datos: false }),
        practica_activa: false,
        practica: null,
      }));
      // Espera hasta que el backend confirme practica_activa === false
      await esperarEstado((e) => e.practica_activa === false);
      await fetchHistorial();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setErrorPractica(e?.response?.data?.error || "No se pudo finalizar la práctica.");
      await fetchEstadoPractica();
    } finally {
      setFinalizando(false);
    }
  }

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
  const mejorPrecision =
    resumenes.length > 0 ? Math.max(...resumenes.map((r) => r.precision_porcentaje ?? 0)) : 0;

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

  const practicaActual = estadoPractica?.practica;
  const hayPracticaActiva = estadoPractica?.practica_activa;

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
        .vv-s5 { animation: fadeUp .4s .32s ease both; }

        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .vv-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }

        .vv-practica-card {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 8px;
          transition: border-color .15s, background .15s;
        }
        .vv-practica-card:hover {
          background: rgba(255,255,255,.08);
          border-color: rgba(255,255,255,.15);
        }

        .vv-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 11px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(59,130,246,.35);
          transition: opacity .2s, transform .15s;
        }
        .vv-btn-primary:hover { opacity: .9; }
        .vv-btn-primary:active { transform: scale(.97); }
        .vv-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

        .vv-btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 11px;
          border: 1px solid rgba(239,68,68,.3);
          background: rgba(239,68,68,.12);
          color: #fca5a5;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s, opacity .2s;
        }
        .vv-btn-danger:hover { background: rgba(239,68,68,.2); }
        .vv-btn-danger:disabled { opacity: .45; cursor: not-allowed; }

        .vv-criterio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        @media (max-width: 480px) {
          .vv-criterio-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* Header bienvenida */}
      <div className="vv-s1" style={{ marginBottom: "24px" }}>
        <p style={{
          color: "rgba(180,200,255,.65)",
          fontSize: "11px", margin: "0 0 2px",
          letterSpacing: ".05em", textTransform: "uppercase",
        }}>
          Bienvenido
        </p>
        <h1 style={{
          color: "white", fontSize: "20px",
          fontWeight: 700, margin: 0, letterSpacing: "-.4px",
        }}>
          Hola, {estudiante?.nombre_completo.split(" ")[0]}
        </h1>
        <p style={{
          color: "rgba(180,200,255,.6)",
          fontSize: "12px", margin: "3px 0 0",
        }}>
          {estudiante?.programa} · Semestre {estudiante?.semestre}
        </p>
      </div>

      {/* Panel práctica activa */}
      <div className="vv-s2" style={{
        background: "rgba(59,130,246,.1)",
        border: "1px solid rgba(59,130,246,.25)",
        borderRadius: "18px",
        padding: "20px",
        marginBottom: "20px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Orb decorativo */}
        <div style={{
          position: "absolute", top: "-30px", right: "-30px",
          width: "130px", height: "130px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,.25) 0%,transparent 70%)",
          pointerEvents: "none",
        }}/>

        {/* Header panel */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px", flexWrap: "wrap", gap: "8px",
        }}>
          <div>
            <p style={{
              color: "rgba(147,197,253,.8)",
              fontSize: "10px", textTransform: "uppercase",
              letterSpacing: ".12em", margin: "0 0 3px",
            }}>
              Práctica de prueba
            </p>
            <p style={{
              color: "rgba(180,200,255,.6)",
              fontSize: "11px", margin: 0,
            }}>
              Sin nota · para practicar antes del examen
            </p>
          </div>
          {hayPracticaActiva && practicaActual?.tipo === "prueba" ? (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(52,211,153,.12)",
              border: "1px solid rgba(52,211,153,.3)",
              borderRadius: "20px", padding: "5px 12px",
            }}>
              <div style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#34d399",
                animation: "dotPulse 2s ease-in-out infinite",
              }}/>
              <span style={{ color: "#6ee7b7", fontSize: "11px", fontWeight: 500 }}>
                En curso
              </span>
            </div>
          ) : (
            <span style={{
              background: "rgba(255,255,255,.07)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "rgba(200,215,255,.55)",
              fontSize: "11px", padding: "5px 12px",
              borderRadius: "20px",
            }}>
              Sin práctica activa
            </span>
          )}
        </div>

        {/* Alerta inactividad */}
        {mensajeInactividad && (
          <div style={{
            background: "rgba(251,191,36,.1)",
            border: "1px solid rgba(251,191,36,.25)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{
              width: "6px", height: "6px",
              borderRadius: "50%", background: "#fbbf24", flexShrink: 0,
            }}/>
            <p style={{ color: "#fcd34d", fontSize: "12px", margin: 0 }}>
              {mensajeInactividad}
            </p>
          </div>
        )}

        {/* Error */}
        {errorPractica && (
          <div style={{
            background: "rgba(239,68,68,.1)",
            border: "1px solid rgba(239,68,68,.22)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{
              width: "6px", height: "6px",
              borderRadius: "50%", background: "#f87171", flexShrink: 0,
            }}/>
            <p style={{ color: "#fca5a5", fontSize: "12px", margin: 0 }}>
              {errorPractica}
            </p>
          </div>
        )}

        {/* Bloqueo por examen */}
        {hayPracticaActiva && practicaActual?.tipo === "examen" && (
          <div style={{
            background: "rgba(59,130,246,.12)",
            border: "1px solid rgba(59,130,246,.25)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{
              width: "6px", height: "6px",
              borderRadius: "50%", background: "#3b82f6", flexShrink: 0,
            }}/>
            <p style={{ color: "#93c5fd", fontSize: "12px", margin: 0 }}>
              Tienes una práctica de examen activa. No puedes iniciar una prueba hasta que finalice.
            </p>
          </div>
        )}

        {/* Stats práctica activa */}
        {hayPracticaActiva && practicaActual?.tipo === "prueba" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "16px",
          }}>
            {[
              {
                label: "Duración",
                value: formatDuracion(practicaActual.tiempo_transcurrido),
                accent: "rgba(59,130,246,.12)",
                border: "rgba(59,130,246,.25)",
              },
              {
                label: "Cierre por inactividad",
                value: estadoPractica?.segundos_inactividad !== null
                  ? formatTiempo(estadoPractica?.segundos_inactividad ?? 300)
                  : "—",
                accent: (estadoPractica?.segundos_inactividad ?? 300) < 60
                  ? "rgba(239,68,68,.12)" : "rgba(255,255,255,.07)",
                border: (estadoPractica?.segundos_inactividad ?? 300) < 60
                  ? "rgba(239,68,68,.25)" : "rgba(255,255,255,.12)",
                danger: (estadoPractica?.segundos_inactividad ?? 300) < 60,
              },
              {
                label: "Intentos",
                value: practicaActual.numero_intentos,
                accent: "rgba(139,92,246,.12)",
                border: "rgba(139,92,246,.28)",
              },
            ].map(({ label, value, accent, border, danger }) => (
              <div key={label} style={{
                background: accent,
                border: `1px solid ${border}`,
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center",
              }}>
                <p style={{
                  color: "rgba(200,215,255,.65)",
                  fontSize: "10px", margin: "0 0 6px",
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>
                  {label}
                </p>
                <p style={{
                  color: danger ? "#fca5a5" : "white",
                  fontSize: "16px", fontWeight: 700, margin: 0,
                  letterSpacing: "-.3px",
                }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Botones acción */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {!hayPracticaActiva || practicaActual?.tipo === "examen" ? (
            <button
              className="vv-btn-primary"
              onClick={iniciarPrueba}
              disabled={iniciando || (hayPracticaActiva && practicaActual?.tipo === "examen")}
            >
              {iniciando ? (
                <RefreshCw size={13} style={{ animation: "spin .8s linear infinite" }}/>
              ) : (
                <Play size={13}/>
              )}
              {iniciando ? "Iniciando..." : "Iniciar práctica de prueba"}
            </button>
          ) : (
            <button
              className="vv-btn-danger"
              onClick={finalizarPrueba}
              disabled={finalizando}
            >
              {finalizando ? (
                <RefreshCw size={13} style={{ animation: "spin .8s linear infinite" }}/>
              ) : (
                <Square size={13}/>
              )}
              {finalizando ? "Finalizando..." : "Finalizar práctica"}
            </button>
          )}
        </div>

        <p style={{
          color: "rgba(147,197,253,.5)",
          fontSize: "11px", margin: "12px 0 0",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <Clock size={11}/>
          Se finaliza automáticamente si hay 5 min sin movimiento del sensor
        </p>
      </div>

      {/* Stats grid */}
      <div className="vv-stats-grid vv-s3">
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
            sub: "de todas tus prácticas",
            accent: "rgba(52,211,153,.12)",
            border: "rgba(52,211,153,.28)",
          },
          {
            label: "Mejor precisión",
            value: `${mejorPrecision.toFixed(1)}%`,
            sub: "tu mejor sesión",
            accent: "rgba(139,92,246,.12)",
            border: "rgba(139,92,246,.28)",
          },
          {
            label: "Calificación prom.",
            value: calificacionPromedio ? `${calificacionPromedio.toFixed(2)} / 5` : "—",
            sub: "escala 0 – 5",
            accent: "rgba(251,191,36,.12)",
            border: "rgba(251,191,36,.28)",
          },
        ].map(({ label, value, sub, accent, border }) => (
          <div key={label} style={{
            background: accent,
            border: `1px solid ${border}`,
            borderRadius: "14px",
            padding: "14px",
          }}>
            <p style={{
              color: "rgba(200,215,255,.7)",
              fontSize: "10px", margin: "0 0 8px",
              textTransform: "uppercase", letterSpacing: ".06em",
            }}>
              {label}
            </p>
            <p style={{
              color: "white", fontSize: "20px",
              fontWeight: 700, margin: "0 0 4px",
              letterSpacing: "-.3px",
            }}>
              {value}
            </p>
            <p style={{
              color: "rgba(180,200,255,.55)",
              fontSize: "10px", margin: 0,
            }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="vv-s4" style={{
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
            {t === "practicas" ? "Mis prácticas" : "Mis resúmenes"}
          </button>
        ))}
      </div>

      {/* Tab prácticas */}
      {tab === "practicas" && (
        <div className="vv-s5">
          {practicas.length === 0 ? (
            <div style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "16px",
              padding: "48px", textAlign: "center",
            }}>
              <p style={{ color: "rgba(180,200,255,.5)", fontSize: "13px", margin: 0 }}>
                Aún no tienes prácticas registradas.
              </p>
            </div>
          ) : (
            practicas.map((p) => {
              const ec = estadoColorMap[p.estado] ?? estadoColorMap.finalizada;
              const tc = tipoColorMap[p.tipo] ?? tipoColorMap.prueba;
              return (
                <div key={p.id} className="vv-practica-card">
                  <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px", flexWrap: "wrap",
                    marginBottom: p.estado === "finalizada" ? "12px" : "0",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badges */}
                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: "6px", marginBottom: "6px", flexWrap: "wrap",
                      }}>
                        <span style={{
                          color: "rgba(180,200,255,.45)",
                          fontSize: "10px", fontFamily: "monospace",
                        }}>
                          #{p.id}
                        </span>
                        <BadgePill {...ec}>{p.estado}</BadgePill>
                        <BadgePill {...tc}>{p.tipo}</BadgePill>
                      </div>
                      {/* Fecha */}
                      <p style={{
                        color: "rgba(180,200,255,.65)",
                        fontSize: "12px", margin: "0 0 2px",
                      }}>
                        {new Date(p.fecha_inicio).toLocaleDateString("es-CO", {
                          weekday: "long", day: "numeric",
                          month: "long", year: "numeric",
                        })}
                      </p>
                      <p style={{
                        color: "rgba(180,200,255,.5)",
                        fontSize: "11px", margin: 0,
                      }}>
                        Duración: {formatDuracion(p.tiempo_transcurrido)}
                        {p.numero_intentos > 0 && ` · ${p.numero_intentos} intentos`}
                      </p>
                    </div>

                    {/* Precisión */}
                    {p.estado === "finalizada" && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{
                          color: "rgba(200,215,255,.6)",
                          fontSize: "10px", margin: "0 0 3px",
                          textTransform: "uppercase", letterSpacing: ".06em",
                        }}>
                          Precisión
                        </p>
                        <p style={{
                          color: p.precision_promedio >= 80 ? "#6ee7b7"
                            : p.precision_promedio >= 60 ? "#fcd34d" : "#fca5a5",
                          fontSize: "20px", fontWeight: 700, margin: 0,
                          letterSpacing: "-.4px",
                        }}>
                          {(p.precision_promedio ?? 0).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {p.estado === "finalizada" && p.precision_promedio > 0 && (
                    <BarraPrecision valor={p.precision_promedio ?? 0}/>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab resúmenes */}
      {tab === "resumenes" && (
        <div className="vv-s5">
          {resumenes.length === 0 ? (
            <div style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "16px",
              padding: "48px", textAlign: "center",
            }}>
              <p style={{ color: "rgba(180,200,255,.5)", fontSize: "13px", margin: 0 }}>
                Tus resúmenes aparecerán aquí cuando finalices prácticas.
              </p>
            </div>
          ) : (
            resumenes.map((r) => {
              const calColor =
                r.calificacion !== null
                  ? r.calificacion >= 3.5 ? "#6ee7b7"
                    : r.calificacion >= 2.5 ? "#fcd34d" : "#fca5a5"
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
                <div key={r.id} style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "8px",
                }}>
                  {/* Top */}
                  <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px", flexWrap: "wrap",
                    marginBottom: "14px",
                  }}>
                    <div>
                      <p style={{
                        color: "rgba(180,200,255,.7)",
                        fontSize: "12px", margin: "0 0 2px",
                      }}>
                        {new Date(r.fecha_practica).toLocaleDateString("es-CO", {
                          weekday: "long", day: "numeric",
                          month: "long", year: "numeric",
                        })}
                      </p>
                      <p style={{
                        color: "rgba(180,200,255,.5)",
                        fontSize: "11px", margin: 0,
                      }}>
                        Duración: {formatDuracion(r.tiempo_canalizacion)}
                      </p>
                    </div>
                    {r.calificacion !== null && (
                      <div style={{
                        background: calBg,
                        border: `1px solid ${calBorder}`,
                        borderRadius: "12px",
                        padding: "8px 14px",
                        textAlign: "center",
                      }}>
                        <p style={{
                          color: "rgba(200,215,255,.6)",
                          fontSize: "9px", margin: "0 0 2px",
                          textTransform: "uppercase", letterSpacing: ".08em",
                        }}>
                          Calificación
                        </p>
                        <p style={{
                          color: calColor,
                          fontSize: "18px", fontWeight: 700, margin: 0,
                        }}>
                          {r.calificacion.toFixed(1)} / 5
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Precisión */}
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{
                      color: "rgba(200,215,255,.6)",
                      fontSize: "10px", margin: "0 0 6px",
                      textTransform: "uppercase", letterSpacing: ".06em",
                    }}>
                      Precisión técnica
                    </p>
                    <BarraPrecision valor={r.precision_porcentaje ?? 0}/>
                  </div>

                  {/* Criterios */}
                  <div className="vv-criterio-grid" style={{ marginBottom: "12px" }}>
                    {[
                      { label: "Técnica", ok: r.tecnica_correcta },
                      { label: "Ángulo",  ok: r.angulo_adecuado },
                      { label: "Presión", ok: r.presion_controlada },
                    ].map(({ label, ok }) => (
                      <div key={label} style={{
                        background: ok ? "rgba(52,211,153,.12)" : "rgba(239,68,68,.1)",
                        border: `1px solid ${ok ? "rgba(52,211,153,.28)" : "rgba(239,68,68,.22)"}`,
                        borderRadius: "10px",
                        padding: "10px",
                        textAlign: "center",
                      }}>
                        <p style={{
                          color: ok ? "#6ee7b7" : "#fca5a5",
                          fontSize: "18px", fontWeight: 700,
                          margin: "0 0 3px", lineHeight: 1,
                        }}>
                          {ok ? "✓" : "✗"}
                        </p>
                        <p style={{
                          color: ok ? "rgba(110,231,183,.75)" : "rgba(252,165,165,.75)",
                          fontSize: "10px", margin: 0, fontWeight: 500,
                        }}>
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Métricas */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: "16px",
                    borderTop: "1px solid rgba(255,255,255,.07)",
                    paddingTop: "12px",
                  }}>
                    {[
                      {
                        label: "Intentos",
                        value: `${r.numero_intentos}${r.intentos_exitosos > 0 ? ` (${r.intentos_exitosos} ✓)` : ""}`,
                      },
                      r.inclinacion_promedio !== null && {
                        label: "Ángulo prom.",
                        value: `${r.inclinacion_promedio?.toFixed(1)}°`,
                      },
                      r.fuerza_promedio !== null && {
                        label: "Fuerza prom.",
                        value: `${r.fuerza_promedio?.toFixed(0)} g`,
                      },
                    ].filter(Boolean).map((item) => {
                      const { label, value } = item as { label: string; value: string };
                      return (
                        <div key={label}>
                          <p style={{
                            color: "rgba(200,215,255,.55)",
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
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}