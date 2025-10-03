import { Prisma } from "@prisma/client";
import CommentForm from "./CommentForm";
import CommentThread from "./CommentThread";

type CommentWithRepliesAndAuthor = Prisma.CommunityCommentGetPayload<{
  include: {
    author: { select: { id: true, name: true, image: true } };
    replies: {
      include: {
        author: { select: { id: true, name: true, image: true } };
        replies: true;
      };
    };
  };
}>;

interface CommentSectionProps {
  postId: string;
  comments: CommentWithRepliesAndAuthor[];
}

export default function CommentSection({ postId, comments }: CommentSectionProps) {
  // Filtra para obter apenas os comentários de nível superior (sem parentId)
  const topLevelComments = comments.filter(comment => !comment.parentId);

  // Mapeia os comentários por ID para encontrar as respostas facilmente
  const commentsById = new Map(comments.map(comment => [comment.id, comment]));

  // Constrói a árvore de comentários
  comments.forEach(comment => {
    if (comment.parentId) {
      const parent = commentsById.get(comment.parentId);
      if (parent) {
        if (!parent.replies) {
          parent.replies = [];
        }
        // Evita duplicados
        if (!parent.replies.some(reply => reply.id === comment.id)) {
          parent.replies.push(comment);
        }
      }
    }
  });

  return (
    <div className="space-y-6 pt-4">
      <CommentForm postId={postId} />
      <div className="space-y-6">
        {topLevelComments.length > 0 ? (
          topLevelComments.map(comment => (
            <CommentThread key={comment.id} comment={comment as any} postId={postId} />
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground">Ainda não há comentários. Seja o primeiro!</p>
        )}
      </div>
    </div>
  );
}