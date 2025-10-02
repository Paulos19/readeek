"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const filters = [
  { label: "Todos", value: "ALL" },
  { label: "Posts", value: "POST" },
  { label: "Trechos", value: "EXCERPT" },
  { label: "Desafios", value: "CHALLENGE" },
];

export function PostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("type") || "ALL";

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "ALL") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}