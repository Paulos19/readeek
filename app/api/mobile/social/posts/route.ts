import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob"; // Ensure you installed: npm install @vercel/blob

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

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
        // This was the part causing the error previously when receiving files
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
        imageUrl: imageUrl || undefined // Make sure you ran the prisma migration for this field
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