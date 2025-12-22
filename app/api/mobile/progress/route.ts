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

    const updatedBook = await prisma.book.update({
      where: { 
        id: bookId,
        userId: decoded.userId // Garante segurança
      },
      data: {
        currentLocation: cfi, // <--- CORRIGIDO: Nome exato do seu Schema
        progress: Math.floor(percentage * 100) // Converte 0.5 para 50 (Int)
      },
    });

    return NextResponse.json({ success: true, progress: updatedBook.progress });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Falha ao salvar progresso" }, { status: 500 });
  }
}