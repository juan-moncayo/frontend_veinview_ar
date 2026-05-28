"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import api from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Intentar login como profesor primero
    try {
      const { data } = await api.post("/api/profesor/login/", {
        username: form.username.trim(),
        password: form.password,
      });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("profesor", JSON.stringify(data.profesor));
      localStorage.setItem("rol", "profesor");
      router.push("/dashboard");
      return;
    } catch {
      // No es profesor, intentar como estudiante
    }

    // Intentar login como estudiante (username = correo, password = codigo)
    try {
      const { data } = await api.post("/api/token/", {
        username: form.username.trim(),
        password: form.password,
      });

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("rol", "estudiante");

      // Obtener perfil del estudiante
      const perfilRes = await api.get("/api/estudiantes/mi_perfil/", {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      localStorage.setItem("estudiante", JSON.stringify(perfilRes.data));
      router.push("/estudiante");
      return;
    } catch {
      setError(
        "Usuario o contraseña incorrectos. " +
        "Profesores usan su usuario, estudiantes usan su correo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center
            justify-center mx-auto mb-4 text-white font-bold text-xl">
            V
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">VeinView AR</h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Usuario o correo"
              placeholder="usuario o correo@universidad.edu"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              icon={<LogIn size={15} />}
              className="w-full mt-1"
            >
              {loading ? "Verificando..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Profesores: usuario y contraseña asignados
            </p>
            <p className="text-xs text-slate-400 text-center mt-0.5">
              Estudiantes: correo y código universitario
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          VeinView AR — Sistema de prácticas de canalización v3.4
        </p>
      </div>
    </div>
  );
}