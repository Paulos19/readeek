import { getLatestCommunities } from "@/app/actions/communityActions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function LatestCommunitiesCard() {
    // Busca as 4 comunidades públicas mais recentes
    const latestCommunities = await getLatestCommunities(4);

    // Se não houver comunidades, o card não será renderizado
    if (latestCommunities.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Novas Comunidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {latestCommunities.map(community => (
                    <div key={community.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback>{community.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Link href={`/communities/${community.id}`} className="font-semibold text-sm hover:underline">
                                    {community.name}
                                </Link>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {community._count.members} {community._count.members === 1 ? 'membro' : 'membros'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                <Button asChild variant="secondary" className="w-full mt-4">
                    <Link href="/communities">
                        Ver todas as comunidades
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}