import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import DashboardCharts from "./DashboardCharts";
import LogoutButton from "./LogoutButton";

async function getInsights() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { db } = await import("@/lib/db");

  const feedback = await db.feedback.findMany({
    where: {
      workspaceId: user.workspaceId,
    },
    select: {
      sentiment: true,
      status: true,
      createdAt: true,
      themes: {
        include: {
          theme: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const total = feedback.length;

  const positive = feedback.filter(
    (item) => item.sentiment === "POS"
  ).length;

  const neutral = feedback.filter(
    (item) => item.sentiment === "NEU"
  ).length;

  const negative = feedback.filter(
    (item) => item.sentiment === "NEG"
  ).length;

  const newCount = feedback.filter(
    (item) => item.status === "NEW"
  ).length;

  const reviewed = feedback.filter(
    (item) => item.status === "REVIEWED"
  ).length;

  const actioned = feedback.filter(
    (item) => item.status === "ACTIONED"
  ).length;

  const themeCounts: Record<string, number> = {};

  for (const item of feedback) {
    for (const relation of item.themes) {
      const name = relation.theme.name;
      themeCounts[name] = (themeCounts[name] || 0) + 1;
    }
  }

  const topThemes = Object.entries(themeCounts)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const volumeMap: Record<string, number> = {};

  for (const item of feedback) {
    const date = item.createdAt.toISOString().slice(0, 10);
    volumeMap[date] = (volumeMap[date] || 0) + 1;
  }

  const volumeOverTime = Object.entries(volumeMap).map(
    ([date, count]) => ({
      date,
      count,
    })
  );

  return {
    user,
    stats: {
      total,
      positive,
      neutral,
      negative,
      new: newCount,
      reviewed,
      actioned,
    },
    sentiment: [
      { name: "Positive", value: positive },
      { name: "Neutral", value: neutral },
      { name: "Negative", value: negative },
    ],
    topThemes,
    volumeOverTime,
  };
}

export default async function DashboardPage() {
  const data = await getInsights();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              LOOP Analytics
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Welcome, {data.user.name}
            </h1>
          </div>

          <div className="flex gap-3">
            <a
              href="/inbox"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              Feedback Inbox
            </a>

            <LogoutButton />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Feedback"
            value={data.stats.total}
          />

          <StatCard
            title="Positive"
            value={data.stats.positive}
          />

          <StatCard
            title="Neutral"
            value={data.stats.neutral}
          />

          <StatCard
            title="Negative"
            value={data.stats.negative}
          />
        </div>

        {/* Workflow stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="New"
            value={data.stats.new}
          />

          <StatCard
            title="Reviewed"
            value={data.stats.reviewed}
          />

          <StatCard
            title="Actioned"
            value={data.stats.actioned}
          />
        </div>

        {/* Charts */}
        <DashboardCharts
          sentiment={data.sentiment}
          topThemes={data.topThemes}
          volumeOverTime={data.volumeOverTime}
        />
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}