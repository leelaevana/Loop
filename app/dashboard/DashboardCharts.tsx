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

export default function DashboardCharts({
  sentiment,
  topThemes,
  volumeOverTime,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sentiment */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-5 text-lg font-semibold">
          Sentiment Distribution
        </h2>

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
                  <Cell key={`cell-${index}`} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top themes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-5 text-lg font-semibold">
          Top Feedback Themes
        </h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topThemes}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="count"
                name="Feedback"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
        <h2 className="mb-5 text-lg font-semibold">
          Feedback Volume Over Time
        </h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeOverTime}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="count"
                name="Feedback"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
