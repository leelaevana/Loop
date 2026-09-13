
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generateEmbedding } from "@/lib/ai";
import { searchFeedback } from "@/lib/search";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const question = String(body.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    // Generate an embedding for the user's question
    const queryVector = await generateEmbedding(question);

    // Search only inside the authenticated user's workspace
    const results = await searchFeedback(
      user.workspaceId,
      queryVector,
      10
    );

    if (results.length === 0) {
      return NextResponse.json({
        question,
        answer: "I could not find relevant customer feedback.",
        feedbackCount: 0,
      });
    }

    // Prepare relevant feedback for Gemini
    const context = results
      .map((item, index) => {
        return `
Feedback ${index + 1}:
Content: ${item.content}
Channel: ${item.channel}
Sentiment: ${item.sentiment || "Unknown"}
Feature Area: ${item.featureArea || "Unknown"}
Status: ${item.status}
Similarity: ${item.similarity.toFixed(3)}
`;
      })
      .join("\n---\n");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const prompt = `
You are LOOP, an AI customer-feedback intelligence assistant.

Answer the user's question using ONLY the customer feedback provided below.

The feedback was selected using semantic similarity search.

Rules:
- Do not invent information.
- Do not use outside knowledge.
- If the feedback does not contain enough information, clearly say so.
- Give a concise and useful business answer.
- Mention specific patterns when they are supported by the feedback.

Relevant customer feedback:
${context}

User question:
${question}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Gemini Ask LOOP error:",
        errorText
      );

      return NextResponse.json(
        { error: "Gemini API request failed." },
        { status: 500 }
      );
    }

    const data = await response.json();

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return NextResponse.json(
        { error: "Gemini did not return an answer." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      question,
      answer,
      feedbackCount: results.length,
    });
  } catch (error) {
    console.error("Ask LOOP API error:", error);

    return NextResponse.json(
      { error: "Failed to process question." },
      { status: 500 }
    );
  }
}