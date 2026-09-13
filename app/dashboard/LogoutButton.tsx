"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Logout
    </button>
  );
}