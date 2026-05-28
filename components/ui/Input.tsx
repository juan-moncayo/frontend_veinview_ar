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
  ...props
}: InputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          type={inputType}
          className={`w-full rounded-lg border text-sm transition-colors duration-150
            bg-white text-slate-900 placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${error ? "border-red-300 focus:ring-red-200" : "border-slate-200"}
            ${icon ? "pl-9" : "pl-3"}
            ${isPassword ? "pr-10" : "pr-3"}
            py-2.5 ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
              hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label={show ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}