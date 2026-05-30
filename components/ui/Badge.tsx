type Color = "green" | "yellow" | "red" | "gray" | "blue";

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
}

const styles: Record<Color, React.CSSProperties> = {
  green: {
    background: "rgba(52,211,153,.12)",
    border: "1px solid rgba(52,211,153,.25)",
    color: "#6ee7b7",
  },
  yellow: {
    background: "rgba(251,191,36,.1)",
    border: "1px solid rgba(251,191,36,.2)",
    color: "#fcd34d",
  },
  red: {
    background: "rgba(239,68,68,.1)",
    border: "1px solid rgba(239,68,68,.2)",
    color: "#fca5a5",
  },
  gray: {
    background: "rgba(148,163,184,.08)",
    border: "1px solid rgba(148,163,184,.15)",
    color: "rgba(148,163,184,.6)",
  },
  blue: {
    background: "rgba(59,130,246,.12)",
    border: "1px solid rgba(59,130,246,.2)",
    color: "#93c5fd",
  },
};

export default function Badge({ color = "gray", children }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...styles[color],
      }}
    >
      {children}
    </span>
  );
}