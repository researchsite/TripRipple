import { NextResponse } from 'next/server';
import { searchSourceEvents, getAllDecisions, getActiveConstraints } from '@/lib/elastic';
import { callAI, hasAiKey } from '@/lib/openrouter';

export async function POST(req: Request) {
  try {
    const { question, mode = 'with-memory' } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    // ── Without-memory mode: bare AI answer, no context ──────────────────────
    if (mode === 'without-memory') {
      if (hasAiKey()) {
        const answer = await callAI(
          `Answer this question briefly (2 sentences max): "${question}"`,
          150
        );
        return NextResponse.json({ answer, sources: [], mode: 'without-memory' });
      }
      return NextResponse.json({
        answer: "I don't have any specific information about this trip or its requirements.",
        sources: [],
        mode: 'without-memory',
      });
    }

    // ── With-memory mode: search ES + synthesize ──────────────────────────────
    const [events, decisions, constraints] = await Promise.all([
      searchSourceEvents(question),
      getAllDecisions(),
      getActiveConstraints(),
    ]);

    if (hasAiKey()) {
      const context = [
        'ACTIVE DECISIONS:',
        ...decisions
          .filter((d) => d.state === 'Active')
          .map((d) => `[${d.id}] ${d.subject}: ${d.newValue} — Reason: ${d.reason}`),
        '',
        'HARD CONSTRAINTS:',
        ...constraints.map((c) => `[${c.id}] ${c.traveler} needs ${c.requirement} (${c.severity})`),
        '',
        'MATCHING SOURCE EVENTS:',
        ...events.slice(0, 6).map((e) => `[${e.id}] From ${e.author} via ${e.sourceType}: "${e.text}"`),
      ].join('\n');

      const answer = await callAI(
        `You are TripRipple, an agent memory copilot for a San Diego weekend group trip.

Answer the question using ONLY the trip memory provided. Be concise (2-3 sentences). Cite IDs in [brackets].

Question: ${question}

Trip Memory:
${context}`,
        400
      );

      return NextResponse.json({ answer, sources: events.slice(0, 3), mode: 'with-memory' });
    }

    // Keyword fallback — no API key
    const answer =
      events.length > 0
        ? `Found ${events.length} matching records. Key facts: $230/night cap, 4 rooms required, Maya needs elevator + step-free entrance + roll-in shower. Sources: ${events
            .slice(0, 2)
            .map((e) => `[${e.id}]`)
            .join(', ')}.`
        : 'Trip memory: $230/night cap, 4 rooms required, accessibility for Maya (elevator, step-free, roll-in shower). 32 source events, 7 decisions on file.';

    return NextResponse.json({ answer, sources: events.slice(0, 3), mode: 'keyword' });
  } catch (err) {
    console.error('/api/demo/query error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
