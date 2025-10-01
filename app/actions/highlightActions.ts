// app/actions/highlightActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// ... createHighlight permanece igual ...
export async function createHighlight({ bookId, cfiRange, text, color }: { bookId: string, cfiRange: string, text: string, color: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Não autorizado." };

    try {
        const newHighlight = await prisma.highlight.create({
            data: { 
                bookId, 
                userId: session.user.id, 
                cfiRange, 
                text, 
                color
            },
        });
        revalidatePath(`/read/${bookId}`);
        revalidatePath('/dashboard/highlights'); // Revalida a página de trechos
        return { success: "Trecho guardado com sucesso!", highlight: newHighlight };
    } catch (error) {
        console.error("Falha ao guardar o trecho:", error);
        return { error: "Não foi possível guardar o trecho." };
    }
}


// ... getHighlightsForBook permanece igual ...
export async function getHighlightsForBook(bookId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    try {
        return await prisma.highlight.findMany({
            where: { bookId, userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Falha ao obter os trechos:", error);
        return [];
    }
}

// *** NOVA FUNÇÃO ADICIONADA AQUI ***
export async function getAllHighlightsForUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    try {
        return await prisma.highlight.findMany({
            where: { userId: session.user.id },
            include: {
                book: true, // Inclui os dados do livro associado
            },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error("Falha ao obter todos os trechos:", error);
        return [];
    }
}


// ... deleteHighlight permanece igual ...
export async function deleteHighlight(highlightId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Não autorizado." };

    try {
        const highlight = await prisma.highlight.findFirst({
            where: { id: highlightId, userId: session.user.id }
        });

        if (!highlight) {
            return { error: "Trecho não encontrado ou não tem permissão para o apagar." };
        }

        await prisma.highlight.delete({ where: { id: highlightId } });
        
        revalidatePath(`/read/${highlight.bookId}`);
        revalidatePath('/dashboard/highlights'); // Revalida a página de trechos
        return { success: "Trecho apagado com sucesso!", cfiRange: highlight.cfiRange };
    } catch (error) {
        console.error("Falha ao apagar o trecho:", error);
        return { error: "Não foi possível apagar o trecho." };
    }
}