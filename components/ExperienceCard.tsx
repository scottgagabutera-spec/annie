"use client";
// components/ExperienceCard.tsx
// The featured experience card. Will eventually receive real data from Supabase.

type Props = {
  pullQuote: string;
  category: string;
  tag: string;
  authorInitial: string;
  authorName: string;
  authorNote: string;
  title: string;
  excerpt: string;
  carriedCount: string;
  responseCount: string;
  readTime: string;
};

export default function ExperienceCard({
  pullQuote, category, tag, authorInitial, authorName, authorNote,
  title, excerpt, carriedCount, responseCount, readTime,
}: Props) {
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer" }}>
      {/* Pull quote section */}
      <div style={{ background: "var(--permanent-ink)", padding: "28px 24px 24px", position: "relative" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "72px", color: "var(--permanent-gold)", opacity: 0.2, position: "absolute", top: "-4px", left: "18px", lineHeight: 1, pointerEvents: "none" }}>"</div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(17px, 4vw, 22px)", fontStyle: "italic", fontWeight: 300, color: "var(--permanent-parchment)", lineHeight: 1.55, position: "relative", paddingTop: "16px" }}>
          {pullQuote}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)", marginTop: "16px", opacity: 0.8 }}>
          {category} · {tag}
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--gold-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 600, color: "var(--permanent-gold)", flexShrink: 0 }}>
            {authorInitial}
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{authorName}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>{authorNote}</p>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.28, marginBottom: "10px" }}>
          {title}
        </h2>

        <p style={{ fontSize: "15px", color: "var(--text-soft)", lineHeight: 1.72, marginBottom: "16px", fontWeight: 300 }}>
          {excerpt}
        </p>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
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
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {readTime} min read
            </span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--permanent-gold)", cursor: "pointer" }}>
            Read
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}