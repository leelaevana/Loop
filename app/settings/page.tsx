"use client";

import { useEffect, useState } from "react";

type UserInfo = {
  name: string;
  email: string;
  role: string;
  workspaceId: string;
};

type WorkspaceInfo = {
  id: string;
  name: string;
  createdAt: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [workspace, setWorkspace] =
    useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data?.user) {
          setUser({
            name: data.user.name || "User",
            email: data.user.email || "",
            role: data.user.role || "VIEWER",
            workspaceId: data.user.workspaceId || "",
          });
        }

        const workspaceResponse =
          await fetch("/api/workspace");

        const workspaceData =
          await workspaceResponse.json();

        if (workspaceData?.workspace) {
          setWorkspace(workspaceData.workspace);
        }
      } catch (error) {
        console.error(
          "Failed to load settings:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Settings
            </h1>

            <p className="mt-2 text-slate-400">
              Manage your LOOP account and workspace information.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Dashboard
          </a>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading settings...
          </div>
        ) : (
          <div className="space-y-6">

            {/* Account */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your LOOP account information.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">

                <div>
                  <label className="text-sm text-slate-400">
                    Name
                  </label>

                  <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
                    {user?.name || "—"}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400">
                    Email
                  </label>

                  <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
                    {user?.email || "—"}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400">
                    Role
                  </label>

                  <div className="mt-2">
                    <span className="inline-flex rounded-full bg-blue-950 px-4 py-2 text-sm font-semibold text-blue-300">
                      {user?.role || "VIEWER"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400">
                    Workspace ID
                  </label>

                  <div className="mt-2 overflow-hidden text-ellipsis rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400">
                    {user?.workspaceId || "—"}
                  </div>
                </div>

              </div>
            </section>

            {/* Workspace */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Workspace
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your organization-level LOOP workspace.
              </p>

              <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {workspace?.name || "Workspace"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Multi-tenant customer feedback workspace
                    </p>
                  </div>

                  <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-400">
                    Active
                  </span>
                </div>
              </div>
            </section>

            {/* Access Control */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Access Control
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Permissions available for your current role.
              </p>

              <div className="mt-6 space-y-3">

                <Permission
                  name="View customer feedback"
                  allowed={true}
                />

                <Permission
                  name="Search and filter feedback"
                  allowed={true}
                />

                <Permission
                  name="View analytics and trends"
                  allowed={true}
                />

                <Permission
                  name="Generate Voice of Customer reports"
                  allowed={
                    user?.role === "ADMIN" ||
                    user?.role === "ANALYST"
                  }
                />

                <Permission
                  name="Modify feedback status"
                  allowed={
                    user?.role === "ADMIN" ||
                    user?.role === "ANALYST"
                  }
                />

                <Permission
                  name="Manage workspace"
                  allowed={user?.role === "ADMIN"}
                />

              </div>
            </section>

            {/* Security */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Security
              </h2>

              <div className="mt-5 rounded-lg border border-green-900 bg-green-950/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-900 text-green-300">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-green-300">
                      Workspace isolation enabled
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Customer feedback and reports are restricted
                      to your authenticated workspace.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Application */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">
                Application
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    Application
                  </p>

                  <p className="mt-1 font-semibold">
                    LOOP
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    Environment
                  </p>

                  <p className="mt-1 font-semibold">
                    Development
                  </p>
                </div>

              </div>
            </section>

          </div>
        )}

      </div>
    </main>
  );
}

function Permission({
  name,
  allowed,
}: {
  name: string;
  allowed: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
      <span className="text-sm text-slate-300">
        {name}
      </span>

      {allowed ? (
        <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-400">
          Allowed
        </span>
      ) : (
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-500">
          Restricted
        </span>
      )}
    </div>
  );
}