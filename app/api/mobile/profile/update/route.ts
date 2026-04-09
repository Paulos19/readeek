import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { utapi } from "@/lib/uploadthing-server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function PATCH(request: Request) {
  try {
    // 1. Autenticação
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const contentType = request.headers.get("content-type") || "";

    let dataToUpdate: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      const name = formData.get("name") as string | null;
      const about = formData.get("about") as string | null;
      const profileVisibility = formData.get("profileVisibility") as "PUBLIC" | "PRIVATE" | null;

      if (name) dataToUpdate.name = name;
      if (about) dataToUpdate.about = about;
      if (profileVisibility) dataToUpdate.profileVisibility = profileVisibility;

      if (file) {
        const filename = `avatars-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
        const blob = await utapi.uploadFiles(
          new File([await file.arrayBuffer()], filename, { type: file.type })
        );
        if (!blob.error && blob.data) dataToUpdate.image = blob.data.url;
      }
    } else {
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