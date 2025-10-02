"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RankingPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function RankingPagination({ currentPage, totalPages }: RankingPaginationProps) {
  const pathname = usePathname();

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Button asChild variant="outline" disabled={!hasPrevPage}>
        <Link href={`${pathname}?page=${currentPage - 1}`} scroll={false}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Link>
      </Button>
      <span className="text-sm font-medium">
        Página {currentPage} de {totalPages}
      </span>
      <Button asChild variant="outline" disabled={!hasNextPage}>
        <Link href={`${pathname}?page=${currentPage + 1}`} scroll={false}>
          Próxima
          <ChevronRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}