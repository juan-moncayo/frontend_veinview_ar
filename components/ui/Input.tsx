"use client";
import { InputHTMLAttributes, useState, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  type = "text",
  className = "",
  style,
  ...props
}: InputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{
          color: "rgba(148,163,184,.65)",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(148,163,184,.45)",
            display: "flex", alignItems: "center",
            pointerEvents: "none",
          }}>
            {icon}
          </span>
        )}
        <input
          type={inputType}
          className={className}
          style={{
            width: "100%",
            background: error
              ? "rgba(239,68,68,.06)" : "rgba(255,255,255,.06)",
            border: `1px solid ${error
              ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.1)"}`,
            borderRadius: "11px",
            padding: `11px ${isPassword ? "40px" : "14px"} 11px ${icon ? "40px" : "14px"}`,
            color: "white",
            fontSize: "14px",
            outline: "none",
            transition: "border-color .2s, background .2s",
            boxSizing: "border-box",
            WebkitAppearance: "none",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? "rgba(239,68,68,.5)" : "rgba(96,165,250,.5)";
            e.currentTarget.style.background = "rgba(255,255,255,.09)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.1)";
            e.currentTarget.style.background = error
              ? "rgba(239,68,68,.06)" : "rgba(255,255,255,.06)";
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(148,163,184,.45)",
              display: "flex", alignItems: "center",
              padding: "2px",
            }}
            tabIndex={-1}
            aria-label={show ? "Ocultar" : "Mostrar"}
          >
            {show
              ? <EyeOff size={15} color="rgba(148,163,184,.5)"/>
              : <Eye size={15} color="rgba(148,163,184,.5)"/>
            }
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: "#fca5a5", fontSize: "11px", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}