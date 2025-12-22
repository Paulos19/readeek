import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob"; // Importante: @vercel/blob

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function PATCH(request: Request) {
  try {
    // 1. Autenticação
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // 2. Verifica o Content-Type para decidir como ler os dados
    const contentType = request.headers.get("content-type") || "";

    let dataToUpdate: any = {};

    if (contentType.includes("multipart/form-data")) {
      // --- LÓGICA DE UPLOAD DE ARQUIVO ---
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      const name = formData.get("name") as string | null;
      const about = formData.get("about") as string | null;
      const profileVisibility = formData.get("profileVisibility") as "PUBLIC" | "PRIVATE" | null;

      if (name) dataToUpdate.name = name;
      if (about) dataToUpdate.about = about;
      if (profileVisibility) dataToUpdate.profileVisibility = profileVisibility;

      // Se enviou uma nova imagem, faz upload para o Blob
      if (file) {
        const filename = `avatars/${userId}-${Date.now()}.${file.name.split('.').pop()}`;
        const blob = await put(filename, file, { 
            access: 'public',
            contentType: file.type // Preserva o tipo (png/jpg)
        });
        dataToUpdate.image = blob.url; // Salva a URL pública do Vercel Blob
      }

    } else {
      // --- LÓGICA JSON (Texto apenas) ---
      const body = await request.json();
      dataToUpdate = { ...body };
    }

    // 3. Atualiza no Banco de Dados
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true, name: true, email: true, image: true, role: true, 
        about: true, profileVisibility: true, credits: true
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}