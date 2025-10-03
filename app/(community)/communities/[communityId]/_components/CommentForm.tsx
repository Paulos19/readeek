"use client";

import { addCommunityComment } from "@/app/actions/communityActions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: () => void; // Função para fechar o formulário após submeter
}

export default function CommentForm({ postId, parentId, onCommentAdded }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    const result = await addCommunityComment(formData);
    if (result.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    } else {
      formRef.current?.reset();
      if (onCommentAdded) onCommentAdded();
    }
  };

  return (
    <form ref={formRef} action={handleAction} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Textarea
        name="content"
        placeholder={parentId ? "Escreva a sua resposta..." : "Adicione um comentário..."}
        required
        rows={3}
      />
      <div className="flex justify-end gap-2">
        {onCommentAdded && <Button type="button" variant="ghost" onClick={onCommentAdded}>Cancelar</Button>}
        <Button type="submit">Enviar</Button>
      </div>
    </form>
  );
}