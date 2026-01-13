import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
// Novos imports
import { sendMail } from "@/lib/mail";
import { getPurchaseReceiptTemplate, getSaleNotificationTemplate } from "@/lib/emails/transactional-templates";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> } // Atualizado para Next 15 (params é Promise)
) {
  const params = await props.params;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const buyerId = decoded.userId;
    const productId = params.id;

    // Transação de Compra
    const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: productId },
            include: { shop: { include: { owner: true } } }
        });

        if (!product) throw new Error("Produto não encontrado");
        if (product.stock <= 0) throw new Error("Produto esgotado");
        if (product.currency !== 'CREDITS') throw new Error("Apenas produtos em créditos podem ser comprados diretamente");

        const buyer = await tx.user.findUnique({ where: { id: buyerId } });
        if (!buyer || (buyer.credits || 0) < Number(product.price)) {
            throw new Error("Saldo insuficiente");
        }

        // 1. Desconta do comprador
        const updatedBuyer = await tx.user.update({
            where: { id: buyerId },
            data: { credits: { decrement: Number(product.price) } }
        });

        // 2. Adiciona ao vendedor
        await tx.user.update({
            where: { id: product.shop.ownerId },
            data: { credits: { increment: Number(product.price) } }
        });

        // 3. Atualiza estoque
        await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: 1 } }
        });

        return { product, buyer: updatedBuyer, seller: product.shop.owner };
    });

    // --- NOTIFICAÇÃO PUSH (DB) ---
    await prisma.notification.create({
        data: {
            userId: result.product.shop.ownerId,
            title: "Produto Vendido! 🎉",
            message: `${result.buyer?.name || 'Alguém'} comprou "${result.product.title}".`,
            type: "ORDER",
            link: "/(app)/dashboard"
        }
    });

    // --- E-MAILS TRANSACIONAIS (Disparo Assíncrono) ---
    Promise.all([
        // 1. Para o Comprador (Recibo)
        sendMail({
            to: result.buyer.email,
            subject: `Compra Confirmada: ${result.product.title}`,
            html: getPurchaseReceiptTemplate(
                result.buyer.name || "Leitor", 
                result.product.title, 
                Number(result.product.price), 
                result.buyer.credits // Saldo atualizado
            )
        }),
        // 2. Para o Vendedor (Aviso de Venda)
        sendMail({
            to: result.seller.email,
            subject: `Você vendeu um item no Readeek! 💰`,
            html: getSaleNotificationTemplate(
                result.seller.name || "Vendedor", 
                result.product.title, 
                Number(result.product.price)
            )
        })
    ]).catch(err => console.error("Falha no envio de emails de compra:", err));
    // --------------------------------------------------

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro na compra" }, { status: 400 });
  }
}