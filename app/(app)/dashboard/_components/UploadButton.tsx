"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { uploadBook } from "@/app/actions/bookActions";

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    // Validação básica do lado do cliente para feedback rápido
    const file = formData.get("epubFile") as File;
    if (!file || file.size === 0) {
      toast.error("Nenhum arquivo selecionado.");
      return;
    }
    if (file.type !== 'application/epub+zip') {
      toast.error("Formato de arquivo inválido. Apenas .epub é permitido.");
      return;
    }

    startTransition(async () => {
      const result = await uploadBook(formData);

      if (result.error) {
        toast.error("Erro no Upload", { description: result.error });
      } else {
        toast.success("Sucesso!", { description: result.success });
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Adicionar Livro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form
          ref={formRef}
          action={handleSubmit}
          className="grid gap-4"
        >
          <DialogHeader>
            <DialogTitle>Enviar novo livro</DialogTitle>
            <DialogDescription>
              Selecione um arquivo no formato .epub do seu computador.
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full items-center gap-4 py-4">
            <Label htmlFor="epubFile" className="sr-only">Arquivo EPUB</Label>
            <Input id="epubFile" name="epubFile" type="file" accept=".epub" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Livro"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}