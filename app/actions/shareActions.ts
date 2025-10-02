// app/actions/shareActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { RequestStatus } from "@prisma/client";

// Ação para um utilizador pedir um livro
export async function requestBook(bookId: string, ownerId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "Precisa de estar autenticado para pedir um livro." };
    }
    if (session.user.id === ownerId) {
        return { error: "Não pode pedir um livro a si mesmo." };
    }

    try {
        const existingRequest = await prisma.bookRequest.findUnique({
            where: { bookId_requesterId: { bookId, requesterId: session.user.id } },
        });

        if (existingRequest) {
            return { error: "Já pediu este livro." };
        }

        await prisma.bookRequest.create({
            data: {
                bookId,
                ownerId,
                requesterId: session.user.id,
            },
        });

        revalidatePath("/dashboard/notifications");
        return { success: "Pedido enviado com sucesso!" };
    } catch (error) {
        console.error("Erro ao pedir livro:", error);
        return { error: "Não foi possível enviar o seu pedido." };
    }
}

// Ação para o dono do livro obter os seus pedidos pendentes
export async function getPendingRequests() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    return prisma.bookRequest.findMany({
        where: {
            ownerId: session.user.id,
            status: RequestStatus.PENDING,
        },
        include: {
            book: true,
            requester: true,
        },
        orderBy: {
            createdAt: 'desc',
        }
    });
}

// Ação para aprovar um pedido
export async function approveBookRequest(requestId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Não autorizado." };

    try {
        const request = await prisma.bookRequest.findFirst({
            where: { id: requestId, ownerId: session.user.id },
            include: { book: true },
        });

        if (!request) {
            return { error: "Pedido não encontrado." };
        }
        
        // Cria uma cópia do livro para o novo utilizador
        await prisma.book.create({
            data: {
                title: request.book.title,
                author: request.book.author,
                coverUrl: request.book.coverUrl,
                filePath: request.book.filePath, // Partilha o mesmo ficheiro
                userId: request.requesterId,
            }
        });

        // Atualiza o estado do pedido para APROVADO
        await prisma.bookRequest.update({
            where: { id: requestId },
            data: { status: RequestStatus.APPROVED },
        });

        revalidatePath("/dashboard/notifications");
        return { success: "Pedido aprovado! O livro foi adicionado à biblioteca do utilizador." };

    } catch (error) {
        console.error("Erro ao aprovar pedido:", error);
        return { error: "Não foi possível aprovar o pedido." };
    }
}

// Ação para rejeitar um pedido
export async function rejectBookRequest(requestId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Não autorizado." };
    
    try {
        await prisma.bookRequest.update({
            where: { id: requestId, ownerId: session.user.id },
            data: { status: RequestStatus.REJECTED },
        });
        
        revalidatePath("/dashboard/notifications");
        return { success: "Pedido rejeitado." };
    } catch (error) {
        console.error("Erro ao rejeitar pedido:", error);
        return { error: "Não foi possível rejeitar o pedido." };
    }
}