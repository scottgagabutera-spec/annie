// app/api/assist/route.ts
// Server-side only. The Anthropic API key never reaches the browser.
// Receives { text, mode } from the ShareFlow client, returns { result }.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

type AssistMode = "improve" | "paraphrase" | "shorten" | "expand";

const PROMPTS: Record<AssistMode, string> = {
  improve:
    "Improve the clarity and flow of this personal experience while keeping the author's voice completely intact. Do not make it sound formal or press-release-like. Return only the improved text, nothing else.",
  paraphrase:
    "Paraphrase this text in a way that preserves the meaning and emotional truth but uses different words. Keep it human and personal. Return only the paraphrased text, nothing else.",
  shorten:
    "Shorten this text by removing anything that does not add to the core experience. Keep every sentence that carries emotional weight. Return only the shortened text, nothing else.",
  expand:
    "Expand this text by adding more sensory detail and emotional honesty where it feels thin. Do not add facts that are not implied. Return only the expanded text, nothing else.",
};

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!PROMPTS[mode as AssistMode]) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 1000,
        system:
          "You are a writing assistant for Annie, a platform where people share real experiences. Your only job is to help people express their truth more clearly. You never change the facts, never add emotions that are not there, and never make personal writing sound corporate or AI-generated. You return only the requested text with no preamble, no explanation, and no quotes around the result.",
        messages: [{ role: "user", content: `${PROMPTS[mode as AssistMode]}\n\n${text}` }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const data = await response.json();
    const result = data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text;

    if (!result) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    return NextResponse.json({ result: result.trim() });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}