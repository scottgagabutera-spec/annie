"use client";
// app/plus/page.tsx
// Premium pricing page. Annie's voice throughout.
// One price shown. Honest about not being open yet.
// All 10 statements applied. Zero hardcoded colors.

import Link from "next/link";

const FREE_FEATURES = [
  "Read every experience",
  "Share your own experience",
  "Up to 3 photos per experience",
  "Carry experiences forward",
  "YouTube and Vimeo video links",
  "Annie writing assist (3 times a day)",
];

const PLUS_FEATURES = [
  "Everything in free",
  "Unlimited photos per experience",
  "Unlimited writing assist",
  "Upload video directly to Annie",
  "Voice to text — speak your experience",
  "Early access to new features",
  "Creator earnings when they launch",
];

function FeatureRow({ label, gold }: { label: string; gold?: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "9px 0",
      borderBottom: "1px solid var(--border-default)",
    }}>
      <div style={{
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        background: gold ? "var(--gold-soft)" : "var(--surface-mid)",
        border: `1px solid ${gold ? "var(--permanent-gold)" : "var(--border-strong)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "2px",
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
          stroke={gold ? "var(--permanent-gold)" : "var(--text-muted)"}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "13px",
        color: gold ? "var(--text-primary)" : "var(--text-soft)",
        margin: 0,
        lineHeight: 1.5,
      }}>
        {label}
      </p>
    </div>
  );
}

export default function PlusPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-bg)" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: "56px",
        background: "var(--surface-bg)",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <Link href="/" aria-label="Back to Annie" style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "6px", display: "flex", alignItems: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-primary)" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "20px",
          fontWeight: 600, color: "var(--text-primary)", textDecoration: "none",
        }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      {/* ── HERO ── */}
      <div style={{
        maxWidth: "560px", margin: "0 auto",
        padding: "56px 24px 40px", textAlign: "center", position: "relative",
      }}>
        <div style={{
          position: "absolute", top: "40px", left: "50%",
          transform: "translateX(-50%)", width: "400px", height: "200px",
          background: "radial-gradient(ellipse at center, var(--gold-soft) 0%, transparent 70%)",
          pointerEvents: "none", opacity: 0.5,
        }} />

        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600,
          letterSpacing: "3px", textTransform: "uppercase",
          color: "var(--permanent-gold)", opacity: 0.85,
          display: "block", marginBottom: "16px",
        }}>
          Annie Plus
        </span>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 300,
          color: "var(--text-primary)", lineHeight: 1.18,
          margin: "0 auto 16px", maxWidth: "440px",
        }}>
          More room for the stories that need it.
        </h1>

        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: "14px",
          color: "var(--text-muted)", maxWidth: "360px",
          margin: "0 auto 32px", fontWeight: 300, lineHeight: 1.7,
        }}>
          Some experiences take more than words. Plus gives you the space,
          the tools, and a stake in what Annie becomes.
        </p>

        {/* Price card */}
        <div style={{
          background: "var(--gold-pale)",
          border: "1px solid var(--border-strong)",
          borderRadius: "14px", padding: "24px",
          maxWidth: "320px", margin: "0 auto",
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "42px",
            fontWeight: 300, color: "var(--text-primary)",
            margin: "0 0 4px", lineHeight: 1,
          }}>
            $1.50
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "12px",
            color: "var(--text-muted)", margin: "0 0 20px",
          }}>
            a month. Pricing reflects where you live.
          </p>
          <div style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px", padding: "12px 16px",
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: "13px",
              fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px",
            }}>
              Not open yet.
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: "12px",
              color: "var(--text-muted)", margin: 0, lineHeight: 1.5,
            }}>
              This page exists so you know it is coming. You will be able
              to subscribe here when it is ready.
            </p>
          </div>
        </div>
      </div>

      {/* ── WHAT YOU GET ── */}
      <div style={{
        maxWidth: "560px", margin: "0 auto",
        padding: "0 16px 80px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
      }}>
        {/* Free */}
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px", padding: "20px",
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700,
            letterSpacing: "2px", textTransform: "uppercase",
            color: "var(--text-muted)", margin: "0 0 16px",
          }}>
            Free
          </p>
          {FREE_FEATURES.map((f) => <FeatureRow key={f} label={f} />)}
        </div>

        {/* Plus */}
        <div style={{
          background: "var(--gold-pale)",
          border: "1px solid var(--permanent-gold)",
          borderRadius: "12px", padding: "20px",
        }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700,
            letterSpacing: "2px", textTransform: "uppercase",
            color: "var(--permanent-gold)", margin: "0 0 16px",
          }}>
            Plus
          </p>
          {PLUS_FEATURES.map((f) => <FeatureRow key={f} label={f} gold />)}
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .plus-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}