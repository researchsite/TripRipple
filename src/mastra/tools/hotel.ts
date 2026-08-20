import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { searchHotels } from '@/lib/amadeus';
import { evaluateAll, failureLabel, unknownLabel } from '@/lib/evaluate';

export const searchAndEvaluateHotelsTool = createTool({
  id: 'search-and-evaluate-hotels',
  description: 'Calls Amadeus for hotel candidates then deterministically evaluates each against the trip\'s hard requirements.',
  inputSchema: z.object({
    cityCode: z.string().default('SAN'),
  }),
  outputSchema: z.object({
    rejectedCount: z.number(),
    needsEvidenceCount: z.number(),
    passCount: z.number(),
    contactsSent: z.number(),
    provenance: z.string(),
    retrievedAt: z.string(),
  }),
  execute: async (inputData: { cityCode: string }) => {
    const { candidates, provenance, retrievedAt } = await searchHotels(inputData.cityCode ?? 'SAN');
    const evaluations = evaluateAll(candidates);
    return {
      rejectedCount: evaluations.filter((e) => e.status === 'REJECTED').length,
      needsEvidenceCount: evaluations.filter((e) => e.status === 'NEEDS_EVIDENCE').length,
      passCount: evaluations.filter((e) => e.status === 'PASS').length,
      contactsSent: 0,
      provenance,
      retrievedAt,
    };
  },
});
