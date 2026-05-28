"use client";
import { useEffect, useState } from "react";
import { Users, Activity, CheckCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/profesor/dashboard/").then((r) => {
      setData(r.data);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );

  if (!data) return null;

  const stats = [
    {
      label: "Estudiantes activos",
      value: data.total_estudiantes_activos,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Prácticas hoy",
      value: data.total_practicas_hoy,
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "En curso ahora",
      value: data.practicas_en_curso,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Precisión promedio",
      value: `${data.promedio_precision_hoy.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
  ];

  return (
    <>
      <TopBar title="Panel principal" subtitle="Resumen del día" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-semibold text-slate-800 mt-1">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Prácticas en curso */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Prácticas en curso</h2>
          {data.practicas_activas.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              No hay prácticas activas ahora mismo
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.practicas_activas.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/practicas/${p.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50
                    -mx-5 px-5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.estudiante}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.dispositivo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {formatSegundos(p.tiempo_transcurrido)}
                    </span>
                    <Badge color={p.estado === "iniciada" ? "green" : "yellow"}>
                      {p.estado}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Últimas finalizadas */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Últimas prácticas finalizadas
          </h2>
          {data.ultimas_practicas_finalizadas.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Sin prácticas finalizadas hoy
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.ultimas_practicas_finalizadas.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/practicas/${p.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50
                    -mx-5 px-5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.estudiante}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.fecha}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{p.precision.toFixed(1)}%</span>
                    {p.calificacion !== null && (
                      <Badge color="blue">{p.calificacion.toFixed(1)} / 5</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}