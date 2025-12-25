import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Identificar Comprador
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const buyerId = decoded.userId;
    const productId = params.id;

    // 2. Transação Atômica (Tudo ou Nada)
    const result = await prisma.$transaction(async (tx) => {
      // a) Buscar Produto e validar
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { shop: { include: { owner: true } } }
      });

      if (!product) throw new Error("Produto não encontrado");
      if (product.stock <= 0 || product.isSold) throw new Error("Produto esgotado");
      if (product.currency !== 'CREDITS') throw new Error("Este produto não aceita créditos");
      if (product.shop.ownerId === buyerId) throw new Error("Você não pode comprar seu próprio produto");

      const price = Number(product.price);

      // b) Buscar Comprador e validar saldo
      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer) throw new Error("Comprador não encontrado");
      
      if ((buyer.credits || 0) < price) {
        throw new Error("Saldo insuficiente"); // Erro específico para o front tratar
      }

      // c) Executar Movimentações
      // 1. Debitar do Comprador
      await tx.user.update({
        where: { id: buyerId },
        data: { credits: { decrement: price } }
      });

      // 2. Creditar ao Vendedor (Dono da Loja)
      await tx.user.update({
        where: { id: product.shop.ownerId },
        data: { credits: { increment: price } }
      });

      // 3. Atualizar Estoque do Produto
      const newStock = product.stock - 1;
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          isSold: newStock === 0, // Se zerar, marca como vendido
        }
      });

      // 4. (Opcional) Criar registro de transação/Chat aqui futuramente

      return updatedProduct;
    });

    return NextResponse.json({ success: true, product: result });

  } catch (error: any) {
    console.error("Erro na compra:", error.message);
    const status = error.message === "Saldo insuficiente" ? 402 : 400; // 402 Payment Required
    return NextResponse.json({ error: error.message || "Erro ao processar compra" }, { status });
  }
}