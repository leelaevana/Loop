
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { classifyFeedback } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "ANALYST") {
      return NextResponse.json(
        { error: "You do not have permission to classify feedback." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const feedbackId = String(body.feedbackId || "");

    if (!feedbackId) {
      return NextResponse.json(
        { error: "Feedback ID is required." },
        { status: 400 }
      );
    }

    // Always verify the feedback belongs to the
    // authenticated user's workspace.
    const feedback = await db.feedback.findFirst({
      where: {
        id: feedbackId,
        workspaceId: user.workspaceId,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found." },
        { status: 404 }
      );
    }

    // Ask Gemini to classify the feedback.
    const result = await classifyFeedback(feedback.content);

    // Update sentiment and feature area.
    const updatedFeedback = await db.feedback.update({
      where: {
        id: feedback.id,
      },
      data: {
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        featureArea: result.featureArea,
      },
    });

    // Find an existing theme inside THIS workspace only.
    // Case-insensitive matching prevents duplicate themes such as:
    // "Slow Checkout" and "slow checkout".
    let theme = await db.theme.findFirst({
      where: {
        workspaceId: user.workspaceId,
        name: {
          equals: result.theme,
          mode: "insensitive",
        },
      },
    });

    // Create the theme if it does not already exist.
    if (!theme) {
      theme = await db.theme.create({
        data: {
          name: result.theme,
          description: result.themeDescription,
          workspaceId: user.workspaceId,
        },
      });
    }

    // Connect the feedback to the theme.
    await db.feedbackTheme.upsert({
      where: {
        feedbackId_themeId: {
          feedbackId: feedback.id,
          themeId: theme.id,
        },
      },
      update: {
        confidence: result.sentimentScore,
      },
      create: {
        feedbackId: feedback.id,
        themeId: theme.id,
        confidence: result.sentimentScore,
      },
    });

    return NextResponse.json({
      message: "Feedback classified successfully.",
      feedback: updatedFeedback,
      ai: result,
      theme,
    });
  } catch (error) {
    console.error("Feedback classification error:", error);

    return NextResponse.json(
      { error: "Failed to classify feedback." },
      { status: 500 }
    );
  }
}

