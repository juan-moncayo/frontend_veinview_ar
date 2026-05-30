"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  BarChart2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth";

const nav = [
  { href: "/dashboard",             label: "Inicio",      icon: LayoutDashboard },
  { href: "/dashboard/estudiantes", label: "Estudiantes", icon: Users },
  { href: "/dashboard/practicas",   label: "Prácticas",   icon: Activity },
  { href: "/dashboard/resumenes",   label: "Resúmenes",   icon: FileText },
  { href: "/dashboard/reportes",    label: "Reportes",    icon: BarChart2 },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 4px",
        marginBottom: "28px",
      }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "13px",
          background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,.3)",
        }}>
          <Image
            src="/logo.png"
            alt="VeinView AR"
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
            priority
          />
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
            Panel Profesor
          </p>
        </div>

        {/* Botón cerrar en mobile */}
        <button
          className="vv-close-btn"
          onClick={() => setOpen(false)}
          style={{
            display: "none",
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(148,163,184,.6)",
            padding: "4px",
          }}
          aria-label="Cerrar menú"
        >
          <X size={18}/>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`vv-nav-item${active ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon
                size={15}
                style={{
                  color: active ? "#93c5fd" : "rgba(148,163,184,.5)",
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: "13px",
                fontWeight: active ? 500 : 400,
                color: active ? "#93c5fd" : "rgba(148,163,184,.55)",
              }}>
                {label}
              </span>
              {active && (
                <div style={{
                  marginLeft: "auto",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                  flexShrink: 0,
                }}/>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,.06)",
        paddingTop: "14px",
        marginTop: "14px",
      }}>
        <button onClick={logout} className="vv-logout">
          <LogOut
            size={14}
            className="vv-logout-icon"
            style={{ color: "rgba(148,163,184,.4)", flexShrink: 0 }}
          />
          <span
            className="vv-logout-text"
            style={{ fontSize: "12px", color: "rgba(148,163,184,.4)" }}
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .vv-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px solid transparent;
          cursor: pointer;
          text-decoration: none;
          transition: background .15s, border-color .15s;
          margin-bottom: 2px;
        }
        .vv-nav-item:hover { background: rgba(255,255,255,.06); }
        .vv-nav-item.active {
          background: rgba(59,130,246,.12);
          border-color: rgba(59,130,246,.2);
        }
        .vv-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          border: none;
          background: none;
          cursor: pointer;
          width: 100%;
          transition: background .15s;
        }
        .vv-logout:hover { background: rgba(239,68,68,.1); }
        .vv-logout:hover .vv-logout-icon { color: #f87171 !important; }
        .vv-logout:hover .vv-logout-text { color: #f87171 !important; }

        /* Desktop sidebar */
        .vv-sidebar-desktop {
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          width: 220px;
          background: rgba(255,255,255,.035);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-right: 1px solid rgba(255,255,255,.07);
          display: flex;
          flex-direction: column;
          padding: 20px 12px;
          z-index: 30;
        }

        /* Mobile topbar */
        .vv-topbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: rgba(6,12,26,.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,.07);
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 40;
        }

        /* Mobile drawer */
        .vv-drawer {
          display: none;
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          width: 260px;
          background: rgba(10,16,35,.97);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-right: 1px solid rgba(255,255,255,.08);
          flex-direction: column;
          padding: 20px 12px;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform .28s cubic-bezier(.22,1,.36,1);
        }
        .vv-drawer.open {
          transform: translateX(0);
        }

        /* Overlay */
        .vv-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.5);
          z-index: 45;
          backdrop-filter: blur(2px);
        }
        .vv-overlay.open { display: block; }

        @media (max-width: 768px) {
          .vv-sidebar-desktop { display: none; }
          .vv-topbar { display: flex; }
          .vv-drawer { display: flex; }
          .vv-close-btn { display: flex !important; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Desktop sidebar ── */}
      <aside className="vv-sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* ── Mobile topbar ── */}
      <div className="vv-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            borderRadius: "9px",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <Image
              src="/logo.png"
              alt="VeinView AR"
              width={24}
              height={24}
              style={{ objectFit: "contain" }}
            />
          </div>
          <span style={{
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "-.3px",
          }}>
            VeinView AR
          </span>
        </div>

        <button
          onClick={() => setOpen(true)}
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: "8px",
            cursor: "pointer",
            color: "rgba(148,163,184,.8)",
            padding: "7px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Abrir menú"
        >
          <Menu size={18}/>
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      <div
        className={`vv-overlay${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* ── Mobile drawer ── */}
      <aside className={`vv-drawer${open ? " open" : ""}`}>
        <SidebarContent />
      </aside>
    </>
  );
}