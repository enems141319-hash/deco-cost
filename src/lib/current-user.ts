import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

interface SessionLike {
  user?: {
    id?: string;
    email?: string | null;
  };
}

export async function requireCurrentUserId(session: SessionLike | null | undefined): Promise<string> {
  if (!session?.user?.id && !session?.user?.email) redirect("/login");

  if (session.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (user) return user.id;
  }

  if (session.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (user) return user.id;
  }

  redirect("/login");
}
