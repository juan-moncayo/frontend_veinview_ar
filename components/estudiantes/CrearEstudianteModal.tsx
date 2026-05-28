"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormData {
  codigo_estudiante: string;
  nombre_completo: string;
  correo: string;
  programa: string;
  semestre: string;
  telefono: string;
}

export default function CrearEstudianteModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormData>({
    codigo_estudiante: "",
    nombre_completo: "",
    correo: "",
    programa: "Enfermería",
    semestre: "1",
    telefono: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs: Partial<FormData> = {};
    if (!form.codigo_estudiante) errs.codigo_estudiante = "Campo requerido";
    if (!form.nombre_completo) errs.nombre_completo = "Campo requerido";
    if (!form.correo) errs.correo = "Campo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      errs.correo = "Correo inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError("");
    setLoading(true);
    try {
      await api.post("/api/estudiantes/", {
        ...form,
        semestre: parseInt(form.semestre),
      });
      setForm({
        codigo_estudiante: "",
        nombre_completo: "",
        correo: "",
        programa: "Enfermería",
        semestre: "1",
        telefono: "",
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })
        ?.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join(" ");
        setServerError(msgs);
      } else {
        setServerError("Error al crear el estudiante");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo estudiante">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Código"
            placeholder="E12345"
            value={form.codigo_estudiante}
            onChange={(e) => set("codigo_estudiante", e.target.value)}
            error={errors.codigo_estudiante}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Semestre</label>
            <select
              value={form.semestre}
              onChange={(e) => set("semestre", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white text-sm
                text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2
                focus:ring-slate-300 focus:border-slate-400"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <option key={s} value={s}>
                  Semestre {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Nombre completo"
          placeholder="Juan Pérez García"
          value={form.nombre_completo}
          onChange={(e) => set("nombre_completo", e.target.value)}
          error={errors.nombre_completo}
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="juan@universidad.edu"
          value={form.correo}
          onChange={(e) => set("correo", e.target.value)}
          error={errors.correo}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Programa</label>
          <select
            value={form.programa}
            onChange={(e) => set("programa", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white text-sm
              text-slate-900 px-3 py-2.5 focus:outline-none focus:ring-2
              focus:ring-slate-300 focus:border-slate-400"
          >
            {["Enfermería", "Medicina", "Instrumentación quirúrgica", "Bacteriología"].map(
              (p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              )
            )}
          </select>
        </div>

        <Input
          label="Teléfono (opcional)"
          placeholder="3001234567"
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />

        {serverError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            {serverError}
          </p>
        )}

        <p className="text-xs text-slate-400">
          La contraseña inicial del estudiante será su código (ej. E12345)
        </p>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Crear estudiante
          </Button>
        </div>
      </form>
    </Modal>
  );
}