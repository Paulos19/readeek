import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;

  try {
    // 1. Verifica autenticação (Opcional, mas recomendado para saber se o usuário é dono)
    const authHeader = req.headers.get("authorization");
    let currentUserId = "";

    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (e) {}
    }

    // 2. Busca o jogo completo, incluindo o HTML e dados do dono
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, image: true } //
        },
        purchases: {
          where: { userId: currentUserId },
          select: { id: true }
        }
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    // 3. Formata a resposta
    const formattedGame = {
      ...game,
      // O campo isOwned é importante para o front saber se mostra o botão "Jogar" ou "Comprar"
      // Se for o dono OU se tiver comprado, é true
      isOwned: game.ownerId === currentUserId || game.purchases.length > 0, 
      // IMPORTANTE: Aqui enviamos o htmlContent, diferente da rota de listagem
      htmlContent: game.htmlContent 
    };

    return NextResponse.json(formattedGame);

  } catch (error) {
    console.error("Erro ao buscar detalhes do jogo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;

  try {
    const authHeader = req.headers.get("authorization");
    let currentUserId = "";

    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (e) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const game = await prisma.game.findUnique({
      where: { id }
    });

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    if (game.ownerId !== currentUserId) {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    const formData = await req.formData();
    
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const htmlContent = formData.get('htmlContent') as string | null;
    // Cover upload logic would go here if needed, 
    // mas vamos atualizar apenas os dados de texto por enquanto
    const orientationStr = formData.get('orientation') as string | null;
    const priceStr = formData.get('price') as string | null;

    const dataToUpdate: any = {};
    if (title !== null) dataToUpdate.title = title;
    if (description !== null) dataToUpdate.description = description;
    if (htmlContent !== null) dataToUpdate.htmlContent = htmlContent;
    
    // Opcionais não implementados no frontend mas preparados no backend
    if (orientationStr) dataToUpdate.orientation = orientationStr;
    if (priceStr) dataToUpdate.price = parseInt(priceStr);

    const updatedGame = await prisma.game.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(updatedGame);

  } catch (error) {
    console.error("Erro ao atualizar o jogo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}