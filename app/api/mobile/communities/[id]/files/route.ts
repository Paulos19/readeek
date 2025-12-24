// app/api/mobile/communities/[id]/files/route.ts
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Upload para Blob Storage
  const blob = await put(`community/${params.id}/${file.name}`, file, { access: 'public' });

  // Salva no Banco
  const dbFile = await prisma.communityFile.create({
    data: {
      title: file.name,
      fileUrl: blob.url,
      fileType: file.type.includes('pdf') ? 'PDF' : 'EPUB',
      communityId: params.id,
      uploaderId: session.user.id
    }
  });

  return NextResponse.json(dbFile);
}