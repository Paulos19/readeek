import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  let currentUserId = "";

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.userId;
    } catch (e) {}
  }

  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true, image: true }
        },
        // Verifica se o usuário atual já comprou este jogo
        purchases: {
          where: { userId: currentUserId },
          select: { id: true }
        }
      }
    });

    const formattedGames = games.map(game => ({
      ...game,
      isOwned: game.ownerId === currentUserId || game.purchases.length > 0, // Dono ou comprou
      htmlContent: undefined // Não enviamos o código HTML na listagem para economizar banda
    }));

    return NextResponse.json(formattedGames);
  } catch (error) {
    console.error("Erro ao buscar games:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}