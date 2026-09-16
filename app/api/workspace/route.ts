import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspace = await db.workspace.findUnique({
      where: {
        id: user.workspaceId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workspace,
    });
  } catch (error) {
    console.error("Workspace GET error:", error);

    return NextResponse.json(
      { error: "Failed to load workspace." },
      { status: 500 }
    );
  }
}