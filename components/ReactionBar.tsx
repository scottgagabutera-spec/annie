"use client";
// components/ReactionBar.tsx
// Annie's reaction system — text-based, human, unique.
// Five named feelings. One per user. Gold when active.
// Used on both ExperienceCard (display) and experience detail page (interactive).
// All 9 statements applied. Zero hardcoded colors.

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ReactionType = "felt_this" | "been_here" | "still_healing" | "moved_me" | "needed_this";

export const REACTIONS: { key: ReactionType; label: string }[] = [
  { key: "felt_this",      label: "Felt this"      },
  { key: "been_here",      label: "Been here"      },
  { key: "still_healing",  label: "Still healing"  },
  { key: "moved_me",       label: "Moved me"       },
  { key: "needed_this",    label: "Needed this"    },
];

export type ReactionCounts = Partial<Record<ReactionType, number>>;

type Props = {
  experienceId:   string;
  counts:         ReactionCounts;
  userReaction:   ReactionType | null;
  isSignedIn:     boolean;
  interactive:    boolean; // false on card (links to detail), true on detail page
  reflectCount?:  number;
  onReact?:       (type: ReactionType | null) => Promise<void>;
};

export default function ReactionBar({
  experienceId,
  counts,
  userReaction,
  isSignedIn,
  interactive,
  reflectCount = 0,
  onReact,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const totalReactions = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  // Dominant reaction label for card summary
  const dominant = REACTIONS.reduce<{ key: ReactionType | null; count: number }>(
    (best, r) => {
      const c = counts[r.key] ?? 0;
      return c > best.count ? { key: r.key, count: c } : best;
    },
    { key: null, count: 0 }
  );
  const dominantLabel = dominant.key
    ? REACTIONS.find((r) => r.key === dominant.key)?.label
    : null;

  const handleReact = async (key: ReactionType) => {
    if (!isSignedIn) {
      router.push(`/?redirect=/experience/${experienceId}`);
      return;
    }
    if (!interactive || !onReact || pending) return;
    setPending(true);
    const next = userReaction === key ? null : key;
    await onReact(next);
    setPending(false);
  };

  // ── CARD MODE — summary only, clicking goes to detail page ──────────
  if (!interactive) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "14px",
        flexWrap: "wrap" as const,
      }}>
        {/* Dominant reaction + total */}
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: totalReactions > 0 ? "var(--permanent-gold)" : "var(--text-muted)",
          fontWeight: totalReactions > 0 ? 600 : 400,
        }}>
          {totalReactions > 0 && dominantLabel
            ? `${dominantLabel} · ${totalReactions}`
            : "Be the first to react"}
        </span>

        {/* Reflections count */}
        {reflectCount > 0 && (
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: "12px",
            color: "var(--text-muted)",
          }}>
            {reflectCount} {reflectCount === 1 ? "reflection" : "reflections"}
          </span>
        )}
      </div>
    );
  }

  // ── DETAIL PAGE MODE — full interactive row ──────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Total summary */}
      {totalReactions > 0 && (
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: "12px",
          color: "var(--text-muted)", margin: 0,
          letterSpacing: "0.2px",
        }}>
          {totalReactions} {totalReactions === 1 ? "person reacted" : "people reacted"}
        </p>
      )}

      {/* Reaction pills */}
      <div style={{
        display: "flex", flexWrap: "wrap" as const, gap: "8px",
      }}>
        {REACTIONS.map(({ key, label }) => {
          const count  = counts[key] ?? 0;
          const active = userReaction === key;
          return (
            <button
              key={key}
              onClick={() => handleReact(key)}
              disabled={pending}
              style={{
                background:    active ? "var(--gold-soft)"      : "transparent",
                border:        `1px solid ${active ? "var(--permanent-gold)" : "var(--border-default)"}`,
                borderRadius:  "var(--radius-sm)",
                padding:       "6px 12px",
                cursor:        pending ? "default" : "pointer",
                fontFamily:    "'Inter', sans-serif",
                fontSize:      "13px",
                fontWeight:    active ? 600 : 400,
                color:         active ? "var(--permanent-gold)" : "var(--text-muted)",
                display:       "flex",
                alignItems:    "center",
                gap:           "6px",
                transition:    "all 0.15s ease",
                whiteSpace:    "nowrap" as const,
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  fontSize:   "11px",
                  fontWeight: active ? 700 : 400,
                  color:      active ? "var(--permanent-gold)" : "var(--text-muted)",
                  opacity:    active ? 1 : 0.7,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sign in nudge */}
      {!isSignedIn && (
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: "12px",
          color: "var(--text-muted)", margin: 0,
        }}>
          <button
            onClick={() => router.push(`/?redirect=/experience/${experienceId}`)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: "inherit",
              color: "var(--permanent-gold)", fontWeight: 600, padding: 0,
            }}
          >
            Sign in
          </button>
          {" "}to react
        </p>
      )}
    </div>
  );
}