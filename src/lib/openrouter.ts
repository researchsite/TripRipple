/**
 * OpenRouter API client.
 * Supports both OPENROUTER_API_KEY and ANTHROPIC_API_KEY as fallback.
 * Falls back to keyword mode if neither key is set.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-3-haiku';

export async function callAI(prompt: string, maxTokens = 600): Promise<string> {
  // Prefer OpenRouter, fall back to Anthropic direct
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openRouterKey) {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tripripple.ai',
        'X-Title': 'TripRipple — Agent Memory Copilot',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  if (anthropicKey) {
    // Fall back to Anthropic SDK if available
    const { generateText } = await import('ai');
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const anthropic = createAnthropic();
    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: anthropic('claude-haiku-4-5-20251001') as any,
      prompt,
      maxTokens,
    });
    return text;
  }

  throw new Error('NO_AI_KEY');
}

export function hasAiKey(): boolean {
  return !!(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY);
}
