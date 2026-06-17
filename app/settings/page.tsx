"use client";
// app/settings/page.tsx
// Honest placeholder. Nothing here works yet, and the page says so plainly
// instead of pretending otherwise.

import Link from "next/link";

export default function SettingsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--permanent-ink)" }}>

      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", background: "var(--permanent-ink)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" aria-label="Back to Annie" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "12px" }}>
          Settings aren't ready yet.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", maxWidth: "320px" }}>
          When they are, this is where you'll change your language and how Annie looks. For now there's nothing to adjust here.
        </p>
      </div>
    </div>
  );
}