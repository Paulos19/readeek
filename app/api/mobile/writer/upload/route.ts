import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'image.jpg';

  if (!request.body) {
    return NextResponse.json({ error: 'No body' }, { status: 400 });
  }

  // Upload para o Vercel Blob
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return NextResponse.json(blob);
}