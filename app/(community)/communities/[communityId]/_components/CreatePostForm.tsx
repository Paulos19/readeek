// app/(community)/communities/[communityId]/_components/CreatePostForm.tsx
"use client";

import { createCommunityPost } from "@/app/actions/communityActions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

export default function CreatePostForm({ communityId }: { communityId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    const result = await createCommunityPost(formData);

    if (result.error) {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "A sua publicação foi adicionada.",
      });
      formRef.current?.reset();
    }
  };

  return (
    <form ref={formRef} action={handleAction} className="space-y-4 mb-6">
      <input type="hidden" name="communityId" value={communityId} />
      <Textarea
        name="content"
        placeholder="Escreva algo para a comunidade..."
        required
        rows={4}
      />
      <div className="flex justify-end">
        <Button type="submit">Publicar</Button>
      </div>
    </form>
  );
}