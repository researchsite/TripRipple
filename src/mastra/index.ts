import { Mastra } from '@mastra/core';
import { recoverTripWorkflow } from './workflows/recover-trip';
import { loadTripMemoryTool } from './tools/memory';
import { searchAndEvaluateHotelsTool } from './tools/hotel';
import { retrieveRippleTool } from './tools/ripple';
import { generateDraftsTool } from './tools/drafts';

export const mastra = new Mastra({
  workflows: {
    'recover-trip': recoverTripWorkflow,
  },
});

export { recoverTripWorkflow, loadTripMemoryTool, searchAndEvaluateHotelsTool, retrieveRippleTool, generateDraftsTool };
