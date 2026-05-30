"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRol, getEstudiante, logout } from "@/lib/auth";
import { EstudianteAuth } from "@/lib/auth";
import { LogOut, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const [estudiante, setEstudiante] = useState<EstudianteAuth | null>(null);

  useEffect(() => {
    const rol = getRol();
    if (!rol) { router.replace("/login"); return; }
    if (rol === "profesor") { router.replace("/dashboard"); return; }
    const e = getEstudiante();
    if (!e) { router.replace("/login"); return; }
    setEstudiante(e);
  }, [router]);

  if (!estudiante) return null;

  const inicial = estudiante.nombre_completo?.charAt(0)?.toUpperCase() ?? "?";

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
        .vv-layout-in { animation: fadeUp .4s ease both; }

        .vv-nav-link {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 9px;
          border: 1px solid transparent;
          text-decoration: none;
          font-size: 13px;
          font-weight: 400;
          color: rgba(148,163,184,.6);
          transition: background .15s, border-color .15s, color .15s;
        }
        .vv-nav-link:hover {
          background: rgba(255,255,255,.06);
          color: rgba(200,215,255,.8);
        }
        .vv-nav-link.active {
          background: rgba(59,130,246,.12);
          border-color: rgba(59,130,246,.22);
          color: #93c5fd;
          font-weight: 500;
        }

        .vv-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.05);
          color: rgba(148,163,184,.6);
          font-size: 12px;
          cursor: pointer;
          transition: background .15s, color .15s, border-color .15s;
        }
        .vv-logout-btn:hover {
          background: rgba(239,68,68,.1);
          border-color: rgba(239,68,68,.2);
          color: #fca5a5;
        }

        @media (max-width: 640px) {
          .vv-header-code { display: none; }
          .vv-header-name { display: none; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#060c1a",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Topbar */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(6,12,26,.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,.07)",
        }}>
          <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 20px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>

            {/* Logo + Brand */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginRight: "8px",
            }}>
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "rgba(59,130,246,.15)",
                border: "1px solid rgba(59,130,246,.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 700,
                color: "#93c5fd",
              }}>
                V
              </div>
              <div>
                <p style={{
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: "-.3px",
                }}>
                  VeinView AR
                </p>
                <p style={{
                  color: "rgba(148,163,184,.45)",
                  fontSize: "10px",
                  margin: 0,
                }}>
                  Panel estudiante
                </p>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
              <Link
                href="/estudiante"
                className={`vv-nav-link${path === "/estudiante" ? " active" : ""}`}
              >
                <Activity size={13}/>
                Mis prácticas
              </Link>
            </nav>

            {/* Right: info + logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Info usuario */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <div className="vv-header-name" style={{ textAlign: "right" }}>
                  <p style={{
                    color: "rgba(200,215,255,.85)",
                    fontSize: "12px",
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    {estudiante.nombre_completo}
                  </p>
                  <p className="vv-header-code" style={{
                    color: "rgba(148,163,184,.5)",
                    fontSize: "10px",
                    margin: 0,
                    fontFamily: "monospace",
                  }}>
                    {estudiante.codigo_estudiante}
                  </p>
                </div>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "rgba(59,130,246,.2)",
                  border: "2px solid rgba(59,130,246,.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#93c5fd",
                  flexShrink: 0,
                }}>
                  {inicial}
                </div>
              </div>

              {/* Logout */}
              <button
                className="vv-logout-btn"
                onClick={logout}
                title="Cerrar sesión"
              >
                <LogOut size={13}/>
                <span style={{ display: "none" }}>Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          padding: "28px 20px",
          boxSizing: "border-box",
        }}>
          {children}
        </main>
      </div>
    </>
  );
}