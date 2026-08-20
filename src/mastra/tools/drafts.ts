import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { DRAFTS } from '@/data/fixtures';

export const generateDraftsTool = createTool({
  id: 'generate-drafts',
  description: 'Generates recipient-specific update drafts grounded in retrieved evidence. Never sends externally.',
  inputSchema: z.object({
    newHotelName: z.string(),
    includedCount: z.number(),
  }),
  outputSchema: z.object({
    draftsCount: z.number(),
  }),
  execute: async (_inputData: { newHotelName: string; includedCount: number }) => {
    return { draftsCount: DRAFTS.length };
  },
});
