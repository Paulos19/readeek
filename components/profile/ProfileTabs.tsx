"use client";

import { Prisma, User } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCard } from "@/app/(app)/dashboard/_components/BookCard";
import { MessageSquare } from "lucide-react";

type PostWithExtras = Prisma.PostGetPayload<{
  include: { book: true; _count: { select: { comments: true, reactions: true } } }
}>

type Book = Prisma.BookGetPayload<{}>;

interface ProfileTabsProps {
  posts: PostWithExtras[];
  books: Book[];
}

// Pequeno componente para o item da grelha de posts
function PostGridItem({ post }: { post: PostWithExtras }) {
  return (
    <Link href={`/`} className="group relative aspect-square w-full overflow-hidden rounded-md">
      {post.book.coverUrl ? (
        <Image
          src={post.book.coverUrl}
          alt={`Capa do livro ${post.book.title}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center p-2 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{post.book.title}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="flex items-center gap-2 text-white font-bold">
          <MessageSquare className="h-5 w-5" />
          <span>{post._count.comments + post._count.reactions}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProfileTabs({ posts, books }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="posts">Publicações</TabsTrigger>
        <TabsTrigger value="library">Biblioteca</TabsTrigger>
      </TabsList>
      
      <TabsContent value="posts" className="mt-6">
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
              <PostGridItem key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-medium">Nenhuma publicação ainda</h2>
            <p className="text-muted-foreground mt-2">
              Este utilizador não partilhou nenhuma atividade.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="library" className="mt-6">
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-medium">A biblioteca está vazia</h2>
            <p className="text-muted-foreground mt-2">
              Este utilizador ainda não adicionou nenhum livro.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}