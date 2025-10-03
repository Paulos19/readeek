"use client";

import { useState } from "react";
import { Prisma } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import CommentForm from "./CommentForm";

// Define um tipo recursivo para os comentários
type CommentWithRepliesAndAuthor = Prisma.CommunityCommentGetPayload<{
  include: {
    author: { select: { id: true, name: true, image: true } };
    replies: {
      include: {
        author: { select: { id: true, name: true, image: true } };
        replies: true; // Permite o aninhamento
      };
    };
  };
}>;

interface CommentThreadProps {
  comment: CommentWithRepliesAndAuthor;
  postId: string;
}

export default function CommentThread({ comment, postId }: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="flex gap-4">
      {/* Linha vertical para indicar o aninhamento */}
      <div className="w-1 bg-muted rounded-full cursor-pointer hover:bg-primary/50 transition-colors" />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.author.image ?? undefined} />
            <AvatarFallback>{comment.author.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <Link href={`/profile/${comment.author.id}`} className="text-sm font-medium hover:underline">
            {comment.author.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            • {formatDistanceToNow(new Date(comment.createdAt), { locale: ptBR, addSuffix: true })}
          </span>
        </div>
        <p className="py-2 text-sm">{comment.content}</p>
        <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Responder
        </Button>

        {isReplying && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCommentAdded={() => setIsReplying(false)}
            />
          </div>
        )}

        {/* Renderização recursiva das respostas com a correção */}
        <div className="mt-4 space-y-4">
          {comment.replies && comment.replies.map(reply => (
            <CommentThread key={reply.id} comment={reply as any} postId={postId} />
          ))}
        </div>
      </div>
    </div>
  );
}