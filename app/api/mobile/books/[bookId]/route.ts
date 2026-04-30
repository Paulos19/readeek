import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-dev-only";

export async function DELETE(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const userRole = decoded.role;
    
    // In Next.js 15, route params can be an async object depending on configuration,
    // but typically params are synchronous in the signature if correctly exported.
    // Ensure we handle it if it is a Promise (Next 15+ new params format):
    const bookId = typeof params.bookId === 'string' ? params.bookId : await (params as any).bookId;

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    // 1. Fetch the book
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, userId: true }
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // 2. Check Permissions (Owner or Admin)
    if (book.userId !== userId && userRole !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: You don't have permission to delete this book" }, { status: 403 });
    }

    // 3. Delete the book
    await prisma.book.delete({
      where: { id: bookId }
    });

    return NextResponse.json({ success: true, message: "Book deleted successfully" });

  } catch (error) {
    console.error("Erro API Delete Book:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
