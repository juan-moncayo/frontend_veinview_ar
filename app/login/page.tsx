"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backendveinviewar-production.up.railway.app";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const username = form.username.trim();
    const password = form.password;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/profesor/login/`,
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("profesor", JSON.stringify(data.profesor));
      localStorage.setItem("rol", "profesor");
      router.push("/dashboard");
      return;
    } catch { /* no es profesor */ }

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/token/`,
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("rol", "estudiante");
      const perfilRes = await axios.get(
        `${BASE_URL}/api/estudiantes/mi_perfil/`,
        { headers: { Authorization: `Bearer ${data.access}` } }
      );
      localStorage.setItem("estudiante", JSON.stringify(perfilRes.data));
      router.push("/estudiante");
      return;
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes floatOrb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-30px) scale(1.05); }
          66%      { transform: translate(-20px,35px) scale(0.97); }
        }
        @keyframes floatOrb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-35px,25px) scale(1.03); }
          66%      { transform: translate(25px,-20px) scale(0.98); }
        }
        @keyframes floatOrb3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(20px,-40px); }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes logoIn {
          from { opacity:0; transform:scale(.8) translateY(-16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.75); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(600px); }
        }

        .vv-orb1 { animation: floatOrb1 9s ease-in-out infinite; }
        .vv-orb2 { animation: floatOrb2 11s ease-in-out infinite; }
        .vv-orb3 { animation: floatOrb3 7s ease-in-out infinite; }
        .vv-logo-in  { animation: logoIn .65s cubic-bezier(.34,1.56,.64,1) both; }
        .vv-card-in  { animation: fadeSlideUp .7s cubic-bezier(.22,1,.36,1) .15s both; }
        .vv-f1 { animation: fadeSlideUp .5s cubic-bezier(.22,1,.36,1) .38s both; }
        .vv-f2 { animation: fadeSlideUp .5s cubic-bezier(.22,1,.36,1) .50s both; }
        .vv-f3 { animation: fadeSlideUp .5s cubic-bezier(.22,1,.36,1) .62s both; }
        .vv-footer { animation: fadeSlideUp .5s cubic-bezier(.22,1,.36,1) .75s both; }
        .vv-dot { animation: dotPulse 2s ease-in-out infinite; }
        .vv-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
          background-size: 200% 100%;
          animation: shimmer 2.5s infinite;
        }

        .vv-input {
          width: 100%;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 13px 14px 13px 44px;
          color: white;
          font-size: 15px;
          outline: none;
          transition: border-color .2s, background .2s;
          box-sizing: border-box;
          -webkit-appearance: none;
        }
        .vv-input::placeholder { color: rgba(180,200,255,.3); }
        .vv-input:focus {
          border-color: rgba(59,130,246,.55);
          background: rgba(255,255,255,.09);
        }

        .vv-label {
          display: block;
          color: rgba(180,200,255,.65);
          font-size: 11px;
          letter-spacing: .09em;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .vv-btn-login {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: white;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 24px rgba(59,130,246,.4),
                      inset 0 1px 0 rgba(255,255,255,.2);
          position: relative;
          overflow: hidden;
          transition: opacity .2s, transform .15s;
          -webkit-appearance: none;
        }
        .vv-btn-login:hover  { opacity: .92; }
        .vv-btn-login:active { transform: scale(.98); }
        .vv-btn-login:disabled { opacity: .45; cursor: not-allowed; }

        .vv-eye {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: rgba(180,200,255,.4);
          display: flex;
          align-items: center;
          -webkit-appearance: none;
          transition: color .15s;
        }
        .vv-eye:hover { color: rgba(180,200,255,.8); }

        @media (max-width: 480px) {
          .vv-page { padding: 20px 16px !important; }
          .vv-logo-wrap { width: 100px !important; height: 100px !important; border-radius: 28px !important; }
          .vv-title { font-size: 24px !important; }
          .vv-card { padding: 22px 18px !important; border-radius: 20px !important; }
        }
      `}</style>

      <div
        className="vv-page"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg,#060c1a 0%,#0d1b3e 45%,#0a1628 75%,#040810 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orbs */}
        <div className="vv-orb1" style={{
          position: "absolute", top: "-100px", left: "-100px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,.28) 0%,transparent 70%)",
          pointerEvents: "none",
        }}/>
        <div className="vv-orb2" style={{
          position: "absolute", bottom: "-120px", right: "-80px",
          width: "420px", height: "420px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 70%)",
          pointerEvents: "none",
        }}/>
        <div className="vv-orb3" style={{
          position: "absolute", top: "30%", right: "5%",
          width: "240px", height: "240px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(14,165,233,.15) 0%,transparent 70%)",
          pointerEvents: "none",
        }}/>

        <div style={{
          width: "100%",
          maxWidth: "400px",
          position: "relative",
          zIndex: 1,
        }}>

          {/* Logo */}
          {show && (
            <div className="vv-logo-in" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "36px",
            }}>
              <div
                className="vv-logo-wrap"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "32px",
                  background: "rgba(255,255,255,.07)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  position: "relative",
                  boxShadow:
                    "0 12px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.12)",
                  overflow: "hidden",
                }}
              >
                {/* Scanline decorativo */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: "30px",
                  background: "linear-gradient(transparent,rgba(59,130,246,.08),transparent)",
                  animation: "scanline 4s linear infinite",
                  pointerEvents: "none",
                }}/>
                <Image
                  src="/logo.png"
                  alt="VeinView AR"
                  width={120}
                  height={120}
                  style={{
                    objectFit: "contain",
                    width: "116px",
                    height: "116px",
                    transform: "scale(1.45)",
                  }}
                  priority
                />
                {/* Indicador activo */}
                <div
                  className="vv-dot"
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#34d399",
                    border: "2px solid rgba(6,12,26,.9)",
                  }}
                />
              </div>

              <h1
                className="vv-title"
                style={{
                  color: "white",
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "-.6px",
                  margin: 0,
                }}
              >
                VeinView AR
              </h1>
              <p style={{
                color: "rgba(180,200,255,.45)",
                fontSize: "12px",
                letterSpacing: ".18em",
                textTransform: "uppercase",
                margin: "6px 0 0",
              }}>
                Simulador de Canalización
              </p>
            </div>
          )}

          {/* Card login */}
          {show && (
            <div
              className="vv-card vv-card-in"
              style={{
                background: "rgba(255,255,255,.06)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: "24px",
                padding: "28px 26px",
                boxShadow:
                  "0 25px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)",
              }}
            >
              {/* Línea gradiente superior */}
              <div style={{
                height: "1px",
                background:
                  "linear-gradient(90deg,transparent,rgba(59,130,246,.7),rgba(99,102,241,.7),transparent)",
                marginBottom: "24px",
                borderRadius: "1px",
              }}/>

              <p style={{
                color: "rgba(180,200,255,.6)",
                fontSize: "13px",
                margin: "0 0 22px",
              }}>
                Acceso al sistema
              </p>

              <form onSubmit={handleSubmit}>

                {/* Campo usuario */}
                <div className="vv-f1" style={{ marginBottom: "14px" }}>
                  <label className="vv-label">Usuario</label>
                  <div style={{ position: "relative" }}>
                    {/* Icono usuario */}
                    <svg
                      style={{
                        position: "absolute", left: "14px", top: "50%",
                        transform: "translateY(-50%)", pointerEvents: "none",
                      }}
                      width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(180,200,255,.45)" strokeWidth="1.5" strokeLinecap="round"
                    >
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    <input
                      className="vv-input"
                      type="text"
                      placeholder="usuario o correo"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      autoComplete="username"
                      autoCapitalize="none"
                      required
                    />
                  </div>
                </div>

                {/* Campo contraseña */}
                <div className="vv-f2" style={{ marginBottom: "22px" }}>
                  <label className="vv-label">Contraseña</label>
                  <div style={{ position: "relative" }}>
                    {/* Icono candado */}
                    <svg
                      style={{
                        position: "absolute", left: "14px", top: "50%",
                        transform: "translateY(-50%)", pointerEvents: "none",
                      }}
                      width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(180,200,255,.45)" strokeWidth="1.5" strokeLinecap="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className="vv-input"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="current-password"
                      required
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      className="vv-eye"
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? "Ocultar" : "Mostrar"}
                    >
                      {showPass ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: "rgba(239,68,68,.1)",
                    border: "1px solid rgba(239,68,68,.22)",
                    borderRadius: "10px",
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    marginBottom: "16px",
                  }}>
                    <div style={{
                      width: "6px", height: "6px",
                      borderRadius: "50%", background: "#f87171", flexShrink: 0,
                    }}/>
                    <p style={{ color: "#fca5a5", fontSize: "13px", margin: 0 }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Botón */}
                <div className="vv-f3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="vv-btn-login"
                  >
                    <div className="vv-shimmer" style={{
                      position: "absolute", inset: 0,
                    }}/>
                    {loading ? (
                      <>
                        <svg
                          style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="2" strokeLinecap="round"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="2" strokeLinecap="round">
                          <path d="M15 3h6v18h-6M10 17l5-5-5-5M13 12H3"/>
                        </svg>
                        Ingresar
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Separador inferior */}
              <div style={{
                height: "1px",
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)",
                marginTop: "24px",
              }}/>
            </div>
          )}

          {/* Footer */}
          {show && (
            <div
              className="vv-footer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                marginTop: "22px",
              }}
            >
              <div
                className="vv-dot"
                style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%", background: "#34d399",
                }}
              />
              <span style={{
                color: "rgba(180,200,255,.4)",
                fontSize: "11px",
                letterSpacing: ".05em",
              }}>
                Sistema activo
              </span>
            </div>
          )}

        </div>
      </div>
    </>
  );
}