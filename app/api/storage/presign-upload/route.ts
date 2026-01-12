import 'server-only';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'Uploads are disabled in core product mode.' },
    { status: 501 },
  );
}
