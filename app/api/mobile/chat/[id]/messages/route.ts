import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";
import jwt from "jsonwebtoken";
import { pusherServer } from "@/lib/pusher"; // <--- Importante: Importe o Singleton do Pusher

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Busca histórico de mensagens
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

// POST: Envia nova mensagem + Gatilho Pusher
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

    const contentType = request.headers.get("content-type") || "";

    let content = "";
    let replyToId = null;
    let imageUrl = null;
    let audioUrl = null;
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let type = "TEXT";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      content = formData.get("content") as string || "";
      replyToId = formData.get("replyToId") as string || null;

      const imageFile = formData.get("image") as File | null;
      if (imageFile) {
        const blob = await utapi.uploadFiles(
          new File([await imageFile.arrayBuffer()], `chat-image-${Date.now()}-${imageFile.name}`, { type: imageFile.type })
        );
        if (!blob.error && blob.data) {
          imageUrl = blob.data.url;
          type = "IMAGE";
        }
      }

      const audioFile = formData.get("audio") as File | null;
      if (audioFile) {
        const blob = await utapi.uploadFiles(
          new File([await audioFile.arrayBuffer()], `chat-audio-${Date.now()}.m4a`, { type: 'audio/m4a' })
        );
        if (!blob.error && blob.data) {
          audioUrl = blob.data.url;
          type = "AUDIO";
        }
      }

      const rawFile = formData.get("file") as File | null;
      const fSize = formData.get("fileSize") as string;
      if (rawFile) {
        const blob = await utapi.uploadFiles(
          new File([await rawFile.arrayBuffer()], `chat-file-${Date.now()}-${rawFile.name}`, { type: rawFile.type })
        );
        if (!blob.error && blob.data) {
          fileUrl = blob.data.url;
          fileName = rawFile.name;
          fileSize = fSize ? parseInt(fSize, 10) : rawFile.size;
          type = "FILE";
        }
      }
    } else {
      const payload = await request.json();
      content = payload.content || "";
      imageUrl = payload.imageUrl || null;
      audioUrl = payload.audioUrl || null;
      fileUrl = payload.fileUrl || null;
      fileName = payload.fileName || null;
      fileSize = payload.fileSize || null;
      replyToId = payload.replyToId || null;

      if (imageUrl) type = "IMAGE";
      if (audioUrl) type = "AUDIO";
      if (fileUrl) type = "FILE";
    }

    // --- SALVAR NO BANCO (PRISMA) ---
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

    // Atualiza data da conversa
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    // --- REAL-TIME: PUSHER TRIGGER (Adicionado) ---
    try {
      await pusherServer.trigger(
        `presence-chat-${params.id}`, // Nome do canal (deve bater com o hook do frontend)
        'new-message',                // Nome do evento
        message                       // Payload (a mensagem completa)
      );
    } catch (pusherError) {
      // Não falhamos a request se o socket falhar, apenas logamos
      console.error("Erro ao disparar Pusher:", pusherError);
    }
    // ----------------------------------------------

    // --- NOTIFICAÇÃO PUSH (Para quem não está com o chat aberto) ---
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

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erro geral POST Message:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}