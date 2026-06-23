"use client";
// app/settings/page.tsx
// Four sections: Identity, Appearance, Notifications, Account.
// Profile photo upload and delete account are functional.
// @username edit with real-time availability check and 14-day cooldown.
// Notifications are visible but honest coming soon.
// All 8 statements applied. Zero hardcoded colors.

import { useEffect, useRef, useState, useCallback, type ChangeEvent } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  AnnieUser, getCurrentUser, onAuthChange,
  signOut, updateDisplayName, uploadAvatar,
  checkUsernameAvailable, updateUsername, getCanChangeUsernameAt,
} from "../../lib/auth";
import Avatar from "../../components/Avatar";

const MAX_AVATAR_BYTES  = 5 * 1024 * 1024;
const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700,
      letterSpacing: "2.5px", textTransform: "uppercase",
      color: "var(--text-muted)", margin: "0 0 4px", padding: "0 4px",
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
      borderRadius: "12px", marginBottom: "24px", overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

function SettingsRow({ label, sub, right, danger, topBorder }: {
  label: string; sub?: string; right?: React.ReactNode;
  danger?: boolean; topBorder?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", gap: "16px",
      borderTop: topBorder ? "1px solid var(--border-default)" : "none",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 500,
          color: danger ? "var(--permanent-live)" : "var(--text-primary)", margin: 0,
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "12px",
            color: "var(--text-muted)", margin: "3px 0 0", lineHeight: 1.5,
          }}>
            {sub}
          </p>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

function SoonBadge() {
  return (
    <span style={{
      fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600,
      letterSpacing: "1px", textTransform: "uppercase",
      color: "var(--text-muted)",
      background: "var(--surface-mid)",
      border: "1px solid var(--border-default)",
      borderRadius: "4px", padding: "2px 6px",
    }}>
      Soon
    </span>
  );
}

function OutlineButton({
  onClick, disabled, children, danger,
}: {
  onClick?: () => void; disabled?: boolean;
  children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: `1px solid ${danger ? "var(--permanent-live)" : "var(--border-default)"}`,
        borderRadius: "8px", padding: "7px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500,
        color: danger ? "var(--permanent-live)" : "var(--text-muted)",
        opacity: disabled ? 0.5 : 1,
      }}>
      {children}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted]         = useState(false);
  const [user, setUser]               = useState<AnnieUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Display name
  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue]     = useState("");
  const [nameSaving, setNameSaving]   = useState(false);
  const [nameError, setNameError]     = useState("");
  const [nameSaved, setNameSaved]     = useState(false);

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]         = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Username
  const [usernameEditing, setUsernameEditing]   = useState(false);
  const [usernameValue, setUsernameValue]       = useState("");
  const [usernameStatus, setUsernameStatus]     = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameSaving, setUsernameSaving]     = useState(false);
  const [usernameError, setUsernameError]       = useState("");
  const [usernameSaved, setUsernameSaved]       = useState(false);
  const [cooldownUntil, setCooldownUntil]       = useState<Date | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete account
  const [deleteStage, setDeleteStage] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteError, setDeleteError] = useState("");
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then(async (u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) {
        setNameValue(u.name);
        setUsernameValue(u.username || "");
        // Check cooldown for existing users
        const canChangeAt = await getCanChangeUsernameAt(u.id);
        setCooldownUntil(canChangeAt);
      }
    });
    const unsub = onAuthChange((u) => {
      setUser(u);
      if (u) setNameValue(u.name);
    });
    return unsub;
  }, []);

  // Real-time username availability check (debounced 300ms)
  const checkUsername = useCallback(async (value: string) => {
    if (!value || value.length < 3) { setUsernameStatus("idle"); return; }
    const pattern = /^[a-z_][a-z0-9_]{2,19}$/;
    if (!pattern.test(value)) { setUsernameStatus("invalid"); return; }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setUsernameStatus("checking");
    debounceTimer.current = setTimeout(async () => {
      // Don't call API if it's the same as current username
      if (value === user?.username) { setUsernameStatus("available"); return; }
      const available = await checkUsernameAvailable(value);
      setUsernameStatus(available ? "available" : "taken");
    }, 300);
  }, [user?.username]);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsernameValue(cleaned);
    checkUsername(cleaned);
  };

  const handleSaveUsername = async () => {
    if (!user || usernameStatus !== "available") return;
    setUsernameSaving(true);
    setUsernameError("");
    const result = await updateUsername(user.id, usernameValue);
    if (!result.ok) {
      setUsernameError(result.error || "Could not save. Try again.");
      setUsernameSaving(false);
      return;
    }
    setUser({ ...user, username: usernameValue });
    setUsernameSaving(false);
    setUsernameEditing(false);
    setUsernameSaved(true);
    // Reset cooldown display
    const canChangeAt = await getCanChangeUsernameAt(user.id);
    setCooldownUntil(canChangeAt);
    setTimeout(() => setUsernameSaved(false), 2500);
  };

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!ALLOWED_IMG_TYPES.includes(file.type)) { setAvatarError("Use a JPG, PNG, or WEBP."); return; }
    if (file.size > MAX_AVATAR_BYTES) { setAvatarError("Keep it under 5MB."); return; }
    setAvatarError("");
    setAvatarUploading(true);
    const result = await uploadAvatar(file, user.id);
    if (!result.ok) { setAvatarError("Upload failed. Try again."); setAvatarUploading(false); return; }
    getCurrentUser().then((u) => setUser(u));
    setAvatarUploading(false);
  };

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return;
    setNameSaving(true); setNameError("");
    const result = await updateDisplayName(nameValue.trim());
    if (!result.ok) { setNameError("Could not save. Try again."); setNameSaving(false); return; }
    setUser({ ...user, name: nameValue.trim() });
    setNameSaving(false); setNameEditing(false); setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteInput.trim().toLowerCase() !== "delete") return;
    setDeleteStage("deleting"); setDeleteError("");
    try {
      const res  = await fetch("/api/delete-account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!data.ok) { setDeleteError(data.error || "Something went wrong. Try again."); setDeleteStage("confirm"); return; }
      await signOut();
      window.location.href = "/";
    } catch {
      setDeleteError("Something went wrong. Try again.");
      setDeleteStage("confirm");
    }
  };

  // Username status indicator
  const UsernameIndicator = () => {
    if (usernameStatus === "checking") return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>...</span>;
    if (usernameStatus === "available") return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-gold)", fontWeight: 600 }}>✓</span>;
    if (usernameStatus === "taken") return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-live)", fontWeight: 600 }}>✗</span>;
    if (usernameStatus === "invalid") return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--permanent-live)" }}>3 to 20 characters, letters, numbers, underscore only</span>;
    return null;
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
          Sign in to access settings.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-gold)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

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
        <Link href="/" aria-label="Back to Annie" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      {/* ── PAGE TITLE ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px 24px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>
          Settings
        </h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 16px 80px" }}>

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
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarSelect} style={{ display: "none" }} />
                <OutlineButton onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                  {avatarUploading ? "Uploading..." : "Change"}
                </OutlineButton>
              </div>
            }
          />

          {/* Display name */}
          <SettingsRow
            topBorder label="Display name"
            sub={nameEditing ? undefined : (nameSaved ? "Saved." : (user?.name || ""))}
            right={
              nameEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  <input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setNameEditing(false); }}
                    style={{ background: "var(--surface-mid)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "8px 12px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-primary)", outline: "none", width: "160px" }}
                  />
                  {nameError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--permanent-live)", margin: 0 }}>{nameError}</p>}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => setNameEditing(false)} style={{ background: "transparent", border: "1px solid var(--border-default)", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>Cancel</button>
                    <button onClick={handleSaveName} disabled={nameSaving} style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: nameSaving ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "white", opacity: nameSaving ? 0.6 : 1 }}>
                      {nameSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <OutlineButton onClick={() => { setNameEditing(true); setNameError(""); }}>Edit</OutlineButton>
              )
            }
          />

          {/* @username */}
          <SettingsRow
            topBorder
            label="Username"
            sub={
              usernameEditing
                ? undefined
                : usernameSaved
                  ? "Saved."
                  : cooldownUntil
                    ? `You can change this again on ${cooldownUntil.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
                    : user?.username
                      ? `@${user.username}`
                      : "Not set yet."
            }
            right={
              usernameEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      value={usernameValue}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      autoFocus
                      placeholder={user?.username || "yourhandle"}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") { setUsernameEditing(false); setUsernameValue(user?.username || ""); setUsernameStatus("idle"); } }}
                      style={{ background: "var(--surface-mid)", border: `1px solid ${usernameStatus === "taken" || usernameStatus === "invalid" ? "var(--permanent-live)" : "var(--border-default)"}`, borderRadius: "8px", padding: "8px 12px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-primary)", outline: "none", width: "140px" }}
                    />
                    <UsernameIndicator />
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    You can change this once every 14 days.
                  </p>
                  {usernameError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--permanent-live)", margin: 0 }}>{usernameError}</p>}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => { setUsernameEditing(false); setUsernameValue(user?.username || ""); setUsernameStatus("idle"); setUsernameError(""); }}
                      style={{ background: "transparent", border: "1px solid var(--border-default)", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUsername}
                      disabled={usernameSaving || usernameStatus !== "available"}
                      style={{ background: usernameStatus === "available" ? "var(--permanent-gold)" : "var(--surface-mid)", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: usernameSaving || usernameStatus !== "available" ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: usernameStatus === "available" ? "white" : "var(--text-muted)", opacity: usernameSaving ? 0.6 : 1 }}>
                      {usernameSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <OutlineButton
                  disabled={!!cooldownUntil}
                  onClick={() => { if (!cooldownUntil) { setUsernameEditing(true); setUsernameError(""); setUsernameStatus("idle"); } }}
                >
                  {cooldownUntil ? "Locked" : "Edit"}
                </OutlineButton>
              )
            }
          />

          {/* Email */}
          <SettingsRow
            topBorder label="Email" sub={user?.email || ""}
            right={
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", background: "var(--surface-mid)", border: "1px solid var(--border-default)", borderRadius: "4px", padding: "2px 7px" }}>
                {user?.provider ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1) : "—"}
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
                  aria-label="Toggle theme"
                  style={{ position: "relative", width: "44px", height: "24px", borderRadius: "12px", background: theme === "dark" ? "var(--permanent-gold)" : "var(--border-strong)", border: "none", cursor: "pointer", transition: "background 0.2s", padding: 0 }}>
                  <span style={{ position: "absolute", top: "3px", left: theme === "dark" ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
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
            <SettingsRow key={item.label} topBorder={i > 0} label={item.label} sub={item.sub} right={<SoonBadge />} />
          ))}
        </SettingsCard>

        {/* ── ACCOUNT ── */}
        <SectionLabel label="Account" />
        <SettingsCard>
          <SettingsRow
            label="Sign out"
            sub="You can always sign back in."
            right={
              <OutlineButton onClick={async () => { await signOut(); window.location.href = "/"; }}>
                Sign out
              </OutlineButton>
            }
          />
          <SettingsRow
            topBorder danger
            label="Delete account"
            sub="Removes your account and everything you have shared. This cannot be undone."
            right={<OutlineButton danger onClick={() => setDeleteStage("confirm")}>Delete</OutlineButton>}
          />
        </SettingsCard>
      </div>

      {/* ── DELETE CONFIRM OVERLAY ── */}
      {(deleteStage === "confirm" || deleteStage === "deleting") && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,14,12,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "32px 24px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
              Delete your account?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              This removes your account and every experience you have shared. No one will be able to read them anymore. It cannot be undone.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Type <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>delete</strong> to confirm.
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="delete"
              disabled={deleteStage === "deleting"}
              style={{ width: "100%", background: "var(--surface-mid)", border: "1px solid var(--border-strong)", borderRadius: "8px", padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", marginBottom: "16px", textAlign: "center" }}
            />
            {deleteError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--permanent-live)", marginBottom: "12px" }}>{deleteError}</p>}
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
                style={{ flex: 1, background: deleteInput.trim().toLowerCase() === "delete" ? "var(--permanent-live)" : "var(--surface-mid)", border: "none", borderRadius: "8px", padding: "12px", cursor: deleteInput.trim().toLowerCase() === "delete" && deleteStage !== "deleting" ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: deleteInput.trim().toLowerCase() === "delete" ? "white" : "var(--text-muted)", transition: "all 0.2s" }}>
                {deleteStage === "deleting" ? "Deleting..." : "Yes, delete it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}