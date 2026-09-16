
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

    const reports = await db.report.findMany({
      where: {
        workspaceId: user.workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      reports,
    });
  } catch (error) {
    console.error("Reports GET error:", error);

    return NextResponse.json(
      { error: "Failed to load reports." },
      { status: 500 }
    );
  }
}

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
        {
          error:
            "You do not have permission to generate reports.",
        },
        { status: 403 }
      );
    }

    const feedback = await db.feedback.findMany({
      where: {
        workspaceId: user.workspaceId,
      },
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
      take: 100,
    });

    if (feedback.length === 0) {
      return NextResponse.json(
        { error: "No feedback available for the report." },
        { status: 400 }
      );
    }

    const context = feedback
      .map((item) => {
        const themes = item.themes
          .map((itemTheme) => itemTheme.theme.name)
          .join(", ");

        return `
Feedback: ${item.content}
Channel: ${item.channel}
Sentiment: ${item.sentiment || "Unknown"}
Feature Area: ${item.featureArea || "Unknown"}
Themes: ${themes || "None"}
Status: ${item.status}
`;
      })
      .join("\n---\n");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    const prompt = `
You are LOOP, an AI Voice-of-Customer analyst.

Create a concise Voice-of-Customer report using ONLY
the customer feedback provided below.

Return ONLY valid JSON with exactly these fields:

{
  "executiveSummary": "Short summary of the overall customer voice.",
  "topThemes": [
    {
      "theme": "Theme name",
      "description": "What customers are saying about this theme.",
      "impact": "High"
    }
  ],
  "sentimentSummary": {
    "positive": "Summary of positive feedback.",
    "neutral": "Summary of neutral feedback.",
    "negative": "Summary of negative feedback."
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Rules:
- Do not invent information.
- Use only the supplied feedback.
- Keep the report business-focused.
- Include 3 to 5 important themes.
- Impact must be High, Medium, or Low.
- Recommendations must be supported by customer feedback.
- Return JSON only.
- Do not use markdown.

Customer feedback:
${context}
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
    
      console.error("Gemini report error:", errorText);
    
      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "Gemini API quota exceeded. Please try again after the quota resets or enable billing for the Gemini API project.",
          },
          { status: 429 }
        );
      }
    
      return NextResponse.json(
        { error: "Gemini API request failed." },
        { status: 500 }
      );
    }
    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini did not return a report." },
        { status: 500 }
      );
    }

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const reportContent = JSON.parse(cleanedText);

    const now = new Date();

    const report = await db.report.create({
      data: {
        title: "Voice of Customer Report",
        periodStart: new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ),
        periodEnd: now,
        contentJson: reportContent,
        workspaceId: user.workspaceId,
        generatedById: user.id,
      },
    });

    return NextResponse.json({
      message: "Report generated successfully.",
      report,
    });
  } catch (error) {
    console.error("Reports POST error:", error);

    return NextResponse.json(
      { error: "Failed to generate report." },
      { status: 500 }
    );
  }
}