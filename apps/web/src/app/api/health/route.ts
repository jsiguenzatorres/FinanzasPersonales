import { NextResponse } from 'next/server';

/**
 * Health check endpoint para Docker / VPS / monitoring.
 * GET /api/health → 200 {status:'ok', ...}
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'flowfinance-web',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
