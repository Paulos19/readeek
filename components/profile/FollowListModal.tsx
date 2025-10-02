"use client";

import { ReactNode, useState } from "react";
import { User } from "@prisma/client";
import { getFollowers, getFollowing } from "@/app/actions/followActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { UserListItem } from "./UserListItem";

interface FollowListModalProps {
  children: ReactNode;
  title: string;
  userId: string;
  type: 'followers' | 'following';
}

export function FollowListModal({ children, title, userId, type }: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const fetchedUsers = type === 'followers'
      ? await getFollowers(userId)
      : await getFollowing(userId);
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild onClick={fetchData}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length > 0 ? (
            users.map(user => <UserListItem key={user.id} user={user} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum utilizador encontrado.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}