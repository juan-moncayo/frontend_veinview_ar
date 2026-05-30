interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "24px",
      gap: "12px",
      flexWrap: "wrap",
    }}>
      <div>
        <h1 style={{
          color: "white",
          fontSize: "20px",
          fontWeight: 700,
          margin: 0,
          letterSpacing: "-.4px",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            color: "rgba(148,163,184,.5)",
            fontSize: "12px",
            margin: "3px 0 0",
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {actions}
        </div>
      )}
    </div>
  );
}