
"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  contentJson: {
    executiveSummary: string;
    topThemes: {
      theme: string;
      description: string;
      impact: string;
    }[];
    sentimentSummary: {
      positive: string;
      neutral: string;
      negative: string;
    };
    recommendations: string[];
  };
  createdAt: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");


async function loadReports() {
  try {
    setLoading(true);

    const sessionResponse = await fetch("/api/auth/session");
    const sessionData = await sessionResponse.json();

    if (sessionData?.user?.role) {
      setRole(sessionData.user.role);
    }

    const response = await fetch("/api/reports");
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Failed to load reports.");
      return;
    }

    setReports(data.reports || []);
  } catch (error) {
    console.error("Load reports error:", error);
    setError("Failed to load reports.");
  } finally {
    setLoading(false);
  }
}

  async function generateReport() {
    try {
      setGenerating(true);
      setError("");

      const response = await fetch("/api/reports", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate report.");
        return;
      }

      await loadReports();
    } catch (error) {
      console.error("Generate report error:", error);
      setError("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const latestReport = reports[0];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Voice of Customer Reports
            </h1>

            <p className="mt-2 text-slate-400">
              AI-generated summaries of customer feedback and insights.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              Dashboard
            </a>

            
{(role === "ADMIN" || role === "ANALYST") && (
  <button
    onClick={generateReport}
    disabled={generating}
    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {generating
      ? "Generating..."
      : "Generate Report"}
  </button>
)}

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading reports...
          </div>
        )}

        {/* No Reports */}
        {!loading && reports.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-semibold">
              No reports yet
            </h2>

            <p className="mt-2 text-slate-400">
              Generate your first Voice of Customer report.
            </p>

            {(role === "ADMIN" || role === "ANALYST") && (
  <button
    onClick={generateReport}
    disabled={generating}
    className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
  >
    {generating
      ? "Generating..."
      : "Generate First Report"}
  </button>
)}
          </div>
        )}

        {/* Latest Report */}
        {!loading && latestReport && (
          <div className="space-y-6">

            {/* Report Info */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {latestReport.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Period:{" "}
                    {new Date(
                      latestReport.periodStart
                    ).toLocaleDateString()}{" "}
                    –{" "}
                    {new Date(
                      latestReport.periodEnd
                    ).toLocaleDateString()}
                  </p>
                </div>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  Latest Report
                </span>
              </div>
            </section>

            {/* Executive Summary */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Executive Summary
              </h2>

              <p className="leading-7 text-slate-300">
                {latestReport.contentJson.executiveSummary}
              </p>
            </section>

            {/* Top Themes */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-semibold">
                Top Customer Themes
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {latestReport.contentJson.topThemes.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          {item.theme}
                        </h3>

                        <span className="rounded-full bg-blue-950 px-3 py-1 text-xs text-blue-300">
                          {item.impact}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Sentiment */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-semibold">
                Sentiment Summary
              </h2>

              <div className="grid gap-4 md:grid-cols-3">

                <div className="rounded-lg border border-green-900 bg-green-950/30 p-5">
                  <h3 className="font-semibold text-green-400">
                    Positive
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {
                      latestReport.contentJson
                        .sentimentSummary.positive
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-950 p-5">
                  <h3 className="font-semibold text-slate-300">
                    Neutral
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {
                      latestReport.contentJson
                        .sentimentSummary.neutral
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-red-900 bg-red-950/30 p-5">
                  <h3 className="font-semibold text-red-400">
                    Negative
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {
                      latestReport.contentJson
                        .sentimentSummary.negative
                    }
                  </p>
                </div>

              </div>
            </section>

            {/* Recommendations */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-semibold">
                Recommendations
              </h2>

              <div className="space-y-3">
                {latestReport.contentJson.recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={index}
                      className="flex gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                        {index + 1}
                      </div>

                      <p className="leading-6 text-slate-300">
                        {recommendation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Previous Reports */}
            {reports.length > 1 && (
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-5 text-xl font-semibold">
                  Previous Reports
                </h2>

                <div className="space-y-3">
                  {reports.slice(1).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          {report.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Generated{" "}
                          {new Date(
                            report.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>

                      <span className="text-sm text-slate-500">
                        Report
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </main>
  );
}