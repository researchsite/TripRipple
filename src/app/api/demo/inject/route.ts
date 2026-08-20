import { NextResponse } from 'next/server';
import { getState, patchState, logAction } from '@/lib/store';
import { callAI, hasAiKey } from '@/lib/openrouter';

type ClassifiedEvent = {
  type: 'decision' | 'constraint' | 'dependency' | 'info';
  subject: string;
  keyFact: string;
  affects: string[];
  confidence: number;
};

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    let classified: ClassifiedEvent | null = null;

    if (hasAiKey()) {
      try {
        const raw = await callAI(
          `Classify this message about a San Diego group weekend trip. Return valid JSON only — no markdown, no explanation.

Message: "${text}"

Required JSON format:
{"type":"decision|constraint|dependency|info","subject":"max 8 words","keyFact":"max 15 words","affects":["person or plan name"],"confidence":0.0}`,
          200
        );
        const match = raw.match(/\{[\s\S]*?\}/);
        if (match) classified = JSON.parse(match[0]);
      } catch {
        // fall through to keyword default
      }
    }

    if (!classified) {
      const lower = text.toLowerCase();
      const type: ClassifiedEvent['type'] =
        lower.includes('decide') || lower.includes('going with') || lower.includes('confirmed')
          ? 'decision'
          : lower.includes('must') || lower.includes('require') || lower.includes('need')
          ? 'constraint'
          : lower.includes('depend') || lower.includes('based on') || lower.includes('because of')
          ? 'dependency'
          : 'info';

      classified = {
        type,
        subject: text.slice(0, 50).trim(),
        keyFact: 'Added to trip memory',
        affects: ['organizer'],
        confidence: 0.6,
      };
    }

    const state = getState();
    patchState({ sourceEventCount: state.sourceEventCount + 1 });
    logAction(
      'Event injected',
      `${classified.type.toUpperCase()}: ${classified.subject}`,
      'HUMAN_CONFIRMED'
    );

    return NextResponse.json({
      eventId: `E-INJ-${Date.now().toString().slice(-4)}`,
      classified,
      state: getState(),
    });
  } catch (err) {
    console.error('/api/demo/inject error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
