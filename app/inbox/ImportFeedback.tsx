"use client";

import { useState } from "react";

export default function ImportFeedback() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!file) {
      setMessage("Please select a CSV file.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/feedback/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Import failed.");
        return;
      }

      setMessage(
        `Successfully imported ${data.importedCount} feedback records.`
      );

      setFile(null);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-white">
            Import Feedback
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Upload a CSV file containing customer feedback.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
          />

          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Importing..." : "Import CSV"}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-slate-300">
          {message}
        </p>
      )}
    </div>
  );
}