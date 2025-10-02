"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateDisplayedInsignias } from "@/app/actions/profileActions";

type InsigniasOnUsersWithInsignia = Prisma.InsigniasOnUsersGetPayload<{
  include: { insignia: true };
}>;

interface InsigniaManagerProps {
  ownedInsignias: InsigniasOnUsersWithInsignia[];
  initiallyDisplayedIds: string[];
}

const MAX_DISPLAYED = 3;

export function InsigniaManager({ ownedInsignias, initiallyDisplayedIds }: InsigniaManagerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initiallyDisplayedIds);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (insigniaId: string) => {
    setSelectedIds((currentIds) => {
      if (currentIds.includes(insigniaId)) {
        // Desseleciona
        return currentIds.filter((id) => id !== insigniaId);
      } else {
        // Seleciona, respeitando o limite
        if (currentIds.length < MAX_DISPLAYED) {
          return [...currentIds, insigniaId];
        }
        toast.info(`Pode exibir no máximo ${MAX_DISPLAYED} insígnias.`);
        return currentIds;
      }
    });
  };

  const handleSaveChanges = () => {
    startTransition(async () => {
        const result = await updateDisplayedInsignias(selectedIds);
        if (result.error) {
            toast.error("Erro", { description: result.error });
        } else {
            toast.success("Sucesso", { description: result.success });
        }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {ownedInsignias.map(({ insignia }) => (
          <button
            key={insignia.id}
            onClick={() => handleSelect(insignia.id)}
            className="flex flex-col items-center gap-2 text-center"
          >
            <div
              className={cn(
                "relative h-20 w-20 rounded-full border-2 p-2 transition-all",
                selectedIds.includes(insignia.id)
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-muted hover:border-muted-foreground"
              )}
            >
              <Image src={insignia.imageUrl} alt={insignia.name} fill className="object-contain" />
            </div>
            <span className="text-xs font-medium truncate">{insignia.name}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Insígnias
        </Button>
      </div>
    </div>
  );
}