// app/api/mobile/books/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const books = await prisma.book.findMany({
      where: { userId: decoded.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        progress: true,
        filePath: true,
        currentLocation: true, // <--- ADICIONADO: Importante para o sync reverso
      }
    });

    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}