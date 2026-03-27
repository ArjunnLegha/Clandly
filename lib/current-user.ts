import { prisma } from "@/lib/prisma";

/**
 * Demo "logged-in" user: set DEMO_USER_ID in .env, or the first user from the database is used.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const fromEnv = process.env.DEMO_USER_ID;
  if (fromEnv) return fromEnv;

  const first = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  return first?.id ?? null;
}

export async function requireCurrentUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) {
    throw new Error("No user found. Run prisma db seed.");
  }
  return id;
}
