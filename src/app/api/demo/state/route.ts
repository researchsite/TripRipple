import { NextResponse } from 'next/server';
import { getState } from '@/lib/store';
import { getBackendInfo } from '@/lib/elastic';

export async function GET() {
  const [state, backend] = await Promise.all([
    Promise.resolve(getState()),
    getBackendInfo(),
  ]);
  return NextResponse.json({ state, backend });
}
