import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { utapi } from "@/lib/uploadthing-server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const contentType = req.headers.get("content-type") || "";

    let title, description, htmlContent, orientation, mode, coverUrl = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = formData.get("title") as string;
      description = formData.get("description") as string;
      htmlContent = formData.get("htmlContent") as string;
      orientation = formData.get("orientation") as string;
      mode = formData.get("mode") as string;

      const coverFile = formData.get("cover") as File | null;
      if (coverFile) {
        const blob = await utapi.uploadFiles(
          new File([await coverFile.arrayBuffer()], `game-${Date.now()}-${coverFile.name}`, { type: coverFile.type })
        );
        if (!blob.error && blob.data) coverUrl = blob.data.url;
      }
    } else {
      const body = await req.json();
      title = body.title;
      description = body.description;
      htmlContent = body.htmlContent;
      orientation = body.orientation;
      mode = body.mode;
      coverUrl = body.coverUrl || null;
    }
    // mode: 'IMPORT' (45) | 'CREATE' (60)

    const cost = mode === 'CREATE' ? 60 : 45;

    // 1. Transação Atômica: Verifica saldo -> Deduz -> Cria Jogo
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user || user.credits < cost) {
        throw new Error("Saldo insuficiente");
      }

      // Deduz créditos
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } }
      });

      // Cria o Jogo
      const newGame = await tx.game.create({
        data: {
          title,
          description,
          htmlContent, // Aqui entra o HTML stringão
          orientation: orientation || 'PORTRAIT',
          ownerId: userId,
          coverUrl: coverUrl || null,
          price: 15 // Valor fixo de venda conforme requisito
        }
      });

      return newGame;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.message === "Saldo insuficiente") {
      return NextResponse.json({ error: "Você não tem créditos suficientes." }, { status: 402 });
    }
    console.error("Erro ao criar game:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}