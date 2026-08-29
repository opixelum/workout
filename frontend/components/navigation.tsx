"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Navigation() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  if (
    normalizedPath === "/login" ||
    normalizedPath === "/signup" ||
    normalizedPath === "/" ||
    normalizedPath.includes("active") ||
    normalizedPath.includes("edit") ||
    normalizedPath.includes("new")
  ) {
    return null;
  }
  return (
    <nav className="flex justify-between border-b p-4">
      <Link href="/workouts" className="hover:underline">
        Workouts
      </Link>
      <Link href="/exercises" className="hover:underline">
        Exercises
      </Link>
      <Link href="/settings" className="hover:underline">
        Settings
      </Link>
      <button
        className="hover:underline text-red-500"
        onClick={logout}
        type="button"
      >
        Logout
      </button>
    </nav>
  );
}
