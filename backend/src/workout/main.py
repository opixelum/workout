import db
from classes import DurationSet, Exercise, MacroCycle, Mesocycle, RepSet, SetType, Workout

def main():
    print("Testing database insertion and retrieval...")

    # 1. Create structures
    macrocycle = MacroCycle(name="Hypertrophy Phase 1", mesocycles=[])
    macrocycle_id = db.add_macrocycle(macrocycle)
    print(f"Added macrocycle: {macrocycle.name} (ID: {macrocycle_id})")

    mesocycle = Mesocycle(name="Week 1 - Accumulation", workouts=[])
    mesocycle_id = db.add_mesocycle(mesocycle, macrocycle_id)
    print(f"Added mesocycle: {mesocycle.name} (ID: {mesocycle_id})")

    workout = Workout(name="Upper Body A", exercises=[])
    workout_id = db.add_workout(workout, mesocycle_id)
    print(f"Added workout: {workout.name} (ID: {workout_id})")

    # Bench Press exercise with RepSets
    bench_press = Exercise(name="Bench Press", sets=[])
    bench_press_id = db.add_exercise(bench_press, workout_id)
    print(f"Added exercise: {bench_press.name} (ID: {bench_press_id})")

    # Add 2 RepSets to Bench Press
    set1 = RepSet(type_=SetType.WORKSET, rpe=8.5, weight=80.0, rest=180, reps=8, tempo=(3, 1, 1))
    set2 = RepSet(type_=SetType.FAILURE, rpe=10.0, weight=80.0, rest=240, reps=7, tempo=(3, 0, 1))
    
    set1_id = db.add_rep_set(set1, bench_press_id)
    set2_id = db.add_rep_set(set2, bench_press_id)
    print(f"  Added RepSet 1 (ID: {set1_id}): {set1}")
    print(f"  Added RepSet 2 (ID: {set2_id}): {set2}")

    # Plank exercise with DurationSets
    plank = Exercise(name="Plank", sets=[])
    plank_id = db.add_exercise(plank, workout_id)
    print(f"Added exercise: {plank.name} (ID: {plank_id})")

    # Add 1 DurationSet to Plank
    plank_set = DurationSet(type_=SetType.WORKSET, rpe=7.0, weight=0.0, rest=60, duration=60)
    plank_set_id = db.add_duration_set(plank_set, plank_id)
    print(f"  Added DurationSet (ID: {plank_set_id}): {plank_set}")

    # 2. Retrieve and print tables
    print("\n--- Current DB Rows ---")
    tables = ["macrocycles", "mesocycles", "workouts", "exercises", "sets", "rep_sets", "duration_sets"]
    for table in tables:
        rows = db.list_rows(table)
        print(f"\nTable '{table}':")
        for row in rows:
            print(f"  {row}")

if __name__ == "__main__":
    main()
