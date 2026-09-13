"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    workspaceName: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed.");
        return;
      }

      const loginResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError(
          "Account created, but automatic login failed. Please login manually."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            LOOP
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-slate-400">
            Create your company workspace and start using LOOP.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Your name
            </label>

            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-slate-400"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-slate-400"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-slate-400"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Company / Workspace name
            </label>

            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-slate-400"
              placeholder="Example: Acme Technologies"
              value={form.workspaceName}
              onChange={(e) =>
                setForm({
                  ...form,
                  workspaceName: e.target.value,
                })
              }
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-950 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="pt-2 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-white hover:underline"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}