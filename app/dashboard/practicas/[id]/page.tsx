"use client";
import { useEffect, useState, use } from "react";
import { ArrowLeft, Play, Pause, Square } from "lucide-react";
import api from "@/lib/api";
import { Practica, DatosSensor } from "@/types";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

interface MetricasRT {
  practica_id: number;
  estudiante_nombre: string;
  estado: string;
  tiempo_transcurrido: number;
  numero_intentos: number;
  precision_actual: number;
  angulo_actual: number;
  fuerza_actual: number;
}

const estadoColor: Record<string, "green" | "yellow" | "gray"> = {
  iniciada: "green",
  pausada: "yellow",
  finalizada: "gray",
};

function formatDuracion(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${sec}s`;
}

export default function PracticaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [practica, setPractica] = useState<Practica | null>(null);
  const [metricas, setMetricas] = useState<MetricasRT | null>(null);
  const [datos, setDatos] = useState<DatosSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  async function fetchAll() {
    const [pRes, mRes, dRes] = await Promise.all([
      api.get(`/api/placa/practicas/${id}/`),
      api.get(`/api/profesor/metricas-tiempo-real/?practica_id=${id}`),
      api.get(`/api/placa/datos-sensores/?practica=${id}&limit=20`),
    ]);
    setPractica(pRes.data);
    setMetricas(mRes.data);
    setDatos(dRes.data.results ?? dRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    // Refrescar cada 3s si la práctica está activa
    const interval = setInterval(() => {
      if (practica?.estado === "iniciada") fetchAll();
    }, 3000);
    return () => clearInterval(interval);
  }, [id, practica?.estado]);

  async function cambiarEstado(nuevo: string) {
    if (!practica) return;
    setChanging(true);
    await api.patch(`/api/placa/practicas/${practica.id}/`, { estado: nuevo });
    await fetchAll();
    setChanging(false);
  }

  if (loading || !practica)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <Link
          href="/dashboard/practicas"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <TopBar
          title={`Práctica #${practica.id}`}
          subtitle={practica.estudiante.nombre_completo}
          actions={
            <div className="flex gap-2">
              {practica.estado === "iniciada" && (
                <>
                  <Button
                    variant="secondary"
                    icon={<Pause size={14} />}
                    loading={changing}
                    onClick={() => cambiarEstado("pausada")}
                  >
                    Pausar
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Square size={14} />}
                    loading={changing}
                    onClick={() => cambiarEstado("finalizada")}
                  >
                    Finalizar
                  </Button>
                </>
              )}
              {practica.estado === "pausada" && (
                <>
                  <Button
                    icon={<Play size={14} />}
                    loading={changing}
                    onClick={() => cambiarEstado("iniciada")}
                  >
                    Reanudar
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Square size={14} />}
                    loading={changing}
                    onClick={() => cambiarEstado("finalizada")}
                  >
                    Finalizar
                  </Button>
                </>
              )}
            </div>
          }
        />
      </div>

      {/* Métricas en tiempo real */}
      {metricas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            {
              label: "Estado",
              value: (
                <Badge color={estadoColor[practica.estado] ?? "gray"}>
                  {practica.estado}
                </Badge>
              ),
            },
            {
              label: "Duración",
              value: formatDuracion(metricas.tiempo_transcurrido),
            },
            {
              label: "Precisión",
              value: `${metricas.precision_actual.toFixed(1)}%`,
            },
            { label: "Intentos", value: metricas.numero_intentos },
          ].map(({ label, value }) => (
            <Card key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-lg font-semibold text-slate-800">{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Sensores actuales */}
      {metricas && practica.estado !== "finalizada" && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Card>
            <p className="text-xs text-slate-500 mb-1">Ángulo pitch actual</p>
            <p className="text-2xl font-semibold text-slate-800">
              {metricas.angulo_actual.toFixed(1)}°
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.abs(metricas.angulo_actual) / 45, 1) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Óptimo: 10° – 30°</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 mb-1">Fuerza aplicada</p>
            <p className="text-2xl font-semibold text-slate-800">
              {metricas.fuerza_actual.toFixed(0)} g
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full transition-all"
                style={{
                  width: `${Math.min(metricas.fuerza_actual / 400, 1) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Óptimo: 50 – 300 g</p>
          </Card>
        </div>
      )}

      {/* Últimas lecturas */}
      <Card padding={false}>
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            Últimas lecturas de sensores
          </h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-50">
              {["Tiempo", "Pitch", "Roll", "Fuerza", "Técnica"].map((h) => (
                <th
                  key={h}
                  className="text-left text-slate-500 font-medium px-5 py-2.5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {datos.slice(0, 15).map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-2.5 text-slate-400">
                  {new Date(d.timestamp).toLocaleTimeString("es-CO")}
                </td>
                <td className="px-5 py-2.5 text-slate-700">
                  {d.angulo_pitch.toFixed(1)}°
                </td>
                <td className="px-5 py-2.5 text-slate-700">
                  {d.angulo_roll.toFixed(1)}°
                </td>
                <td className="px-5 py-2.5 text-slate-700">{d.fuerza.toFixed(0)} g</td>
                <td className="px-5 py-2.5">
                  <Badge color={d.tecnica_correcta ? "green" : "red"}>
                    {d.tecnica_correcta ? "Correcta" : "Ajustar"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}