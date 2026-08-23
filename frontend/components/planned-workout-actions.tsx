"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api, type Workout } from "@/lib/api";

export function PlannedWorkoutActions({ workout }: { workout: Workout }) {
	const router = useRouter();

	const handleDelete = async () => {
		if (!window.confirm(`Delete planned workout "${workout.name}"?`)) return;
		await api.deleteWorkout(workout.id);
		router.push("/workouts");
	};

	return (
		<div className="flex items-center gap-2">
			<Link href={`/workouts/${workout.id}/edit`}>
				<Button variant="outline" size="sm">
					<Pencil />
					Edit
				</Button>
			</Link>
			<Button variant="destructive" size="sm" onClick={handleDelete}>
				<Trash2 />
				Delete
			</Button>
		</div>
	);
}
