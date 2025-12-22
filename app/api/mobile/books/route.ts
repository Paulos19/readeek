// app/api/mobile/books/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id; // Suporte a diferentes payloads de JWT

    // Busca os livros do usuário
    const books = await prisma.book.findMany({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        progress: true,
        filePath: true,
        currentLocation: true,
        downloadsCount: true, // <--- ADICIONADO
        
        // Trazendo dados do dono para montar o perfil corretamente no App
        user: {
            select: {
                id: true,
                name: true,
                image: true,
                role: true
            }
        }
      }
    });

    // Flattening (Aplainando) os dados para facilitar no Mobile
    const formattedBooks = books.map(book => ({
        ...book,
        userId: book.user.id,
        userName: book.user.name,
        userImage: book.user.image,
        userRole: book.user.role
    }));

    return NextResponse.json(formattedBooks);
  } catch (error) {
    console.error("Erro API Mobile:", error);
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}