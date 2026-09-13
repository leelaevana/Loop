import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      Number(searchParams.get("page") || "1"),
      1
    );

    const pageSize = 10;

    const search = searchParams.get("search") || "";
    const channel = searchParams.get("channel") || "";
    const sentiment = searchParams.get("sentiment") || "";
    const status = searchParams.get("status") || "";

    const where = {
      workspaceId: user.workspaceId,

      ...(search
        ? {
            content: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),

      ...(channel
        ? {
            channel,
          }
        : {}),

      ...(sentiment
        ? {
            sentiment: sentiment as "POS" | "NEU" | "NEG",
          }
        : {}),

      ...(status
        ? {
            status: status as
              | "NEW"
              | "REVIEWED"
              | "ACTIONED",
          }
        : {}),
    };

    const [feedback, total] = await Promise.all([
      db.feedback.findMany({
        where,
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      db.feedback.count({
        where,
      }),
    ]);

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Feedback API error:", error);

    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
    try {
      const user = await getCurrentUser();
  
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      // Only ADMIN and ANALYST can update feedback
      if (user.role !== "ADMIN" && user.role !== "ANALYST") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
  
      const body = await request.json();
  
      const feedbackId = String(body.feedbackId || "");
      const newStatus = String(body.status || "");
  
      const allowedStatuses = ["NEW", "REVIEWED", "ACTIONED"];
  
      if (!feedbackId || !allowedStatuses.includes(newStatus)) {
        return NextResponse.json(
          { error: "Invalid feedback ID or status" },
          { status: 400 }
        );
      }
  
      // IMPORTANT:
      // workspaceId ensures one company cannot modify another
      // company's feedback.
      const feedback = await db.feedback.findFirst({
        where: {
          id: feedbackId,
          workspaceId: user.workspaceId,
        },
      });
  
      if (!feedback) {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 }
        );
      }
  
      const updatedFeedback = await db.feedback.update({
        where: {
          id: feedback.id,
        },
        data: {
          status: newStatus as "NEW" | "REVIEWED" | "ACTIONED",
        },
      });
  
      return NextResponse.json({
        message: "Feedback status updated successfully",
        feedback: updatedFeedback,
      });
    } catch (error) {
      console.error("Feedback PATCH error:", error);
  
      return NextResponse.json(
        { error: "Failed to update feedback status" },
        { status: 500 }
      );
    }
  }