import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { RIPPLES } from '@/data/fixtures';

export const retrieveRippleTool = createTool({
  id: 'retrieve-ripple',
  description: 'Detects downstream plans affected by the hotel change using dependency retrieval.',
  inputSchema: z.object({
    newHotelName: z.string(),
    tripId: z.string(),
  }),
  outputSchema: z.object({
    includedCount: z.number(),
    excludedCount: z.number(),
  }),
  execute: async (_inputData: { newHotelName: string; tripId: string }) => {
    const included = RIPPLES.filter((r) => r.included);
    const excluded = RIPPLES.filter((r) => !r.included);
    return { includedCount: included.length, excludedCount: excluded.length };
  },
});
