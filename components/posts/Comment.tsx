// components/posts/Comment.tsx
"use client"

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Prisma, User } from "@prisma/client";
import { CommentForm } from "./CommentForm";

// Define um tipo para o comentário que inclui o utilizador e as respostas
type CommentWithReplies = Prisma.CommentGetPayload<{
    include: { user: true, replies: { include: { user: true } } }
}>

interface CommentProps {
    comment: CommentWithReplies;
    currentUser: User;
    postId: string;
}

const timeAgo = (date: Date): string => {
    // ... (função timeAgo)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
}

export function Comment({ comment, currentUser, postId }: CommentProps) {
    const [isReplying, setIsReplying] = useState(false);

    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.image ?? undefined} />
                <AvatarFallback>{comment.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm">
                <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{comment.user.name}</p>
                        <p className="text-xs text-muted-foreground">· {timeAgo(comment.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-muted-foreground">{comment.text}</p>
                </div>
                <div className="pl-3 pt-1">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsReplying(!isReplying)}>
                        Responder
                    </Button>
                </div>

                {isReplying && (
                    <div className="mt-2">
                        <CommentForm
                            postId={postId}
                            currentUser={currentUser}
                            parentId={comment.id}
                            onCommentPosted={() => setIsReplying(false)}
                        />
                    </div>
                )}
                
                {/* Renderiza as respostas de forma recursiva */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-6 border-l-2">
                        {comment.replies.map(reply => (
                             <Comment key={reply.id} comment={reply as CommentWithReplies} currentUser={currentUser} postId={postId} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}