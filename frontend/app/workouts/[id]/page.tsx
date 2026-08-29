import Link from "next/link";
import { notFound } from "next/navigation";
import { PlannedWorkoutActions } from "@/components/planned-workout-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  api,
  type DurationSet,
  type Exercise,
  type RepSet,
  type Workout,
  type WorkoutExercise,
} from "@/lib/api";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workoutId = Number.parseInt(id, 10);

  const workout: Workout = await api.getWorkout(workoutId);
  if (!workout) {
    notFound();
  }

  const exercises: Exercise[] = await api.getExercises();
  const workoutExercises: WorkoutExercise[] =
    await api.getWorkoutExercises(workoutId);
  const repSets: RepSet[] = await api.getRepSets();
  const durationSets: DurationSet[] = await api.getDurationSets();

  const workoutRepSets = repSets.filter((set) => set.workout_id === workoutId);
  const workoutDurationSets = durationSets.filter(
    (set) => set.workout_id === workoutId,
  );

  const exerciseSets = new Map<number, (RepSet | DurationSet)[]>();
  const orderedSets = [...workoutRepSets, ...workoutDurationSets].sort(
    (a, b) => a.position - b.position,
  );

  for (const set of orderedSets) {
    if (!exerciseSets.has(set.exercise_id)) {
      exerciseSets.set(set.exercise_id, []);
    }
    exerciseSets.get(set.exercise_id)?.push(set);
  }

  return (
    <div className="container mx-auto p-6">
      <Link
        href="/workouts"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        Back to Workouts
      </Link>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{workout.name}</CardTitle>
            <div className="flex items-center gap-2">
              {workout.planned && <PlannedWorkoutActions workout={workout} />}
              <Link href={`/workouts/${id}/active`}>
                <Button>Start Workout</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <p>
              <strong>{workout.planned ? "Created on" : "Completed on"}</strong>{" "}
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(workout.creation_date))}
            </p>
            {workout.description && <p>{workout.description}</p>}
          </div>

          <div className="space-y-6">
            {exerciseSets.size === 0 ? (
              <p className="text-muted-foreground">
                No exercises recorded for this workout yet.
              </p>
            ) : (
              Array.from(exerciseSets.entries()).map(([exerciseId, sets]) => {
                const exercise = exercises.find((e) => e.id === exerciseId);
                if (!exercise) return null;

                const isRepExercise = exercise.type === "REPS";
                const weightLabel =
                  exercise.equipment === "ASSISTED_BODYWEIGHT"
                    ? "-kg"
                    : exercise.equipment === "BODYWEIGHT"
                      ? "+kg"
                      : "kg";

                return (
                  <div key={exerciseId}>
                    <h3 className="text-lg font-semibold mb-2">
                      {exercise.name}
                    </h3>
                    {(() => {
                      const we = workoutExercises.find(
                        (w) => w.exercise_id === exerciseId,
                      );
                      return we?.note ? (
                        <p className="text-sm text-muted-foreground mb-2 italic">
                          {we.note}
                        </p>
                      ) : null;
                    })()}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Set</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Weight ({weightLabel})</TableHead>
                          {isRepExercise && <TableHead>Reps</TableHead>}
                          {!isRepExercise && (
                            <TableHead>Duration (s)</TableHead>
                          )}
                          <TableHead>RPE</TableHead>
                          <TableHead>Rest (s)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sets.map((set, index) => {
                          const repSet =
                            isRepExercise && "reps" in set ? set : null;

                          return (
                            <TableRow key={set.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{set.type_}</TableCell>
                              <TableCell>{set.weight ?? 0}</TableCell>
                              {isRepExercise && (
                                <TableCell>
                                  {repSet ? (repSet.reps ?? 0) : 0}
                                </TableCell>
                              )}
                              {!isRepExercise && (
                                <TableCell>
                                  {"duration" in set ? (set.duration ?? 0) : 0}
                                </TableCell>
                              )}
                              <TableCell>{set.rpe ?? 0}</TableCell>
                              <TableCell>{set.rest ?? 0}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
