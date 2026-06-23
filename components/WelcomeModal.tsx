"use client";
// components/WelcomeModal.tsx
// Shown once, on first login. Writes has_seen_welcome + newsletter_opted_in
// back to the profiles table via markWelcomeSeen(). Never shows again after that.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnnieUser, markWelcomeSeen } from "../lib/auth";

type Props = {
  user: AnnieUser;
  onDone: () => void;
};

export default function WelcomeModal({ user, onDone }: Props) {
  const t = useTranslations("welcome");
  const [newsletterChecked, setNewsletterChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleClose = async () => {
    setSaving(true);
    await markWelcomeSeen(user.id, newsletterChecked);
    setSaving(false);
    onDone();
  };

  const firstName = user.name.split(" ")[0];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(15,14,12,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "14px",
        padding: "32px 28px",
        maxWidth: "400px",
        width: "100%",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "24px",
          fontWeight: 300,
          color: "var(--text-primary)",
          marginBottom: "12px",
          lineHeight: 1.3,
        }}>
          {t("title", { name: firstName })}
        </p>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          color: "var(--text-muted)",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}>
          {t("body")}
        </p>

        <label style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          textAlign: "left",
          marginBottom: "24px",
          cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={newsletterChecked}
            onChange={(e) => setNewsletterChecked(e.target.checked)}
            style={{ marginTop: "3px", flexShrink: 0, cursor: "pointer" }}
          />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}>
            {t("newsletter_label")}
          </span>
        </label>

        <button
          onClick={handleClose}
          disabled={saving}
          style={{
            width: "100%",
            background: "var(--permanent-gold)",
            border: "none",
            borderRadius: "8px",
            padding: "13px",
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "white",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "..." : t("cta")}
        </button>
      </div>
    </div>
  );
}