"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRol, getEstudiante, logout } from "@/lib/auth";
import { EstudianteAuth } from "@/lib/auth";
import { LogOut, Activity } from "lucide-react";

export default function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav simple */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center
              justify-center text-white text-xs font-bold">
              V
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">
                VeinView AR
              </p>
              <p className="text-xs text-slate-400">Panel del estudiante</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-700">
                {estudiante.nombre_completo}
              </p>
              <p className="text-xs text-slate-400">{estudiante.codigo_estudiante}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center
              justify-center text-slate-600 text-xs font-semibold">
              {estudiante.nombre_completo.charAt(0)}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500
                hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Nav simple */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-0">
          
            href="/estudiante"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium
              text-slate-600 hover:text-slate-800 border-b-2 border-transparent
              hover:border-slate-300 transition-colors"
          >
            <Activity size={13} />
            Mis prácticas
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}