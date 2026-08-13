CREATE TYPE set_type_enum AS ENUM (
    'WARMUP',
    'WORKSET',
    'DROPSET',
    'SUPERSET',
    'FAILURE'
);

CREATE TABLE macrocycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE mesocycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    macrocycle_id INTEGER NOT NULL,
    FOREIGN KEY (macrocycle_id) REFERENCES macrocycles(id) ON DELETE CASCADE
);

CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mesocycle_id INTEGER NOT NULL,
    FOREIGN KEY (mesocycle_id) REFERENCES mesocycles(id) ON DELETE CASCADE
);

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    workout_id INTEGER NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE TABLE sets (
    id SERIAL PRIMARY KEY,
    type_ set_type_enum NOT NULL DEFAULT 'WORKSET',
    rpe FLOAT CHECK (rpe >= 1 AND rpe <= 10),
    weight FLOAT,  -- kg
    rest INTEGER NOT NULL DEFAULT 0,  -- seconds
    exercise_id INTEGER NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE rep_sets (
    id SERIAL PRIMARY KEY,
    set_id INTEGER NOT NULL UNIQUE,
    reps INTEGER,
    tempo_excentric INTEGER NOT NULL DEFAULT 0,
    tempo_isometric INTEGER NOT NULL DEFAULT 0,
    tempo_concentric INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE TABLE duration_sets (
    id SERIAL PRIMARY KEY,
    set_id INTEGER NOT NULL UNIQUE,
    duration INTEGER NOT NULL,  -- seconds
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

CREATE INDEX idx_sets_exercise ON sets(exercise_id);
CREATE INDEX idx_exercises_workout ON exercises(workout_id);
CREATE INDEX idx_workouts_mesocycle ON workouts(mesocycle_id);
CREATE INDEX idx_mesocycles_macrocycle ON mesocycles(macrocycle_id);
