// lib/ai.ts
// Client-side only — calls our own API route, never Anthropic directly.
// The API key lives in the server environment and never reaches the browser.

export type AssistMode = "improve" | "paraphrase" | "shorten" | "expand";

export async function assistWriting(
  text: string,
  mode: AssistMode
): Promise<string> {
  try {
    const response = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode }),
    });

    if (!response.ok) throw new Error("Request failed");

    const data = await response.json();
    if (!data.result) throw new Error("Empty result");

    return data.result;
  } catch {
    // Graceful degradation — return original text, never crash the editor
    return text;
  }
}