from classes import MacroCycle, Mesocycle, Workout, Exercise, RepSet, DurationSet, Set
import psycopg2


def connect():
    return psycopg2.connect(
        host="localhost",
        port="5432",
        user="user",
        password="password",
        dbname="workout"
    )

def insert_query(query: str, params: tuple) -> int:
    conn = connect()
    cur = conn.cursor()
    cur.execute(query + " RETURNING id", params)
    inserted_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return inserted_id

def delete_query(table: str, id: int) -> int:
    conn = connect()
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {table} WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return cur.rowcount

def list_rows(table: str) -> list:
    conn = connect()
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    conn.commit()
    cur.close()
    conn.close()
    return rows

def get_query(query: str, params: tuple) -> list:
    conn = connect()
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.commit()
    cur.close()
    conn.close()
    return rows

def add_macrocycle(macrocycle: MacroCycle) -> int:
    return insert_query("INSERT INTO macrocycles (name) VALUES (%s)", (macrocycle.name,))

def add_mesocycle(mesocycle: Mesocycle, macrocycle_id: int) -> int:
    return insert_query("INSERT INTO mesocycles (name, macrocycle_id) VALUES (%s, %s)", (mesocycle.name, macrocycle_id))

def add_workout(workout: Workout, mesocycle_id: int) -> int:
    return insert_query("INSERT INTO workouts (name, mesocycle_id) VALUES (%s, %s)", (workout.name, mesocycle_id))

def add_exercise(exercise: Exercise, workout_id: int) -> int:
    return insert_query("INSERT INTO exercises (name, workout_id) VALUES (%s, %s)", (exercise.name, workout_id))

def add_rep_set(set: RepSet, exercise_id: int) -> int:
    set_id = insert_query(
        "INSERT INTO sets (type_, rpe, weight, rest, exercise_id) VALUES (%s, %s, %s, %s, %s)",
        (set.type_.name, set.rpe, set.weight, set.rest, exercise_id)
    )
    conn = connect()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO rep_sets (set_id, reps, tempo_excentric, tempo_isometric, tempo_concentric) VALUES (%s, %s, %s, %s, %s)",
        (set_id, set.reps, set.tempo[0], set.tempo[1], set.tempo[2])
    )
    conn.commit()
    cur.close()
    conn.close()
    return set_id

def add_duration_set(set: DurationSet, exercise_id: int) -> int:
    set_id = insert_query(
        "INSERT INTO sets (type_, rpe, weight, rest, exercise_id) VALUES (%s, %s, %s, %s, %s)",
        (set.type_.name, set.rpe, set.weight, set.rest, exercise_id)
    )
    conn = connect()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO duration_sets (set_id, duration) VALUES (%s, %s)",
        (set_id, set.duration)
    )
    conn.commit()
    cur.close()
    conn.close()
    return set_id

def del_macrocycle(macrocycle_id: int) -> int:
    return delete_query("macrocycles", macrocycle_id)

def del_mesocycle(mesocycle_id: int) -> int:
    return delete_query("mesocycles", mesocycle_id)

def del_workout(workout_id: int) -> int:
    return delete_query("workouts", workout_id)

def del_exercise(exercise_id: int) -> int:
    return delete_query("exercises", exercise_id)

def del_set(set_id: int) -> int:
    return delete_query("sets", set_id)

def get_macrocycle(id: int) -> MacroCycle:
    return get_query("SELECT * FROM macrocycles WHERE id = %s", (id,))

def get_mesocycle(id: int) -> Mesocycle:
    return get_query("SELECT * FROM mesocycles WHERE id = %s", (id,))

def get_workout(id: int) -> Workout:
    return get_query("SELECT * FROM workouts WHERE id = %s", (id,))

def get_exercise(id: int) -> Exercise:
    return get_query("SELECT * FROM exercises WHERE id = %s", (id,))

def get_set(id: int) -> Set:
    return get_query("SELECT * FROM sets WHERE id = %s", (id,))

def get_rep_set(id: int) -> RepSet:
    return get_query("SELECT * FROM rep_sets WHERE id = %s", (id,))