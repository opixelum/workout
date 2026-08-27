"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NewWorkoutButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.push("/workouts/new")}>New workout</Button>
  );
}
