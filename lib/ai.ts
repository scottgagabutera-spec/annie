// lib/ai.ts
// AI writing assist — Claude as primary, graceful degradation if unavailable.
// Called from the share page. Never auto-runs — only when user asks for help.

export type AssistMode = "improve" | "paraphrase" | "shorten" | "expand";

export async function assistWriting(
  text: string,
  mode: AssistMode
): Promise<string> {
  const prompts: Record<AssistMode, string> = {
    improve:
      "Improve the clarity and flow of this personal experience while keeping the author's voice completely intact. Do not make it sound formal or press-release-like. Return only the improved text, nothing else.",
    paraphrase:
      "Paraphrase this text in a way that preserves the meaning and emotional truth but uses different words. Keep it human and personal. Return only the paraphrased text, nothing else.",
    shorten:
      "Shorten this text by removing anything that doesn't add to the core experience. Keep every sentence that carries emotional weight. Return only the shortened text, nothing else.",
    expand:
      "Expand this text by adding more sensory detail and emotional honesty where it feels thin. Do not add facts that aren't implied. Return only the expanded text, nothing else.",
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system:
          "You are a writing assistant for Annie, a platform where people share real experiences. Your only job is to help people express their truth more clearly. You never change the facts, never add emotions that aren't there, and never make personal writing sound corporate or AI-generated. You return only the requested text — no preamble, no explanation, no quotes around the result.",
        messages: [{ role: "user", content: `${prompts[mode]}\n\n${text}` }],
      }),
    });

    const data = await response.json();
    const result = data.content?.find((b: any) => b.type === "text")?.text;
    if (!result) throw new Error("No response");
    return result.trim();
  } catch {
    // Graceful degradation — return original text, never crash the editor
    return text;
  }
}