import { NextResponse } from 'next/server';
import { resetState, logAction } from '@/lib/store';
import { seedElasticsearch } from '@/lib/elastic';

export async function POST() {
  const state = resetState();
  const { backend } = await seedElasticsearch();
  logAction('RESET', `Demo reset. Memory backend: ${backend}`, 'SYNTHETIC_EVENT');

  return NextResponse.json({
    ok: true,
    state: resetState(),
    backend,
  });
}
