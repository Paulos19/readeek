// components/posts/CommentForm.tsx
"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { createComment } from "@/app/actions/postActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { User } from "@prisma/client";

interface CommentFormProps {
    postId: string;
    currentUser: User;
    parentId?: string; // Opcional, para indicar que é uma resposta
    onCommentPosted?: () => void; // Opcional, para fechar o formulário após postar
}

export function CommentForm({ postId, currentUser, parentId, onCommentPosted }: CommentFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();

    const handleCommentSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await createComment(formData);
            if (result?.error) {
                 toast.error("Erro ao comentar", { description: "O seu comentário não pôde ser publicado." });
            } else {
                formRef.current?.reset();
                if (onCommentPosted) onCommentPosted();
            }
        });
    };

    return (
        <form ref={formRef} action={handleCommentSubmit} className="flex items-start gap-4">
            <Avatar className="h-9 w-9">
                <AvatarImage src={currentUser.image ?? undefined} />
                <AvatarFallback>{currentUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <input type="hidden" name="postId" value={postId} />
                {parentId && <input type="hidden" name="parentId" value={parentId} />}
                <Textarea
                    name="text"
                    placeholder={parentId ? "Escreva uma resposta..." : "Escreva um comentário..."}
                    rows={2}
                    className="w-full resize-none mb-2"
                    disabled={isPending}
                />
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {parentId ? "Responder" : "Comentar"}
                    </Button>
                </div>
            </div>
        </form>
    );
}