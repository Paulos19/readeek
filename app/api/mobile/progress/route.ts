// app/api/mobile/progress/route.ts
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

    // Busca o estado atual para comparar
    const currentBook = await prisma.book.findUnique({
        where: { id: bookId },
        select: { progress: true }
    });

    // LÓGICA DE PROTEÇÃO:
    // Se o novo progresso for 0 mas o livro já estava avançado (>5%),
    // assumimos que é um erro de cálculo do mobile e salvamos apenas o CFI (currentLocation),
    // mantendo o progresso visual antigo para não assustar o usuário.
    let newProgress = Math.floor(percentage * 100);
    
    if (newProgress === 0 && (currentBook?.progress || 0) > 5) {
        console.log(`[Sync War] Ignorando progresso 0% para livro avançado (${currentBook?.progress}%). Salvando apenas localização.`);
        newProgress = currentBook?.progress || 0;
    }

    const updatedBook = await prisma.book.update({
      where: { 
        id: bookId,
        userId: decoded.userId 
      },
      data: {
        currentLocation: cfi, 
        progress: newProgress,
        updatedAt: new Date() // Força atualização do timestamp para o sync reverso pegar
      },
    });

    return NextResponse.json({ success: true, progress: updatedBook.progress });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Falha ao salvar progresso" }, { status: 500 });
  }
}