"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Practica, PaginatedResponse } from "@/types";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
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

const estadoColor: Record<string, "green" | "yellow" | "gray"> = {
  iniciada: "green",
  pausada: "yellow",
  finalizada: "gray",
};

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

  useEffect(() => {
    fetchPracticas();
  }, [fetchPracticas]);

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
      // Redirigir directo a la práctica recién creada
      router.push(`/dashboard/practicas/${nueva.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join(" ")
        : "Error al crear la práctica";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <>
      <TopBar
        title="Prácticas"
        subtitle={data ? `${data.count} registradas` : ""}
        actions={
          <Button icon={<Plus size={15} />} onClick={() => setModal(true)}>
            Nueva práctica
          </Button>
        }
      />

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300
              border-t-slate-700 rounded-full" />
          </div>
        ) : data?.results.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">No hay prácticas registradas.</p>
            <button
              onClick={() => setModal(true)}
              className="mt-2 text-sm text-slate-600 underline underline-offset-2
                hover:text-slate-800 transition-colors"
            >
              Crear la primera
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["ID", "Estudiante", "Inicio", "Duración", "Estado"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-500 px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.results.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">
                      #{p.id}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/practicas/${p.id}`}
                        className="font-medium text-slate-800 hover:text-blue-600
                          transition-colors"
                      >
                        {p.estudiante.nombre_completo}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {p.estudiante.codigo_estudiante}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {new Date(p.fecha_inicio).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDuracion(p.tiempo_transcurrido)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={estadoColor[p.estado] ?? "gray"}>
                        {p.estado}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3
                border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200
                      text-slate-600 hover:bg-slate-50 disabled:opacity-40
                      disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200
                      text-slate-600 hover:bg-slate-50 disabled:opacity-40
                      disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal nueva práctica */}
      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setCreateError("");
          setForm({ estudiante_id: "", dispositivo_id: "" });
        }}
        title="Nueva práctica"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Estudiante
            </label>
            <select
              value={form.estudiante_id}
              onChange={(e) =>
                setForm({ ...form, estudiante_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 bg-white text-sm
                text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2
                focus:ring-slate-300"
            >
              <option value="">Seleccionar estudiante...</option>
              {estudiantes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre_completo} — {e.codigo_estudiante}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Dispositivo ESP32
            </label>
            <select
              value={form.dispositivo_id}
              onChange={(e) =>
                setForm({ ...form, dispositivo_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 bg-white text-sm
                text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2
                focus:ring-slate-300"
            >
              <option value="">Seleccionar dispositivo...</option>
              {dispositivos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — {d.mac_address}
                </option>
              ))}
            </select>
          </div>

          {createError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2
              border border-red-100">
              {createError}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Al crear la práctica serás redirigido automáticamente al panel
            de seguimiento en tiempo real.
          </p>

          <div className="flex gap-2 justify-end pt-1">
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