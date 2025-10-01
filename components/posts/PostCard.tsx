// components/posts/PostCard.tsx
"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Repeat2, BookCheck, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Prisma, User } from "@prisma/client";
import { toggleReaction } from "@/app/actions/postActions";
import { CommentSection } from "./CommentSection";
import { cn } from "@/lib/utils";

type PostWithExtras = Prisma.PostGetPayload<{
  include: {
    user: true;
    book: true;
    reactions: true;
    comments: {
        include: { user: true },
        orderBy: { createdAt: 'asc' }
    };
    _count: {
        select: { comments: true, reactions: true }
    }
  }
}>

interface PostCardProps {
    post: PostWithExtras;
    currentUser: User | undefined;
}

const timeAgo = (date: Date): string => {
    // ... (função timeAgo permanece igual)
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


export function PostCard({ post, currentUser }: PostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [isPending, startTransition] = useTransition();

    const userHasReacted = currentUser ? post.reactions.some(r => r.userId === currentUser.id && r.emoji === "❤️") : false;

    const handleReaction = () => {
        if (!currentUser || isPending) return;
        startTransition(() => {
            toggleReaction(post.id, "❤️");
        });
    };

    const PostTypeIndicator = () => {
        if (post.type === 'CHALLENGE') {
            return <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><BookCheck size={14} /> Desafio</div>
        }
        if (post.type === 'EXCERPT') {
            return <div className="flex items-center gap-1 text-xs text-sky-600 font-semibold"><BookOpen size={14} /> Trecho</div>
        }
        return null;
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                <Avatar>
                    <AvatarImage src={post.user.image ?? undefined} alt={post.user.name ?? "Avatar"} />
                    <AvatarFallback>{post.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.user.name}</p>
                        <p className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            a ler <Link href={`/read/${post.book.id}`} className="font-medium text-foreground hover:underline">{post.book.title}</Link>
                        </p>
                        {/* <<< INDICADOR DE TIPO DE POST ADICIONADO AQUI >>> */}
                        {PostTypeIndicator() && <span className="text-xs text-muted-foreground">·</span>}
                        <PostTypeIndicator />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-2">
                <p className="whitespace-pre-wrap">{post.content}</p>
                 {post.book.coverUrl && post.type !== 'EXCERPT' && (
                    <div className="mt-4 relative aspect-[4/2] w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
                         <Image
                            src={post.book.coverUrl}
                            alt={`Capa do livro ${post.book.title}`}
                            fill
                            className="object-cover"
                         />
                    </div>
                )}
            </CardContent>
            <CardFooter className="px-4 pb-4 justify-start gap-4">
                <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle size={16} />
                    <span>{post._count.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReaction} disabled={!currentUser || isPending} className="flex items-center gap-2 text-muted-foreground">
                    <Heart size={16} className={cn(userHasReacted && "fill-red-500 text-red-500")} />
                    <span>{post._count.reactions}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <Repeat2 size={16} />
                    <span>Repostar</span>
                </Button>
            </CardFooter>

            {showComments && currentUser && (
                <CommentSection postId={post.id} comments={post.comments} currentUser={currentUser} />
            )}
        </Card>
    )
}