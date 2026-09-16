
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { classifyFeedback, generateEmbedding } from "@/lib/ai";

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

/**
 * POST
 *
 * Creates feedback and automatically:
 * 1. Classifies it with Gemini
 * 2. Creates or reuses a workspace theme
 * 3. Links feedback to the theme
 * 4. Generates an embedding
 * 5. Stores the embedding in JSON + pgvector
 */
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
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const content = String(body.content || "").trim();
    const channel = String(body.channel || "Manual").trim();
    const sourceRef = body.sourceRef
      ? String(body.sourceRef).trim()
      : null;
    const customerLabel = body.customerLabel
      ? String(body.customerLabel).trim()
      : null;

    if (!content) {
      return NextResponse.json(
        { error: "Feedback content is required." },
        { status: 400 }
      );
    }

    // Step 1: Ask Gemini to classify the feedback.
    const classification = await classifyFeedback(content);

    // Step 2: Generate the semantic embedding.
    const vector = await generateEmbedding(content);

    if (vector.length !== 3072) {
      throw new Error(
        `Unexpected embedding dimension: ${vector.length}. Expected 3072.`
      );
    }

    const vectorLiteral = `[${vector.join(",")}]`;

    // Step 3: Create feedback, theme relationship,
    // and embedding in one database transaction.
    const result = await db.$transaction(async (tx) => {
      // Find an existing theme ONLY inside the current workspace.
      let theme = await tx.theme.findFirst({
        where: {
          workspaceId: user.workspaceId,
          name: {
            equals: classification.theme,
            mode: "insensitive",
          },
        },
      });

      // Create the theme if it doesn't exist.
      if (!theme) {
        theme = await tx.theme.create({
          data: {
            name: classification.theme,
            description: classification.themeDescription,
            workspaceId: user.workspaceId,
          },
        });
      }

      // Create the feedback.
      const feedback = await tx.feedback.create({
        data: {
          content,
          channel,
          sourceRef,
          customerLabel,
          sentiment: classification.sentiment,
          sentimentScore: classification.sentimentScore,
          featureArea: classification.featureArea,
          workspaceId: user.workspaceId,
        },
      });

      // Connect feedback to the AI-generated theme.
      await tx.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: 1,
        },
      });

      // Create the embedding record.
      const embedding = await tx.embedding.create({
        data: {
          feedbackId: feedback.id,
          vector,
        },
      });

      // Copy the vector into the PostgreSQL pgvector column.
      await tx.$executeRaw`
        UPDATE "Embedding"
        SET "vector_pg" = ${vectorLiteral}::vector
        WHERE "feedbackId" = ${feedback.id}
      `;

      return {
        feedback,
        theme,
        embedding,
      };
    });

    return NextResponse.json(
      {
        message: "Feedback created and analyzed successfully.",
        feedback: result.feedback,
        theme: result.theme,
        embeddingId: result.embedding.id,
        vectorLength: vector.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback POST error:", error);

    return NextResponse.json(
      { error: "Failed to create and analyze feedback." },
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
        status: newStatus as
          | "NEW"
          | "REVIEWED"
          | "ACTIONED",
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
