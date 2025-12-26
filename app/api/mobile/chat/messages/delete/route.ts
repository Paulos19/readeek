import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { messageIds, type } = await request.json(); // type: 'ME' | 'EVERYONE'

    if (!messageIds || messageIds.length === 0) {
        return NextResponse.json({ error: "Nada selecionado" }, { status: 400 });
    }

    if (type === 'EVERYONE') {
        // Apaga do banco (ninguém vê mais)
        // Segurança: Só apaga se o usuário for o dono
        await prisma.message.deleteMany({
            where: {
                id: { in: messageIds },
                senderId: userId // Garante que só apaga as suas para todos
            }
        });
    } else {
        // type === 'ME'
        // Adiciona o ID do usuário ao array deletedForIds
        // Prisma não tem "push" direto em updateMany para arrays escalares em todos os DBs,
        // então faremos um loop ou query raw. Para segurança e compatibilidade, faremos em loop transaction.
        
        await prisma.$transaction(
            messageIds.map((msgId: string) => 
                prisma.message.update({
                    where: { id: msgId },
                    data: {
                        deletedForIds: { push: userId }
                    }
                })
            )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Erro ao apagar" }, { status: 500 });
  }
}