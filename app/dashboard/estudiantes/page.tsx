"use client";
import { useEffect, useState, useCallback } from "react";
import { UserPlus, Search, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Estudiante, PaginatedResponse } from "@/types";
import CrearEstudianteModal from "@/components/estudiantes/CrearEstudianteModal";
import Link from "next/link";

export default function EstudiantesPage() {
  const [data, setData] = useState<PaginatedResponse<Estudiante> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    api
      .get("/api/estudiantes/", { params })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  function getInicial(nombre: string) {
    return nombre?.charAt(0)?.toUpperCase() ?? "?";
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .vv-h1 { animation: fadeUp .4s ease both; }
        .vv-h2 { animation: fadeUp .4s .08s ease both; }
        .vv-h3 { animation: fadeUp .4s .16s ease both; }

        .vv-search {
          width: 100%;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 11px 14px 11px 40px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color .2s, background .2s;
          box-sizing: border-box;
          -webkit-appearance: none;
        }
        .vv-search::placeholder { color: rgba(180,200,255,.35); }
        .vv-search:focus {
          border-color: rgba(96,165,250,.55);
          background: rgba(255,255,255,.08);
        }

        .vv-student-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          text-decoration: none;
          transition: background .15s;
        }
        .vv-student-row:hover { background: rgba(255,255,255,.05); }
        .vv-student-row:last-child { border-bottom: none; }

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
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(59,130,246,.35);
        }
        .vv-btn-new:hover  { opacity: .9; }
        .vv-btn-new:active { transform: scale(.97); }

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
        .vv-page-btn:disabled { opacity: .3; cursor: not-allowed; }

        @media (max-width: 640px) {
          .vv-col-programa { display: none; }
          .vv-col-semestre { display: none; }
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
            Estudiantes
          </h1>
          {data && (
            <p style={{
              color: "rgba(180,200,255,.6)",
              fontSize: "12px", margin: "3px 0 0",
            }}>
              {data.count} registrados
            </p>
          )}
        </div>
        <button className="vv-btn-new" onClick={() => setModal(true)}>
          <UserPlus size={14}/>
          Nuevo estudiante
        </button>
      </div>

      {/* Buscador */}
      <div className="vv-h2" style={{ position: "relative", marginBottom: "16px" }}>
        <Search
          size={15}
          style={{
            position: "absolute", left: "13px", top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(180,200,255,.45)",
            pointerEvents: "none",
          }}
        />
        <input
          className="vv-search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o código..."
          style={{ maxWidth: "360px" }}
        />
      </div>

      {/* Lista */}
      <div className="vv-h3" style={{
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: "16px",
        overflow: "hidden",
      }}>

        {/* Header tabla */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr 1fr 80px",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          gap: "8px",
        }}>
          {["Estudiante", "Correo / Código", "Programa", "Semestre", "Estado"].map((h, i) => (
            <span
              key={h}
              className={i === 2 ? "vv-col-programa" : i === 3 ? "vv-col-semestre" : ""}
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

        {loading ? (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: "48px",
          }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{
              width: "24px", height: "24px",
              border: "2px solid rgba(255,255,255,.1)",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spin .8s linear infinite",
            }}/>
          </div>
        ) : data?.results.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{
              color: "rgba(180,200,255,.5)",
              fontSize: "13px", margin: 0,
            }}>
              No se encontraron estudiantes
            </p>
          </div>
        ) : (
          data?.results.map((e) => (
            <Link
              key={e.id}
              href={`/dashboard/estudiantes/${e.id}`}
              className="vv-student-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr 1fr 1fr 80px",
                gap: "8px", alignItems: "center",
              }}
            >
              {/* Avatar + nombre */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                  {getInicial(e.nombre_completo)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    color: "white",
                    fontSize: "13px", fontWeight: 500,
                    margin: 0, whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {e.nombre_completo}
                  </p>
                  <p style={{
                    color: "rgba(180,200,255,.6)",
                    fontSize: "10px", margin: "2px 0 0",
                    fontFamily: "monospace",
                  }}>
                    {e.total_practicas} práctica{e.total_practicas !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Correo / código */}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  color: "rgba(200,215,255,.75)",
                  fontSize: "12px", margin: 0,
                  whiteSpace: "nowrap", overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {e.correo}
                </p>
                <p style={{
                  color: "rgba(180,200,255,.55)",
                  fontSize: "10px", margin: "2px 0 0",
                  fontFamily: "monospace",
                }}>
                  {e.codigo_estudiante}
                </p>
              </div>

              {/* Programa */}
              <p className="vv-col-programa" style={{
                color: "rgba(200,215,255,.7)",
                fontSize: "12px", margin: 0,
                whiteSpace: "nowrap", overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {e.programa}
              </p>

              {/* Semestre */}
              <p className="vv-col-semestre" style={{
                color: "rgba(200,215,255,.7)",
                fontSize: "12px", margin: 0,
              }}>
                Sem. {e.semestre}
              </p>

              {/* Estado */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{
                  background: e.activo
                    ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.06)",
                  border: `1px solid ${e.activo
                    ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.12)"}`,
                  color: e.activo ? "#6ee7b7" : "rgba(200,215,255,.5)",
                  fontSize: "10px", padding: "3px 8px",
                  borderRadius: "20px", whiteSpace: "nowrap",
                }}>
                  {e.activo ? "Activo" : "Inactivo"}
                </span>
                <ChevronRight size={13} color="rgba(180,200,255,.45)"/>
              </div>
            </Link>
          ))
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,.08)",
          }}>
            <span style={{
              color: "rgba(180,200,255,.6)",
              fontSize: "11px",
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
      </div>

      <CrearEstudianteModal
        open={modal}
        onClose={() => setModal(false)}
        onCreated={fetchData}
      />
    </>
  );
}