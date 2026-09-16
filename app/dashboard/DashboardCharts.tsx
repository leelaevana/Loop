"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SentimentItem = {
  name: string;
  value: number;
};

type ThemeItem = {
  name: string;
  count: number;
};

type VolumeItem = {
  date: string;
  count: number;
};

type DashboardChartsProps = {
  sentiment: SentimentItem[];
  topThemes: ThemeItem[];
  volumeOverTime: VolumeItem[];
};

const sentimentColors = ["#22c55e", "#94a3b8", "#ef4444"];

export default function DashboardCharts({
  sentiment,
  topThemes,
  volumeOverTime,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sentiment Distribution */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Sentiment Distribution
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Overall customer sentiment
          </p>
        </div>

        {sentiment.every((item) => item.value === 0) ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-400">
            No classified feedback yet
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentiment}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {sentiment.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={sentimentColors[index % sentimentColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Feedback Themes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Top Feedback Themes
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Most common customer topics
          </p>
        </div>

        {topThemes.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-400">
            No themes available yet
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topThemes}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  name="Feedback"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Feedback Volume */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Feedback Volume Over Time
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Number of feedback records received over time
          </p>
        </div>

        {volumeOverTime.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-400">
            No feedback volume data available
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={volumeOverTime}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  name="Feedback"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}