import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'image.jpg';

    // Se o corpo não for blob/file, tentamos ler do formData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 });
    }

    // Upload para o Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Retorna a URL pública que deve ser salva no banco
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: 'Erro interno no upload' }, { status: 500 });
  }
}