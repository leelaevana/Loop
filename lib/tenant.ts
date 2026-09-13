import { db } from "@/lib/db";

export async function getWorkspaceFeedback(
  workspaceId: string
) {
  return db.feedback.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getWorkspaceThemes(
  workspaceId: string
) {
  return db.theme.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getWorkspaceReports(
  workspaceId: string
) {
  return db.report.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}