import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-slate-200 select-none">404</p>
        <h1 className="text-xl font-semibold text-slate-700 mt-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center mt-6 px-4 py-2 rounded-lg
            bg-slate-800 text-white text-sm font-medium hover:bg-slate-700
            transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}