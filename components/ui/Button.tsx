import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
    color: "white",
    border: "none",
    boxShadow: "0 4px 16px rgba(59,130,246,.35), inset 0 1px 0 rgba(255,255,255,.15)",
  },
  secondary: {
    background: "rgba(255,255,255,.06)",
    color: "rgba(148,163,184,.8)",
    border: "1px solid rgba(255,255,255,.1)",
  },
  ghost: {
    background: "transparent",
    color: "rgba(148,163,184,.7)",
    border: "none",
  },
  danger: {
    background: "rgba(239,68,68,.1)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,.2)",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "7px 12px", fontSize: "12px", gap: "6px" },
  md: { padding: "10px 16px", fontSize: "13px", gap: "7px" },
  lg: { padding: "12px 20px", fontSize: "14px", gap: "8px" },
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "11px",
        fontWeight: 500,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? .5 : 1,
        transition: "opacity .2s, transform .15s",
        position: "relative",
        overflow: "hidden",
        WebkitAppearance: "none",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <svg
            style={{ animation: "spin .8s linear infinite", flexShrink: 0 }}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </>
      ) : icon ? (
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}