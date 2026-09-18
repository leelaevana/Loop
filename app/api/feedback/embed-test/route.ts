
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

    const feedback = await db.feedback.findFirst({
      where: {
        workspaceId: user.workspaceId,
        embedding: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!feedback) {
      return NextResponse.json({
        message: "No feedback needs an embedding.",
      });
    }

    const vector = await generateEmbedding(feedback.content);

    const vectorLiteral = `[${vector.join(",")}]`;

    const embedding = await db.$transaction(async (tx: any) => {
        const createdEmbedding = await tx.embedding.create({
          data: {
            feedbackId: feedback.id,
            vector,
          },
        });

        await tx.$executeRaw`
          UPDATE "Embedding"
          SET "vector_pg" = ${vectorLiteral}::vector
          WHERE "feedbackId" = ${feedback.id}
        `;

        return createdEmbedding;
      });

    return NextResponse.json({
      message: "Test embedding created successfully.",
      feedbackId: feedback.id,
      vectorLength: vector.length,
      embeddingId: embedding.id,
    });
  } catch (error) {
    console.error("Embedding test error:", error);

    return NextResponse.json(
      { error: "Embedding test failed." },
      { status: 500 }
    );
  }
}
