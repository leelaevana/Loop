
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai";

export async function POST() {
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

    const feedback = await db.feedback.findMany({
      where: {
        workspaceId: user.workspaceId,
        embedding: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    let created = 0;

    for (const item of feedback) {
      const vector = await generateEmbedding(item.content);

      await db.embedding.create({
        data: {
          feedbackId: item.id,
          vector,
        },
      });

      created++;
    }

    return NextResponse.json({
      message: "Embeddings generated successfully.",
      created,
    });
  } catch (error) {
    console.error("Embedding generation error:", error);

    return NextResponse.json(
      { error: "Failed to generate embeddings." },
      { status: 500 }
    );
  }
}