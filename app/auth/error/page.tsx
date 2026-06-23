// app/auth/error/page.tsx
import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
        That link didn't work
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          maxWidth: "320px",
          marginBottom: "24px",
        }}
      >
        {reason === "missing_code"
          ? "This link is missing some information. Try requesting a new one."
          : "This confirmation link may have expired or already been used. Try signing up or signing in again."}
      </p>
      <Link
        href="/"
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-primary, #fff)",
          textDecoration: "underline",
        }}
      >
        Back to Annie
      </Link>
    </div>
  );
}