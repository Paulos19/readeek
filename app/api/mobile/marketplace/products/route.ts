import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utapi } from "@/lib/uploadthing-server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function GET(request: Request) {
    // Mantém a implementação atual ou retorna vazio
    return NextResponse.json([]);
}

export async function POST(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const token = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { shop: true }
        });

        if (!user?.shop) {
            return NextResponse.json({ error: "Você precisa criar uma loja primeiro" }, { status: 400 });
        }

        const payload = await request.json();
        const { title, description, currency, address, imageUrl } = payload;
        const price = parseFloat(payload.price as string);
        const stock = parseInt(payload.stock as string) || 1;

        // CORREÇÃO: Usando 'product' em vez de 'marketProduct'
        const product = await prisma.product.create({
            data: {
                shopId: user.shop.id,
                title,
                description,
                price,
                currency: currency as any,
                address,
                stock,
                images: imageUrl ? {
                    create: { url: imageUrl }
                } : undefined
            }
        });

        // --- NOTIFICAÇÃO (Gatilho) ---
        // Notifica os seguidores do vendedor
        const followers = await prisma.follows.findMany({
            where: { followingId: userId },
            select: { followerId: true }
        });

        if (followers.length > 0) {
            await Promise.all(followers.map(f =>
                prisma.notification.create({
                    data: {
                        userId: f.followerId,
                        title: `Novidade na loja de ${user.name}!`,
                        message: `Confira o novo produto: ${title}`,
                        type: "SALE",
                        link: `/(app)/product/${product.id}`
                    }
                })
            ));
        }
        // ----------------------------

        return NextResponse.json(product);

    } catch (error) {
        console.error("Erro criar produto:", error);
        return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
    }
}