"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { isLoggedIn, getRol } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    if (getRol() === "estudiante") { router.replace("/estudiante"); return; }
  }, [router]);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .vv-main    { padding-left: 0 !important; padding-top: 56px !important; }
          .vv-content { padding: 16px !important; }
        }
      `}</style>
      <div style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#060c1a",
      }}>
        <Sidebar />
        <main
          className="vv-main"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingLeft: "220px",
          }}
        >
          <div
            className="vv-content"
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "28px",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </>
  );
}