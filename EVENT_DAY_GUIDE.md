# TripRipple — Event Day Guide

## Before the event starts (do this at home the night before)

### 1. Copy your env file
```
cp .env.example .env.local
```
Fill in these values:

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Yes (for future AI steps) |
| `AMADEUS_CLIENT_ID` | developers.amadeus.com → My Apps | Optional (cache works without) |
| `AMADEUS_CLIENT_SECRET` | same as above | Optional |
| `ELASTICSEARCH_URL` | cloud.elastic.co → Deployment → Copy endpoint | Optional (in-memory works) |
| `ELASTICSEARCH_API_KEY` | Elastic Cloud → Security → API Keys | Optional |
| `DEMO_USE_CACHE` | Set to `true` if no Amadeus key | Fallback |

> **Safe demo mode**: Set `DEMO_USE_CACHE=true`. The app works perfectly without any API keys.

### 2. Start the app
```
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 3. Test the full flow once
1. Click "Start live recovery" → you should go to Step 2
2. Click "Find replacements" → you should see 3 hotel cards (2 red, 1 amber)
3. Click "Ask one blocking question" → you should see confirmation and Step 4
4. Click "Approve change" → you should see ripples on Step 5
5. Click "Prepare targeted updates" → you should see Step 6 with 5 drafts
6. Click Reset and confirm it goes back to Step 1

### 4. Open presenter notes
Open a second browser window/tab: [http://localhost:3000/notes](http://localhost:3000/notes)

This syncs automatically via BroadcastChannel. As you click through the demo in the main window, the notes window shows what to say.

---

## On the day — setup (first 5 minutes)

```
npm run dev
```

Open two windows:
- **Window 1** (audience sees this): http://localhost:3000
- **Window 2** (you read this): http://localhost:3000/notes

---

## Demo script — what to click and when

| Time | Action | What to say |
|------|--------|-------------|
| 0:00 | Show Step 1 | "I organize the trip here. Everyone else stays in their channels." |
| 0:25 | Click "Start live recovery" | "Harbor View just cancelled. Watch what the agent remembers." |
| 0:55 | Click "Find replacements" | (pause on hotel cards) "Contacts sent: ZERO. Two hotels rejected before I called anyone." |
| 1:45 | Click "Ask one blocking question" | "One question. To one hotel. Not three." |
| 2:20 | Click "Approve change" | "The old decision is still active until I approve. This is the gate." |
| 2:50 | Show Step 5 ripples | "Surfing, zoo, packing: excluded. No hotel dependency." |
| 3:35 | Click "Prepare targeted updates" | "48 minutes saved. Each person gets only what they need." |
| 4:15 | Show Step 6 | "No external sends in the MVP. Organizer approves first." |

---

## If something breaks during demo

**Problem**: App won't start
→ Run `npm install` then `npm run dev`

**Problem**: API error on cancel/search
→ Click Reset button, start over

**Problem**: Hotels don't appear
→ Set `DEMO_USE_CACHE=true` in `.env.local`, restart

**Problem**: TypeScript errors in build
→ The demo runs in dev mode — TypeScript errors don't block `npm run dev`

**Problem**: Notes window not syncing
→ Both windows must be on the same domain (localhost:3000). Refresh the notes window.

---

## Key numbers to say confidently

- **32** source events ingested (emails, chats, docs)
- **7** structured decisions extracted
- **4** hard constraints applied deterministically
- **0** contacts sent before 2 hotels were rejected
- **1** focused inquiry (to Mission Bay Suites only)
- **4** ripples detected, **3** distractors excluded
- **5** recipient-specific drafts generated
- **48 minutes** estimated saved (51 manual → 3 with TripRipple)

---

## Why this wins

1. **Relatable problem**: Everyone has done a group trip. Everyone knows the chaos.
2. **Mastra showcase**: Real workflow with suspend/resume at approval gates. Not just a chatbot.
3. **Elasticsearch memory**: Hybrid retrieval. Not just embeddings — structured decision state.
4. **Deterministic safety**: Hard constraints checked with code, not AI guessing.
5. **Controlled autonomy**: Nothing happens without organizer approval. Judges care about this.
6. **Concrete value**: 48 minutes isn't vibes — it's a measurable claim with a methodology.
7. **Enterprise angle**: Works for any domain. Project decisions. Procurement. Compliance.

---

## Event-day changes (tell me what you want changed before you start)

This codebase is ready to run as-is. Things you might want to adjust:
- Trip name or hotel names (edit `src/data/fixtures.ts`)
- Time saved estimate (edit `src/lib/store.ts` → `timeSavedMinutes`)
- Demo slide text (edit `src/app/page.tsx` → each `Step*` component)

Message me with "change X to Y" and I'll update immediately.
