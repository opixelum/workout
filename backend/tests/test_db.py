# ruff: noqa: I001
from pathlib import Path
import sys

import pytest

# Add src/workout to the path so we can import db and classes
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src" / "workout"))

from classes import DurationSet, Exercise, MacroCycle, Mesocycle, RepSet, SetType, Workout  # fmt: skip
import db  # fmt: skip

@pytest.fixture(scope="function")
def test_macrocycle():
    # Setup: Create a unique macrocycle
    mc = MacroCycle(name="Temp Test Macrocycle", mesocycles=[])
    mc_id = db.add_macrocycle(mc)
    
    yield mc_id
    
    # Teardown: Delete the macrocycle, which cascades to delete all sub-entities
    db.del_macrocycle(mc_id)

def test_database_hierarchy(test_macrocycle):
    macrocycle_id = test_macrocycle
    assert macrocycle_id is not None
    
    # Verify macrocycle was created
    mc_rows = db.list_rows("macrocycles")
    assert any(row[0] == macrocycle_id and row[1] == "Temp Test Macrocycle" for row in mc_rows)

    # 1. Add Mesocycle
    mesocycle = Mesocycle(name="Test Mesocycle", workouts=[])
    mesocycle_id = db.add_mesocycle(mesocycle, macrocycle_id)
    assert mesocycle_id is not None
    
    meso_rows = db.list_rows("mesocycles")
    assert any(row[0] == mesocycle_id and row[1] == "Test Mesocycle" and row[2] == macrocycle_id for row in meso_rows)

    # 2. Add Workout
    workout = Workout(name="Test Workout", exercises=[])
    workout_id = db.add_workout(workout, mesocycle_id)
    assert workout_id is not None

    workout_rows = db.list_rows("workouts")
    assert any(row[0] == workout_id and row[1] == "Test Workout" and row[2] == mesocycle_id for row in workout_rows)

    # 3. Add Exercise
    exercise = Exercise(name="Test Exercise", sets=[])
    exercise_id = db.add_exercise(exercise, workout_id)
    assert exercise_id is not None

    exercise_rows = db.list_rows("exercises")
    assert any(row[0] == exercise_id and row[1] == "Test Exercise" and row[2] == workout_id for row in exercise_rows)

    # 4. Add RepSet
    rep_set = RepSet(type_=SetType.WORKSET, rpe=8.0, weight=100.0, rest=90, reps=5, tempo=(2, 1, 1))
    rep_set_id = db.add_rep_set(rep_set, exercise_id)
    assert rep_set_id is not None

    # Check sets table
    set_rows = db.list_rows("sets")
    assert any(row[0] == rep_set_id and row[1] == "WORKSET" and row[2] == 8.0 and row[3] == 100.0 and row[4] == 90 and row[5] == exercise_id for row in set_rows)

    # Check rep_sets table
    rep_set_rows = db.list_rows("rep_sets")
    assert any(row[1] == rep_set_id and row[2] == 5 and row[3] == 2 and row[4] == 1 and row[5] == 1 for row in rep_set_rows)

    # 5. Add DurationSet
    duration_set = DurationSet(type_=SetType.WARMUP, rpe=5.0, weight=10.0, rest=30, duration=45)
    duration_set_id = db.add_duration_set(duration_set, exercise_id)
    assert duration_set_id is not None

    # Check sets table for DurationSet
    set_rows_after = db.list_rows("sets")
    assert any(row[0] == duration_set_id and row[1] == "WARMUP" and row[2] == 5.0 and row[3] == 10.0 and row[4] == 30 and row[5] == exercise_id for row in set_rows_after)

    # Check duration_sets table
    duration_set_rows = db.list_rows("duration_sets")
    assert any(row[1] == duration_set_id and row[2] == 45 for row in duration_set_rows)
