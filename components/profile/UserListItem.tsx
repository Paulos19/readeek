"use client";

import { User } from "@prisma/client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DialogClose } from "@/components/ui/dialog";

interface UserListItemProps {
  user: User;
}

export function UserListItem({ user }: UserListItemProps) {
  return (
    <DialogClose asChild>
      <Link href={`/profile/${user.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted">
        <Avatar>
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email?.split('@')[0]}</p>
        </div>
      </Link>
    </DialogClose>
  );
}