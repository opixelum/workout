"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type Exercise } from "@/lib/api";

export default function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"REPS" | "DURATION">("REPS");
  const [equipment, setEquipment] = useState<
    | "BARBELL"
    | "DUMBBELL"
    | "MACHINE"
    | "BODYWEIGHT"
    | "ASSISTED_BODYWEIGHT"
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadExercise() {
      try {
        const { id } = await params;
        const exerciseData = await api.getExercise(Number.parseInt(id, 10));
        setExercise(exerciseData);
        setName(exerciseData.name);
        setDescription(exerciseData.description || "");
        setType(exerciseData.type as "REPS" | "DURATION");
        setEquipment(exerciseData.equipment);
      } catch (error) {
        console.error("Error loading exercise:", error);
      } finally {
        setLoading(false);
      }
    }
    loadExercise();
  }, [params]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || !name.trim() || !equipment) return;

    setSaving(true);
    try {
      await api.updateExercise(exercise.id, {
        name,
        description: description || null,
        type,
        equipment,
      });
      router.push("/exercises");
    } catch (error) {
      console.error("Error updating exercise:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;
    if (!confirm("Are you sure you want to delete this exercise?")) return;

    setDeleting(true);
    try {
      await api.deleteExercise(exercise.id);
      router.push("/exercises");
    } catch (error) {
      console.error("Error deleting exercise:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!exercise) {
    return <div className="container mx-auto p-6">Exercise not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Exercise</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exercise name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Exercise description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: "REPS" | "DURATION") => setType(value)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REPS">Rep-based</SelectItem>
                  <SelectItem value="DURATION">Duration-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Select
                value={equipment ?? ""}
                onValueChange={(
                  value:
                    | "BARBELL"
                    | "DUMBBELL"
                    | "MACHINE"
                    | "BODYWEIGHT"
                    | "ASSISTED_BODYWEIGHT",
                ) => setEquipment(value)}
              >
                <SelectTrigger id="equipment" required>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BARBELL">Barbell</SelectItem>
                  <SelectItem value="DUMBBELL">Dumbbell</SelectItem>
                  <SelectItem value="MACHINE">Machine</SelectItem>
                  <SelectItem value="BODYWEIGHT">Bodyweight</SelectItem>
                  <SelectItem value="ASSISTED_BODYWEIGHT">
                    Assisted Bodyweight
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-between">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="border-destructive/40"
                onClick={handleDelete}
                disabled={saving || deleting}
                title="Delete exercise"
              >
                <Trash2 className="size-4" />
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/exercises")}
                  disabled={saving || deleting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || deleting || !name.trim() || !equipment}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
