
"use client";

import ImportFeedback from "./ImportFeedback";
import { useCallback, useEffect, useState } from "react";

type Theme = {
  id: string;
  name: string;
};

type Feedback = {
  id: string;
  content: string;
  channel: string;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: "POS" | "NEU" | "NEG" | null;
  sentimentScore: number | null;
  featureArea: string | null;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  createdAt: string;
  themes: {
    theme: Theme;
    confidence: number;
  }[];
};

type ApiResponse = {
  feedback: Feedback[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function InboxPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newChannel, setNewChannel] = useState("Website");
  const [newCustomerLabel, setNewCustomerLabel] = useState("");
  const [newSourceRef, setNewSourceRef] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [bulkClassifying, setBulkClassifying] = useState(false);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
      });

      if (search) params.set("search", search);
      if (channel) params.set("channel", channel);
      if (sentiment) params.set("sentiment", sentiment);
      if (status) params.set("status", status);

      const response = await fetch(`/api/feedback?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load feedback");
      }

      const data: ApiResponse = await response.json();

      setFeedback(data.feedback);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
      setError("Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  }, [page, search, channel, sentiment, status]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleChannel(value: string) {
    setChannel(value);
    setPage(1);
  }

  function handleSentiment(value: string) {
    setSentiment(value);
    setPage(1);
  }

  function handleStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  async function addFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newContent.trim()) {
      setCreateError("Please enter customer feedback.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent.trim(),
          channel: newChannel,
          customerLabel: newCustomerLabel.trim() || null,
          sourceRef: newSourceRef.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || "Failed to create feedback.");
        return;
      }

      setNewContent("");
      setNewCustomerLabel("");
      setNewSourceRef("");
      setNewChannel("Website");
      setShowAddForm(false);

      setPage(1);
      await loadFeedback();

      alert(
        `Feedback added successfully.\n\nTheme: ${
          data.theme?.name || "Created by AI"
        }\nEmbedding: ${data.vectorLength || 0} dimensions`
      );
    } catch (error) {
      console.error(error);
      setCreateError("Something went wrong while creating feedback.");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(
    feedbackId: string,
    newStatus: string
  ) {
    try {
      const response = await fetch("/api/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update status");
        return;
      }

      await loadFeedback();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating status.");
    }
  }

  async function classifyFeedback(feedbackId: string) {
    try {
      const response = await fetch("/api/feedback/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "AI classification failed.");
        return;
      }

      alert("AI classification completed successfully.");

      await loadFeedback();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while classifying feedback.");
    }
  }

  async function bulkClassifyFeedback() {
    if (bulkClassifying) return;

    const unclassified = feedback.filter(
      (item) => !item.sentiment || !item.featureArea
    );

    if (unclassified.length === 0) {
      alert(
        "There are no unclassified feedback records on this page."
      );
      return;
    }

    const confirmed = window.confirm(
      `AI will classify ${Math.min(
        unclassified.length,
        5
      )} unclassified feedback records from this page.\n\nContinue?`
    );

    if (!confirmed) return;

    try {
      setBulkClassifying(true);

      const batch = unclassified.slice(0, 5);

      let completed = 0;
      let failed = 0;

      for (const item of batch) {
        try {
          const response = await fetch("/api/feedback/classify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              feedbackId: item.id,
            }),
          });

          if (response.ok) {
            completed++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(
            `Failed to classify feedback ${item.id}:`,
            error
          );
          failed++;
        }
      }

      await loadFeedback();

      alert(
        `Bulk AI classification completed.\n\nSuccessful: ${completed}\nFailed: ${failed}`
      );
    } catch (error) {
      console.error(error);
      alert("Bulk AI classification failed.");
    } finally {
      setBulkClassifying(false);
    }
  }

  function sentimentLabel(value: Feedback["sentiment"]) {
    if (value === "POS") return "Positive";
    if (value === "NEG") return "Negative";
    if (value === "NEU") return "Neutral";
    return "Unknown";
  }

  function sentimentClass(value: Feedback["sentiment"]) {
    if (value === "POS") {
      return "bg-green-100 text-green-700";
    }

    if (value === "NEG") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  function statusClass(value: Feedback["status"]) {
    if (value === "ACTIONED") {
      return "bg-purple-100 text-purple-700";
    }

    if (value === "REVIEWED") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feedback Inbox</h1>
            <p className="mt-2 text-slate-400">
              Review and manage customer feedback.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddForm((current) => !current);
                setCreateError("");
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {showAddForm ? "Close" : "+ Add Feedback"}
            </button>

            <button
              onClick={bulkClassifyFeedback}
              disabled={bulkClassifying || loading}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkClassifying
                ? "Classifying..."
                : "AI Classify 5"}
            </button>

            <a
              href="/dashboard"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              Dashboard
            </a>
          </div>
        </div>

        {/* Add Feedback */}
        {showAddForm && (
          <form
            onSubmit={addFeedback}
            className="mb-6 rounded-xl border border-blue-900 bg-slate-900 p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                Add Customer Feedback
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Gemini will automatically analyze the feedback and
                create or reuse a theme.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Customer Feedback *
                </label>

                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Example: The checkout page is very slow and sometimes takes more than 10 seconds to complete my payment."
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Channel
                </label>

                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="Website">Website</option>
                  <option value="Survey">Survey</option>
                  <option value="App Store">App Store</option>
                  <option value="Chat">Chat</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Customer
                </label>

                <input
                  type="text"
                  value={newCustomerLabel}
                  onChange={(e) =>
                    setNewCustomerLabel(e.target.value)
                  }
                  placeholder="Optional customer name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Source Reference
                </label>

                <input
                  type="text"
                  value={newSourceRef}
                  onChange={(e) => setNewSourceRef(e.target.value)}
                  placeholder="Optional reference"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            {createError && (
              <div className="mt-4 rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300">
                {createError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setCreateError("");
                }}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Analyzing..." : "Add & Analyze"}
              </button>
            </div>
          </form>
        )}

        <ImportFeedback />

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
            />

            <select
              value={channel}
              onChange={(e) => handleChannel(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">All Channels</option>
              <option value="Website">Website</option>
              <option value="Survey">Survey</option>
              <option value="App Store">App Store</option>
              <option value="Chat">Chat</option>
              <option value="Email">Email</option>
            </select>

            <select
              value={sentiment}
              onChange={(e) => handleSentiment(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">All Sentiments</option>
              <option value="POS">Positive</option>
              <option value="NEU">Neutral</option>
              <option value="NEG">Negative</option>
            </select>

            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ACTIONED">Actioned</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading feedback...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-900 bg-red-950 p-6 text-red-300">
            {error}
          </div>
        )}

        {/* Feedback list */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Feedback
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Channel
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Sentiment
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Theme
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold text-slate-300">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {feedback.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="max-w-xl px-5 py-5">
                        <p className="font-medium text-white">
                          {item.content}
                        </p>

                        <div className="mt-2 text-xs text-slate-500">
                          {item.customerLabel || "Unknown"} •{" "}
                          {item.sourceRef || "No reference"}
                        </div>
                      </td>

                      <td className="px-5 py-5 text-slate-300">
                        {item.channel}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${sentimentClass(
                            item.sentiment
                          )}`}
                        >
                          {sentimentLabel(item.sentiment)}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-slate-300">
                        {item.themes.length > 0
                          ? item.themes[0].theme.name
                          : "Uncategorized"}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex flex-col gap-2">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              updateStatus(
                                item.id,
                                e.target.value
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                          >
                            <option value="NEW">NEW</option>
                            <option value="REVIEWED">
                              REVIEWED
                            </option>
                            <option value="ACTIONED">
                              ACTIONED
                            </option>
                          </select>

                          <button
                            onClick={() =>
                              classifyFeedback(item.id)
                            }
                            className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                          >
                            AI Classify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">
              <p className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPage((current) =>
                      Math.max(current - 1, 1)
                    )
                  }
                  disabled={page === 1}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800"
                >
                  Previous
                </button>

                <button
                  onClick={() =>
                    setPage((current) =>
                      Math.min(current + 1, totalPages)
                    )
                  }
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
