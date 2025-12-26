import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      credits: true,
      role: true,
      profileVisibility: true,
      _count: {
        select: {
          followers: true,
          following: true,
          books: true,
        }
      }
    }
  });

  // Sugestões de usuários para seguir (usuários aleatórios que você não segue)
  const suggestions = await prisma.user.findMany({
    where: {
      NOT: { id: session.user.id },
      followers: { none: { followerId: session.user.id } }
    },
    take: 5,
    select: { id: true, name: true, image: true }
  });

  return NextResponse.json({ stats, suggestions });
}