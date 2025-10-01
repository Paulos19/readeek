// components/community/TopReadersCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { TopReader, getWeeklyTopReaders } from "@/app/actions/communityActions";

export async function TopReadersCard() {
    const topReaders = await getWeeklyTopReaders();

    if (topReaders.length === 0) {
        return null; // Não mostra nada se não houver leitores ativos
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="text-amber-500" />
                    Leitores da Semana
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {topReaders.map((reader, index) => (
                    <div key={reader.id} className="flex items-center gap-4">
                        <span className="font-bold text-lg text-muted-foreground w-5">#{index + 1}</span>
                        <Avatar>
                            <AvatarImage src={reader.image ?? undefined} />
                            <AvatarFallback>{reader.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold truncate">{reader.name}</p>
                            <p className="text-xs text-muted-foreground">{reader.score} pontos</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}