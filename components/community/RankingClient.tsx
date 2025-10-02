"use client";

import { useState } from "react";
import { FullRankingUser } from "@/app/actions/communityActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, MessageSquare, Heart, Edit } from "lucide-react";
import Link from "next/link";
import { RankingPagination } from "./RankingPagination";

interface RankingClientProps {
  initialData: {
    users: FullRankingUser[];
    totalPages: number;
    currentPage: number;
  };
}

export function RankingClient({ initialData }: RankingClientProps) {
  const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);

  const { users, totalPages, currentPage } = initialData;

  return (
    <div>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Utilizador</TableHead>
                    <TableHead className="text-right">Pontuação</TableHead>
                    <TableHead className="w-32 text-center">Métricas</TableHead>
                </TableRow>
                </TableHeader>
                {/* CORREÇÃO: O <Collapsible> agora envolve um <tbody> em vez de um <>, o que é válido e corrige o erro. */}
                {users.map((user, index) => {
                    const rank = (currentPage - 1) * 15 + index + 1;
                    return (
                    <Collapsible asChild key={user.id} open={openCollapsibleId === user.id} onOpenChange={() => setOpenCollapsibleId(prev => prev === user.id ? null : user.id)}>
                        <tbody className="border-b last:border-b-0">
                            <TableRow className="hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                <TableCell className="text-center font-bold text-lg">{rank}</TableCell>
                                <TableCell>
                                <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
                                    <Avatar>
                                    <AvatarImage src={user.image ?? undefined} />
                                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                    <p className="font-semibold group-hover:underline">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">@{user.email?.split('@')[0]}</p>
                                    </div>
                                </Link>
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary text-lg">{user.score}</TableCell>
                                <TableCell className="text-center">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                    Métricas
                                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                                </TableCell>
                            </TableRow>
                            <CollapsibleContent asChild>
                                <TableRow>
                                    <TableCell colSpan={4} className="p-0">
                                        <div className="bg-background p-4 flex justify-around items-center">
                                            <div className="text-center">
                                                <p className="font-bold text-xl">{user._count.posts}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center"><Edit size={14}/> Posts</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-xl">{user._count.comments}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center"><MessageSquare size={14}/> Comentários</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-xl">{user._count.reactions}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center"><Heart size={14}/> Reações</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </CollapsibleContent>
                        </tbody>
                    </Collapsible>
                    );
                })}
            </Table>
        </div>
        
        <RankingPagination currentPage={currentPage} totalPages={totalPages} />

    </div>
  );
}