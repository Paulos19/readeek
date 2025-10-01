// components/posts/CommentSection.tsx
import { Prisma, User } from "@prisma/client";
import { Comment } from "./Comment";
import { CommentForm } from "./CommentForm";

// Tipo para incluir utilizador e respostas de forma aninhada
type CommentWithReplies = Prisma.CommentGetPayload<{
    include: { 
        user: true, 
        replies: {
            include: { user: true }
        } 
    }
}>;

interface CommentSectionProps {
    postId: string;
    comments: CommentWithReplies[];
    currentUser: User;
}

export function CommentSection({ postId, comments, currentUser }: CommentSectionProps) {
    // Filtra apenas os comentários de nível superior (que não são respostas)
    const topLevelComments = comments.filter(comment => !comment.parentId);

    return (
        <div className="p-4 pt-2 border-t">
            {/* Formulário para novos comentários de nível superior */}
            <div className="mb-6">
                <CommentForm postId={postId} currentUser={currentUser} />
            </div>

            {/* Lista de comentários */}
            <div className="space-y-6">
                {topLevelComments.map(comment => (
                    <Comment key={comment.id} comment={comment} currentUser={currentUser} postId={postId} />
                ))}
            </div>
        </div>
    );
}