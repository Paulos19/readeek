"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPost } from "@/app/actions/postActions";
import { getHighlightsForBook } from "@/app/actions/highlightActions";
import { Book, Highlight, PostType, User } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BookCheck, MessageSquare, BookOpen } from "lucide-react";

interface CreatePostFormProps {
  user: User;
  books: Book[];
}

export function CreatePostForm({ user, books }: CreatePostFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [postType, setPostType] = useState<PostType>("POST");
  
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isFetchingHighlights, setIsFetchingHighlights] = useState(false);
  const [content, setContent] = useState("");

  const selectedBook = books.find(b => b.id === selectedBookId);

  useEffect(() => {
    if (postType === 'EXCERPT' && selectedBookId) {
      setIsFetchingHighlights(true);
      getHighlightsForBook(selectedBookId)
        .then(data => setHighlights(data))
        .finally(() => setIsFetchingHighlights(false));
    } else {
      setHighlights([]);
    }
  }, [selectedBookId, postType]);

  const handleSubmit = async (formData: FormData) => {
    formData.append("type", postType);
    formData.set("content", content);

    startTransition(async () => {
      const result = await createPost(formData);

      if (result?.error) {
        if (typeof result.error === 'object') {
          const errorMessages = Object.values(result.error).flat().join("\n");
          toast.error("Erro de validação", { description: errorMessages });
        } else {
          toast.error("Erro", { description: result.error });
        }
      } else {
        toast.success(result.success);
        formRef.current?.reset();
        setContent("");
        setSelectedBookId(null);
        setPostType("POST");
      }
    });
  };

  return (
    <Card>
      <form ref={formRef} action={handleSubmit}>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Avatar"} />
            <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="font-semibold">{user.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant={postType === 'POST' ? 'default' : 'outline'} onClick={() => setPostType('POST')}>
                    <MessageSquare size={16} className="mr-2"/> Post
                </Button>
                <Button type="button" size="sm" variant={postType === 'CHALLENGE' ? 'default' : 'outline'} onClick={() => setPostType('CHALLENGE')}>
                    <BookCheck size={16} className="mr-2"/> Desafio
                </Button>
                <Button type="button" size="sm" variant={postType === 'EXCERPT' ? 'default' : 'outline'} onClick={() => setPostType('EXCERPT')}>
                    <BookOpen size={16} className="mr-2"/> Trecho
                </Button>
            </div>
            {postType === 'EXCERPT' && selectedBookId && (
              <div>
                <Select
                  disabled={isFetchingHighlights || highlights.length === 0}
                  onValueChange={(value) => {
                    setContent(value === "manual" ? "" : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isFetchingHighlights ? "A carregar trechos..." : "Escolha um trecho marcado..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Escrever manualmente</SelectItem>
                    {highlights.map(hl => (
                      <SelectItem key={hl.id} value={hl.text}>
                        <span className="italic truncate">"{hl.text}"</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                    postType === 'POST' ? "O que está a achar da sua leitura?" :
                    postType === 'CHALLENGE' ? "Desafie a comunidade! Ex: Ler 100 páginas hoje." :
                    "Partilhe um trecho marcante do livro..."
                }
                rows={3}
                className="w-full resize-none"
                disabled={isPending}
            />
        </CardContent>
        <CardFooter className="justify-between">
          <Select name="bookId" onValueChange={setSelectedBookId} disabled={isPending || books.length === 0}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione o livro associado..." />
            </SelectTrigger>
            <SelectContent>
              {books.length > 0 ? (
                books.map(book => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Não tem livros na sua biblioteca.</div>
              )}
            </SelectContent>
          </Select>

          {selectedBook && (
            <input type="hidden" name="progressAtPost" value={selectedBook.progress} />
          )}

          <Button type="submit" disabled={isPending || !selectedBookId || !content}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publicar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
