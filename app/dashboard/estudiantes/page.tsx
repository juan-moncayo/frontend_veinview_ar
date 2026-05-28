"use client";
import { useEffect, useState, useCallback } from "react";
import { UserPlus, Search } from "lucide-react";
import api from "@/lib/api";
import { Estudiante, PaginatedResponse } from "@/types";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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

  return (
    <>
      <TopBar
        title="Estudiantes"
        subtitle={data ? `${data.count} registrados` : ""}
        actions={
          <Button icon={<UserPlus size={15} />} onClick={() => setModal(true)}>
            Nuevo estudiante
          </Button>
        }
      />

      {/* Búsqueda */}
      <div className="relative mb-5">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nombre o código..."
          className="w-full max-w-sm pl-9 pr-3 py-2.5 rounded-lg border border-slate-200
            bg-white text-sm text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full" />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Código", "Nombre", "Programa", "Semestre", "Prácticas", "Estado"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-medium text-slate-500 px-5 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.results.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {e.codigo_estudiante}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/estudiantes/${e.id}`}
                        className="font-medium text-slate-800 hover:text-blue-600
                          transition-colors"
                      >
                        {e.nombre_completo}
                      </Link>
                      <p className="text-xs text-slate-400">{e.correo}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{e.programa}</td>
                    <td className="px-5 py-3 text-slate-600">{e.semestre}</td>
                    <td className="px-5 py-3">
                      <span className="text-slate-700">{e.total_practicas}</span>
                      <span className="text-slate-400 ml-1">
                        ({e.practicas_finalizadas} fin.)
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge color={e.activo ? "green" : "gray"}>
                        {e.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
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

      <CrearEstudianteModal
        open={modal}
        onClose={() => setModal(false)}
        onCreated={fetchData}
      />
    </>
  );
}