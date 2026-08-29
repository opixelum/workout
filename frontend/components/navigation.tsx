"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Navigation() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  if (
    normalizedPath === "/login" ||
    normalizedPath === "/signup" ||
    normalizedPath === "/"
  ) {
    return null;
  }

  if (isLoading) {
    return (
      <nav className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Workout Tracker
            </Link>
            <div className="flex gap-4 items-center">
              <span className="text-gray-400">Loading...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href={user ? "/workouts" : "/"} className="text-xl font-bold">
            Workout Tracker
          </Link>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
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
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
                <Link href="/signup" className="hover:underline">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
