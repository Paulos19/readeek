// app/actions/highlightActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Ação para guardar um novo trecho
export async function createHighlight({ bookId, cfiRange, text }: { bookId: string, cfiRange: string, text: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "Não autorizado." };
    }

    try {
        const newHighlight = await prisma.highlight.create({
            data: {
                bookId,
                userId: session.user.id,
                cfiRange,
                text,
            },
        });
        
        // Revalida a página do leitor para que outros dados possam ser atualizados se necessário
        revalidatePath(`/read/${bookId}`);

        return { success: "Trecho guardado com sucesso!", highlight: newHighlight };
    } catch (error) {
        console.error("Falha ao guardar o trecho:", error);
        return { error: "Não foi possível guardar o trecho." };
    }
}

// Ação para obter todos os trechos de um livro para um utilizador
export async function getHighlightsForBook(bookId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return [];
    }

    try {
        const highlights = await prisma.highlight.findMany({
            where: {
                bookId,
                userId: session.user.id,
            },
        });
        return highlights;
    } catch (error) {
        console.error("Falha ao obter os trechos:", error);
        return [];
    }
}