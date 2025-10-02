import { getSuggestedUsers } from "@/app/actions/communityActions";
import { FollowButton } from "@/components/profile/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import Link from "next/link";

export async function SuggestedUsersCard() {
  const suggestedUsers = await getSuggestedUsers();

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-5 w-5 text-primary" />
          Sugestões para Seguir
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedUsers.map(user => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href={`/profile/${user.id}`}>
                <p className="font-semibold text-sm hover:underline">{user.name}</p>
              </Link>
              <p className="text-xs text-muted-foreground">@{user.email?.split('@')[0]}</p>
            </div>
            {/* O isFollowing é sempre falso aqui, pois a query já filtra quem seguimos */}
            <FollowButton profileUserId={user.id} isFollowing={false} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
