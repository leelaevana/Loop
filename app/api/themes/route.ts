
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

    const themes = await db.theme.findMany({
      where: {
        workspaceId: user.workspaceId,
      },
      include: {
        feedback: {
          include: {
            feedback: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const result = themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      feedbackCount: theme.feedback.length,
    }));

    return NextResponse.json({
      themes: result,
    });
  } catch (error) {
    console.error("Themes API error:", error);

    return NextResponse.json(
      { error: "Failed to load themes" },
      { status: 500 }
    );
  }
}

