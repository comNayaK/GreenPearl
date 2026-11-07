import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    platform: 'GreenPearl Party Platform',
    timestamp: new Date().toISOString(),
  });
}

