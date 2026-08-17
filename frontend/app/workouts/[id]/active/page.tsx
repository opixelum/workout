'use client';

import { useEffect, useState, useRef } from 'react';
import { api, Workout, Exercise, RepSet, DurationSet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface SetCompletion {
  completed: boolean;
  restStartTime: number | null;
  actualValues: Record<string, string>;
}

const SET_TYPES = ['WORKSET', 'WARMUP', 'DROPSET', 'SUPERSET', 'FAILURE'];
const SET_TYPE_LABELS: Record<string, string> = {
  'WORKSET': 'Workset',
  'WARMUP': 'Warmup',
  'DROPSET': 'Dropset',
  'SUPERSET': 'Superset',
  'FAILURE': 'Failure',
};

const SET_TYPE_COLORS: Record<string, string> = {
  'WARMUP': 'bg-orange-100 border-orange-300 text-orange-800',
  'FAILURE': 'bg-red-300 border-red-600 text-red-800',
  'DROPSET': 'bg-blue-100 border-blue-300 text-blue-800',
  'SUPERSET': 'bg-purple-100 border-purple-300 text-purple-800',
  'WORKSET': 'bg-background',
};

export default function ActiveWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [repSets, setRepSets] = useState<RepSet[]>([]);
  const [durationSets, setDurationSets] = useState<DurationSet[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [setCompletions, setSetCompletions] = useState<Map<number, SetCompletion>>(new Map());
  const [activeRestTime, setActiveRestTime] = useState<{ setId: number; remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [selectedSetTypes, setSelectedSetTypes] = useState<Map<number, string>>(new Map());
  const inputValues = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;
        const idNum = parseInt(id);
        setWorkoutId(idNum);

        const [workoutData, exercisesData, repSetsData, durationSetsData] = await Promise.all([
          api.getWorkout(idNum),
          api.getExercises(),
          api.getRepSets(),
          api.getDurationSets(),
        ]);

        setWorkout(workoutData);
        setExercises(exercisesData);
        setRepSets(repSetsData.filter((set: RepSet) => set.workout_id === idNum));
        setDurationSets(durationSetsData.filter((set: DurationSet) => set.workout_id === idNum));
      } catch (error) {
        console.error('Error loading workout:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Handle rest timer countdown
  useEffect(() => {
    if (activeRestTime && activeRestTime.remaining > 0) {
      const interval = setInterval(() => {
        setActiveRestTime(prev => {
          if (!prev) return null;
          const newRemaining = prev.remaining - 1;
          if (newRemaining <= 0) {
            return null;
          }
          return { ...prev, remaining: newRemaining };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeRestTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetComplete = (setId: number, restTime: number) => {
    const currentCompletion = setCompletions.get(setId);
    
    if (currentCompletion?.completed) {
      // Uncomplete the set - revert to normal state
      setSetCompletions(prev => {
        const newMap = new Map(prev);
        newMap.delete(setId);
        return newMap;
      });
      setActiveRestTime(null);
    } else {
      // Complete the set - capture actual values and start rest timer
      const actualValues: Record<string, string> = {};
      
      // Find the set to get default values
      const set = repSets.find(s => s.id === setId) || durationSets.find(s => s.id === setId);
      if (!set) return;
      
      // Helper function to get input value or use placeholder
      const getValueOrPlaceholder = (key: string, placeholder: string) => {
        const value = inputValues.current.get(`${setId}-${key}`) || '';
        return value.trim() || placeholder;
      };
      
      // Get values from the inputValues ref, using placeholder if empty
      const weightValue = getValueOrPlaceholder('weight', set.weight?.toString() || '0');
      const rpeValue = getValueOrPlaceholder('rpe', set.rpe?.toString() || '0');
      
      if (weightValue) actualValues.weight = weightValue;
      if (rpeValue) actualValues.rpe = rpeValue;
      
      // Handle reps (for REPS exercise type)
      if ('reps' in set) {
        const repsValue = getValueOrPlaceholder('reps', set.reps?.toString() || '0');
        if (repsValue) actualValues.reps = repsValue;
        
        // Handle tempo values
        const tempoEccentricValue = getValueOrPlaceholder('tempo-eccentric', set.tempo_excentric?.toString() || '0');
        const tempoIsometricValue = getValueOrPlaceholder('tempo-isometric', set.tempo_isometric?.toString() || '0');
        const tempoConcentricValue = getValueOrPlaceholder('tempo-concentric', set.tempo_concentric?.toString() || '0');
        
        if (tempoEccentricValue) actualValues.tempoEccentric = tempoEccentricValue;
        if (tempoIsometricValue) actualValues.tempoIsometric = tempoIsometricValue;
        if (tempoConcentricValue) actualValues.tempoConcentric = tempoConcentricValue;
      }
      
      // Handle duration (for DURATION exercise type)
      if ('duration' in set) {
        const durationValue = getValueOrPlaceholder('duration', set.duration?.toString() || '0');
        if (durationValue) actualValues.duration = durationValue;
      }
      
      setSetCompletions(prev => {
        const newMap = new Map(prev);
        newMap.set(setId, {
          completed: true,
          restStartTime: Date.now(),
          actualValues: actualValues as Record<string, string>,
        });
        return newMap;
      });

      if (restTime > 0) {
        setActiveRestTime({ setId, remaining: restTime });
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!workout) {
    notFound();
  }

  // Group sets by exercise
  const exerciseSets = new Map<number, (RepSet | DurationSet)[]>();
  
  repSets.forEach(set => {
    if (!exerciseSets.has(set.exercise_id)) {
      exerciseSets.set(set.exercise_id, []);
    }
    exerciseSets.get(set.exercise_id)!.push(set);
  });

  durationSets.forEach(set => {
    if (!exerciseSets.has(set.exercise_id)) {
      exerciseSets.set(set.exercise_id, []);
    }
    exerciseSets.get(set.exercise_id)!.push(set);
  });

  return (
    <div className="container mx-auto p-6">
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col items-end">
            <CardTitle className="w-full">{workout.name}</CardTitle>
            <div className="text-2xl font-mono">{formatTime(elapsedTime)}</div>
            {activeRestTime && (
              <div className="text-lg font-medium text-orange-600">
                Rest: {activeRestTime.remaining}s
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {workout.description && <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>}

          {exerciseSets.size === 0 ? (
            <p className="text-muted-foreground">No exercises in this workout.</p>
          ) : (
            <div className="space-y-6">
              {Array.from(exerciseSets.entries()).map(([exerciseId, sets]) => {
                const exercise = exercises.find(e => e.id === exerciseId);
                if (!exercise) return null;

                const isRepExercise = exercise.type === 'REPS';

                return (
                  <div key={exerciseId} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">{exercise.name}</h3>
                    {exercise.description && <p className="text-sm text-muted-foreground mb-4">{exercise.description}</p>}
                    
                    {/* Column headers */}
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2 text-sm font-medium text-muted-foreground border-b pb-2">
                      <span className="w-8">#</span>
                      <span className="w-24">Type</span>
                      <span className="w-20">kg</span>
                      {isRepExercise ? (
                        <>
                          <span className="w-16">reps</span>
                          <span className="w-24">tempo</span>
                        </>
                      ) : (
                        <span className="w-16">duration</span>
                      )}
                      <span className="w-16">RPE</span>
                      <span className="w-8"></span>
                    </div>
                    
                    <div className="space-y-3">
                      {sets.map((set, index) => {
                        const completion = setCompletions.get(set.id);
                        const isCompleted = completion?.completed;
                        const actualValues = completion?.actualValues || {};
                        
                        const getSelectColor = (type: string) => {
                          return SET_TYPE_COLORS[type] || 'bg-background';
                        };

                        return (
                          <div
                            key={set.id}
                            className={`flex flex-wrap justify-between items-center gap-2 p-3 rounded border ${
                              isCompleted ? 'bg-green-50 border-green-300' : 'bg-background'
                            }`}
                          >
                            <span className="font-medium w-8">{index + 1}</span>
                            
                            <select
                              className={`w-24 rounded border px-2 py-1 text-sm ${
                                isCompleted && (selectedSetTypes.get(set.id) || set.type_) === 'WORKSET'
                                  ? 'bg-green-50'
                                  : getSelectColor(selectedSetTypes.get(set.id) || set.type_)
                              }`}
                              defaultValue={set.type_}
                              onChange={(e) => {
                                setSelectedSetTypes(prev => {
                                  const newMap = new Map(prev);
                                  newMap.set(set.id, e.target.value);
                                  return newMap;
                                });
                              }}
                            >
                              {SET_TYPES.map(type => (
                                <option key={type} value={type}>
                                  {SET_TYPE_LABELS[type] || type}
                                </option>
                              ))}
                            </select>
                            
                            <Input
                              type="number"
                              placeholder={actualValues.weight || (set.weight?.toString() || '0')}
                              defaultValue={isCompleted && actualValues.weight ? String(actualValues.weight) : ''}
                              className="w-20"
                              onChange={(e) => inputValues.current.set(`${set.id}-weight`, e.target.value)}
                            />
                            
                            {isRepExercise && (
                              <>
                                <Input
                                  type="number"
                                  placeholder={actualValues.reps || ('reps' in set ? (set.reps?.toString() || '0') : '0')}
                                  defaultValue={isCompleted && actualValues.reps ? String(actualValues.reps) : ''}
                                  min="0"
                                  className="w-16"
                                  onChange={(e) => inputValues.current.set(`${set.id}-reps`, e.target.value)}
                                />
                                
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    placeholder={actualValues.tempoEccentric || ('tempo_excentric' in set ? set.tempo_excentric.toString() : '0')}
                                    defaultValue={isCompleted && actualValues.tempoEccentric ? String(actualValues.tempoEccentric) : ''}
                                    min="0"
                                    className="w-14 text-center"
                                    onChange={(e) => inputValues.current.set(`${set.id}-tempo-eccentric`, e.target.value)}
                                  />
                                  <Input
                                    type="number"
                                    placeholder={actualValues.tempoIsometric || ('tempo_isometric' in set ? set.tempo_isometric.toString() : '0')}
                                    defaultValue={isCompleted && actualValues.tempoIsometric ? String(actualValues.tempoIsometric) : ''}
                                    min="0"
                                    className="w-14 text-center"
                                    onChange={(e) => inputValues.current.set(`${set.id}-tempo-isometric`, e.target.value)}
                                  />
                                  <Input
                                    type="number"
                                    placeholder={actualValues.tempoConcentric || ('tempo_concentric' in set ? set.tempo_concentric.toString() : '0')}
                                    defaultValue={isCompleted && actualValues.tempoConcentric ? String(actualValues.tempoConcentric) : ''}
                                    min="0"
                                    className="w-14 text-center"
                                    onChange={(e) => inputValues.current.set(`${set.id}-tempo-concentric`, e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                            
                            {!isRepExercise && (
                              <Input
                                type="number"
                                placeholder={actualValues.duration || ('duration' in set ? set.duration.toString() : '0')}
                                defaultValue={isCompleted && actualValues.duration ? String(actualValues.duration) : ''}
                                min="0"
                                className="w-16"
                                onChange={(e) => inputValues.current.set(`${set.id}-duration`, e.target.value)}
                              />
                            )}
                            
                            <Input
                              type="number"
                              placeholder={actualValues.rpe || (set.rpe?.toString() || '0')}
                              defaultValue={isCompleted && actualValues.rpe ? String(actualValues.rpe) : ''}
                              className="w-16"
                              min="1"
                              max="10"
                              step="0.5"
                              onChange={(e) => inputValues.current.set(`${set.id}-rpe`, e.target.value)}
                            />
                            
                            <Button
                              size="sm"
                              variant={isCompleted ? "default" : "outline"}
                              className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => handleSetComplete(set.id, set.rest)}
                            >
                              ✓
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex gap-4 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // TODO: Implement cancel workout logic
                console.log('Cancel workout clicked');
              }}
            >
              Cancel Workout
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => {
                // TODO: Implement finish workout logic
                console.log('Finish workout clicked');
              }}
            >
              Finish Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
