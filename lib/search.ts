
import { db } from "@/lib/db";

type SearchResult = {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  featureArea: string | null;
  status: string;
  similarity: number;
};

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export async function searchFeedback(
  workspaceId: string,
  queryVector: number[],
  limit = 10
): Promise<SearchResult[]> {
  const feedback = await db.feedback.findMany({
    where: {
      workspaceId,
      embedding: {
        isNot: null,
      },
    },
    include: {
      embedding: true,
    },
  });

  const results = feedback
    .map((item) => {
      const storedVector = Array.isArray(item.embedding?.vector)
        ? (item.embedding.vector as number[])
        : [];

      const similarity = cosineSimilarity(
        queryVector,
        storedVector
      );

      return {
        id: item.id,
        content: item.content,
        channel: item.channel,
        sentiment: item.sentiment,
        featureArea: item.featureArea,
        status: item.status,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}
