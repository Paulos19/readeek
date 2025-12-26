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

    // Construção do filtro dinâmico
    const whereClause: any = {
      deletedAt: null // Garante que posts deletados não apareçam
    };

    // Se houver userId na URL, filtra apenas os posts desse usuário
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
            reactions: true, // Confirme se no seu schema é 'reactions' ou 'likes'
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

// --- POST: Criar Novo Post (Com suporte a Imagens) ---
export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  let userId = "";
  try { 
      // Extracts the ID from the token
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

    // --- SCENARIO 1: IMAGE UPLOAD (MULTIPART) ---
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        
        content = formData.get("content") as string || "";
        type = formData.get("type") as string || "POST";
        bookId = formData.get("bookId") as string || null;
        
        const imageFile = formData.get("image") as File | null;

        if (imageFile) {
            // Upload to Vercel Blob
            const blob = await put(imageFile.name, imageFile, {
                access: 'public',
            });
            imageUrl = blob.url;
        }
    } 
    // --- SCENARIO 2: PLAIN TEXT (JSON) ---
    else {
        const body = await req.json();
        content = body.content;
        type = body.type || "POST";
        bookId = body.bookId || null;
    }

    // --- VALIDATIONS ---
    if (!content.trim() && !imageUrl) {
        return NextResponse.json({ error: "Post requires text or image." }, { status: 400 });
    }

    if (type === 'EXCERPT' && !bookId) {
        return NextResponse.json({ error: "Excerpts require a selected book." }, { status: 400 });
    }

    // --- CREATE IN DATABASE ---
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