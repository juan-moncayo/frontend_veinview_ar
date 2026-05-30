import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  style?: React.CSSProperties;
}

export default function Card({
  children,
  className = "",
  padding = true,
  style,
}: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: "16px",
        ...(padding ? { padding: "18px" } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}