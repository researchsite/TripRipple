import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getActiveDecision, getAllDecisions, getActiveConstraints } from '@/lib/elastic';

export const loadTripMemoryTool = createTool({
  id: 'load-trip-memory',
  description: 'Retrieves the active hotel decision, all hard constraints, and lodging dependencies.',
  inputSchema: z.object({
    tripId: z.string().describe('The trip workspace ID'),
  }),
  outputSchema: z.object({
    activeHotelId: z.string().nullable(),
    decisionCount: z.number(),
    activeCount: z.number(),
    constraintCount: z.number(),
  }),
  execute: async (_inputData: { tripId: string }) => {
    const [decisions, constraints, activeHotel] = await Promise.all([
      getAllDecisions(),
      getActiveConstraints(),
      getActiveDecision('Hotel'),
    ]);
    return {
      activeHotelId: activeHotel?.id ?? null,
      decisionCount: decisions.length,
      activeCount: decisions.filter((d) => d.state === 'Active').length,
      constraintCount: constraints.length,
    };
  },
});
