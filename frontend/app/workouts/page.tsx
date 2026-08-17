import { api, Workout, Exercise, RepSet, DurationSet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

function getExerciseSetCount(
  workoutId: number,
  exerciseId: number,
  repSets: RepSet[],
  durationSets: DurationSet[]
): number {
  const exerciseRepSets = repSets.filter(s => s.workout_id === workoutId && s.exercise_id === exerciseId);
  const exerciseDurationSets = durationSets.filter(s => s.workout_id === workoutId && s.exercise_id === exerciseId);
  return exerciseRepSets.length + exerciseDurationSets.length;
}

export default async function WorkoutsPage() {
  const workouts: Workout[] = await api.getWorkouts();
  const exercises: Exercise[] = await api.getExercises();
  const repSets: RepSet[] = await api.getRepSets();
  const durationSets: DurationSet[] = await api.getDurationSets();

  const plannedWorkouts = workouts.filter(w => w.planned);
  const completedWorkouts = workouts.filter(w => !w.planned);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Planned Workouts Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Workouts</h2>
        {plannedWorkouts.length === 0 ? (
          <p className="text-muted-foreground">No planned workouts.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plannedWorkouts.map((workout) => {
              // Get all exercises for this workout
              const workoutRepSets = repSets.filter(s => s.workout_id === workout.id);
              const workoutDurationSets = durationSets.filter(s => s.workout_id === workout.id);
              
              // Get unique exercise IDs
              const exerciseIds = new Set([
                ...workoutRepSets.map(s => s.exercise_id),
                ...workoutDurationSets.map(s => s.exercise_id),
              ]);
              
              // Get exercise set counts
              const exerciseData = Array.from(exerciseIds).map(exerciseId => {
                const exercise = exercises.find(e => e.id === exerciseId);
                if (!exercise) return null;
                const setCount = getExerciseSetCount(workout.id, exerciseId, repSets, durationSets);
                return { exercise, setCount };
              }).filter((data): data is { exercise: Exercise; setCount: number } => data !== null);

              return (
                <Link key={workout.id} href={`/workouts/${workout.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle>{workout.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {workout.description && (
                        <p className="text-sm text-muted-foreground mb-3">{workout.description}</p>
                      )}
                      {exerciseData.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {exerciseData.map(({ exercise, setCount }, index) => (
                            <li key={index}>{setCount} x {exercise.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No exercises added yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* History Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">History</h2>
        {completedWorkouts.length === 0 ? (
          <p className="text-muted-foreground">No completed workouts yet.</p>
        ) : (
          <div className="space-y-4">
            {completedWorkouts.map((workout) => {
              // Get all exercises for this workout
              const workoutRepSets = repSets.filter(s => s.workout_id === workout.id);
              const workoutDurationSets = durationSets.filter(s => s.workout_id === workout.id);
              
              // Get unique exercise IDs
              const exerciseIds = new Set([
                ...workoutRepSets.map(s => s.exercise_id),
                ...workoutDurationSets.map(s => s.exercise_id),
              ]);
              
              // Get exercise set counts
              const exerciseData = Array.from(exerciseIds).map(exerciseId => {
                const exercise = exercises.find(e => e.id === exerciseId);
                if (!exercise) return null;
                const setCount = getExerciseSetCount(workout.id, exerciseId, repSets, durationSets);
                return { exercise, setCount };
              }).filter((data): data is { exercise: Exercise; setCount: number } => data !== null);

              return (
                <Link key={workout.id} href={`/workouts/${workout.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer mb-4">
                    <CardContent>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{workout.name}</h3>
                          {exerciseData.length > 0 ? (
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {exerciseData.map(({ exercise, setCount }, index) => (
                                <li key={index}>{setCount} x {exercise.name}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No exercises added yet.</p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground ml-4">
                          {new Date(workout.creation_date).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
