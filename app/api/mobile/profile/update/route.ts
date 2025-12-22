import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const body = await request.json();
    const { name, about, profileVisibility, image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        about,
        profileVisibility, // Espera "PUBLIC" ou "PRIVATE"
        image
      },
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