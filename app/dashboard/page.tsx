"use client";
import { useEffect, useState } from "react";
import { Users, Activity, CheckCircle, Clock, Plus, FileText } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import Link from "next/link";

interface DashboardData {
  total_estudiantes_activos: number;
  total_practicas_hoy: number;
  practicas_en_curso: number;
  promedio_precision_hoy: number;
  practicas_activas: {
    id: number;
    estudiante: string;
    estado: string;
    tiempo_transcurrido: number;
    dispositivo: string;
  }[];
  ultimas_practicas_finalizadas: {
    id: number;
    estudiante: string;
    fecha: string;
    precision: number;
    calificacion: number | null;
  }[];
}

function formatSegundos(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function Avatar({ nombre }: { nombre: string }) {
  return (
    <div style={{
      width: "34px", height: "34px",
      borderRadius: "50%",
      background: "rgba(59,130,246,.2)",
      border: "1px solid rgba(59,130,246,.35)",
      display: "flex", alignItems: "center",
      justifyContent: "center",
      fontSize: "13px", fontWeight: 700,
      color: "#93c5fd", flexShrink: 0,
    }}>
      {nombre.charAt(0)}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get("/api/profesor/dashboard/").then((r) => setData(r.data));
    }, 10000);
    api.get("/api/profesor/dashboard/").then((r) => {
      setData(r.data);
      setLoading(false);
    });
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "center", height: "60vh",
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: "28px", height: "28px",
          border: "2px solid rgba(255,255,255,.1)",
          borderTopColor: "#3b82f6", borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }}/>
      </div>
    );

  if (!data) return null;

  const stats = [
    {
      label: "Estudiantes",
      value: data.total_estudiantes_activos,
      icon: Users,
      accent: "rgba(99,102,241,.18)",
      border: "rgba(99,102,241,.35)",
      iconColor: "#a5b4fc",
    },
    {
      label: "Prácticas hoy",
      value: data.total_practicas_hoy,
      icon: Activity,
      accent: "rgba(52,211,153,.15)",
      border: "rgba(52,211,153,.3)",
      iconColor: "#6ee7b7",
    },
    {
      label: "Finalizadas",
      value: data.ultimas_practicas_finalizadas.length,
      icon: CheckCircle,
      accent: "rgba(251,191,36,.12)",
      border: "rgba(251,191,36,.28)",
      iconColor: "#fcd34d",
    },
    {
      label: "Precisión prom.",
      value: `${data.promedio_precision_hoy.toFixed(0)}%`,
      icon: Clock,
      accent: "rgba(139,92,246,.15)",
      border: "rgba(139,92,246,.3)",
      iconColor: "#c4b5fd",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.75); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(800px); }
        }

        .vv-s1 { animation: fadeUp .4s ease both; }
        .vv-s2 { animation: fadeUp .4s .08s ease both; }
        .vv-s3 { animation: fadeUp .4s .16s ease both; }
        .vv-s4 { animation: fadeUp .4s .24s ease both; }
        .vv-c1 { animation: fadeUp .4s .32s ease both; }
        .vv-c2 { animation: fadeUp .4s .40s ease both; }

        .vv-row-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,.07);
          text-decoration: none;
          transition: background .15s;
          border-radius: 6px;
        }
        .vv-row-link:hover { background: rgba(255,255,255,.04); }
        .vv-row-link:last-child { border-bottom: none; }

        .vv-cta-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg,rgba(59,130,246,.15),rgba(99,102,241,.12));
          border: 1px solid rgba(59,130,246,.3);
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          text-decoration: none;
          transition: background .2s, border-color .2s;
          width: 100%;
        }
        .vv-cta-btn:hover {
          background: linear-gradient(135deg,rgba(59,130,246,.22),rgba(99,102,241,.2));
          border-color: rgba(59,130,246,.45);
        }

        .vv-quick-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px;
          padding: 14px 16px;
          text-decoration: none;
          transition: background .2s, border-color .2s;
        }
        .vv-quick-link:hover {
          background: rgba(255,255,255,.09);
          border-color: rgba(255,255,255,.15);
        }

        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .vv-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .vv-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .vv-cards-grid { grid-template-columns: 1fr; }
          .vv-hero { padding: 16px !important; }
        }
        @media (max-width: 480px) {
          .vv-stat-value { font-size: 22px !important; }
        }
      `}</style>

      <div style={{ position: "relative" }}>

        {/* Orbs */}
        <div style={{
          position: "absolute", top: "-60px", left: "-40px",
          width: "300px", height: "300px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,.14) 0%,transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }}/>
        <div style={{
          position: "absolute", top: "100px", right: "-60px",
          width: "200px", height: "200px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }}/>

        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div className="vv-s1" style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "24px", flexWrap: "wrap", gap: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.12)",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
              }}>
                <Image src="/logo.png" alt="VeinView AR"
                  width={30} height={30}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div>
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
                  Panel principal
                </h1>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(52,211,153,.12)",
              border: "1px solid rgba(52,211,153,.3)",
              borderRadius: "20px", padding: "6px 12px",
            }}>
              <div style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#34d399",
                animation: "dotPulse 2s ease-in-out infinite",
              }}/>
              <span style={{ color: "#6ee7b7", fontSize: "11px", fontWeight: 500 }}>
                En vivo
              </span>
            </div>
          </div>

          {/* Hero */}
          <div className="vv-s2 vv-hero" style={{
            background: "rgba(59,130,246,.12)",
            border: "1px solid rgba(59,130,246,.28)",
            borderRadius: "20px", padding: "20px",
            marginBottom: "16px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0,
              height: "60px",
              background: "linear-gradient(transparent,rgba(59,130,246,.07),transparent)",
              animation: "scanline 4s linear infinite",
              pointerEvents: "none",
            }}/>
            <div style={{
              position: "absolute", top: "-20px", right: "-20px",
              width: "120px", height: "120px", borderRadius: "50%",
              background: "radial-gradient(circle,rgba(59,130,246,.3) 0%,transparent 70%)",
              pointerEvents: "none",
            }}/>

            <p style={{
              color: "rgba(147,197,253,.8)",
              fontSize: "10px", textTransform: "uppercase",
              letterSpacing: ".12em", margin: "0 0 6px",
            }}>
              Prácticas activas ahora
            </p>
            <div style={{
              display: "flex", alignItems: "baseline",
              gap: "8px", marginBottom: "14px",
            }}>
              <span style={{
                color: "white", fontSize: "48px",
                fontWeight: 700, letterSpacing: "-3px", lineHeight: 1,
              }}>
                {data.practicas_en_curso}
              </span>
              <span style={{ color: "rgba(147,197,253,.7)", fontSize: "14px" }}>
                en curso
              </span>
            </div>

            {data.practicas_activas.length === 0 ? (
              <p style={{ color: "rgba(180,200,255,.5)", fontSize: "13px", margin: 0 }}>
                No hay prácticas activas ahora mismo
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {data.practicas_activas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/practicas/${p.id}`}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(255,255,255,.07)",
                      border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: "10px", padding: "10px 12px",
                      textDecoration: "none", transition: "background .15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar nombre={p.estudiante}/>
                      <div>
                        <p style={{
                          color: "white",
                          fontSize: "13px", fontWeight: 500, margin: 0,
                        }}>
                          {p.estudiante}
                        </p>
                        <p style={{
                          color: "rgba(180,200,255,.6)",
                          fontSize: "10px", margin: "2px 0 0",
                        }}>
                          {p.dispositivo} · {formatSegundos(p.tiempo_transcurrido)}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      background: p.estado === "iniciada"
                        ? "rgba(52,211,153,.15)" : "rgba(251,191,36,.12)",
                      border: `1px solid ${p.estado === "iniciada"
                        ? "rgba(52,211,153,.3)" : "rgba(251,191,36,.28)"}`,
                      color: p.estado === "iniciada" ? "#6ee7b7" : "#fcd34d",
                      fontSize: "10px", padding: "3px 9px",
                      borderRadius: "20px", flexShrink: 0, fontWeight: 500,
                    }}>
                      {p.estado}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="vv-stats-grid">
            {stats.map(({ label, value, icon: Icon, accent, border, iconColor }, i) => (
              <div
                key={label}
                className={`vv-s${i + 3}`}
                style={{
                  background: accent,
                  border: `1px solid ${border}`,
                  borderRadius: "14px", padding: "14px",
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: "10px",
                }}>
                  <p style={{
                    color: "rgba(200,215,255,.75)",
                    fontSize: "10px", margin: 0,
                    letterSpacing: ".04em", textTransform: "uppercase",
                  }}>
                    {label}
                  </p>
                  <Icon size={13} color={iconColor}/>
                </div>
                <p
                  className="vv-stat-value"
                  style={{
                    color: "white", fontSize: "26px",
                    fontWeight: 700, margin: 0, letterSpacing: "-.5px",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="vv-cards-grid">

            {/* Últimas finalizadas */}
            <div className="vv-c1" style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "16px", padding: "16px",
            }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: "12px",
              }}>
                <p style={{
                  color: "white",
                  fontSize: "13px", fontWeight: 500, margin: 0,
                }}>
                  Últimas finalizadas
                </p>
                <Link href="/dashboard/practicas" style={{
                  color: "rgba(147,197,253,.75)",
                  fontSize: "11px", textDecoration: "none",
                  fontWeight: 500,
                }}>
                  Ver todo →
                </Link>
              </div>

              {data.ultimas_practicas_finalizadas.length === 0 ? (
                <p style={{
                  color: "rgba(180,200,255,.5)",
                  fontSize: "12px", textAlign: "center",
                  padding: "16px 0", margin: 0,
                }}>
                  Sin prácticas finalizadas hoy
                </p>
              ) : (
                data.ultimas_practicas_finalizadas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/practicas/${p.id}`}
                    className="vv-row-link"
                  >
                    <Avatar nombre={p.estudiante}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: "white",
                        fontSize: "12px", fontWeight: 500,
                        margin: 0, whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {p.estudiante}
                      </p>
                      <p style={{
                        color: "rgba(180,200,255,.6)",
                        fontSize: "10px", margin: "2px 0 0",
                      }}>
                        {p.fecha}
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "6px", flexShrink: 0,
                    }}>
                      <span style={{
                        color: "rgba(200,215,255,.8)",
                        fontSize: "12px", fontWeight: 600,
                      }}>
                        {p.precision.toFixed(0)}%
                      </span>
                      {p.calificacion !== null && (
                        <span style={{
                          background: "rgba(59,130,246,.15)",
                          border: "1px solid rgba(59,130,246,.3)",
                          color: "#93c5fd",
                          fontSize: "10px", padding: "2px 7px",
                          borderRadius: "20px", fontWeight: 500,
                        }}>
                          {p.calificacion.toFixed(1)}/5
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Quick links */}
            <div className="vv-c2" style={{
              display: "flex", flexDirection: "column", gap: "10px",
            }}>

              {/* CTA nueva práctica */}
              <Link href="/dashboard/practicas" className="vv-cta-btn">
                <div>
                  <p style={{
                    color: "rgba(147,197,253,.8)",
                    fontSize: "10px", margin: "0 0 3px",
                    textTransform: "uppercase", letterSpacing: ".1em",
                    fontWeight: 500,
                  }}>
                    Acción rápida
                  </p>
                  <p style={{
                    color: "white", fontSize: "13px",
                    fontWeight: 600, margin: 0,
                  }}>
                    Iniciar nueva práctica
                  </p>
                </div>
                <div style={{
                  width: "36px", height: "36px",
                  borderRadius: "10px",
                  background: "rgba(59,130,246,.3)",
                  border: "1px solid rgba(59,130,246,.45)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <Plus size={16} color="#93c5fd"/>
                </div>
              </Link>

              {/* Ver estudiantes */}
              <Link href="/dashboard/estudiantes" className="vv-quick-link">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "9px",
                    background: "rgba(99,102,241,.2)",
                    border: "1px solid rgba(99,102,241,.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Users size={14} color="#a5b4fc"/>
                  </div>
                  <div>
                    <p style={{
                      color: "white",
                      fontSize: "12px", fontWeight: 500, margin: 0,
                    }}>
                      Ver estudiantes
                    </p>
                    <p style={{
                      color: "rgba(180,200,255,.65)",
                      fontSize: "10px", margin: "2px 0 0",
                    }}>
                      {data.total_estudiantes_activos} activos
                    </p>
                  </div>
                </div>
                <span style={{ color: "rgba(180,200,255,.6)", fontSize: "16px" }}>→</span>
              </Link>

              {/* Resúmenes */}
              <Link href="/dashboard/resumenes" className="vv-quick-link">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "9px",
                    background: "rgba(52,211,153,.15)",
                    border: "1px solid rgba(52,211,153,.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FileText size={14} color="#6ee7b7"/>
                  </div>
                  <div>
                    <p style={{
                      color: "white",
                      fontSize: "12px", fontWeight: 500, margin: 0,
                    }}>
                      Resúmenes
                    </p>
                    <p style={{
                      color: "rgba(180,200,255,.65)",
                      fontSize: "10px", margin: "2px 0 0",
                    }}>
                      Evaluaciones y calificaciones
                    </p>
                  </div>
                </div>
                <span style={{ color: "rgba(180,200,255,.6)", fontSize: "16px" }}>→</span>
              </Link>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}