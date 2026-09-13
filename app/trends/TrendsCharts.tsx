
"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";

type Theme = {
  name: string;
  feedbackCount: number;
};

type SentimentData = {
  name: string;
  value: number;
};

type VolumeData = {
  date: string;
  count: number;
};

type Props = {
  themes: Theme[];
  sentiment: SentimentData[];
  volume: VolumeData[];
};

export default function TrendsCharts({
  themes,
  sentiment,
  volume,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top Themes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-1 text-xl font-semibold text-white">
          Top Themes
        </h2>

        <p className="mb-6 text-sm text-slate-400">
          Most common customer feedback themes.
        </p>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={themes}
              layout="vertical"
              margin={{
                top: 10,
                right: 20,
                left: 30,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={120}
              />

              <Tooltip />

              <Bar
                dataKey="feedbackCount"
                name="Feedback"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-1 text-xl font-semibold text-white">
          Sentiment Distribution
        </h2>

        <p className="mb-6 text-sm text-slate-400">
          Overall customer sentiment.
        </p>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentiment}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              />

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback Volume */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
        <h2 className="mb-1 text-xl font-semibold text-white">
          Feedback Volume Over Time
        </h2>

        <p className="mb-6 text-sm text-slate-400">
          Number of feedback records received each day.
        </p>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={volume}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="count"
                name="Feedback"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}