"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  BarChart2,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { Profesor } from "@/types";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/estudiantes", label: "Estudiantes", icon: Users },
  { href: "/dashboard/practicas", label: "Prácticas", icon: Activity },
  { href: "/dashboard/resumenes", label: "Resúmenes", icon: FileText },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart2 },
];

export default function Sidebar() {
  const path = usePathname();
  const [profesor, setProfesor] = useState<Profesor | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("profesor");
    if (data) setProfesor(JSON.parse(data));
  }, []);

  const inicial = profesor?.nombre_completo?.charAt(0) ?? "";

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r
      border-slate-100 flex flex-col z-30">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center
            justify-center text-white text-sm font-bold">
            V
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-none">
              VeinView AR
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Gestión de prácticas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                font-medium transition-colors mb-0.5
                ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center
            justify-center text-slate-600 text-xs font-semibold shrink-0">
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">
              {profesor?.nombre_completo ?? ""}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {profesor?.correo ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
            text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}