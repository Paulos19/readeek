import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const messages = await prisma.message.findMany({
      where: { 
        conversationId: params.id,
        NOT: { deletedForIds: { has: userId } }
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        sender: { select: { id: true, name: true, image: true } },
        replyTo: { select: { id: true, content: true, type: true, sender: { select: { name: true } } } }
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const imageFile = formData.get("image") as File;
    const audioFile = formData.get("audio") as File;
    const docFile = formData.get("file") as File;
    const replyToId = formData.get("replyToId") as string | null;

    if (!content && !imageFile && !audioFile && !docFile) {
        return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    let imageUrl = null;
    let audioUrl = null;
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let type = "TEXT";

    if (imageFile) {
      type = "IMAGE";
      const blob = await put(`chat/${params.id}/images/${Date.now()}-${imageFile.name}`, imageFile, { access: 'public' });
      imageUrl = blob.url;
    }
    if (audioFile) {
      type = "AUDIO";
      const blob = await put(`chat/${params.id}/audio/${Date.now()}.m4a`, audioFile, { access: 'public' });
      audioUrl = blob.url;
    }
    if (docFile) {
      type = "FILE";
      fileName = docFile.name;
      fileSize = docFile.size;
      const blob = await put(`chat/${params.id}/files/${Date.now()}-${docFile.name}`, docFile, { access: 'public' });
      fileUrl = blob.url;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: userId,
        content: content || null,
        imageUrl,
        audioUrl,
        fileUrl,
        fileName,
        fileSize,
        type,
        replyToId: replyToId || null,
      },
      include: { 
        sender: { select: { id: true, name: true, image: true } },
        replyTo: { select: { id: true, content: true, type: true, sender: { select: { name: true } } } }
      }
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    // --- NOTIFICAÇÃO (Gatilho) ---
    const conversation = await prisma.conversation.findUnique({
        where: { id: params.id },
        include: { participants: { select: { id: true } } }
    });

    if (conversation) {
        const recipients = conversation.participants.filter(p => p.id !== userId);
        const notifMessage = type === 'IMAGE' ? '📷 Imagem' : 
                             type === 'AUDIO' ? '🎵 Áudio' : 
                             type === 'FILE' ? '📄 Arquivo' : 
                             content;

        await Promise.all(recipients.map(recipient => 
            prisma.notification.create({
                data: {
                    userId: recipient.id,
                    title: sender?.name || "Nova Mensagem",
                    message: notifMessage || "Nova mensagem recebida",
                    type: "MESSAGE",
                    link: `/(app)/chat/${params.id}`
                }
            })
        ));
    }
    // ----------------------------

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}