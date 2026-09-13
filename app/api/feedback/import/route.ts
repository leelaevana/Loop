import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only ADMIN and ANALYST can import feedback.
    if (user.role !== "ADMIN" && user.role !== "ANALYST") {
      return NextResponse.json(
        { error: "You do not have permission to import feedback." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV file is required." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported." },
        { status: 400 }
      );
    }

    const text = await file.text();

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must contain a header and at least one row." },
        { status: 400 }
      );
    }

    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().toLowerCase());

    const requiredHeaders = ["content", "channel"];

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        return NextResponse.json(
          {
            error: `Missing required CSV column: ${header}`,
          },
          { status: 400 }
        );
      }
    }

    const importedFeedback = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(",")
        .map((value) => value.trim());

      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      if (!row.content) {
        continue;
      }

      const feedback = await db.feedback.create({
        data: {
          content: row.content,
          channel: row.channel || "CSV Import",
          sourceRef: row.sourceRef || null,
          customerLabel: row.customerLabel || null,
          featureArea: row.featureArea || null,
          workspaceId: user.workspaceId,
          status: "NEW",
        },
      });

      importedFeedback.push(feedback.id);
    }

    return NextResponse.json({
      message: "CSV imported successfully.",
      importedCount: importedFeedback.length,
    });
  } catch (error) {
    console.error("CSV import error:", error);

    return NextResponse.json(
      { error: "Failed to import CSV." },
      { status: 500 }
    );
  }
}
