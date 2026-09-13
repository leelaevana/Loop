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

    // IMPORTANT: every query is restricted to the
    // authenticated user's workspace.
    const workspaceId = user.workspaceId;

    const feedback = await db.feedback.findMany({
      where: {
        workspaceId,
      },
      select: {
        sentiment: true,
        status: true,
        createdAt: true,
        themes: {
          include: {
            theme: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const total = feedback.length;

    const positive = feedback.filter(
      (item) => item.sentiment === "POS"
    ).length;

    const neutral = feedback.filter(
      (item) => item.sentiment === "NEU"
    ).length;

    const negative = feedback.filter(
      (item) => item.sentiment === "NEG"
    ).length;

    const newCount = feedback.filter(
      (item) => item.status === "NEW"
    ).length;

    const reviewed = feedback.filter(
      (item) => item.status === "REVIEWED"
    ).length;

    const actioned = feedback.filter(
      (item) => item.status === "ACTIONED"
    ).length;

    // Theme counts
    const themeCounts: Record<string, number> = {};

    for (const item of feedback) {
      for (const relation of item.themes) {
        const themeName = relation.theme.name;

        themeCounts[themeName] =
          (themeCounts[themeName] || 0) + 1;
      }
    }

    const topThemes = Object.entries(themeCounts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Feedback volume by date
    const volumeMap: Record<string, number> = {};

    for (const item of feedback) {
      const date = item.createdAt.toISOString().slice(0, 10);

      volumeMap[date] = (volumeMap[date] || 0) + 1;
    }

    const volumeOverTime = Object.entries(volumeMap).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    return NextResponse.json({
      stats: {
        total,
        positive,
        neutral,
        negative,
        new: newCount,
        reviewed,
        actioned,
      },
      sentiment: [
        {
          name: "Positive",
          value: positive,
        },
        {
          name: "Neutral",
          value: neutral,
        },
        {
          name: "Negative",
          value: negative,
        },
      ],
      status: [
        {
          name: "New",
          value: newCount,
        },
        {
          name: "Reviewed",
          value: reviewed,
        },
        {
          name: "Actioned",
          value: actioned,
        },
      ],
      topThemes,
      volumeOverTime,
    });
  } catch (error) {
    console.error("Insights API error:", error);

    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}