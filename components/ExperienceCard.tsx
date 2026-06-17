"use client";
// components/ExperienceCard.tsx
// Handles all four card states: text, image, video, live.
// Features not yet built show a "coming soon" state — visible but not interactive.
// Props marked optional default gracefully so existing usage does not break.

type MediaType = "image" | "video" | "none";

type Props = {
  // Core content
  pullQuote:     string;
  category:      string;
  tag?:          string;
  authorInitial: string;
  authorName:    string;
  authorNote?:   string;
  title:         string;
  excerpt?:      string;

  // Media
  mediaType?:    MediaType;
  mediaUrl?:     string;      // image URL or YouTube/TikTok link
  mediaCount?:   number;      // number of images if multiple

  // Live state
  isLive?:       boolean;
  liveStarted?:  string;      // e.g. "12 min ago"

  // Stats
  carriedCount?:  string | number;
  responseCount?: string | number;
  readTime?:      string | number;

  // Feature gates
  isPlus?:       boolean;     // viewer has Annie Plus
};

// Image area — shown when mediaType is "image"
function ImageArea({ url, count }: { url?: string; count?: number }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "200px", background: url ? "transparent" : "#1a1814", overflow: "hidden" }}>
      {url ? (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      )}
      {count && count > 1 && (
        <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(15,14,12,0.72)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.8)", fontWeight: 500 }}>
          1 of {count}
        </div>
      )}
    </div>
  );
}

// Video area — shown when mediaType is "video". Not interactive yet — coming soon.
function VideoArea({ url }: { url?: string }) {
  const source = url?.includes("youtube") ? "YouTube" : url?.includes("tiktok") ? "TikTok" : url?.includes("instagram") ? "Instagram" : "Video";
  return (
    <div style={{ position: "relative", width: "100%", height: "200px", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(191,155,78,0.12)", border: "1.5px solid rgba(191,155,78,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(191,155,78,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
      {source && (
        <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(15,14,12,0.8)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.5)" }}>
          {source}
        </div>
      )}
    </div>
  );
}

// Live bar shown at top of live experiences
function LiveBar({ started }: { started?: string }) {
  return (
    <div style={{ background: "#c13a3a", padding: "7px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", flexShrink: 0 }} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: "white", letterSpacing: "1px", textTransform: "uppercase" }}>Live now</span>
      {started && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.65)", marginLeft: "auto" }}>
          Started {started}
        </span>
      )}
    </div>
  );
}

export default function ExperienceCard({
  pullQuote, category, tag, authorInitial, authorName, authorNote,
  title, excerpt, mediaType = "none", mediaUrl, mediaCount,
  isLive = false, liveStarted, carriedCount = 0, responseCount = 0,
  readTime, isPlus = false,
}: Props) {
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer" }}>

      {/* Live bar */}
      {isLive && <LiveBar started={liveStarted} />}

      {/* Media — image or video */}
      {mediaType === "image" && <ImageArea url={mediaUrl} count={mediaCount} />}
      {mediaType === "video" && <VideoArea url={mediaUrl} />}

      {/* Pull quote */}
      <div style={{ background: "var(--permanent-ink)", padding: "28px 24px 24px", position: "relative" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "72px", color: "var(--permanent-gold)", opacity: 0.2, position: "absolute", top: "-4px", left: "18px", lineHeight: 1, pointerEvents: "none" }}>"</div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(17px, 4vw, 22px)", fontStyle: "italic", fontWeight: 300, color: "var(--permanent-parchment)", lineHeight: 1.55, position: "relative", paddingTop: "16px" }}>
          {pullQuote}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)", opacity: 0.8 }}>
            {category}{tag ? ` · ${tag}` : ""}
          </p>
          {isLive && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, color: "#c13a3a", letterSpacing: "1px", textTransform: "uppercase" }}>
              Updating
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>

        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isLive ? "rgba(193,58,58,0.15)" : "var(--gold-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 600, color: isLive ? "#c13a3a" : "var(--permanent-gold)", flexShrink: 0 }}>
            {authorInitial}
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{authorName}</p>
            {authorNote && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>{authorNote}</p>}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.28, marginBottom: "10px" }}>
          {title}
        </h2>

        {/* Excerpt */}
        {excerpt && (
          <p style={{ fontSize: "15px", color: "var(--text-soft)", lineHeight: 1.72, marginBottom: "16px", fontWeight: 300 }}>
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" as const, gap: "8px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" as const, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {carriedCount} carried this forward
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {responseCount} responses
            </span>
            {readTime && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {readTime} min read
              </span>
            )}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: isLive ? "#c13a3a" : "var(--permanent-gold)", cursor: "pointer" }}>
            {isLive ? "Follow" : "Read"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}