"use client";
// app/settings/page.tsx
// Four sections: Identity, Appearance, Notifications, Danger Zone.
// Profile photo upload and delete account are functional.
// Notifications and privacy are visible but honest coming soon.
// All 9 statements applied throughout.

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AnnieUser, getCurrentUser, onAuthChange, signOut, updateDisplayName, uploadAvatar } from "../../lib/auth";
import Avatar from "../../components/Avatar";

const MAX_AVATAR_BYTES   = 5 * 1024 * 1024;
const ALLOWED_IMG_TYPES  = ["image/jpeg", "image/png", "image/webp"];

// ─── Reusable row components ──────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "2.5px",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      margin: "0 0 4px",
      padding: "0 20px",
    }}>
      {label}
    </p>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "12px",
      margin: "0 16px 24px",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  sub,
  right,
  danger,
  topBorder,
}: {
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  topBorder?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 20px",
      gap: "16px",
      borderTop: topBorder ? "1px solid var(--border-default)" : "none",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          color: danger ? "#e07070" : "var(--text-primary)",
          margin: 0,
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "var(--text-muted)",
            margin: "3px 0 0",
            lineHeight: 1.5,
          }}>
            {sub}
          </p>
        )}
      </div>
      {right && (
        <div style={{ flexShrink: 0 }}>
          {right}
        </div>
      )}
    </div>
  );
}

function SoonBadge() {
  return (
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "9px",
      fontWeight: 600,
      letterSpacing: "1px",
      textTransform: "uppercase",
      color: "rgba(246,241,234,0.35)",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "4px",
      padding: "2px 6px",
    }}>
      Soon
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [user, setUser]             = useState<AnnieUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Display name edit
  const [nameEditing, setNameEditing]   = useState(false);
  const [nameValue, setNameValue]       = useState("");
  const [nameSaving, setNameSaving]     = useState(false);
  const [nameError, setNameError]       = useState("");
  const [nameSaved, setNameSaved]       = useState(false);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]         = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Delete account
  const [deleteStage, setDeleteStage]   = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteError, setDeleteError]   = useState("");
  const [deleteInput, setDeleteInput]   = useState("");

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) setNameValue(u.name);
    });
    const unsub = onAuthChange((u) => {
      setUser(u);
      if (u) setNameValue(u.name);
    });
    return unsub;
  }, []);

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      setAvatarError("Use a JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Keep it under 5MB.");
      return;
    }
    setAvatarError("");
    setAvatarUploading(true);
    const result = await uploadAvatar(file, user.id);
    if (!result.ok) {
      setAvatarError("Upload failed. Try again.");
      setAvatarUploading(false);
      return;
    }
    // Refresh user so Avatar component picks up the new URL
    getCurrentUser().then((u) => setUser(u));
    setAvatarUploading(false);
  };

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return;
    setNameSaving(true);
    setNameError("");
    const result = await updateDisplayName(nameValue.trim());
    if (!result.ok) {
      setNameError("Could not save. Try again.");
      setNameSaving(false);
      return;
    }
    setUser({ ...user, name: nameValue.trim() });
    setNameSaving(false);
    setNameEditing(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteInput.trim().toLowerCase() !== "delete") return;
    setDeleteStage("deleting");
    setDeleteError("");

    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setDeleteError(data.error || "Something went wrong. Try again.");
        setDeleteStage("confirm");
        return;
      }
      // Sign out and redirect home
      await signOut();
      window.location.href = "/";
    } catch {
      setDeleteError("Something went wrong. Try again.");
      setDeleteStage("confirm");
    }
  };

  // ── Not signed in ──
  if (authChecked && !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "12px" }}>
          Sign in to access settings.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-gold)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--permanent-ink)" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "56px",
        background: "var(--permanent-ink)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
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

      {/* ── PAGE TITLE ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px 24px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "28px",
          fontWeight: 300,
          color: "var(--permanent-parchment)",
          margin: 0,
        }}>
          Settings
        </h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px" }}>

        {/* ── IDENTITY ── */}
        <SectionLabel label="Identity" />
        <SettingsCard>

          {/* Profile photo */}
          <SettingsRow
            label="Profile photo"
            sub={avatarUploading ? "Uploading..." : avatarError || "Shown next to your name on experiences you share."}
            right={
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {user && <Avatar user={user} size={40} />}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    cursor: avatarUploading ? "not-allowed" : "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    opacity: avatarUploading ? 0.5 : 1,
                  }}>
                  {avatarUploading ? "Uploading..." : "Change"}
                </button>
              </div>
            }
          />

          {/* Display name */}
          <SettingsRow
            topBorder
            label="Display name"
            sub={nameEditing ? undefined : (nameSaved ? "Saved." : (user?.name || ""))}
            right={
              nameEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  <input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      color: "var(--permanent-parchment)",
                      outline: "none",
                      width: "160px",
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setNameEditing(false); }}
                  />
                  {nameError && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#e07070", margin: 0 }}>{nameError}</p>
                  )}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setNameEditing(false)}
                      style={{ background: "transparent", border: "1px solid var(--border-default)", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveName}
                      disabled={nameSaving}
                      style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: nameSaving ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "white", opacity: nameSaving ? 0.6 : 1 }}>
                      {nameSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setNameEditing(true); setNameError(""); }}
                  style={{ background: "transparent", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "var(--text-muted)" }}>
                  Edit
                </button>
              )
            }
          />

          {/* Email — read only */}
          <SettingsRow
            topBorder
            label="Email"
            sub={user?.email || ""}
            right={
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-default)", borderRadius: "4px", padding: "2px 7px" }}>
                Google
              </span>
            }
          />
        </SettingsCard>

        {/* ── APPEARANCE ── */}
        <SectionLabel label="Appearance" />
        <SettingsCard>
          <SettingsRow
            label="Theme"
            sub={mounted ? (theme === "dark" ? "Dark" : "Light") : ""}
            right={
              mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    background: theme === "dark" ? "var(--permanent-gold)" : "rgba(255,255,255,0.15)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    padding: 0,
                  }}>
                  <span style={{
                    position: "absolute",
                    top: "3px",
                    left: theme === "dark" ? "23px" : "3px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 0.2s",
                    display: "block",
                  }} />
                </button>
              )
            }
          />
        </SettingsCard>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel label="Notifications" />
        <SettingsCard>
          {[
            { label: "Someone carries your experience forward", sub: "Know when your story reaches someone." },
            { label: "Someone responds to your experience",     sub: "Conversations that start with what you shared." },
            { label: "Weekly digest",                           sub: "A summary of what was shared that week." },
          ].map((item, i) => (
            <SettingsRow
              key={item.label}
              topBorder={i > 0}
              label={item.label}
              sub={item.sub}
              right={<SoonBadge />}
            />
          ))}
        </SettingsCard>

        {/* ── DANGER ZONE ── */}
        <SectionLabel label="Account" />
        <SettingsCard>
          <SettingsRow
            label="Sign out"
            sub="You can always sign back in with Google."
            right={
              <button
                onClick={async () => { await signOut(); window.location.href = "/"; }}
                style={{ background: "transparent", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "var(--text-muted)" }}>
                Sign out
              </button>
            }
          />
          <SettingsRow
            topBorder
            label="Delete account"
            sub="Removes your account and everything you have shared. This cannot be undone."
            danger
            right={
              <button
                onClick={() => setDeleteStage("confirm")}
                style={{ background: "transparent", border: "1px solid rgba(193,58,58,0.35)", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "#e07070" }}>
                Delete
              </button>
            }
          />
        </SettingsCard>

      </div>

      {/* ── DELETE CONFIRM OVERLAY ── */}
      {(deleteStage === "confirm" || deleteStage === "deleting") && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,14,12,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "var(--permanent-ink)", border: "1px solid rgba(193,58,58,0.25)", borderRadius: "14px", padding: "32px 24px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "12px" }}>
              Delete your account?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)", marginBottom: "24px", lineHeight: 1.6 }}>
              This removes your account and every experience you have shared. No one will be able to read them anymore. It cannot be undone.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.4)", marginBottom: "8px" }}>
              Type <strong style={{ color: "rgba(246,241,234,0.7)", fontWeight: 600 }}>delete</strong> to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="delete"
              disabled={deleteStage === "deleting"}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(193,58,58,0.3)",
                borderRadius: "8px",
                padding: "10px 12px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "var(--permanent-parchment)",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "16px",
                textAlign: "center",
              }}
            />
            {deleteError && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#e07070", marginBottom: "12px" }}>{deleteError}</p>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { setDeleteStage("idle"); setDeleteInput(""); setDeleteError(""); }}
                disabled={deleteStage === "deleting"}
                style={{ flex: 1, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "12px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
                Keep my account
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput.trim().toLowerCase() !== "delete" || deleteStage === "deleting"}
                style={{
                  flex: 1,
                  background: deleteInput.trim().toLowerCase() === "delete" ? "#c13a3a" : "rgba(193,58,58,0.15)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  cursor: deleteInput.trim().toLowerCase() === "delete" && deleteStage !== "deleting" ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: deleteInput.trim().toLowerCase() === "delete" ? "white" : "rgba(193,58,58,0.4)",
                  transition: "all 0.2s",
                }}>
                {deleteStage === "deleting" ? "Deleting..." : "Yes, delete it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}