"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Inbox", href: "/inbox" },
  { name: "Trends", href: "/trends" },
  { name: "Ask LOOP", href: "/ask" },
  { name: "Reports", href: "/reports" },
  { name: "Settings", href: "/settings" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900"
        >
          LOOP Analytics
        </Link>

        <div className="flex items-center gap-2">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}