"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Practica, PaginatedResponse } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Dispositivo {
  id: number;
  nombre: string;
  mac_address: string;
}

interface EstudianteSimple {
  id: number;
  codigo_estudiante: string;
  nombre_completo: string;
}

function formatDuracion(s: number) {
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "11px",
  padding: "11px 14px",
  color: "white",
  fontSize: "14px",
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
  cursor: "pointer",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(200,215,255,.75)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: "6px",
};

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
      {nombre?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}

export default function PracticasPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Practica> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);
  const [estudiantes, setEstudiantes] = useState<EstudianteSimple[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [form, setForm] = useState({ estudiante_id: "", dispositivo_id: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchPracticas = useCallback(() => {
    setLoading(true);
    api
      .get("/api/placa/practicas/", { params: { page } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchPracticas(); }, [fetchPracticas]);

  useEffect(() => {
    if (modal) {
      setCreateError("");
      Promise.all([
        api.get("/api/estudiantes/", { params: { page_size: 100 } }),
        api.get("/api/placa/dispositivos/"),
      ]).then(([eRes, dRes]) => {
        setEstudiantes(eRes.data.results ?? []);
        setDispositivos(dRes.data.results ?? dRes.data ?? []);
      });
    }
  }, [modal]);

  async function crearPractica() {
    if (!form.estudiante_id || !form.dispositivo_id) return;
    setCreating(true);
    setCreateError("");
    try {
      const { data: nueva } = await api.post("/api/placa/practicas/", {
        estudiante_id: parseInt(form.estudiante_id),
        dispositivo_id: parseInt(form.dispositivo_id),
      });
      setModal(false);
      setForm({ estudiante_id: "", dispositivo_id: "" });
      router.push(`/dashboard/practicas/${nueva.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      setCreateError(
        e?.response?.data
          ? Object.values(e.response.data).flat().join(" ")
          : "Error al crear la práctica"
      );
    } finally {
      setCreating(false);
    }
  }

  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .vv-h1 { animation: fadeUp .4s ease both; }
        .vv-h2 { animation: fadeUp .4s .1s ease both; }

        .vv-practica-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          text-decoration: none;
          transition: background .15s;
        }
        .vv-practica-row:hover { background: rgba(255,255,255,.05); }
        .vv-practica-row:last-child { border-bottom: none; }

        .vv-page-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: rgba(200,215,255,.75);
          font-size: 12px;
          cursor: pointer;
          transition: background .15s;
        }
        .vv-page-btn:hover:not(:disabled) { background: rgba(255,255,255,.1); }
        .vv-page-btn:disabled { opacity:.3; cursor:not-allowed; }

        .vv-btn-new {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px;
          border-radius: 11px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity .2s, transform .15s;
          box-shadow: 0 4px 16px rgba(59,130,246,.35);
          white-space: nowrap;
        }
        .vv-btn-new:hover  { opacity: .9; }
        .vv-btn-new:active { transform: scale(.97); }

        @media (max-width: 560px) {
          .vv-col-fecha    { display: none; }
          .vv-col-duracion { display: none; }
        }
      `}</style>

      {/* Header */}
      <div className="vv-h1" style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px", gap: "12px", flexWrap: "wrap",
      }}>
        <div>
          <p style={{
            color: "rgba(180,200,255,.65)",
            fontSize: "11px", margin: "0 0 2px",
            letterSpacing: ".05em", textTransform: "uppercase",
          }}>
            Gestión
          </p>
          <h1 style={{
            color: "white", fontSize: "20px",
            fontWeight: 700, margin: 0, letterSpacing: "-.4px",
          }}>
            Prácticas
          </h1>
          {data && (
            <p style={{
              color: "rgba(180,200,255,.6)",
              fontSize: "12px", margin: "3px 0 0",
            }}>
              {data.count} registradas
            </p>
          )}
        </div>
        <button className="vv-btn-new" onClick={() => setModal(true)}>
          <Plus size={14}/>
          Nueva práctica
        </button>
      </div>

      {/* Lista */}
      <div className="vv-h2" style={{
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: "16px",
        overflow: "hidden",
      }}>
        {/* Header columnas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "40px 1fr 120px 90px 90px",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          gap: "8px",
        }}>
          {[
            { label: "#", cls: "" },
            { label: "Estudiante", cls: "" },
            { label: "Inicio", cls: "vv-col-fecha" },
            { label: "Duración", cls: "vv-col-duracion" },
            { label: "Estado", cls: "" },
          ].map(({ label, cls }) => (
            <span
              key={label}
              className={cls}
              style={{
                color: "rgba(200,215,255,.6)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: ".07em",
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: "48px",
          }}>
            <div style={{
              width: "24px", height: "24px",
              border: "2px solid rgba(255,255,255,.1)",
              borderTopColor: "#3b82f6", borderRadius: "50%",
              animation: "spin .8s linear infinite",
            }}/>
          </div>
        ) : data?.results.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{
              color: "rgba(180,200,255,.5)",
              fontSize: "13px", margin: "0 0 12px",
            }}>
              No hay prácticas registradas.
            </p>
            <button
              onClick={() => setModal(true)}
              style={{
                background: "rgba(59,130,246,.15)",
                border: "1px solid rgba(59,130,246,.3)",
                borderRadius: "10px",
                padding: "8px 16px",
                color: "#93c5fd", fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Crear la primera
            </button>
          </div>
        ) : (
          data?.results.map((p) => {
            const estado = p.estado;
            const estadoStyle =
              estado === "iniciada"
                ? { bg: "rgba(52,211,153,.15)", border: "rgba(52,211,153,.3)", text: "#6ee7b7" }
                : estado === "pausada"
                ? { bg: "rgba(251,191,36,.12)", border: "rgba(251,191,36,.28)", text: "#fcd34d" }
                : { bg: "rgba(255,255,255,.07)", border: "rgba(255,255,255,.13)", text: "rgba(200,215,255,.6)" };

            return (
              <Link
                key={p.id}
                href={`/dashboard/practicas/${p.id}`}
                className="vv-practica-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 120px 90px 90px",
                  gap: "8px", alignItems: "center",
                }}
              >
                <span style={{
                  color: "rgba(180,200,255,.55)",
                  fontSize: "11px", fontFamily: "monospace",
                }}>
                  #{p.id}
                </span>

                <div style={{
                  display: "flex", alignItems: "center",
                  gap: "10px", minWidth: 0,
                }}>
                  <Avatar nombre={p.estudiante.nombre_completo}/>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      color: "white",
                      fontSize: "13px", fontWeight: 500,
                      margin: 0, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {p.estudiante.nombre_completo}
                    </p>
                    <p style={{
                      color: "rgba(180,200,255,.6)",
                      fontSize: "10px", margin: "2px 0 0",
                      fontFamily: "monospace",
                    }}>
                      {p.estudiante.codigo_estudiante}
                    </p>
                  </div>
                </div>

                <span
                  className="vv-col-fecha"
                  style={{ color: "rgba(180,200,255,.65)", fontSize: "11px" }}
                >
                  {new Date(p.fecha_inicio).toLocaleString("es-CO", {
                    day: "2-digit", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>

                <span
                  className="vv-col-duracion"
                  style={{ color: "rgba(180,200,255,.65)", fontSize: "12px" }}
                >
                  {formatDuracion(p.tiempo_transcurrido)}
                </span>

                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{
                    background: estadoStyle.bg,
                    border: `1px solid ${estadoStyle.border}`,
                    color: estadoStyle.text,
                    fontSize: "10px", padding: "3px 8px",
                    borderRadius: "20px", fontWeight: 500,
                  }}>
                    {estado}
                  </span>
                  <ChevronRight size={13} color="rgba(180,200,255,.45)"/>
                </div>
              </Link>
            );
          })
        )}

        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,.08)",
          }}>
            <span style={{ color: "rgba(180,200,255,.6)", fontSize: "11px" }}>
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
      </div>

      {/* Modal */}
      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setCreateError("");
          setForm({ estudiante_id: "", dispositivo_id: "" });
        }}
        title="Nueva práctica"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Estudiante</label>
            <select
              value={form.estudiante_id}
              onChange={(e) => setForm({ ...form, estudiante_id: e.target.value })}
              style={selectStyle}
            >
              <option value="" style={{ background: "#0a1020" }}>
                Seleccionar estudiante...
              </option>
              {estudiantes.map((e) => (
                <option key={e.id} value={e.id} style={{ background: "#0a1020" }}>
                  {e.nombre_completo} — {e.codigo_estudiante}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Dispositivo ESP32</label>
            <select
              value={form.dispositivo_id}
              onChange={(e) => setForm({ ...form, dispositivo_id: e.target.value })}
              style={selectStyle}
            >
              <option value="" style={{ background: "#0a1020" }}>
                Seleccionar dispositivo...
              </option>
              {dispositivos.map((d) => (
                <option key={d.id} value={d.id} style={{ background: "#0a1020" }}>
                  {d.nombre} — {d.mac_address}
                </option>
              ))}
            </select>
          </div>

          {createError && (
            <div style={{
              background: "rgba(239,68,68,.12)",
              border: "1px solid rgba(239,68,68,.25)",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <div style={{
                width: "6px", height: "6px",
                borderRadius: "50%", background: "#f87171", flexShrink: 0,
              }}/>
              <p style={{ color: "#fca5a5", fontSize: "12px", margin: 0 }}>
                {createError}
              </p>
            </div>
          )}

          <p style={{
            color: "rgba(180,200,255,.55)",
            fontSize: "11px", margin: 0,
          }}>
            Al crear la práctica serás redirigido al panel de seguimiento en tiempo real.
          </p>

          <div style={{
            display: "flex", gap: "8px",
            justifyContent: "flex-end", paddingTop: "4px",
          }}>
            <Button
              variant="secondary"
              onClick={() => {
                setModal(false);
                setCreateError("");
                setForm({ estudiante_id: "", dispositivo_id: "" });
              }}
            >
              Cancelar
            </Button>
            <Button
              loading={creating}
              disabled={!form.estudiante_id || !form.dispositivo_id}
              onClick={crearPractica}
            >
              Iniciar práctica
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}