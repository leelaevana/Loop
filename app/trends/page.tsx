
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TrendsCharts from "./TrendsCharts";

export default async function TrendsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
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
  });

  const themeMap = new Map<
    string,
    number
  >();

  for (const item of feedback) {
    for (const feedbackTheme of item.themes) {
      const themeName = feedbackTheme.theme.name;

      themeMap.set(
        themeName,
        (themeMap.get(themeName) || 0) + 1
      );
    }
  }

  const themes = Array.from(themeMap.entries())
    .map(([name, feedbackCount]) => ({
      name,
      feedbackCount,
    }))
    .sort(
      (a, b) => b.feedbackCount - a.feedbackCount
    )
    .slice(0, 10);

  const positive = feedback.filter(
    (item) => item.sentiment === "POS"
  ).length;

  const neutral = feedback.filter(
    (item) => item.sentiment === "NEU"
  ).length;

  const negative = feedback.filter(
    (item) => item.sentiment === "NEG"
  ).length;

  const sentiment = [
    {
      name: "Positive",
      value: positive,
    },
    {
      name: "Neutral",
      value: neutral,
    },
    {
      name: "Negative",
      value: negative,
    },
  ];
  const volumeMap = new Map<string, number>();

for (const item of feedback) {
  const date = new Date(item.createdAt)
    .toISOString()
    .split("T")[0];

  volumeMap.set(
    date,
    (volumeMap.get(date) || 0) + 1
  );
}

const volume = Array.from(volumeMap.entries())
  .map(([date, count]) => ({
    date,
    count,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Feedback Trends
            </h1>

            <p className="mt-2 text-slate-400">
              Understand customer themes and sentiment.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Dashboard
          </a>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Feedback
            </p>

            <p className="mt-2 text-3xl font-bold">
              {feedback.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Positive
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {positive}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Neutral
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {neutral}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Negative
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {negative}
            </p>
          </div>
        </div>

        <TrendsCharts
  themes={themes}
  sentiment={sentiment}
  volume={volume}
/>
      </div>
    </main>
  );
}
