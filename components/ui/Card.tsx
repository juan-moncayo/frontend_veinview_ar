import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 shadow-sm
        ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}