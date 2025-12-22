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
    // Identificamos quem está fazendo o pedido
    const currentUserId = decoded.userId || decoded.id; 

    // AGORA BUSCAMOS TODOS OS LIVROS (Sem filtro de userId)
    // Opcional: Você pode querer filtrar apenas livros 'sharable: true' no futuro
    const books = await prisma.book.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        progress: true,
        filePath: true,
        currentLocation: true,
        downloadsCount: true,
        description: true,
        
        // Incluímos explicitamente o dono do livro para o perfil
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

    const formattedBooks = books.map(book => {
        // LÓGICA DE PROTEÇÃO DE PROGRESSO
        // Se o livro não é meu, eu não devo ver o progresso do dono
        const isMyBook = book.user.id === currentUserId;

        return {
            ...book,
            // Se não for meu, zero o progresso para não confundir o app
            progress: isMyBook ? book.progress : 0,
            currentLocation: isMyBook ? book.currentLocation : null,
            
            // Flattening para facilitar no mobile
            userId: book.user.id,
            userName: book.user.name,
            userImage: book.user.image,
            userRole: book.user.role
        };
    });

    return NextResponse.json(formattedBooks);
  } catch (error) {
    console.error("Erro API Books:", error);
    return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
  }
}