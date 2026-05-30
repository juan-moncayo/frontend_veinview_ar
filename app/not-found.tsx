import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes floatOrb {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(20px,-20px) scale(1.04); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes glitch {
          0%,100% { text-shadow: none; }
          20%      { text-shadow: 3px 0 rgba(59,130,246,.6), -3px 0 rgba(99,102,241,.6); }
          40%      { text-shadow: -2px 0 rgba(59,130,246,.4), 2px 0 rgba(99,102,241,.4); }
          60%      { text-shadow: 2px 0 rgba(59,130,246,.5), -2px 0 rgba(99,102,241,.5); }
          80%      { text-shadow: none; }
        }

        .vv-orb1 { animation: floatOrb 8s ease-in-out infinite; }
        .vv-orb2 { animation: floatOrb 11s ease-in-out infinite reverse; }
        .vv-404   { animation: glitch 6s ease-in-out infinite; }
        .vv-s1    { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) .1s both; }
        .vv-s2    { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) .22s both; }
        .vv-s3    { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) .34s both; }
        .vv-s4    { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) .46s both; }

        .vv-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: white;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(59,130,246,.4),
                      inset 0 1px 0 rgba(255,255,255,.2);
          transition: opacity .2s, transform .15s;
        }
        .vv-back-btn:hover  { opacity: .9; }
        .vv-back-btn:active { transform: scale(.97); }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#060c1a 0%,#0d1b3e 45%,#0a1628 75%,#040810 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Orbs */}
        <div className="vv-orb1" style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,.2) 0%,transparent 70%)",
          pointerEvents: "none",
        }}/>
        <div className="vv-orb2" style={{
          position: "absolute", bottom: "-100px", right: "-60px",
          width: "350px", height: "350px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)",
          pointerEvents: "none",
        }}/>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,.06)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: "24px",
          padding: "52px 48px",
          textAlign: "center",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)",
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Línea gradiente top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "1px",
            background: "linear-gradient(90deg,transparent,rgba(59,130,246,.7),rgba(99,102,241,.7),transparent)",
          }}/>

          {/* 404 */}
          <p
            className="vv-404 vv-s1"
            style={{
              fontSize: "clamp(80px,18vw,120px)",
              fontWeight: 800,
              letterSpacing: "-6px",
              lineHeight: 1,
              margin: "0 0 4px",
              background: "linear-gradient(135deg,rgba(59,130,246,.35),rgba(99,102,241,.25))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              userSelect: "none",
            }}
          >
            404
          </p>

          {/* Separador */}
          <div className="vv-s2" style={{
            width: "40px", height: "2px",
            background: "linear-gradient(90deg,#3b82f6,#4f46e5)",
            borderRadius: "2px",
            margin: "0 auto 20px",
          }}/>

          {/* Título */}
          <h1 className="vv-s3" style={{
            color: "white",
            fontSize: "18px",
            fontWeight: 700,
            margin: "0 0 8px",
            letterSpacing: "-.4px",
          }}>
            Página no encontrada
          </h1>

          {/* Descripción */}
          <p className="vv-s3" style={{
            color: "rgba(180,200,255,.6)",
            fontSize: "13px",
            margin: "0 0 32px",
            lineHeight: 1.6,
          }}>
            La página que buscas no existe o fue movida.
          </p>

          {/* Botón */}
          <div className="vv-s4">
            <Link href="/dashboard" className="vv-back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Volver al inicio
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}