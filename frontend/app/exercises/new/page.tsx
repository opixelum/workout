"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { api } from "@/lib/api";

export default function NewExercisePage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState<"REPS" | "DURATION">("REPS");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setLoading(true);
		try {
			await api.createExercise({
				name,
				description: description || null,
				type,
				user_id: 1,
			});
			router.push("/exercises");
		} catch (error) {
			console.error("Error creating exercise:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-6">
			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>New Exercise</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
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

						<div className="flex gap-2 justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.push("/exercises")}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || !name.trim()}>
								{loading ? "Creating..." : "Create"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
