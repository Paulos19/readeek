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
        select: { progress: true, currentLocation: true }
    });

    // Usa Round para melhor precisão visual (ex: 0.999 vira 100%, 0.004 vira 0%)
    let newProgress = Math.round(percentage * 100);
    
    // LÓGICA DE PROTEÇÃO REFINADA:
    // Evita o bug do "0% eterno" onde o app manda 0 mas o user estava lá na frente.
    // Só ignora o 0 se o CFI também for nulo/inválido ou IGUAL ao anterior.
    // Se o CFI mudou (o usuário voltou para a capa), aceitamos o 0.
    if (newProgress === 0 && (currentBook?.progress || 0) > 5 && cfi === currentBook?.currentLocation) {
        console.log(`[Sync War] Ignorando 0% pois o CFI é idêntico ao anterior (${currentBook?.progress}%).`);
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
        updatedAt: new Date() // Força atualização do timestamp para o Dashboard ordenar corretamente
      },
    });

    return NextResponse.json({ success: true, progress: updatedBook.progress });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Falha ao salvar progresso" }, { status: 500 });
  }
}