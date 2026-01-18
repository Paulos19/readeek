import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const WEBHOOK_SECRET = process.env.N8N_SECRET || "readeek-secure-key";

export async function POST(req: Request) {
  try {
    // 1. Verificação de Segurança (Query Param ou Header)
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Recebe o arquivo (Blob/Buffer do N8N)
    // O N8N envia arquivos como Form Data ou Binary Body. 
    // Vamos assumir que o N8N manda o arquivo no body diretamente ou via formData.
    // Para simplificar no N8N, formData é o padrão.
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'sprite'; // 'sprite' ou 'background'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Upload para Vercel Blob
    const filename = `${type}-${Date.now()}.png`;
    const blob = await put(`games/assets/${filename}`, file, {
      access: 'public',
    });

    // 4. Retorna a URL para o N8N usar no código
    return NextResponse.json({ url: blob.url });

  } catch (error) {
    console.error("Erro no upload via N8N:", error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}