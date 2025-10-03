"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Prisma, CommunityRole } from "@prisma/client";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageSquare, MoreVertical, Flag, Trash2, UserX, Crown, Star } from "lucide-react";
import Link from "next/link";
import {
  reactToCommunityPost,
  reportCommunityPost,
  deleteCommunityPost,
  banUserFromCommunity
} from "@/app/actions/communityActions";

// Importa a nova secção de comentários
import CommentSection from "./CommentSection";

// Tipo de dados expandido para incluir os comentários
type CommunityPostWithDetails = Prisma.CommunityPostGetPayload<{
  include: {
    author: {
        select: {
            id: true; name: true; image: true;
            communityMemberships: { where: { communityId: string } }
        }
    };
    _count: { select: { reactions: true, comments: true } };
    reactions: { where: { userId: string } };
    comments: {
      include: {
        author: { select: { id: true, name: true, image: true } };
        replies: true;
      }
    }
  };
}>;

interface CommunityPostCardProps {
  post: CommunityPostWithDetails;
  currentUserId?: string;
  isOwner: boolean;
  authorRole?: CommunityRole;
}

function RoleBadge({ role }: { role?: CommunityRole }) {
    if (!role) return null;
    if (role === "OWNER") return <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100"><Crown className="h-3 w-3 mr-1" />Dono</Badge>;
    if (role === "HONORARY_MEMBER") return <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"><Star className="h-3 w-3 mr-1" />Honorário</Badge>;
    return null;
}

export default function CommunityPostCard({ post, currentUserId, isOwner, authorRole }: CommunityPostCardProps) {
  const { toast } = useToast();
  const isReacted = post.reactions.some(r => r.userId === currentUserId);

  const handleReact = async () => { /* ... (código inalterado) ... */ };
  const handleReport = async () => { /* ... (código inalterado) ... */ };
  const handleDelete = async () => { /* ... (código inalterado) ... */ };
  const handleBan = async () => { /* ... (código inalterado) ... */ };

  return (
    <Collapsible asChild>
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <Link href={`/profile/${post.author.id}`}>
            <Avatar>
              <AvatarImage src={post.author.image ?? undefined} />
              <AvatarFallback>{post.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center">
              <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">{post.author.name}</Link>
              <RoleBadge role={authorRole} />
            </div>
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}</p>
          </div>
          <div className="ml-auto">
            {/* O DropdownMenu permanece o mesmo */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {isOwner && post.authorId !== currentUserId && (
                        <>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="h-4 w-4 mr-2" />Remover Publicação</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleBan} className="text-destructive focus:text-destructive focus:bg-destructive/10"><UserX className="h-4 w-4 mr-2" />Banir Utilizador</DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem onClick={handleReport}><Flag className="h-4 w-4 mr-2" />Denunciar</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        </CardContent>
        <CardFooter className="gap-4 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={handleReact} className="flex items-center gap-1.5">
            <Heart className={`h-4 w-4 ${isReacted ? 'text-red-500 fill-current' : ''}`} />
            {post._count.reactions}
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              {post.comments.length}
            </Button>
          </CollapsibleTrigger>
        </CardFooter>

        {/* Conteúdo Dobrável que contém a secção de comentários */}
        <CollapsibleContent>
          <div className="p-4 pt-0 border-t">
            <CommentSection postId={post.id} comments={post.comments as any} />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}