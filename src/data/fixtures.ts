import type { HotelCandidate, Ripple, Draft } from '@/types';

export const CANCELLATION_EVENT = {
  id: 'CANCEL-001',
  type: 'HOTEL_CANCELLATION',
  timestamp: '2026-09-01T14:00:00Z',
  source: 'Simulated hotel email',
  hotelName: 'Harbor View',
  confirmationCode: 'HV-8842',
  description: 'Harbor View lost two rooms due to water damage. The group can no longer stay together.',
  affectedDecisionId: 'D-002A',
  provenance: 'SYNTHETIC_EVENT' as const,
};

// The three candidates surfaced by Amadeus search
export const HOTEL_CANDIDATES: HotelCandidate[] = [
  {
    id: 'bayfront-lodge',
    name: 'Bayfront Lodge',
    nightlyPrice: 229,
    currency: 'USD',
    roomsAvailable: 4,
    elevator: false,
    wheelchairAccessibleEntrance: false,
    rollInShower: null,
    parkingCostPerNight: 0,
    address: '500 Bayfront Ave, San Diego, CA 92101',
    available: true,
    provenance: 'CACHED_API_RESPONSE',
    retrievedAt: '2026-09-01T14:05:00Z',
  },
  {
    id: 'seaside-inn',
    name: 'Seaside Inn',
    nightlyPrice: 238,
    currency: 'USD',
    roomsAvailable: 4,
    elevator: true,
    wheelchairAccessibleEntrance: true,
    rollInShower: null,
    parkingCostPerNight: 15,
    address: '1200 Seaside Blvd, San Diego, CA 92109',
    available: true,
    provenance: 'CACHED_API_RESPONSE',
    retrievedAt: '2026-09-01T14:05:00Z',
  },
  {
    id: 'mission-bay-suites',
    name: 'Mission Bay Suites',
    nightlyPrice: 205,
    currency: 'USD',
    roomsAvailable: 4,
    elevator: true,
    wheelchairAccessibleEntrance: true,
    rollInShower: null, // UNKNOWN at search time
    parkingCostPerNight: 28,
    address: '1600 Mission Bay Drive, San Diego, CA 92109',
    available: true,
    provenance: 'CACHED_API_RESPONSE',
    retrievedAt: '2026-09-01T14:05:00Z',
  },
];

// After hotel confirms roll-in shower
export const HOTEL_CONFIRMED_CANDIDATE: HotelCandidate = {
  ...HOTEL_CANDIDATES[2],
  rollInShower: true,
  provenance: 'HUMAN_CONFIRMED',
  retrievedAt: '2026-09-01T14:30:00Z',
};

// Ripples detected after Mission Bay Suites approved
export const RIPPLES: Ripple[] = [
  {
    id: 'RIP-001',
    recipient: 'Ravi',
    plan: 'Airport pickup',
    impact: 'Destination changed from Harbor View to Mission Bay Suites (1600 Mission Bay Drive). Pickup time and passenger count unchanged.',
    requiredAction: 'Update GPS destination. Keep 4:30 PM SAN pickup.',
    evidenceIds: ['E-010', 'E-011', 'E-022', 'E-030'],
    included: true,
  },
  {
    id: 'RIP-002',
    recipient: 'Maya',
    plan: 'Accessible room',
    impact: 'New hotel must confirm roll-in shower. Step-free entrance confirmed.',
    requiredAction: 'Confirm roll-in shower assignment at Mission Bay Suites room 105.',
    evidenceIds: ['E-003', 'E-007', 'E-021', 'E-031'],
    included: true,
  },
  {
    id: 'RIP-003',
    recipient: 'Sofia',
    plan: 'Saturday dinner — Casa Verde',
    impact: 'Casa Verde is now 11.8 miles from hotel instead of a 6-minute walk. Ben\'s shellfish allergy note must be preserved with the booking.',
    requiredAction: 'Arrange transport (Uber or carpool). Keep allergy note on file.',
    evidenceIds: ['E-012', 'E-025', 'E-026'],
    included: true,
  },
  {
    id: 'RIP-004',
    recipient: 'Noah',
    plan: 'Rental car budget',
    impact: 'Mission Bay Suites charges $28/day parking ($56 total for two nights).',
    requiredAction: 'Update trip budget. Noah covers parking and group splits later.',
    evidenceIds: ['E-006', 'E-016', 'E-021', 'E-027'],
    included: true,
  },
  {
    id: 'RIP-005',
    recipient: 'Liam',
    plan: 'General trip update',
    impact: 'Liam missed the decision call and needs the final hotel change.',
    requiredAction: 'Send concise update: hotel changed to Mission Bay Suites.',
    evidenceIds: ['E-028', 'E-029'],
    included: true,
  },
  {
    id: 'RIP-X1',
    recipient: 'Aisha',
    plan: 'Surf lesson',
    impact: 'No hotel dependency — Pacific Beach location unchanged.',
    requiredAction: 'No action needed.',
    evidenceIds: ['E-015'],
    included: false,
    excludedReason: 'No dependency on hotel address or accessibility.',
  },
  {
    id: 'RIP-X2',
    recipient: 'Aisha',
    plan: 'Zoo visit',
    impact: 'No hotel dependency — zoo location unchanged.',
    requiredAction: 'No action needed.',
    evidenceIds: ['E-018'],
    included: false,
    excludedReason: 'No dependency on hotel address or accessibility.',
  },
  {
    id: 'RIP-X3',
    recipient: 'Ben',
    plan: 'Packing and cards',
    impact: 'No hotel dependency.',
    requiredAction: 'No action needed.',
    evidenceIds: ['E-017'],
    included: false,
    excludedReason: 'No dependency on hotel decision.',
  },
];

// Targeted draft messages per recipient
export const DRAFTS: Draft[] = [
  {
    id: 'DRAFT-001',
    recipient: 'Ravi',
    channel: 'Group Chat / Direct message',
    subject: 'Pickup destination update',
    body: `Hi Ravi — quick update on your Friday pickup.\n\nNew destination: Mission Bay Suites, 1600 Mission Bay Drive, San Diego, CA 92109. The accessible entrance is on the south side of the building.\n\nPickup time (SAN 4:30 PM) and passengers (Maya + Ben) are unchanged. Drive time to the new hotel is similar to Harbor View.\n\nPlease update your GPS. Thanks for organizing the ride!`,
    evidenceIds: ['E-010', 'E-022', 'E-024', 'E-030'],
    status: 'pending',
  },
  {
    id: 'DRAFT-002',
    recipient: 'Maya',
    channel: 'Email / Direct message',
    subject: 'Accessible room confirmed at Mission Bay Suites',
    body: `Hi Maya — great news on accessibility at the new hotel.\n\nMission Bay Suites (1600 Mission Bay Drive) has confirmed: step-free entrance on the south side, elevator, and a roll-in shower in room 105, which they will pre-assign to you.\n\nYour pickup with Ravi at SAN 4:30 PM is unchanged.`,
    evidenceIds: ['E-003', 'E-021', 'E-031'],
    status: 'pending',
  },
  {
    id: 'DRAFT-003',
    recipient: 'Sofia',
    channel: 'Group Chat / Direct message',
    subject: 'Casa Verde is now 11.8 miles — transport needed',
    body: `Hi Sofia — heads up on dinner logistics.\n\nCasa Verde is 11.8 miles from Mission Bay Suites (it was a 6-minute walk from Harbor View). We will need to arrange Uber or carpool for Saturday evening.\n\nImportantly: Ben's shellfish allergy note and the no-shared-fryer confirmation must stay on your booking. Casa Verde was chosen specifically for this — please preserve it.\n\nReservation details otherwise unchanged: Saturday 7 PM, eight people.`,
    evidenceIds: ['E-012', 'E-025', 'E-026'],
    status: 'pending',
  },
  {
    id: 'DRAFT-004',
    recipient: 'Noah',
    channel: 'Group Chat / Direct message',
    subject: 'Parking adds $56 to the trip budget',
    body: `Hi Noah — parking update for your rental car.\n\nMission Bay Suites charges $28/day, so two nights = $56 total. Harbor View included parking, so this is a new cost.\n\nYou mentioned you would cover it and we split later — that plan still works. Just flagging so you can update the trip budget sheet.`,
    evidenceIds: ['E-006', 'E-016', 'E-027'],
    status: 'pending',
  },
  {
    id: 'DRAFT-005',
    recipient: 'Liam',
    channel: 'Email',
    subject: 'Trip update: hotel changed to Mission Bay Suites',
    body: `Hi Liam — brief summary since you missed the planning calls.\n\nHotel changed: we moved from Harbor View to Mission Bay Suites (1600 Mission Bay Drive, San Diego). Four rooms confirmed at $205/night, full accessibility for Maya.\n\nAll other plans are unchanged: same dates (Sep 18–20), same dinner Saturday (Casa Verde 7 PM), same Sunday beach and departure.\n\nLet me know if you have questions!`,
    evidenceIds: ['E-028', 'E-029'],
    status: 'pending',
  },
];

// Amadeus test cache (what the API would return in San Diego)
export const AMADEUS_CACHE = {
  query: { cityCode: 'SAN', checkInDate: '2026-09-18', checkOutDate: '2026-09-20', adults: 2, rooms: 4 },
  retrievedAt: '2026-09-01T14:05:00Z',
  candidates: HOTEL_CANDIDATES,
};

// Ground truth for automated tests
export const GROUND_TRUTH = {
  rejections: ['bayfront-lodge', 'seaside-inn'],
  rejectionReasons: {
    'bayfront-lodge': ['ELEVATOR', 'STEP_FREE'],
    'seaside-inn': ['PRICE'],
  },
  viableCandidate: 'mission-bay-suites',
  unknownField: 'ROLL_IN_SHOWER',
  includedRipples: ['RIP-001', 'RIP-002', 'RIP-003', 'RIP-004', 'RIP-005'],
  excludedRipples: ['RIP-X1', 'RIP-X2', 'RIP-X3'],
  supersededDecision: 'D-002A',
  activeDecision: 'D-002B',
  contactsSent: 0,
  inquiriesSent: 1,
};
