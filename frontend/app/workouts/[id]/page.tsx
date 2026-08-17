import { api, Workout, Exercise, RepSet, DurationSet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workoutId = parseInt(id);

  const workout: Workout = await api.getWorkout(workoutId);
  if (!workout) {
    notFound();
  }

  const exercises: Exercise[] = await api.getExercises();
  const repSets: RepSet[] = await api.getRepSets();
  const durationSets: DurationSet[] = await api.getDurationSets();

  // Filter sets for this workout
  const workoutRepSets = repSets.filter(set => set.workout_id === workoutId);
  const workoutDurationSets = durationSets.filter(set => set.workout_id === workoutId);

  // Group sets by exercise
  const exerciseSets = new Map<number, (RepSet | DurationSet)[]>();
  
  workoutRepSets.forEach(set => {
    if (!exerciseSets.has(set.exercise_id)) {
      exerciseSets.set(set.exercise_id, []);
    }
    exerciseSets.get(set.exercise_id)!.push(set);
  });

  workoutDurationSets.forEach(set => {
    if (!exerciseSets.has(set.exercise_id)) {
      exerciseSets.set(set.exercise_id, []);
    }
    exerciseSets.get(set.exercise_id)!.push(set);
  });

  return (
    <div className="container mx-auto p-6">
      <Link href="/workouts" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Workouts
      </Link>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{workout.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <p><strong>Created on:</strong> {new Date(workout.creation_date).toLocaleDateString()}</p>
            {workout.description && <p>{workout.description}</p>}
          </div>

          {exerciseSets.size === 0 ? (
            <p className="text-muted-foreground">No exercises added to this workout yet.</p>
          ) : (
            <div className="space-y-6">
              {Array.from(exerciseSets.entries()).map(([exerciseId, sets]) => {
                const exercise = exercises.find(e => e.id === exerciseId);
                if (!exercise) return null;

                const isRepExercise = exercise.type === 'REPS';

                return (
                  <div key={exerciseId}>
                    <h3 className="text-lg font-semibold mb-2">{exercise.name}</h3>
                    {exercise.description && <p className="text-sm text-muted-foreground mb-2">{exercise.description}</p>}
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Set</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Weight (kg)</TableHead>
                          {isRepExercise && <TableHead>Reps</TableHead>}
                          {!isRepExercise && <TableHead>Duration (s)</TableHead>}
                          {isRepExercise && <TableHead>Tempo</TableHead>}
                          <TableHead>RPE</TableHead>
                          <TableHead>Rest (s)</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sets.map((set, index) => (
                          <TableRow key={set.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{set.type_}</TableCell>
                            <TableCell>{set.weight || '-'}</TableCell>
                            {isRepExercise && (
                              <TableCell>
                                {'reps' in set ? (set.reps || '-') : '-'}
                              </TableCell>
                            )}
                            {!isRepExercise && (
                              <TableCell>
                                {'duration' in set ? (set.duration || '-') : '-'}
                              </TableCell>
                            )}
                            {isRepExercise && (
                              <TableCell>
                                {'tempo' in set && set.tempo && Array.isArray(set.tempo) ? set.tempo.join('-') : '-'}
                              </TableCell>
                            )}
                            <TableCell>{set.rpe || '-'}</TableCell>
                            <TableCell>{set.rest}</TableCell>
                            <TableCell>{set.note || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
