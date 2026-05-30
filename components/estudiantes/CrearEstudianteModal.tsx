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

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: "11px",
  padding: "11px 14px",
  color: "white",
  fontSize: "14px",
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(148,163,184,.65)",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: "6px",
};

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
    if (!form.nombre_completo)   errs.nombre_completo   = "Campo requerido";
    if (!form.correo)            errs.correo            = "Campo requerido";
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
      setServerError(
        data ? Object.values(data).flat().join(" ") : "Error al crear el estudiante"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo estudiante">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* Código + Semestre */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Input
            label="Código"
            placeholder="E12345"
            value={form.codigo_estudiante}
            onChange={(e) => set("codigo_estudiante", e.target.value)}
            error={errors.codigo_estudiante}
          />
          <div>
            <label style={labelStyle}>Semestre</label>
            <select
              value={form.semestre}
              onChange={(e) => set("semestre", e.target.value)}
              style={selectStyle}
            >
              {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                <option key={s} value={s} style={{ background: "#0a1020" }}>
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

        <div>
          <label style={labelStyle}>Programa</label>
          <select
            value={form.programa}
            onChange={(e) => set("programa", e.target.value)}
            style={selectStyle}
          >
            {["Enfermería","Medicina","Instrumentación quirúrgica","Bacteriología"].map((p) => (
              <option key={p} value={p} style={{ background: "#0a1020" }}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Teléfono (opcional)"
          placeholder="3001234567"
          value={form.telefono}
          onChange={(e) => set("telefono", e.target.value)}
        />

        {serverError && (
          <div style={{
            background: "rgba(239,68,68,.1)",
            border: "1px solid rgba(239,68,68,.2)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{
              width: "6px", height: "6px",
              borderRadius: "50%", background: "#f87171", flexShrink: 0,
            }}/>
            <p style={{ color: "#fca5a5", fontSize: "12px", margin: 0 }}>
              {serverError}
            </p>
          </div>
        )}

        <p style={{
          color: "rgba(148,163,184,.35)",
          fontSize: "11px", margin: 0,
        }}>
          La contraseña inicial será el código del estudiante
        </p>

        <div style={{
          display: "flex", gap: "8px",
          justifyContent: "flex-end", paddingTop: "4px",
        }}>
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