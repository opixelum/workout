import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type Exercise } from "@/lib/api";

export default async function ExercisesPage() {
	const exercises: Exercise[] = await api.getExercises();

	return (
		<div className="container mx-auto p-6 space-y-8">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Exercises</h2>
				<Link href="/exercises/new">
					<button
						type="button"
						className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
					>
						New exercise
					</button>
				</Link>
			</div>
			{exercises.length === 0 ? (
				<p className="text-muted-foreground">No exercises yet.</p>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{exercises.map((exercise) => (
						<Link key={exercise.id} href={`/exercises/${exercise.id}`}>
							<Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
								<CardHeader>
									<CardTitle>{exercise.name}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{exercise.description && (
											<p className="text-sm text-muted-foreground">
												{exercise.description}
											</p>
										)}
										<div className="text-sm font-medium">
											Type: {exercise.type}
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
