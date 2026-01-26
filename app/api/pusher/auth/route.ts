import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  // 1. Verifica sessão do usuário
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Processa o corpo da requisição (formato x-www-form-urlencoded)
  const text = await req.text();
  const params = new URLSearchParams(text);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return new NextResponse("Missing socket_id or channel_name", { status: 400 });
  }

  // 3. Dados do usuário para o canal de presença (quem está online)
  const presenceData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };

  // 4. Autoriza e retorna a resposta do Pusher
  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}