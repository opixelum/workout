"use client";
import { Check, FileEdit, GripHorizontal, Trash2, X } from "lucide-react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  type DurationSet,
  type Exercise,
  type RepSet,
  type Workout,
} from "@/lib/api";

interface SetCompletion {
  completed: boolean;
  restStartTime: number | null;
  actualValues: Record<string, string>;
}

interface ExerciseGroup {
  id: string;
  exerciseId: number;
  sets: Array<RepSet | DurationSet>;
}

function createExerciseGroupId() {
  return `exercise-group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const SET_TYPES = ["WORKSET", "WARMUP", "DROPSET", "SUPERSET", "FAILURE"];
const SET_TYPE_LABELS: Record<string, string> = {
  WORKSET: "Workset",
  WARMUP: "Warmup",
  DROPSET: "Dropset",
  SUPERSET: "Superset",
  FAILURE: "Failure",
};

const SET_TYPE_COLORS: Record<string, string> = {
  WARMUP: "bg-orange-100 border-orange-300 text-orange-800",
  FAILURE: "bg-red-300 border-red-600 text-red-800",
  DROPSET: "bg-blue-100 border-blue-300 text-blue-800",
  SUPERSET: "bg-purple-100 border-purple-300 text-purple-800",
  WORKSET: "bg-background",
};

export default function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [repSets, setRepSets] = useState<RepSet[]>([]);
  const [durationSets, setDurationSets] = useState<DurationSet[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [setCompletions, setSetCompletions] = useState<
    Map<number, SetCompletion>
  >(new Map());
  const [activeRestTime, setActiveRestTime] = useState<{
    setId: number;
    remaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSetTypes, setSelectedSetTypes] = useState<Map<number, string>>(
    new Map(),
  );
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"cancel" | "finish" | null>(
    null,
  );
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  );
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [exerciseRestTimes, setExerciseRestTimes] = useState<
    Record<string, number>
  >({});
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    groupId: string;
    position: "before" | "after";
  } | null>(null);
  const [visibleNoteFields, setVisibleNoteFields] = useState<Set<number>>(
    new Set(),
  );
  const timerStartedAtRef = useRef<number | null>(null);
  const timerWorkoutIdRef = useRef<number | null>(null);
  const initialRepSetIdsRef = useRef<Set<number>>(new Set());
  const initialDurationSetIdsRef = useRef<Set<number>>(new Set());
  const initialRepSetsRef = useRef<Map<number, RepSet>>(new Map());
  const initialDurationSetsRef = useRef<Map<number, DurationSet>>(new Map());
  const pathname = usePathname();
  const isEditMode = pathname.endsWith("/edit");
  const isNewMode = pathname.endsWith("/workouts/new");
  const isFormMode = isEditMode || isNewMode;
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const { id } = await params;
        if (id === "new") {
          const exercisesData = await api.getExercises();
          setWorkout({
            id: 0,
            user_id: 1,
            name: "",
            planned: true,
            description: null,
            creation_date: new Date().toISOString(),
            mesocycle_id: null,
          });
          setExercises(exercisesData);
          setRepSets([]);
          setDurationSets([]);
          setExerciseGroups([]);
          return;
        }
        const idNum = Number.parseInt(id, 10);

        const [workoutData, exercisesData, repSetData, durationSetData]: [
          Workout,
          Exercise[],
          RepSet[],
          DurationSet[],
        ] = await Promise.all([
          api.getWorkout(idNum),
          api.getExercises(),
          api.getRepSets(),
          api.getDurationSets(),
        ]);

        const nextRepSets = repSetData.filter(
          (set: RepSet) => set.workout_id === idNum,
        );
        const nextDurationSets = durationSetData.filter(
          (set: DurationSet) => set.workout_id === idNum,
        );

        setWorkout(workoutData);
        setExercises(exercisesData);
        setRepSets(nextRepSets);
        setDurationSets(nextDurationSets);
        initialRepSetIdsRef.current = new Set(nextRepSets.map((set) => set.id));
        initialDurationSetIdsRef.current = new Set(
          nextDurationSets.map((set) => set.id),
        );
        initialRepSetsRef.current = new Map(
          nextRepSets.map((set) => [set.id, set]),
        );
        initialDurationSetsRef.current = new Map(
          nextDurationSets.map((set) => [set.id, set]),
        );

        // Initialize inputs with saved values when in edit mode
        if (isEditMode) {
          const initialInputs: Record<string, string> = {};
          nextRepSets.forEach((set) => {
            if (set.weight !== null)
              initialInputs[`${set.id}-weight`] = String(set.weight);
            if (set.reps !== null)
              initialInputs[`${set.id}-reps`] = String(set.reps);
            if (set.rpe !== null)
              initialInputs[`${set.id}-rpe`] = String(set.rpe);
            if (set.note) initialInputs[`${set.id}-note`] = set.note;
            initialInputs[`${set.id}-tempo-eccentric`] = String(
              set.tempo_excentric,
            );
            initialInputs[`${set.id}-tempo-isometric`] = String(
              set.tempo_isometric,
            );
            initialInputs[`${set.id}-tempo-concentric`] = String(
              set.tempo_concentric,
            );
          });
          nextDurationSets.forEach((set) => {
            if (set.weight !== null)
              initialInputs[`${set.id}-weight`] = String(set.weight);
            if (set.duration !== null)
              initialInputs[`${set.id}-duration`] = String(set.duration);
            if (set.rpe !== null)
              initialInputs[`${set.id}-rpe`] = String(set.rpe);
            if (set.note) initialInputs[`${set.id}-note`] = set.note;
          });
          setInputs(initialInputs);
        }

        setExerciseGroups(() => {
          const groups: ExerciseGroup[] = [];

          // Sort sets by their original order if we have that information
          // For now, we'll maintain the order they come from the API
          const orderedSets = [...nextRepSets, ...nextDurationSets].sort(
            (a, b) => a.position - b.position,
          );

          for (const set of orderedSets) {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.exerciseId === set.exercise_id) {
              lastGroup.sets.push(set);
              continue;
            }

            groups.push({
              id: createExerciseGroupId(),
              exerciseId: set.exercise_id,
              sets: [set],
            });
          }

          return groups;
        });
      } catch (error) {
        console.error("Error loading workout:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, isEditMode]);

  useEffect(() => {
    if (isEditMode || isNewMode || loading || !workout) {
      return;
    }

    if (timerWorkoutIdRef.current !== workout.id) {
      timerWorkoutIdRef.current = workout.id;
      timerStartedAtRef.current = Date.now();
      setElapsedTime(0);
    }

    const interval = window.setInterval(() => {
      const startedAt = timerStartedAtRef.current;
      if (startedAt !== null) {
        setElapsedTime(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isEditMode, isNewMode, loading, workout]);

  useEffect(() => {
    if (!activeRestTime || activeRestTime.remaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setActiveRestTime((prev) => {
        if (!prev) return null;
        const newRemaining = prev.remaining - 1;
        if (newRemaining <= 0) return null;
        return { ...prev, remaining: newRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRestTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const createRepSetTemplate = (
    exerciseId: number,
    workoutId: number,
  ): RepSet => ({
    id: Date.now() + Math.random(),
    workout_id: workoutId,
    exercise_id: exerciseId,
    position: 0,
    type_: "WORKSET",
    note: null,
    weight: null,
    rpe: null,
    rest: 0,
    reps: 0,
    tempo_excentric: 0,
    tempo_isometric: 0,
    tempo_concentric: 0,
  });

  const createDurationSetTemplate = (
    exerciseId: number,
    workoutId: number,
  ): DurationSet => ({
    id: Date.now() + Math.random(),
    workout_id: workoutId,
    exercise_id: exerciseId,
    position: 0,
    type_: "WORKSET",
    note: null,
    weight: null,
    rpe: null,
    rest: 0,
    duration: 0,
  });

  const handleAddExercise = () => {
    if (!workout || selectedExerciseId === null) return;

    const exercise = exercises.find((item) => item.id === selectedExerciseId);
    if (!exercise) return;

    const newSet =
      exercise.type === "REPS"
        ? createRepSetTemplate(exercise.id, workout.id)
        : createDurationSetTemplate(exercise.id, workout.id);
    const newGroup: ExerciseGroup = {
      id: createExerciseGroupId(),
      exerciseId: exercise.id,
      sets: [newSet],
    };

    setExerciseGroups((prev) => [...prev, newGroup]);
    if (exercise.type === "REPS") {
      setRepSets((prev) => [...prev, newSet as RepSet]);
    } else {
      setDurationSets((prev) => [...prev, newSet as DurationSet]);
    }
    setExerciseDialogOpen(false);
    setSelectedExerciseId(null);
  };

  const handleDeleteSet = (setId: number) => {
    setRepSets((prev) => prev.filter((set) => set.id !== setId));
    setDurationSets((prev) => prev.filter((set) => set.id !== setId));
    setExerciseGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          sets: group.sets.filter((set) => set.id !== setId),
        }))
        .filter((group) => group.sets.length > 0),
    );
    setSetCompletions((prev) => {
      const next = new Map(prev);
      next.delete(setId);
      return next;
    });
    setVisibleNoteFields((prev) => {
      const next = new Set(prev);
      next.delete(setId);
      return next;
    });
  };

  const toggleNoteField = (setId: number) => {
    setVisibleNoteFields((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  const handleDeleteExercise = (groupId: string) => {
    const group = exerciseGroups.find((item) => item.id === groupId);
    if (!group) return;

    const groupSetIds = new Set(group.sets.map((set) => set.id));
    setRepSets((prev) => prev.filter((set) => !groupSetIds.has(set.id)));
    setDurationSets((prev) => prev.filter((set) => !groupSetIds.has(set.id)));
    setExerciseGroups((prev) => prev.filter((item) => item.id !== groupId));
  };

  const handleDragOverExercise = (
    event: React.DragEvent<HTMLDivElement>,
    targetGroupId: string,
  ) => {
    event.preventDefault();
    if (draggedGroupId === null || draggedGroupId === targetGroupId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    setDropIndicator({ groupId: targetGroupId, position });
  };

  const handleDropExercise = (targetGroupId: string) => {
    if (draggedGroupId === null || draggedGroupId === targetGroupId) return;

    setExerciseGroups((prev) => {
      const next = [...prev];
      const sourceIndex = next.findIndex(
        (group) => group.id === draggedGroupId,
      );
      const targetIndex = next.findIndex((group) => group.id === targetGroupId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const [moved] = next.splice(sourceIndex, 1);
      let insertionIndex =
        targetIndex + (dropIndicator?.position === "after" ? 1 : 0);
      if (sourceIndex < insertionIndex) insertionIndex -= 1;
      next.splice(insertionIndex, 0, moved);
      return next;
    });
    setDraggedGroupId(null);
    setDropIndicator(null);
  };

  const handleRestTimeChange = (groupId: string, value: string) => {
    const rest = Math.max(0, Number.parseInt(value, 10) || 0);
    const group = exerciseGroups.find((item) => item.id === groupId);
    if (!group) return;
    const groupSetIds = new Set(group.sets.map((set) => set.id));

    setExerciseRestTimes((prev) => ({ ...prev, [groupId]: rest }));
    setRepSets((prev) =>
      prev.map((set) => (groupSetIds.has(set.id) ? { ...set, rest } : set)),
    );
    setDurationSets((prev) =>
      prev.map((set) => (groupSetIds.has(set.id) ? { ...set, rest } : set)),
    );
    setExerciseGroups((prev) =>
      prev.map((item) =>
        item.id === groupId
          ? { ...item, sets: item.sets.map((set) => ({ ...set, rest })) }
          : item,
      ),
    );
  };

  const handleAddSet = (groupId: string) => {
    if (!workout) return;

    const group = exerciseGroups.find((item) => item.id === groupId);
    if (!group) return;

    const exercise = exercises.find((item) => item.id === group.exerciseId);
    if (!exercise) return;

    const newSet =
      exercise.type === "REPS"
        ? createRepSetTemplate(group.exerciseId, workout.id)
        : createDurationSetTemplate(group.exerciseId, workout.id);
    newSet.rest = exerciseRestTimes[groupId] ?? group.sets[0]?.rest ?? 0;

    if (exercise.type === "REPS") {
      setRepSets((prev) => [...prev, newSet as RepSet]);
    } else {
      setDurationSets((prev) => [...prev, newSet as DurationSet]);
    }

    setExerciseGroups((prev) => {
      return prev.map((item) =>
        item.id === groupId ? { ...item, sets: [...item.sets, newSet] } : item,
      );
    });
  };

  const saveEditedWorkout = async (
    targetWorkoutId = workout?.id,
    createOnly = false,
  ) => {
    if (!workout) return;
    if (targetWorkoutId === undefined) return;

    const toNumberOrNull = (
      value: string | undefined,
      fallback: number | null,
    ) => {
      if (value?.trim()) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      }
      return fallback;
    };

    const currentRepSets: RepSet[] = [];
    const currentDurationSets: DurationSet[] = [];

    // Preserve order by iterating through exercise groups in order
    exerciseGroups.forEach((group) => {
      group.sets.forEach((set) => {
        if ("reps" in set) {
          currentRepSets.push(set as RepSet);
        } else {
          currentDurationSets.push(set as DurationSet);
        }
      });
    });
    const currentRepSetIds = new Set(currentRepSets.map((set) => set.id));
    const currentDurationSetIds = new Set(
      currentDurationSets.map((set) => set.id),
    );
    const positions = new Map<number, number>();
    exerciseGroups.forEach((group, groupIndex) => {
      group.sets.forEach((set, setIndex) => {
        positions.set(set.id, groupIndex * 1000 + setIndex);
      });
    });

    if (!createOnly) {
      await Promise.all([
        ...Array.from(initialRepSetIdsRef.current)
          .filter((setId) => !currentRepSetIds.has(setId))
          .map((setId) => api.deleteRepSet(setId)),
        ...Array.from(initialDurationSetIdsRef.current)
          .filter((setId) => !currentDurationSetIds.has(setId))
          .map((setId) => api.deleteDurationSet(setId)),
      ]);
    }

    const saveRepSet = (set: RepSet) => {
      const type_ = selectedSetTypes.get(set.id) ?? set.type_ ?? "WORKSET";
      const payload = {
        workout_id: targetWorkoutId,
        exercise_id: set.exercise_id,
        position: positions.get(set.id) ?? 0,
        type_,
        note: inputs[`${set.id}-note`] ?? set.note,
        weight: toNumberOrNull(inputs[`${set.id}-weight`], set.weight),
        rpe: toNumberOrNull(inputs[`${set.id}-rpe`], set.rpe),
        rest: set.rest,
        reps: Math.round(
          toNumberOrNull(inputs[`${set.id}-reps`], set.reps) ?? 0,
        ),
        tempo_excentric: Math.round(
          toNumberOrNull(
            inputs[`${set.id}-tempo-eccentric`],
            set.tempo_excentric,
          ) ?? 0,
        ),
        tempo_isometric: Math.round(
          toNumberOrNull(
            inputs[`${set.id}-tempo-isometric`],
            set.tempo_isometric,
          ) ?? 0,
        ),
        tempo_concentric: Math.round(
          toNumberOrNull(
            inputs[`${set.id}-tempo-concentric`],
            set.tempo_concentric,
          ) ?? 0,
        ),
      };

      if (createOnly || !initialRepSetIdsRef.current.has(set.id)) {
        return api.createRepSet(payload);
      }

      const originalSet = initialRepSetsRef.current.get(set.id);
      if (
        originalSet &&
        payload.type_ === originalSet.type_ &&
        payload.note === originalSet.note &&
        payload.weight === originalSet.weight &&
        payload.rpe === originalSet.rpe &&
        payload.rest === originalSet.rest &&
        payload.reps === originalSet.reps &&
        payload.position === originalSet.position &&
        payload.tempo_excentric === originalSet.tempo_excentric &&
        payload.tempo_isometric === originalSet.tempo_isometric &&
        payload.tempo_concentric === originalSet.tempo_concentric
      ) {
        return Promise.resolve();
      }

      return api.updateRepSet(set.id, payload);
    };

    const saveDurationSet = (set: DurationSet) => {
      const type_ = selectedSetTypes.get(set.id) ?? set.type_ ?? "WORKSET";
      const payload = {
        workout_id: targetWorkoutId,
        exercise_id: set.exercise_id,
        position: positions.get(set.id) ?? 0,
        type_,
        note: inputs[`${set.id}-note`] ?? set.note,
        weight: toNumberOrNull(inputs[`${set.id}-weight`], set.weight),
        rpe: toNumberOrNull(inputs[`${set.id}-rpe`], set.rpe),
        rest: set.rest,
        duration: Math.round(
          toNumberOrNull(inputs[`${set.id}-duration`], set.duration) ?? 0,
        ),
      };

      if (createOnly || !initialDurationSetIdsRef.current.has(set.id)) {
        return api.createDurationSet(payload);
      }

      const originalSet = initialDurationSetsRef.current.get(set.id);
      if (
        originalSet &&
        payload.type_ === originalSet.type_ &&
        payload.note === originalSet.note &&
        payload.weight === originalSet.weight &&
        payload.rpe === originalSet.rpe &&
        payload.rest === originalSet.rest &&
        payload.position === originalSet.position &&
        payload.duration === originalSet.duration
      ) {
        return Promise.resolve();
      }

      return api.updateDurationSet(set.id, payload);
    };

    await Promise.all([
      ...currentRepSets.map(saveRepSet),
      ...currentDurationSets.map(saveDurationSet),
    ]);
  };

  const handleSetComplete = (setId: number, restTime: number) => {
    const currentCompletion = setCompletions.get(setId);

    if (currentCompletion?.completed) {
      setSetCompletions((prev) => {
        const next = new Map(prev);
        next.delete(setId);
        return next;
      });
      setActiveRestTime(null);
      return;
    }

    const set =
      repSets.find((item) => item.id === setId) ||
      durationSets.find((item) => item.id === setId);
    if (!set) return;

    const actualValues: Record<string, string> = {};
    const getValueOrPlaceholder = (key: string, placeholder: string) => {
      const value = inputs[`${setId}-${key}`] ?? "";
      return value.trim() || placeholder;
    };

    const weightValue = getValueOrPlaceholder(
      "weight",
      set.weight?.toString() || "0",
    );
    const rawRpeValue = getValueOrPlaceholder("rpe", set.rpe?.toString() || "");
    const noteValue = getValueOrPlaceholder("note", set.note || "");

    if (weightValue) actualValues.weight = weightValue;
    if (rawRpeValue && rawRpeValue !== "0") actualValues.rpe = rawRpeValue;
    if (noteValue) actualValues.note = noteValue;

    if ("reps" in set) {
      const repsValue = getValueOrPlaceholder(
        "reps",
        set.reps?.toString() || "0",
      );
      if (repsValue) actualValues.reps = repsValue;

      const tempoEccentricValue = getValueOrPlaceholder(
        "tempo-eccentric",
        set.tempo_excentric?.toString() || "0",
      );
      const tempoIsometricValue = getValueOrPlaceholder(
        "tempo-isometric",
        set.tempo_isometric?.toString() || "0",
      );
      const tempoConcentricValue = getValueOrPlaceholder(
        "tempo-concentric",
        set.tempo_concentric?.toString() || "0",
      );

      if (tempoEccentricValue)
        actualValues.tempoEccentric = tempoEccentricValue;
      if (tempoIsometricValue)
        actualValues.tempoIsometric = tempoIsometricValue;
      if (tempoConcentricValue)
        actualValues.tempoConcentric = tempoConcentricValue;
    }

    if ("duration" in set) {
      const durationValue = getValueOrPlaceholder(
        "duration",
        set.duration?.toString() || "0",
      );
      if (durationValue) actualValues.duration = durationValue;
    }

    setSetCompletions((prev) => {
      const next = new Map(prev);
      next.set(setId, {
        completed: true,
        restStartTime: Date.now(),
        actualValues,
      });
      return next;
    });

    setInputs((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(actualValues)) {
        const normalizedKey =
          key === "tempoEccentric"
            ? "tempo-eccentric"
            : key === "tempoIsometric"
              ? "tempo-isometric"
              : key === "tempoConcentric"
                ? "tempo-concentric"
                : key;
        next[`${setId}-${normalizedKey}`] = String(value);
      }
      return next;
    });

    if (restTime > 0) {
      setActiveRestTime({ setId, remaining: restTime });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!workout) {
    notFound();
  }

  const exerciseSets = new Map<number, (RepSet | DurationSet)[]>();

  repSets.forEach((set) => {
    const currentSets = exerciseSets.get(set.exercise_id);
    if (!currentSets) {
      exerciseSets.set(set.exercise_id, [set]);
      return;
    }
    currentSets.push(set);
  });

  durationSets.forEach((set) => {
    const currentSets = exerciseSets.get(set.exercise_id);
    if (!currentSets) {
      exerciseSets.set(set.exercise_id, [set]);
      return;
    }
    currentSets.push(set);
  });

  const availableExercises = exercises;
  const orderedExerciseGroups =
    exerciseGroups.length > 0
      ? exerciseGroups
      : Array.from(exerciseSets.entries()).map(([exerciseId, sets]) => ({
          id: createExerciseGroupId(),
          exerciseId,
          sets,
        }));

  return (
    <div className="container mx-auto p-6">
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col items-end">
            {isFormMode ? (
              <div className="w-full space-y-3">
                <Input
                  aria-label="Workout name"
                  className="font-bold"
                  placeholder="Workout name"
                  value={workout.name}
                  onChange={(event) =>
                    setWorkout((current) =>
                      current
                        ? { ...current, name: event.target.value }
                        : current,
                    )
                  }
                />
                <Input
                  aria-label="Workout description"
                  placeholder="Description (optional)"
                  value={workout.description ?? ""}
                  onChange={(event) =>
                    setWorkout((current) =>
                      current
                        ? {
                            ...current,
                            description: event.target.value || null,
                          }
                        : current,
                    )
                  }
                />
              </div>
            ) : (
              <div className="w-full">
                <CardTitle>{workout.name}</CardTitle>
                {workout.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workout.description}
                  </p>
                )}
              </div>
            )}
            {!isFormMode && (
              <div className="text-2xl font-mono">
                {formatTime(elapsedTime)}
              </div>
            )}
            {!isFormMode && activeRestTime && (
              <div className="flex items-center gap-2">
                <div className="text-lg font-medium text-orange-600">
                  Rest: {activeRestTime.remaining}s
                </div>
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setActiveRestTime(null)}
                  >
                    Skip
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setActiveRestTime((prev) =>
                        prev
                          ? { ...prev, remaining: prev.remaining + 15 }
                          : null,
                      )
                    }
                  >
                    +15s
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setActiveRestTime((prev) =>
                        prev
                          ? {
                              ...prev,
                              remaining: Math.max(0, prev.remaining - 15),
                            }
                          : null,
                      )
                    }
                  >
                    -15s
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orderedExerciseGroups.length === 0 ? (
            <p className="text-muted-foreground">
              No exercises in this workout.
            </p>
          ) : (
            <div className="space-y-6">
              {orderedExerciseGroups.map((group) => {
                const { id: groupId, exerciseId, sets } = group;
                const exercise = exercises.find(
                  (item) => item.id === exerciseId,
                );
                if (!exercise) return null;

                const isRepExercise = exercise.type === "REPS";
                const weightLabel =
                  exercise.equipment === "ASSISTED_BODYWEIGHT"
                    ? "-kg"
                    : exercise.equipment === "BODYWEIGHT"
                      ? "+kg"
                      : "kg";

                const showBefore =
                  dropIndicator?.groupId === groupId &&
                  dropIndicator.position === "before";
                const showAfter =
                  dropIndicator?.groupId === groupId &&
                  dropIndicator.position === "after";

                return (
                  <div key={group.id}>
                    {showBefore && <div className="h-1 rounded bg-blue-500" />}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: the card is a drag-and-drop target containing form controls. */}
                    <div
                      className="border rounded-lg p-4 w-full"
                      draggable
                      onDragStart={() => setDraggedGroupId(groupId)}
                      onDragEnd={() => {
                        setDraggedGroupId(null);
                        setDropIndicator(null);
                      }}
                      onDragOver={(event) =>
                        handleDragOverExercise(event, groupId)
                      }
                      onDrop={() => handleDropExercise(groupId)}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Reorder ${exercise.name}`}
                            className="cursor-grab text-muted-foreground"
                            draggable
                            onDragStart={() => setDraggedGroupId(groupId)}
                          >
                            <GripHorizontal aria-hidden="true" />
                          </button>
                          <h3 className="text-lg font-semibold">
                            {exercise.name}
                          </h3>
                        </div>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          className="border-destructive/40"
                          onClick={() => handleDeleteExercise(groupId)}
                          title="Delete exercise"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {exercise.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {exercise.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <label
                          htmlFor={`rest-${groupId}`}
                          className="font-medium"
                        >
                          Rest (s)
                        </label>
                        <Input
                          id={`rest-${groupId}`}
                          type="number"
                          min="0"
                          className="w-24"
                          value={
                            exerciseRestTimes[groupId] ?? sets[0]?.rest ?? 0
                          }
                          onChange={(event) =>
                            handleRestTimeChange(groupId, event.target.value)
                          }
                        />
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-2 mb-2 text-sm font-medium text-muted-foreground border-b pb-2">
                        <span className="w-8">#</span>
                        <span className="w-24">Type</span>
                        <span className="w-20">{weightLabel}</span>
                        {isRepExercise ? (
                          <>
                            <span className="w-16">reps</span>
                            <span className="w-24">tempo</span>
                          </>
                        ) : (
                          <span className="w-16">duration</span>
                        )}
                        <span className="w-16">RPE</span>
                        {!isFormMode && <span className="w-8" />}
                        <span className="w-10" />
                      </div>

                      <div className="space-y-3">
                        {sets.map((set, index) => {
                          const completion = setCompletions.get(set.id);
                          const isCompleted = completion?.completed;
                          const actualValues = completion?.actualValues || {};
                          const selectColor =
                            SET_TYPE_COLORS[
                              selectedSetTypes.get(set.id) || set.type_
                            ] || "bg-background";

                          return (
                            <div
                              key={set.id}
                              className={`flex flex-wrap justify-between items-center gap-2 p-3 rounded-lg border ${
                                isCompleted
                                  ? "bg-green-50 border-green-300 dark:bg-green-950/60 dark:border-green-600 dark:text-green-50 [&_input]:border-green-600 [&_input]:bg-green-900/50 [&_input]:text-green-50 [&_input]:placeholder:text-green-200"
                                  : "bg-background"
                              }`}
                            >
                              <span className="font-medium w-8">
                                {index + 1}
                              </span>

                              <Select
                                value={
                                  selectedSetTypes.get(set.id) || set.type_
                                }
                                onValueChange={(selectedType) => {
                                  if (!selectedType) return;
                                  setSelectedSetTypes((prev) => {
                                    const next = new Map(prev);
                                    next.set(set.id, selectedType);
                                    return next;
                                  });
                                  if (selectedType === "FAILURE") {
                                    setInputs((prev) => ({
                                      ...prev,
                                      [`${set.id}-rpe`]: "10",
                                    }));
                                  }
                                }}
                              >
                                <SelectTrigger
                                  className={`w-28 border px-2 py-1 text-sm ${
                                    isCompleted &&
                                    (selectedSetTypes.get(set.id) ||
                                      set.type_) === "WORKSET"
                                      ? "bg-green-50 dark:bg-green-900/50 dark:text-green-50"
                                      : selectColor
                                  }`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SET_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {SET_TYPE_LABELS[type] || type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                type="number"
                                placeholder={
                                  set.weight !== null
                                    ? set.weight.toString()
                                    : actualValues.weight || "0"
                                }
                                value={
                                  inputs[`${set.id}-weight`] ??
                                  (isCompleted && actualValues.weight
                                    ? String(actualValues.weight)
                                    : isFormMode && set.weight !== null
                                      ? String(set.weight)
                                      : "")
                                }
                                className="w-20"
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    [`${set.id}-weight`]: e.target.value,
                                  }))
                                }
                              />

                              {isRepExercise ? (
                                <>
                                  <Input
                                    type="number"
                                    placeholder={
                                      "reps" in set && set.reps !== null
                                        ? set.reps.toString()
                                        : actualValues.reps || "0"
                                    }
                                    value={
                                      inputs[`${set.id}-reps`] ??
                                      (isCompleted && actualValues.reps
                                        ? String(actualValues.reps)
                                        : isFormMode &&
                                            "reps" in set &&
                                            set.reps !== null
                                          ? String(set.reps)
                                          : "")
                                    }
                                    min="0"
                                    className="w-16"
                                    onChange={(e) =>
                                      setInputs((prev) => ({
                                        ...prev,
                                        [`${set.id}-reps`]: e.target.value,
                                      }))
                                    }
                                  />

                                  <div className="flex gap-1">
                                    <Input
                                      type="number"
                                      placeholder={
                                        "tempo_excentric" in set &&
                                        set.tempo_excentric !== null
                                          ? set.tempo_excentric.toString()
                                          : actualValues.tempoEccentric || "0"
                                      }
                                      value={
                                        inputs[`${set.id}-tempo-eccentric`] ??
                                        (isCompleted &&
                                        actualValues.tempoEccentric
                                          ? String(actualValues.tempoEccentric)
                                          : isFormMode &&
                                              "tempo_excentric" in set &&
                                              set.tempo_excentric !== null
                                            ? String(set.tempo_excentric)
                                            : "")
                                      }
                                      min="0"
                                      className="w-14 text-center"
                                      onChange={(e) =>
                                        setInputs((prev) => ({
                                          ...prev,
                                          [`${set.id}-tempo-eccentric`]:
                                            e.target.value,
                                        }))
                                      }
                                    />
                                    <Input
                                      type="number"
                                      placeholder={
                                        "tempo_isometric" in set &&
                                        set.tempo_isometric !== null
                                          ? set.tempo_isometric.toString()
                                          : actualValues.tempoIsometric || "0"
                                      }
                                      value={
                                        inputs[`${set.id}-tempo-isometric`] ??
                                        (isCompleted &&
                                        actualValues.tempoIsometric
                                          ? String(actualValues.tempoIsometric)
                                          : isFormMode &&
                                              "tempo_isometric" in set &&
                                              set.tempo_isometric !== null
                                            ? String(set.tempo_isometric)
                                            : "")
                                      }
                                      min="0"
                                      className="w-14 text-center"
                                      onChange={(e) =>
                                        setInputs((prev) => ({
                                          ...prev,
                                          [`${set.id}-tempo-isometric`]:
                                            e.target.value,
                                        }))
                                      }
                                    />
                                    <Input
                                      type="number"
                                      placeholder={
                                        "tempo_concentric" in set &&
                                        set.tempo_concentric !== null
                                          ? set.tempo_concentric.toString()
                                          : actualValues.tempoConcentric || "0"
                                      }
                                      value={
                                        inputs[`${set.id}-tempo-concentric`] ??
                                        (isCompleted &&
                                        actualValues.tempoConcentric
                                          ? String(actualValues.tempoConcentric)
                                          : isFormMode &&
                                              "tempo_concentric" in set &&
                                              set.tempo_concentric !== null
                                            ? String(set.tempo_concentric)
                                            : "")
                                      }
                                      min="0"
                                      className="w-14 text-center"
                                      onChange={(e) =>
                                        setInputs((prev) => ({
                                          ...prev,
                                          [`${set.id}-tempo-concentric`]:
                                            e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </>
                              ) : (
                                <Input
                                  type="number"
                                  placeholder={
                                    "duration" in set && set.duration !== null
                                      ? set.duration.toString()
                                      : actualValues.duration || "0"
                                  }
                                  value={
                                    inputs[`${set.id}-duration`] ??
                                    (isCompleted && actualValues.duration
                                      ? String(actualValues.duration)
                                      : isFormMode &&
                                          "duration" in set &&
                                          set.duration !== null
                                        ? String(set.duration)
                                        : "")
                                  }
                                  min="0"
                                  className="w-16"
                                  onChange={(e) =>
                                    setInputs((prev) => ({
                                      ...prev,
                                      [`${set.id}-duration`]: e.target.value,
                                    }))
                                  }
                                />
                              )}

                              <Input
                                type="number"
                                placeholder={
                                  set.rpe !== null
                                    ? set.rpe.toString()
                                    : actualValues.rpe || "0"
                                }
                                value={
                                  inputs[`${set.id}-rpe`] ??
                                  (isCompleted && actualValues.rpe
                                    ? String(actualValues.rpe)
                                    : isFormMode && set.rpe !== null
                                      ? String(set.rpe)
                                      : "")
                                }
                                className="w-16"
                                min="1"
                                max="10"
                                step="0.5"
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    [`${set.id}-rpe`]: e.target.value,
                                  }))
                                }
                              />
							  
                              <div className="flex gap-2 items-center">
                              {!visibleNoteFields.has(set.id) &&
                                !set.note?.trim() &&
                                !actualValues.note?.trim() && (
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  onClick={() => toggleNoteField(set.id)}
                                  title="Add note"
                                >
                                  <FileEdit className="size-4" />
                                </Button>
                              )}
                              {!isEditMode && !isNewMode && (
                                <Button
                                  size="sm"
                                  variant={isCompleted ? "default" : "outline"}
                                  className={
                                    isCompleted
                                      ? "bg-green-600 text-white hover:bg-green-700"
                                      : ""
                                  }
                                  onClick={() =>
                                    handleSetComplete(
                                      set.id,
                                      exerciseRestTimes[groupId] ?? set.rest,
                                    )
                                  }
                                >
                                  <Check className="size-4" />
                                </Button>
                              )}

                              <Button
                                size="icon-sm"
                                variant="destructive"
                                className="border-destructive/40"
                                onClick={() => handleDeleteSet(set.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                              </div>
                              {visibleNoteFields.has(set.id) ||
                              set.note?.trim() ||
                              actualValues.note?.trim() ? (
                                <div className="w-full mt-2 flex gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Set note"
                                    value={
                                      inputs[`${set.id}-note`] ??
                                      (isCompleted && actualValues.note
                                        ? String(actualValues.note)
                                        : set.note || "")
                                    }
                                    onChange={(e) =>
                                      setInputs((prev) => ({
                                        ...prev,
                                        [`${set.id}-note`]: e.target.value,
                                      }))
                                    }
                                    className="flex-1"
                                  />
                                  <Button
                                    size="icon-sm"
                                    variant="outline"
                                    onClick={() => toggleNoteField(set.id)}
                                    title="Delete note"
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSet(groupId)}
                        >
                          Add set
                        </Button>
                      </div>
                    </div>
                    {showAfter && <div className="h-1 rounded bg-blue-500" />}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              disabled={availableExercises.length === 0}
              onClick={() => {
                setSelectedExerciseId(availableExercises[0]?.id ?? null);
                setExerciseDialogOpen(true);
              }}
            >
              Add exercise
            </Button>
          </div>

          <div className="flex gap-4 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDialogMode("cancel");
                setDialogOpen(true);
              }}
            >
              {isNewMode
                ? "Cancel"
                : isEditMode
                  ? "Discard Changes"
                  : "Cancel Workout"}
            </Button>
            <Button
              variant="default"
              className="flex-1"
              disabled={isNewMode && !workout.name.trim()}
              onClick={() => {
                setDialogMode("finish");
                setDialogOpen(true);
              }}
            >
              {isNewMode
                ? "Save Workout"
                : isEditMode
                  ? "Save Workout"
                  : "Finish Workout"}
            </Button>
          </div>

          <Dialog
            open={exerciseDialogOpen}
            onOpenChange={(open) => {
              setExerciseDialogOpen(open);
              if (!open) setSelectedExerciseId(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add exercise</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Select
                  value={selectedExerciseId?.toString() ?? null}
                  onValueChange={(value) =>
                    setSelectedExerciseId(value ? Number(value) : null)
                  }
                >
                  <SelectTrigger className="w-full border px-3 py-2">
                    <SelectValue>
                      {selectedExerciseId === null
                        ? "Select an exercise"
                        : availableExercises.find(
                            (exercise) => exercise.id === selectedExerciseId,
                          )?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableExercises.map((exercise) => (
                      <SelectItem
                        key={exercise.id}
                        value={exercise.id.toString()}
                      >
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setExerciseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={selectedExerciseId === null}
                  onClick={handleAddExercise}
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => setDialogOpen(open)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dialogMode === "cancel"
                    ? isNewMode
                      ? "Cancel workout"
                      : isEditMode
                        ? "Discard changes"
                        : "Cancel workout"
                    : isNewMode || isEditMode
                      ? "Save workout"
                      : "Finish workout"}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription>
                {dialogMode === "cancel"
                  ? isNewMode
                    ? "Are you sure you want to cancel creating this workout?"
                    : isEditMode
                      ? "Are you sure you want to discard your changes?"
                      : "Are you sure to cancel your workout?"
                  : isNewMode || isEditMode
                    ? "Are you sure you want to save your workout?"
                    : "Are you sure to finish your workout?"}
              </DialogDescription>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  No
                </Button>
                <Button
                  variant="default"
                  onClick={async () => {
                    if (dialogMode === "cancel") {
                      setDialogOpen(false);
                      router.push(
                        isEditMode ? `/workouts/${workout.id}` : "/workouts",
                      );
                      return;
                    }

                    try {
                      if (isNewMode) {
                        if (!workout.name.trim()) return;
                        const newWorkout = await api.createWorkout({
                          name: workout.name.trim(),
                          planned: true,
                          description: workout.description?.trim() || null,
                          mesocycle_id: workout.mesocycle_id,
                        });
                        await saveEditedWorkout(newWorkout.id, true);
                        setDialogOpen(false);
                        router.push(`/workouts/${newWorkout.id}`);
                        return;
                      }

                      if (isEditMode) {
                        await saveEditedWorkout();
                        await api.updateWorkout(workout.id, {
                          name: workout.name,
                          planned: true,
                          description: workout.description,
                          mesocycle_id: workout.mesocycle_id,
                        });
                        setDialogOpen(false);
                        router.push(`/workouts/${workout.id}`);
                        return;
                      }

                      const newWorkout = await api.createWorkout({
                        name: workout?.name ?? "Finished workout",
                        planned: false,
                        description: workout?.description ?? null,
                        mesocycle_id: workout?.mesocycle_id ?? null,
                      });

                      for (const [
                        setId,
                        completion,
                      ] of setCompletions.entries()) {
                        if (!completion.completed) continue;

                        const setObj =
                          repSets.find((item) => item.id === setId) ||
                          durationSets.find((item) => item.id === setId);
                        if (!setObj) continue;

                        const selectedType = (
                          selectedSetTypes.get(setId) ??
                          setObj.type_ ??
                          "WORKSET"
                        )
                          .toString()
                          .toUpperCase();
                        const rawRpe = completion.actualValues.rpe;
                        const numericWeight = completion.actualValues.weight
                          ? Number.parseFloat(completion.actualValues.weight)
                          : (setObj.weight ?? null);
                        const numericRpe = rawRpe
                          ? Number.parseFloat(rawRpe)
                          : (setObj.rpe ?? null);

                        const base = {
                          workout_id: newWorkout.id,
                          exercise_id: setObj.exercise_id,
                          position: setObj.position,
                          type_: selectedType,
                          note: completion.actualValues.note || null,
                          weight: Number.isFinite(numericWeight)
                            ? numericWeight
                            : null,
                          rpe:
                            numericRpe != null &&
                            Number.isFinite(numericRpe) &&
                            numericRpe > 0
                              ? numericRpe
                              : null,
                          rest: Number.isFinite(setObj.rest) ? setObj.rest : 0,
                        };

                        if ("reps" in setObj) {
                          const repsValue = completion.actualValues.reps
                            ? Number.parseInt(completion.actualValues.reps, 10)
                            : (setObj.reps ?? 0);
                          const tempoExcentricValue = completion.actualValues
                            .tempoEccentric
                            ? Number.parseInt(
                                completion.actualValues.tempoEccentric,
                                10,
                              )
                            : (setObj.tempo_excentric ?? 0);
                          const tempoIsometricValue = completion.actualValues
                            .tempoIsometric
                            ? Number.parseInt(
                                completion.actualValues.tempoIsometric,
                                10,
                              )
                            : (setObj.tempo_isometric ?? 0);
                          const tempoConcentricValue = completion.actualValues
                            .tempoConcentric
                            ? Number.parseInt(
                                completion.actualValues.tempoConcentric,
                                10,
                              )
                            : (setObj.tempo_concentric ?? 0);

                          await api.createRepSet({
                            ...base,
                            reps: Number.isFinite(repsValue) ? repsValue : 0,
                            tempo_excentric: Number.isFinite(
                              tempoExcentricValue,
                            )
                              ? tempoExcentricValue
                              : 0,
                            tempo_isometric: Number.isFinite(
                              tempoIsometricValue,
                            )
                              ? tempoIsometricValue
                              : 0,
                            tempo_concentric: Number.isFinite(
                              tempoConcentricValue,
                            )
                              ? tempoConcentricValue
                              : 0,
                          });
                        } else {
                          const durationValue = completion.actualValues.duration
                            ? Number.parseInt(
                                completion.actualValues.duration,
                                10,
                              )
                            : (setObj.duration ?? 0);

                          await api.createDurationSet({
                            ...base,
                            duration: Number.isFinite(durationValue)
                              ? durationValue
                              : 0,
                          });
                        }
                      }
                    } catch (err) {
                      console.error(
                        isEditMode
                          ? "Error updating workout"
                          : "Error saving finished workout",
                        err,
                      );
                    } finally {
                      setDialogOpen(false);
                      if (!isEditMode && !isNewMode) {
                        router.push("/workouts");
                      }
                    }
                  }}
                >
                  Yes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
