
import { z } from "zod";

const classificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(0).max(1),
  featureArea: z.string().min(1),
  theme: z.string().min(1),
  themeDescription: z.string().min(1),
});

export async function classifyFeedback(content: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const prompt = `
You are a customer feedback analysis system.

Analyze the following customer feedback.

Return ONLY valid JSON.

Use exactly these fields:

{
  "sentiment": "POS",
  "sentimentScore": 0.9,
  "featureArea": "Checkout",
  "theme": "Slow Checkout",
  "themeDescription": "Customers experience slow checkout performance."
}

Rules:
- sentiment must be POS, NEU, or NEG.
- sentimentScore must be between 0 and 1.
- POS means positive.
- NEU means neutral.
- NEG means negative.
- featureArea should identify the product area.
- theme should be short and reusable.
- themeDescription should briefly explain the theme.
- Return JSON only. No markdown.

Customer feedback:
${content}
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
    console.error("Gemini API error:", errorText);
    throw new Error("Gemini API request failed.");
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini did not return a response.");
  }

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleanedText);

  return classificationSchema.parse(parsed);
}



export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [
            {
              text,
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini embedding error:", errorText);
    throw new Error("Gemini embedding request failed.");
  }

  const data = await response.json();

  const values = data?.embedding?.values;

  if (!Array.isArray(values)) {
    throw new Error("Gemini did not return an embedding.");
  }

  return values;
}
