import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role as Role)) {
    redirect("/dashboard");
  }

  return user;
}