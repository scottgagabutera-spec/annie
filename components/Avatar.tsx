"use client";
// components/Avatar.tsx
// Reusable avatar — shows Google photo if available, gold initials if not.

import { AnnieUser } from "../lib/auth";

type Props = {
  user: AnnieUser;
  size?: number;
};

export default function Avatar({ user, size = 30 }: Props) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--permanent-gold)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      fontSize: size * 0.37,
      fontWeight: 600, color: "white", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}