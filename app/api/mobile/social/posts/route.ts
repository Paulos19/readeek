import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob"; 

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

// --- GET: Listar Posts (Feed Global ou Filtro por Usuário) ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const whereClause: any = {
      // deletedAt: null // Remova se sua tabela Post não tiver soft delete ainda
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            author: true
          }
        },
        _count: {
          select: {
            reactions: true, 
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(posts);

  } catch (error) {
    console.error("[POSTS_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 });
  }
}

// --- POST: Criar Novo Post ---
export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  let userId = "";
  try { 
      userId = (jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as any).userId; 
  } catch { 
      return NextResponse.json({ status: 401 }); 
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let content = "";
    let type = "POST";
    let bookId = null;
    let imageUrl = null;

    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        content = formData.get("content") as string || "";
        type = formData.get("type") as string || "POST";
        bookId = formData.get("bookId") as string || null;
        
        const imageFile = formData.get("image") as File | null;
        if (imageFile) {
            const blob = await put(imageFile.name, imageFile, { access: 'public' });
            imageUrl = blob.url;
        }
    } else {
        const body = await req.json();
        content = body.content;
        type = body.type || "POST";
        bookId = body.bookId || null;
    }

    if (!content.trim() && !imageUrl) {
        return NextResponse.json({ error: "Post requires text or image." }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content: content || "",
        type: type as any,
        userId,
        bookId: bookId || undefined,
        imageUrl: imageUrl || undefined 
      },
      include: {
        user: { select: { name: true, image: true } },
        book: true,
        _count: { select: { reactions: true, comments: true } }
      }
    });

    return NextResponse.json(post);

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal error creating post" }, { status: 500 });
  }
}