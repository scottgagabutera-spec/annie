"use client";
// components/ShareModal.tsx
// "Share an experience" bottom sheet modal.

import { useState } from "react";
import { SHARE_TYPES } from "../lib/categories";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ShareModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position:   "fixed",
        bottom:     0, left: 0, right: 0,
        zIndex:     300,
        background: "var(--surface-card)",
        borderRadius: "16px 16px 0 0",
        padding:    "24px 20px 48px",
        maxHeight:  "85dvh",
        overflowY:  "auto",
        overscrollBehavior: "contain",
      }}>
      {/* Drag handle */}
      <div style={{ width: "36px", height: "4px", background: "var(--border-default)", borderRadius: "2px", margin: "0 auto 20px" }} />

      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
        Share an experience
      </h3>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
        Who is sharing? No credentials required.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
        {SHARE_TYPES.map((type) => (
          <div
            key={type.key}
            onClick={() => setSelected(type.key)}
            style={{
              border:       `1px solid ${selected === type.key ? "var(--permanent-gold)" : "var(--border-default)"}`,
              borderRadius: "var(--radius-md)",
              padding:      "12px 14px",
              cursor:       "pointer",
              fontFamily:   "'Inter', sans-serif",
              fontSize:     "13px",
              fontWeight:   selected === type.key ? 600 : 500,
              color:        selected === type.key ? "var(--permanent-gold)" : "var(--text-primary)",
              background:   selected === type.key ? "var(--gold-soft)" : "transparent",
              transition:   "all 0.15s",
            }}>
            {type.label}
          </div>
        ))}
      </div>

      <button
        disabled={!selected}
        style={{
          width:       "100%",
          background:  selected ? "var(--permanent-gold)" : "rgba(255,255,255,0.08)",
          color:       selected ? "white" : "rgba(246,241,234,0.3)",
          border:      "none",
          padding:     "15px",
          borderRadius: "var(--radius-md)",
          fontFamily:  "'Inter', sans-serif",
          fontSize:    "14px",
          fontWeight:  600,
          cursor:      selected ? "pointer" : "not-allowed",
          transition:  "all 0.2s",
        }}>
        Continue
      </button>
    </div>
  );
}