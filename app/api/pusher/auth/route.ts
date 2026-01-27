import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request) {
  // 1. Tenta pegar o token do Header (Padrão Mobile)
  const authHeader = req.headers.get("authorization");
  let userId = null;

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      console.error("Erro validação token Pusher:", error);
    }
  }

  // (Opcional) Adicione lógica de fallback para sessão web aqui se necessário
  // const session = await getServerSession(authOptions);
  // if (!userId && session) userId = session.user.id;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Busca info do usuário para o canal de presença (Online/Offline)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, email: true }
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // 3. Processa dados do Pusher
  // O Pusher envia os dados como form-urlencoded, não JSON padrão
  const text = await req.text();
  const params = new URLSearchParams(text);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return new NextResponse("Missing socket_id or channel_name", { status: 400 });
  }

  // 4. Monta os dados de presença
  const presenceData = {
    user_id: user.id,
    user_info: {
      name: user.name,
      image: user.image,
      email: user.email,
    },
  };

  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}