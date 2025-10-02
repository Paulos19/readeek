"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleFollow } from "@/app/actions/followActions";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, UserPlus } from "lucide-react";

interface FollowButtonProps {
  profileUserId: string;
  isFollowing: boolean;
}

export function FollowButton({ profileUserId, isFollowing }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    startTransition(async () => {
      const result = await toggleFollow(profileUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  return (
    <Button onClick={handleFollow} disabled={isPending} className="w-full md:w-auto">
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          A Seguir
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Seguir
        </>
      )}
    </Button>
  );
}