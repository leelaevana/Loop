import { db } from "@/lib/db";

export type SearchResult = {
  id: string;
  content: string;
  channel: string;
  sentiment: string | null;
  featureArea: string | null;
  status: string;
  similarity: number;
};

export async function searchFeedback(
  workspaceId: string,
  queryVector: number[],
  limit = 10
): Promise<SearchResult[]> {
  if (!queryVector.length) {
    return [];
  }

  // Convert the query embedding into pgvector's expected format.
  const vectorLiteral = `[${queryVector.join(",")}]`;

  const results = await db.$queryRaw<SearchResult[]>`
    SELECT
      f.id,
      f.content,
      f.channel,
      f.sentiment::text AS sentiment,
      f."featureArea",
      f.status::text AS status,
      1 - (e."vector_pg" <=> ${vectorLiteral}::vector) AS similarity
    FROM "Feedback" f
    INNER JOIN "Embedding" e
      ON e."feedbackId" = f.id
    WHERE f."workspaceId" = ${workspaceId}
      AND e."vector_pg" IS NOT NULL
    ORDER BY e."vector_pg" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;

  return results;
}
