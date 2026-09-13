
"use client";

import { useState } from "react";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askLoop() {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/insights/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to get an answer.");
        return;
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error("Ask LOOP error:", error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Ask LOOP
            </h1>

            <p className="mt-2 text-slate-400">
              Ask questions about your customer feedback.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Dashboard
          </a>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Your question
          </label>

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: What are customers complaining about the most?"
            rows={5}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          />

          <button
            onClick={askLoop}
            disabled={loading}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "LOOP is thinking..." : "Ask LOOP"}
          </button>

          {error && (
            <div className="mt-5 rounded-lg border border-red-900 bg-red-950 p-4 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {answer && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              LOOP&apos;s Answer
            </h2>

            <div className="whitespace-pre-wrap leading-7 text-slate-300">
              {answer}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
