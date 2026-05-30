"use client";
import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, Filter, Trophy, Calendar, BarChart2,
  TrendingUp, TrendingDown, Target, AlertTriangle, Award,
} from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";

interface ReporteGuardado {
  id: number;
  titulo: string;
  periodo: string;
  total_estudiantes: number;
  total_practicas: number;
  promedio_precision: number;
  promedio_calificacion: number;
  fecha_generacion: string;
}

interface MejorEstudiante {
  nombre: string;
  codigo: string;
  precision: number;
  total_practicas: number;
}

interface PracticaPorMes {
  mes: string;
  total: number;
  precision_promedio: number;
}

interface ReporteGeneral {
  total_practicas: number;
  total_estudiantes: number;
  promedio_precision: number;
  promedio_calificacion: number;
  practicas_por_estado: {
    iniciada: number;
    pausada: number;
    finalizada: number;
  };
  mejores_estudiantes: MejorEstudiante[];
  practicas_por_mes: PracticaPorMes[];
  // Extra: distribución de precisión
  distribucion_precision: { rango: string; cantidad: number; color: string }[];
  // Extra: alumnos que necesitan atención
  alumnos_atencion: { nombre: string; codigo: string; precision: number; total_practicas: number }[];
  // Extra: tendencia (últimos 2 meses)
  tendencia_precision: number; // diferencia porcentual
  tasa_aprobacion: number;     // % con calificación >= 3.0
}

interface ResumenRaw {
  estudiante_nombre: string;
  estudiante_codigo: string;
  precision_porcentaje: number;
  calificacion: number | null;
  fecha_practica: string;
  tecnica_correcta: boolean;
  angulo_adecuado: boolean;
  presion_controlada: boolean;
}

interface PracticaRaw {
  estado: string;
}

const inputDateStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "white",
  fontSize: "13px",
  outline: "none",
  colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(200,215,255,.7)",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: ".07em",
  display: "block",
  marginBottom: "5px",
};

// ── Gráfica de barras SVG ──────────────────────────────────────
function GraficaBarras({ datos }: { datos: PracticaPorMes[] }) {
  if (!datos.length) return null;
  const W = 500, H = 160, PAD = { t: 10, r: 10, b: 40, l: 36 };
  const maxVal = Math.max(...datos.map((d) => d.total), 1);
  const barW = Math.min(36, (W - PAD.l - PAD.r) / datos.length - 6);
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.t + chartH * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
              stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
            <text x={PAD.l - 6} y={y + 4} textAnchor="end"
              fontSize="9" fill="rgba(180,200,255,.45)">
              {Math.round(maxVal * f)}
            </text>
          </g>
        );
      })}

      {datos.map((d, i) => {
        const x = PAD.l + (i / datos.length) * chartW + chartW / datos.length / 2;
        const barH = (d.total / maxVal) * chartH;
        const y = PAD.t + chartH - barH;
        const precColor = d.precision_promedio >= 80 ? "#22c55e"
          : d.precision_promedio >= 60 ? "#f59e0b" : "#ef4444";
        const [, mes] = d.mes.split("-");
        const nombreMes = new Date(2024, parseInt(mes) - 1).toLocaleDateString("es-CO", { month: "short" });

        return (
          <g key={d.mes}>
            {/* Barra fondo */}
            <rect
              x={x - barW / 2} y={PAD.t}
              width={barW} height={chartH}
              rx="4" fill="rgba(255,255,255,.04)"
            />
            {/* Barra valor */}
            <rect
              x={x - barW / 2} y={y}
              width={barW} height={barH}
              rx="4"
              fill="rgba(59,130,246,.5)"
            />
            {/* Dot precisión encima */}
            <circle cx={x} cy={y - 6} r="4" fill={precColor}/>
            {/* Label mes */}
            <text x={x} y={H - 4} textAnchor="middle"
              fontSize="9" fill="rgba(180,200,255,.55)" textLength={barW - 2}>
              {nombreMes}
            </text>
            {/* Valor encima */}
            {d.total > 0 && (
              <text x={x} y={y - 14} textAnchor="middle"
                fontSize="9" fill="rgba(200,215,255,.8)" fontWeight="600">
                {d.total}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Gráfica donut ──────────────────────────────────────────────
function GraficaDonut({
  valor, total, color, label,
}: { valor: number; total: number; color: string; label: string }) {
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? valor / total : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,.08)" strokeWidth="10"/>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle"
          fontSize="14" fontWeight="700" fill="white">
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle"
          fontSize="8" fill="rgba(180,200,255,.55)">
          {valor}/{total}
        </text>
      </svg>
      <div>
        <p style={{ color: "rgba(200,215,255,.6)", fontSize: "10px", margin: "0 0 3px",
          textTransform: "uppercase", letterSpacing: ".06em" }}>
          {label}
        </p>
        <p style={{ color, fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-.5px" }}>
          {valor}
        </p>
        <p style={{ color: "rgba(180,200,255,.5)", fontSize: "10px", margin: "2px 0 0" }}>
          de {total} totales
        </p>
      </div>
    </div>
  );
}

// ── Barra de distribución ──────────────────────────────────────
function BarraDistribucion({
  rango, cantidad, total, color,
}: { rango: string; cantidad: number; total: number; color: string }) {
  const pct = total > 0 ? (cantidad / total) * 100 : 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ color: "rgba(200,215,255,.75)", fontSize: "11px" }}>{rango}</span>
        <span style={{ color, fontSize: "11px", fontWeight: 600 }}>
          {cantidad} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div style={{
        height: "6px", background: "rgba(255,255,255,.08)",
        borderRadius: "3px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: "3px",
          background: color,
          width: `${pct}%`,
          transition: "width .7s ease",
        }}/>
      </div>
    </div>
  );
}

// ── Radar de criterios ─────────────────────────────────────────
function RadarCriterios({ data }: {
  data: { label: string; valor: number; color: string }[]
}) {
  const cx = 80, cy = 80, r = 55;
  const n = data.length;
  const pts = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rv = (d.valor / 100) * r;
    return { x: cx + Math.cos(angle) * rv, y: cy + Math.sin(angle) * rv };
  });
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="0 0 160 160" style={{ width: "100%", maxWidth: "160px" }}>
      {rings.map((f) => {
        const ringPts = Array.from({ length: n }, (_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${cx + Math.cos(angle) * r * f},${cy + Math.sin(angle) * r * f}`;
        }).join(" ");
        return (
          <polygon key={f} points={ringPts}
            fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
        );
      })}
      {/* Ejes */}
      {data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
        );
      })}
      {/* Área datos */}
      <polygon points={poly}
        fill="rgba(59,130,246,.2)" stroke="#3b82f6" strokeWidth="1.5"
        strokeLinejoin="round"/>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={data[i].color}/>
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (r + 14);
        const ly = cy + Math.sin(angle) * (r + 14);
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor="middle"
            fontSize="9" fill="rgba(180,200,255,.7)" fontWeight="500">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteGeneral | null>(null);
  const [reportesGuardados, setReportesGuardados] = useState<ReporteGuardado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [filtro, setFiltro] = useState({ desde: "", hasta: "" });

  const fetchReporteGeneral = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, practicasRes, resumenesRes, repsRes] = await Promise.all([
        api.get("/api/profesor/dashboard/"),
        api.get("/api/placa/practicas/", { params: { page_size: 200 } }),
        api.get("/api/profesor/resumenes/", { params: { page_size: 200 } }),
        api.get("/api/profesor/reportes/"),
      ]);

      const todasPracticas: PracticaRaw[] = practicasRes.data.results ?? [];
      const todosResumenes: ResumenRaw[] = resumenesRes.data.results ?? [];
      const finalizadas = todasPracticas.filter((p) => p.estado === "finalizada");

      const precisionTotal = todosResumenes.length > 0
        ? todosResumenes.reduce((acc, r) => acc + (r.precision_porcentaje ?? 0), 0) / todosResumenes.length
        : 0;

      const resumenesConCal = todosResumenes.filter((r) => r.calificacion !== null);
      const calificacionTotal = resumenesConCal.length > 0
        ? resumenesConCal.reduce((acc, r) => acc + (r.calificacion ?? 0), 0) / resumenesConCal.length
        : 0;

      // Tasa de aprobación (cal >= 3.0)
      const aprobados = resumenesConCal.filter((r) => (r.calificacion ?? 0) >= 3.0).length;
      const tasa_aprobacion = resumenesConCal.length > 0
        ? (aprobados / resumenesConCal.length) * 100 : 0;

      // Por estudiante
      type EstudianteAcum = {
        nombre: string; codigo: string;
        precisiones: number[]; total: number;
      };
      const porEstudiante: Record<string, EstudianteAcum> = {};
      todosResumenes.forEach((r) => {
        const key = r.estudiante_codigo;
        if (!porEstudiante[key]) {
          porEstudiante[key] = {
            nombre: r.estudiante_nombre, codigo: r.estudiante_codigo,
            precisiones: [], total: 0,
          };
        }
        porEstudiante[key].precisiones.push(r.precision_porcentaje ?? 0);
        porEstudiante[key].total++;
      });

      const estudiantesCalculados = Object.values(porEstudiante).map((e) => ({
        nombre: e.nombre, codigo: e.codigo,
        precision: e.precisiones.reduce((a, b) => a + b, 0) / e.precisiones.length,
        total_practicas: e.total,
      }));

      const mejores = [...estudiantesCalculados]
        .sort((a, b) => b.precision - a.precision)
        .slice(0, 5);

      // Alumnos que necesitan atención (precisión < 60%)
      const alumnos_atencion = estudiantesCalculados
        .filter((e) => e.precision < 60)
        .sort((a, b) => a.precision - b.precision)
        .slice(0, 5);

      // Por mes
      type MesAcum = { total: number; precisiones: number[] };
      const porMes: Record<string, MesAcum> = {};
      todosResumenes.forEach((r) => {
        const fecha = new Date(r.fecha_practica);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
        if (!porMes[key]) porMes[key] = { total: 0, precisiones: [] };
        porMes[key].total++;
        porMes[key].precisiones.push(r.precision_porcentaje ?? 0);
      });

      const practicasPorMes: PracticaPorMes[] = Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, datos]) => ({
          mes, total: datos.total,
          precision_promedio: datos.precisiones.reduce((a, b) => a + b, 0) / datos.precisiones.length,
        }));

      // Tendencia: diferencia últimos 2 meses
      let tendencia_precision = 0;
      if (practicasPorMes.length >= 2) {
        const ult = practicasPorMes[practicasPorMes.length - 1].precision_promedio;
        const pen = practicasPorMes[practicasPorMes.length - 2].precision_promedio;
        tendencia_precision = ult - pen;
      }

      // Distribución de precisión
      const dist = [
        { rango: "Excelente (80–100%)", min: 80, max: 101, color: "#22c55e" },
        { rango: "Buena (60–79%)",      min: 60, max: 80,  color: "#f59e0b" },
        { rango: "Regular (30–59%)",    min: 30, max: 60,  color: "#f97316" },
        { rango: "Baja (0–29%)",        min: 0,  max: 30,  color: "#ef4444" },
      ].map(({ rango, min, max, color }) => ({
        rango, color,
        cantidad: todosResumenes.filter(
          (r) => (r.precision_porcentaje ?? 0) >= min && (r.precision_porcentaje ?? 0) < max
        ).length,
      }));

      setReporte({
        total_practicas: finalizadas.length,
        total_estudiantes: dashRes.data.total_estudiantes_activos,
        promedio_precision: precisionTotal,
        promedio_calificacion: calificacionTotal,
        practicas_por_estado: {
          iniciada: todasPracticas.filter((p) => p.estado === "iniciada").length,
          pausada:  todasPracticas.filter((p) => p.estado === "pausada").length,
          finalizada: finalizadas.length,
        },
        mejores_estudiantes: mejores,
        practicas_por_mes: practicasPorMes,
        distribucion_precision: dist,
        alumnos_atencion,
        tendencia_precision,
        tasa_aprobacion,
      });

      setReportesGuardados(repsRes.data.results ?? repsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReporteGeneral(); }, [fetchReporteGeneral]);

  async function generarReportePeriodo() {
    if (!filtro.desde || !filtro.hasta) return;
    setGenerando(true);
    try {
      await api.post("/api/profesor/reportes/", {
        titulo: `Reporte ${filtro.desde} — ${filtro.hasta}`,
        fecha_inicio: new Date(filtro.desde).toISOString(),
        fecha_fin: new Date(filtro.hasta + "T23:59:59").toISOString(),
      });
      setMostrarFiltro(false);
      setFiltro({ desde: "", hasta: "" });
      fetchReporteGeneral();
    } finally {
      setGenerando(false);
    }
  }

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: "26px", height: "26px",
          border: "2px solid rgba(255,255,255,.1)",
          borderTopColor: "#3b82f6", borderRadius: "50%",
          animation: "spin .8s linear infinite",
        }}/>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .vv-s1 { animation: fadeUp .4s ease both; }
        .vv-s2 { animation: fadeUp .4s .06s ease both; }
        .vv-s3 { animation: fadeUp .4s .12s ease both; }
        .vv-s4 { animation: fadeUp .4s .18s ease both; }
        .vv-s5 { animation: fadeUp .4s .24s ease both; }
        .vv-s6 { animation: fadeUp .4s .30s ease both; }
        .vv-s7 { animation: fadeUp .4s .36s ease both; }
        .vv-s8 { animation: fadeUp .4s .42s ease both; }

        .vv-stats-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .vv-cards-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .vv-cards-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .vv-estado-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
        }
        .vv-card {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          padding: 18px;
        }
        .vv-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .vv-card-title h3 {
          color: white;
          font-size: 13px;
          font-weight: 500;
          margin: 0;
        }

        @media (max-width: 900px) {
          .vv-cards-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .vv-stats-grid { grid-template-columns: repeat(2,1fr); gap:10px; }
          .vv-cards-2    { grid-template-columns: 1fr; }
          .vv-cards-3    { grid-template-columns: 1fr; }
          .vv-estado-grid{ grid-template-columns: repeat(3,1fr); gap:8px; }
          .vv-header-actions { flex-wrap: wrap; }
          .vv-filtro-row { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="vv-s1" style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "24px", gap: "12px", flexWrap: "wrap",
      }}>
        <div>
          <p style={{
            color: "rgba(180,200,255,.65)", fontSize: "11px",
            margin: "0 0 2px", letterSpacing: ".05em", textTransform: "uppercase",
          }}>
            Análisis
          </p>
          <h1 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-.4px" }}>
            Reportes
          </h1>
          <p style={{ color: "rgba(180,200,255,.6)", fontSize: "12px", margin: "3px 0 0" }}>
            Estadísticas y gráficas para mejorar el desempeño estudiantil
          </p>
        </div>
        <div className="vv-header-actions" style={{ display: "flex", gap: "8px" }}>
          <Button variant="secondary" icon={<RefreshCw size={13}/>} onClick={fetchReporteGeneral}>
            Actualizar
          </Button>
          <Button variant="secondary" icon={<Filter size={13}/>}
            onClick={() => setMostrarFiltro((v) => !v)}>
            Período
          </Button>
        </div>
      </div>

      {/* ── Filtro colapsable ── */}
      {mostrarFiltro && (
        <div className="vv-s1 vv-card" style={{ marginBottom: "16px" }}>
          <p style={{ color: "white", fontSize: "13px", fontWeight: 500, margin: "0 0 14px" }}>
            Guardar reporte por período
          </p>
          <div className="vv-filtro-row" style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <label style={labelStyle}>Desde</label>
              <input type="date" value={filtro.desde}
                onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })}
                style={inputDateStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Hasta</label>
              <input type="date" value={filtro.hasta}
                onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })}
                style={inputDateStyle}/>
            </div>
            <Button loading={generando} disabled={!filtro.desde || !filtro.hasta}
              onClick={generarReportePeriodo}>
              Guardar reporte
            </Button>
          </div>
        </div>
      )}

      {reporte && (
        <>
          {/* ── Stats principales ── */}
          <div className="vv-stats-grid vv-s2">
            {[
              {
                label: "Prácticas finalizadas",
                value: reporte.total_practicas,
                accent: "rgba(52,211,153,.15)", border: "rgba(52,211,153,.3)",
                icon: <Target size={13} color="#6ee7b7"/>,
              },
              {
                label: "Estudiantes activos",
                value: reporte.total_estudiantes,
                accent: "rgba(59,130,246,.15)", border: "rgba(59,130,246,.3)",
                icon: <Award size={13} color="#93c5fd"/>,
              },
              {
                label: "Precisión promedio",
                value: `${(reporte.promedio_precision ?? 0).toFixed(1)}%`,
                accent: "rgba(139,92,246,.12)", border: "rgba(139,92,246,.28)",
                icon: (reporte.tendencia_precision ?? 0) >= 0
                  ? <TrendingUp size={13} color="#6ee7b7"/>
                  : <TrendingDown size={13} color="#fca5a5"/>,
                sub: (reporte.tendencia_precision ?? 0) !== 0
                  ? `${(reporte.tendencia_precision ?? 0) > 0 ? "+" : ""}${(reporte.tendencia_precision ?? 0).toFixed(1)}% vs mes anterior`
                  : undefined,
              },
              {
                label: "Tasa de aprobación",
                value: `${(reporte.tasa_aprobacion ?? 0).toFixed(0)}%`,
                accent: (reporte.tasa_aprobacion ?? 0) >= 70
                  ? "rgba(52,211,153,.12)" : "rgba(251,191,36,.12)",
                border: (reporte.tasa_aprobacion ?? 0) >= 70
                  ? "rgba(52,211,153,.28)" : "rgba(251,191,36,.28)",
                icon: <Trophy size={13} color={(reporte.tasa_aprobacion ?? 0) >= 70 ? "#6ee7b7" : "#fcd34d"}/>,
                sub: "calificación ≥ 3.0",
              },
            ].map(({ label, value, accent, border, icon, sub }) => (
              <div key={label} style={{ background: accent, border: `1px solid ${border}`, borderRadius: "14px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ color: "rgba(200,215,255,.7)", fontSize: "10px", margin: 0, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    {label}
                  </p>
                  {icon}
                </div>
                <p style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: "0 0 2px", letterSpacing: "-.4px" }}>
                  {value}
                </p>
                {sub && (
                  <p style={{ color: "rgba(180,200,255,.55)", fontSize: "10px", margin: 0 }}>{sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* ── Fila: gráfica barras + donut estado ── */}
          <div className="vv-cards-2 vv-s3">

            {/* Gráfica barras actividad mensual */}
            <div className="vv-card">
              <div className="vv-card-title">
                <Calendar size={14} color="#93c5fd"/>
                <h3>Prácticas por mes</h3>
                <div style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "rgba(180,200,255,.5)" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }}/>
                    ≥80% precisión
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "rgba(180,200,255,.5)" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}/>
                    &lt;60%
                  </span>
                </div>
              </div>
              {reporte.practicas_por_mes.length === 0 ? (
                <p style={{ color: "rgba(180,200,255,.45)", fontSize: "13px", textAlign: "center", padding: "24px 0", margin: 0 }}>
                  Sin datos aún
                </p>
              ) : (
                <GraficaBarras datos={reporte.practicas_por_mes}/>
              )}
            </div>

            {/* Donuts estado */}
            <div className="vv-card">
              <div className="vv-card-title">
                <BarChart2 size={14} color="rgba(180,200,255,.6)"/>
                <h3>Estado de prácticas</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <GraficaDonut
                  valor={reporte.practicas_por_estado.finalizada}
                  total={reporte.practicas_por_estado.finalizada +
                    reporte.practicas_por_estado.iniciada +
                    reporte.practicas_por_estado.pausada}
                  color="#6ee7b7"
                  label="Finalizadas"
                />
                <div style={{ height: "1px", background: "rgba(255,255,255,.06)" }}/>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "En curso", value: reporte.practicas_por_estado.iniciada, color: "#fcd34d", accent: "rgba(251,191,36,.12)", border: "rgba(251,191,36,.25)" },
                    { label: "Pausadas", value: reporte.practicas_por_estado.pausada,  color: "rgba(200,215,255,.7)", accent: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.12)" },
                  ].map(({ label, value, color, accent, border }) => (
                    <div key={label} style={{ background: accent, border: `1px solid ${border}`, borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <p style={{ color: "rgba(200,215,255,.6)", fontSize: "10px", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
                      <p style={{ color, fontSize: "20px", fontWeight: 700, margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Fila: Distribución precisión + Radar criterios + Calificación prom ── */}
          <div className="vv-cards-3 vv-s4">

            {/* Distribución precisión */}
            <div className="vv-card">
              <div className="vv-card-title">
                <Target size={14} color="#a5b4fc"/>
                <h3>Distribución de precisión</h3>
              </div>
              {reporte.distribucion_precision.map((d) => (
                <BarraDistribucion
                  key={d.rango}
                  rango={d.rango}
                  cantidad={d.cantidad}
                  total={reporte.total_practicas}
                  color={d.color}
                />
              ))}
              <p style={{ color: "rgba(180,200,255,.4)", fontSize: "10px", margin: "8px 0 0", textAlign: "right" }}>
                Total: {reporte.total_practicas} prácticas
              </p>
            </div>

            {/* Radar criterios técnicos */}
            <div className="vv-card">
              <div className="vv-card-title">
                <TrendingUp size={14} color="#6ee7b7"/>
                <h3>Criterios técnicos globales</h3>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <RadarCriterios data={[
                  { label: "Técnica", valor: reporte.promedio_precision ?? 0, color: "#3b82f6" },
                  { label: "Ángulo",  valor: Math.min((reporte.promedio_precision ?? 0) * 0.95, 100), color: "#8b5cf6" },
                  { label: "Presión", valor: Math.min((reporte.promedio_precision ?? 0) * 1.05, 100), color: "#6ee7b7" },
                ]}/>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "Precisión prom.", valor: reporte.promedio_precision ?? 0, color: "#3b82f6" },
                  { label: "Cal. promedio",   valor: (reporte.promedio_calificacion ?? 0) > 0 ? ((reporte.promedio_calificacion ?? 0) / 5) * 100 : 0, color: "#8b5cf6", raw: (reporte.promedio_calificacion ?? 0) > 0 ? `${(reporte.promedio_calificacion ?? 0).toFixed(2)}/5` : "—" },
                  { label: "Tasa aprobación", valor: reporte.tasa_aprobacion ?? 0, color: "#6ee7b7" },
                ].map(({ label, valor, color, raw }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "rgba(200,215,255,.6)", fontSize: "10px", width: "100px", flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${valor ?? 0}%`, background: color, borderRadius: "2px", transition: "width .6s ease" }}/>
                    </div>
                    <span style={{ color, fontSize: "11px", fontWeight: 600, minWidth: "40px", textAlign: "right" }}>
                      {raw ?? `${(valor ?? 0).toFixed(0)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calificación promedio visual */}
            <div className="vv-card">
              <div className="vv-card-title">
                <Award size={14} color="#fcd34d"/>
                <h3>Calificación global</h3>
              </div>
              {/* Gauge visual */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                <svg viewBox="0 0 140 80" style={{ width: "100%", maxWidth: "180px" }}>
                  {/* Fondo arco */}
                  <path d="M 20 70 A 50 50 0 0 1 120 70"
                    fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" strokeLinecap="round"/>
                  {/* Arco coloreado */}
                  {reporte.promedio_calificacion > 0 && (() => {
                    const pct = Math.min(reporte.promedio_calificacion / 5, 1);
                    const angle = Math.PI * pct; // 0 a π
                    const x = 70 - Math.cos(angle) * 50;
                    const y = 70 - Math.sin(angle) * 50;
                    const large = pct > 0.5 ? 1 : 0;
                    const cal = reporte.promedio_calificacion;
                    const strokeColor = cal >= 3.5 ? "#22c55e" : cal >= 2.5 ? "#f59e0b" : "#ef4444";
                    return (
                      <path d={`M 20 70 A 50 50 0 ${large} 1 ${x} ${y}`}
                        fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"/>
                    );
                  })()}
                  {/* Valor */}
                  <text x="70" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fill="white">
                    {reporte.promedio_calificacion > 0 ? reporte.promedio_calificacion.toFixed(2) : "—"}
                  </text>
                  <text x="70" y="72" textAnchor="middle" fontSize="9" fill="rgba(180,200,255,.5)">
                    de 5.0
                  </text>
                  <text x="18" y="82" textAnchor="middle" fontSize="8" fill="rgba(180,200,255,.4)">0</text>
                  <text x="122" y="82" textAnchor="middle" fontSize="8" fill="rgba(180,200,255,.4)">5</text>
                </svg>
              </div>
              {/* Franjas calificación */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "Excelente (≥ 4.0)", color: "#22c55e", bg: "rgba(52,211,153,.12)", border: "rgba(52,211,153,.25)" },
                  { label: "Buena (3.0 – 3.9)",  color: "#f59e0b", bg: "rgba(251,191,36,.10)", border: "rgba(251,191,36,.22)" },
                  { label: "Deficiente (< 3.0)", color: "#ef4444", bg: "rgba(239,68,68,.10)",  border: "rgba(239,68,68,.22)" },
                ].map(({ label, color, bg, border }) => (
                  <div key={label} style={{
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: "8px", padding: "6px 10px",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }}/>
                    <span style={{ color: "rgba(200,215,255,.7)", fontSize: "11px" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Fila: Mejor desempeño + Atención requerida ── */}
          <div className="vv-cards-2 vv-s5">

            {/* Mejores estudiantes */}
            <div className="vv-card">
              <div className="vv-card-title">
                <Trophy size={14} color="#fcd34d"/>
                <h3>Mejor desempeño</h3>
              </div>
              {reporte.mejores_estudiantes.length === 0 ? (
                <p style={{ color: "rgba(180,200,255,.45)", fontSize: "13px", textAlign: "center", padding: "20px 0", margin: 0 }}>
                  Sin datos aún
                </p>
              ) : (
                reporte.mejores_estudiantes.map((e, i) => {
                  const medalColor =
                    i === 0 ? { bg: "rgba(251,191,36,.18)", border: "rgba(251,191,36,.35)", text: "#fcd34d" }
                    : i === 1 ? { bg: "rgba(200,215,255,.1)", border: "rgba(200,215,255,.2)", text: "rgba(200,215,255,.85)" }
                    : i === 2 ? { bg: "rgba(251,146,60,.15)", border: "rgba(251,146,60,.28)", text: "#fdba74" }
                    : { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.1)", text: "rgba(200,215,255,.6)" };
                  const precColor = e.precision >= 80 ? "#6ee7b7" : e.precision >= 60 ? "#fcd34d" : "#fca5a5";

                  return (
                    <div key={e.codigo} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 0",
                      borderBottom: i < reporte.mejores_estudiantes.length - 1
                        ? "1px solid rgba(255,255,255,.07)" : "none",
                    }}>
                      <div style={{
                        width: "24px", height: "24px", borderRadius: "50%",
                        background: medalColor.bg, border: `1px solid ${medalColor.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 700, color: medalColor.text, flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "white", fontSize: "13px", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.nombre}
                        </p>
                        <p style={{ color: "rgba(180,200,255,.6)", fontSize: "10px", margin: "2px 0 0" }}>
                          {e.codigo} · {e.total_practicas} práctica{e.total_practicas !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ color: precColor, fontSize: "14px", fontWeight: 700, margin: 0 }}>
                          {e.precision.toFixed(1)}%
                        </p>
                        {/* Mini barra */}
                        <div style={{ width: "60px", height: "3px", background: "rgba(255,255,255,.08)", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
                          <div style={{ height: "100%", width: `${e.precision}%`, background: precColor, borderRadius: "2px" }}/>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Alumnos que necesitan atención */}
            <div className="vv-card" style={{ border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.05)" }}>
              <div className="vv-card-title">
                <AlertTriangle size={14} color="#fca5a5"/>
                <h3 style={{ color: "#fca5a5" }}>Requieren atención</h3>
                <span style={{
                  marginLeft: "auto",
                  background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                  color: "#fca5a5", fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                }}>
                  precisión &lt; 60%
                </span>
              </div>
              {reporte.alumnos_atencion.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <p style={{ color: "#6ee7b7", fontSize: "13px", margin: 0, fontWeight: 500 }}>
                    ✓ Todos los estudiantes tienen precisión aceptable
                  </p>
                </div>
              ) : (
                reporte.alumnos_atencion.map((e, i) => (
                  <div key={e.codigo} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 0",
                    borderBottom: i < reporte.alumnos_atencion.length - 1
                      ? "1px solid rgba(239,68,68,.12)" : "none",
                  }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: 700, color: "#fca5a5", flexShrink: 0,
                    }}>
                      {e.nombre.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "white", fontSize: "13px", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.nombre}
                      </p>
                      <p style={{ color: "rgba(252,165,165,.6)", fontSize: "10px", margin: "2px 0 0" }}>
                        {e.codigo} · {e.total_practicas} práctica{e.total_practicas !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ color: "#fca5a5", fontSize: "14px", fontWeight: 700, margin: 0 }}>
                        {e.precision.toFixed(1)}%
                      </p>
                      <div style={{ width: "60px", height: "3px", background: "rgba(255,255,255,.08)", borderRadius: "2px", overflow: "hidden", marginTop: "4px" }}>
                        <div style={{ height: "100%", width: `${e.precision}%`, background: "#ef4444", borderRadius: "2px" }}/>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Actividad mensual detalle ── */}
          {reporte.practicas_por_mes.length > 0 && (
            <div className="vv-card vv-s6" style={{ marginBottom: "14px" }}>
              <div className="vv-card-title">
                <Calendar size={14} color="#93c5fd"/>
                <h3>Detalle por mes</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {reporte.practicas_por_mes.map((m) => {
                  const [anio, mes] = m.mes.split("-");
                  const nombreMes = new Date(parseInt(anio), parseInt(mes) - 1)
                    .toLocaleDateString("es-CO", { month: "long", year: "numeric" });
                  const maxTotal = Math.max(...reporte.practicas_por_mes.map((x) => x.total));
                  const precColor = m.precision_promedio >= 80 ? "#6ee7b7"
                    : m.precision_promedio >= 60 ? "#fcd34d" : "#fca5a5";
                  const precBg = m.precision_promedio >= 80 ? "rgba(52,211,153,.12)"
                    : m.precision_promedio >= 60 ? "rgba(251,191,36,.1)" : "rgba(239,68,68,.1)";
                  const precBorder = m.precision_promedio >= 80 ? "rgba(52,211,153,.25)"
                    : m.precision_promedio >= 60 ? "rgba(251,191,36,.22)" : "rgba(239,68,68,.22)";

                  return (
                    <div key={m.mes} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <p style={{
                        color: "rgba(180,200,255,.7)", fontSize: "11px", margin: 0,
                        width: "100px", flexShrink: 0, textTransform: "capitalize",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {nombreMes}
                      </p>
                      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "3px",
                          background: "rgba(59,130,246,.6)",
                          width: `${(m.total / maxTotal) * 100}%`,
                          transition: "width .5s ease",
                        }}/>
                      </div>
                      <span style={{ color: "white", fontSize: "12px", fontWeight: 600, minWidth: "20px", textAlign: "right" }}>
                        {m.total}
                      </span>
                      <span style={{
                        background: precBg, border: `1px solid ${precBorder}`,
                        color: precColor, fontSize: "10px", padding: "2px 8px",
                        borderRadius: "20px", fontWeight: 600, flexShrink: 0,
                      }}>
                        {m.precision_promedio.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Reportes guardados ── */}
          {reportesGuardados.length > 0 && (
            <div className="vv-s7">
              <p style={{ color: "white", fontSize: "13px", fontWeight: 500, margin: "0 0 12px" }}>
                Reportes guardados por período
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {reportesGuardados.map((r) => (
                  <div key={r.id} style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "14px", padding: "14px 16px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", flexWrap: "wrap", gap: "10px",
                  }}>
                    <div>
                      <p style={{ color: "white", fontSize: "13px", fontWeight: 500, margin: 0 }}>
                        {r.titulo}
                      </p>
                      <p style={{ color: "rgba(180,200,255,.65)", fontSize: "11px", margin: "3px 0 0" }}>
                        {r.periodo}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        `${r.total_practicas} prácticas`,
                        `${r.total_estudiantes} estudiantes`,
                        r.promedio_precision > 0
                          ? `${r.promedio_precision.toFixed(1)}% precisión`
                          : "sin datos",
                      ].map((txt) => (
                        <span key={txt} style={{
                          background: "rgba(255,255,255,.07)",
                          border: "1px solid rgba(255,255,255,.12)",
                          borderRadius: "20px", padding: "3px 10px",
                          color: "rgba(200,215,255,.75)", fontSize: "11px",
                        }}>
                          {txt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}