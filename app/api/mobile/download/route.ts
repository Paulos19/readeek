// app/api/mobile/books/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    // Verifica token apenas para segurança
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);
    
    const { bookId } = await request.json();

    if (!bookId) {
        return NextResponse.json({ error: "Book ID required" }, { status: 400 });
    }

    // Incrementa o contador atomicamente
    const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: {
            downloadsCount: {
                increment: 1
            }
        },
        select: { downloadsCount: true }
    });

    return NextResponse.json({ 
        success: true, 
        newCount: updatedBook.downloadsCount 
    });

  } catch (error) {
    console.error("Erro ao registrar download:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}