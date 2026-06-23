"use client";
// components/ProfileSetupModal.tsx
// Unified profile completion modal for new + existing users.
// Captures: newsletter opt-in, display name, @username, optional photo.
// One modal, all essential profile fields. Screening: Mobile first (no scroll),
// User friendly (no friction), Modern (@handles), Premium (visual polish),
// Giants Way (Instagram/TikTok pattern), Long term (DB-backed, no localStorage).

import { useRef, useState, useCallback, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  AnnieUser,
  completeProfile,
  checkUsernameAvailable,
  generateUsernameFromName,
  uploadAvatar,
} from "../lib/auth";
import Avatar from "./Avatar";

type Props = {
  user: AnnieUser;
  onDone: () => void;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfileSetupModal({ user, onDone }: Props) {
  const t = useTranslations("profileSetup");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [newsletterChecked, setNewsletterChecked] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);
  const [username, setUsername] = useState(generateUsernameFromName(user.name));
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Debounced username availability check
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setUsernameStatus("checking");

    debounceTimer.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(value);
      setUsernameStatus(available ? "available" : "taken");
    }, 300);
  }, []);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);
    checkUsername(cleaned);
  };

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      setError("Use JPG, PNG, or WEBP");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Keep it under 5MB");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = async () => {
    if (usernameStatus !== "available") {
      setError(t("username_taken"));
      return;
    }

    setSaving(true);
    setError("");

    let finalAvatarUrl = avatarPreview;

    // Upload new avatar if changed
    if (avatarPreview && avatarPreview !== user.avatar && avatarPreview.startsWith("data:")) {
      const file = avatarInputRef.current?.files?.[0];
      if (file) {
        const result = await uploadAvatar(file, user.id);
        if (!result.ok) {
          setError("Photo upload failed");
          setSaving(false);
          return;
        }
        finalAvatarUrl = result.url;
      }
    }

    // Save profile
    const result = await completeProfile(
      user.id,
      displayName.trim(),
      username,
      newsletterChecked
    );

    if (!result.ok) {
      setError(result.error || "Something went wrong");
      setSaving(false);
      return;
    }

    setSaving(false);
    onDone();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 400,
      background: "rgba(15,14,12,0.88)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "14px",
        padding: "32px 28px",
        maxWidth: "400px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "24px",
          fontWeight: 300,
          color: "var(--text-primary)",
          lineHeight: 1.3,
          margin: "0 0 24px 0",
        }}>
          {t("title")}
        </p>

        {/* Newsletter */}
        <label style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "24px",
          cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={newsletterChecked}
            onChange={(e) => setNewsletterChecked(e.target.checked)}
            style={{
              marginTop: "3px",
              flexShrink: 0,
              cursor: "pointer",
              width: "16px",
              height: "16px",
            }}
          />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}>
            Send me occasional emails about new features and experiences worth reading.
          </span>
        </label>

        {/* Display Name */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--text-muted)",
            display: "block",
            marginBottom: "6px",
          }}>
            {t("displayName_label")}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface-mid)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              padding: "10px 12px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            color: "var(--text-muted)",
            margin: "4px 0 0 0",
          }}>
            {t("displayName_help")}
          </p>
        </div>

        {/* Username */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--text-muted)",
            display: "block",
            marginBottom: "6px",
          }}>
            {t("username_label")}
          </label>
          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "8px",
          }}>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="scotty_gaga"
              style={{
                flex: 1,
                background: "var(--surface-mid)",
                border: `1px solid ${
                  usernameStatus === "taken" ? "var(--permanent-live)" : "var(--border-default)"
                }`,
                borderRadius: "8px",
                padding: "10px 12px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "var(--text-primary)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {usernameStatus === "checking" && (
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}>
                ...
              </span>
            )}
            {usernameStatus === "available" && (
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                color: "var(--permanent-gold)",
                fontWeight: 600,
              }}>
                ✓
              </span>
            )}
            {usernameStatus === "taken" && (
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                color: "var(--permanent-live)",
                fontWeight: 600,
              }}>
                ✗
              </span>
            )}
          </div>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            color: "var(--text-muted)",
            margin: "0 0 4px 0",
          }}>
            {t("username_help")}
          </p>
        </div>

        {/* Photo Upload */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: "0 0 12px 0",
          }}>
            {t("photo_label")} <span style={{ color: "var(--text-muted)" }}>{t("photo_optional")}</span>
          </p>
          <div style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}>
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="avatar preview"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            )}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                📷 {t("photo_upload")}
              </button>
              {avatarPreview && avatarPreview !== user.avatar && (
                <button
                  onClick={() => setAvatarPreview(user.avatar)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarSelect}
            style={{ display: "none" }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "var(--permanent-live)",
            margin: "0 0 12px 0",
          }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleComplete}
          disabled={saving || usernameStatus !== "available"}
          style={{
            width: "100%",
            background: usernameStatus === "available" ? "var(--permanent-gold)" : "var(--surface-mid)",
            border: "none",
            borderRadius: "8px",
            padding: "13px",
            cursor: usernameStatus === "available" && !saving ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: usernameStatus === "available" ? "white" : "var(--text-muted)",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Completing..." : t("cta")}
        </button>
      </div>
    </div>
  );
}