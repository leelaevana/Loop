import { Role } from "@prisma/client";

export function canManageWorkspace(role: Role) {
  return role === "ADMIN";
}

export function canManageFeedback(role: Role) {
  return role === "ADMIN" || role === "ANALYST";
}

export function canViewAnalytics(role: Role) {
  return (
    role === "ADMIN" ||
    role === "ANALYST" ||
    role === "VIEWER"
  );
}

export function canGenerateReports(role: Role) {
  return role === "ADMIN" || role === "ANALYST";
}