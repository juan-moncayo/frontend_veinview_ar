"use client";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px",
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Card */}
      <div style={{
        position: "relative",
        width: "100%", maxWidth: "480px",
        background: "rgba(10,16,35,.97)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: "20px",
        boxShadow: "0 25px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Línea gradiente top */}
        <div style={{
          height: "1px",
          background: "linear-gradient(90deg,transparent,rgba(96,165,250,.6),rgba(99,102,241,.6),transparent)",
        }}/>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px 16px",
          borderBottom: "1px solid rgba(255,255,255,.07)",
        }}>
          <h2 style={{
            color: "white", fontSize: "15px",
            fontWeight: 600, margin: 0, letterSpacing: "-.3px",
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "rgba(148,163,184,.6)",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              width: "30px", height: "30px",
              transition: "background .15s",
            }}
          >
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div style={{
          overflowY: "auto", flex: 1,
          padding: "20px 22px",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}