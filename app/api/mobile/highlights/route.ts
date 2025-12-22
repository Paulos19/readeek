// app/api/mobile/highlights/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// GET: Busca destaques de um livro específico
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    if (!bookId) return NextResponse.json({ error: "Book ID required" }, { status: 400 });

    const highlights = await prisma.highlight.findMany({
      where: { 
        bookId,
        userId: decoded.userId 
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(highlights);
  } catch (error) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}

// POST: Salva um novo destaque
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const body = await request.json();
    const { bookId, cfiRange, text, color } = body;

    if (!bookId || !cfiRange || !text) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Cria o destaque
    const highlight = await prisma.highlight.create({
      data: {
        userId: decoded.userId,
        bookId,
        cfiRange,
        text,
        color: color || "rgba(255, 255, 0, 0.4)" // Amarelo padrão
      }
    });

    return NextResponse.json(highlight);

  } catch (error) {
    console.error("Highlight Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// DELETE: Remove um destaque
export async function DELETE(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

      await prisma.highlight.deleteMany({
        where: {
            id,
            userId: decoded.userId // Garante que só deleta o seu
        }
      });

      return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}