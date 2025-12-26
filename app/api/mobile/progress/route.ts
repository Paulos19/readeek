import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { bookId, cfi, percentage } = await request.json();

    if (!bookId || !cfi) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const currentBook = await prisma.book.findUnique({
        where: { id: bookId },
        select: { progress: true, currentLocation: true }
    });

    // Usa Round para melhor precisão visual (ex: 99.6% vira 100%)
    let newProgress = Math.round(percentage * 100);
    
    // LÓGICA DE PROTEÇÃO REFINADA:
    // Só ignora o 0 se o CFI também for nulo/inválido ou igual ao anterior.
    // Se o CFI mudou drasticamente (o usuário voltou para a capa), aceitamos o 0.
    if (newProgress === 0 && (currentBook?.progress || 0) > 10 && cfi === currentBook?.currentLocation) {
        console.log(`[Sync War] Ignorando 0% pois o CFI é idêntico ao anterior.`);
        newProgress = currentBook?.progress || 0;
    }

    const updatedBook = await prisma.book.update({
      where: { 
        id: bookId,
        // Garante que só atualiza se o livro pertencer ao usuário (ou for uma cópia dele)
        userId: decoded.userId 
      },
      data: {
        currentLocation: cfi, 
        progress: newProgress,
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ success: true, progress: updatedBook.progress });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Falha ao salvar progresso" }, { status: 500 });
  }
}