from workout import crud, schemas


def _create_user(db_session, email: str) -> int:
    user = crud.create_user(
        db_session,
        schemas.UserCreate(email=email, password="password", bodyweight=80.0),
    )
    return user.id


def _create_macrocycle(db_session, user_id: int, name: str = "Test Macrocycle") -> int:
    macrocycle = crud.create_macrocycle(
        db_session,
        schemas.MacrocycleCreate(name=name, user_id=user_id),
    )
    return macrocycle.id


def _create_mesocycle(
    db_session, macrocycle_id: int, name: str = "Test Mesocycle"
) -> int:
    mesocycle = crud.create_mesocycle(
        db_session,
        schemas.MesocycleCreate(name=name, macrocycle_id=macrocycle_id),
    )
    return mesocycle.id


def _create_workout(
    db_session,
    user_id: int,
    mesocycle_id: int | None = None,
    name: str = "Test Workout",
) -> int:
    workout = crud.create_workout(
        db_session,
        schemas.WorkoutCreate(name=name, user_id=user_id, mesocycle_id=mesocycle_id),
    )
    return workout.id


def _create_exercise(
    db_session,
    user_id: int,
    name: str = "Test Exercise",
    type_: schemas.ExerciseType = schemas.ExerciseType.REPS,
) -> int:
    exercise = crud.create_exercise(
        db_session,
        schemas.ExerciseCreate(
            name=name,
            user_id=user_id,
            type=type_,
            equipment=schemas.Equipment.BODYWEIGHT,
        ),
    )
    return exercise.id


def test_user_lifecycle(db_session):
    email = "test@example.com"
    password = "password"
    bodyweight = 80.0
    new_email = "new_test@example.com"
    new_password = "new_password"
    new_bodyweight = 82.5

    # Create user
    user_in = schemas.UserCreate(email=email, password=password, bodyweight=bodyweight)
    crud.create_user(db_session, user_in)

    # Get user by email
    user = crud.get_user_by_email(db_session, email)
    assert user is not None
    assert user.id is not None
    assert user.email == email
    assert user.password == password
    assert user.bodyweight == bodyweight

    # Get user by id
    user_id = user.id
    user = crud.get_user(db_session, user_id)
    assert user is not None
    assert user.id == user_id
    assert user.email == email
    assert user.password == password
    assert user.bodyweight == bodyweight

    # Update user
    user_in = schemas.UserUpdate(
        email=new_email, password=new_password, bodyweight=new_bodyweight
    )
    crud.update_user(db_session, user_id, user_in)
    updated_user = crud.get_user_by_email(db_session, new_email)
    assert updated_user is not None
    assert updated_user.id == user_id
    assert updated_user.email == new_email
    assert updated_user.password == new_password
    assert updated_user.bodyweight == new_bodyweight

    # Delete user
    crud.delete_user(db_session, user_id)
    user = crud.get_user(db_session, user_id)
    assert user is None

    db_session.close()


def test_macrocycle_lifecycle(db_session):
    # Create user (required for macrocycle)
    user_in = schemas.UserCreate(
        email="macrocycle_test@example.com", password="password", bodyweight=80.0
    )
    user = crud.create_user(db_session, user_in)
    user_id = user.id

    name = "Test Macrocycle"
    description = "A test macrocycle"
    nb_mesocycles = 4
    new_name = "Updated Macrocycle"
    new_description = "An updated test macrocycle"
    new_nb_mesocycles = 6

    # Create macrocycle
    macrocycle_in = schemas.MacrocycleCreate(
        name=name,
        user_id=user_id,
        description=description,
        nb_mesocycles=nb_mesocycles,
    )
    crud.create_macrocycle(db_session, macrocycle_in)

    # Get macrocycles by user id
    macrocycles = crud.get_macrocycles(db_session, user_id=user_id)
    assert len(macrocycles) == 1
    macrocycle = macrocycles[0]
    assert macrocycle.id is not None
    assert macrocycle.user_id == user_id
    assert macrocycle.name == name
    assert macrocycle.description == description
    assert macrocycle.nb_mesocycles == nb_mesocycles
    assert macrocycle.creation_date is not None

    # Get macrocycle by id
    macrocycle_id = macrocycle.id
    macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert macrocycle is not None
    assert macrocycle.id == macrocycle_id
    assert macrocycle.user_id == user_id
    assert macrocycle.name == name
    assert macrocycle.description == description
    assert macrocycle.nb_mesocycles == nb_mesocycles

    # Update macrocycle
    macrocycle_in = schemas.MacrocycleUpdate(
        name=new_name, description=new_description, nb_mesocycles=new_nb_mesocycles
    )
    crud.update_macrocycle(db_session, macrocycle_id, macrocycle_in)
    updated_macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert updated_macrocycle is not None
    assert updated_macrocycle.id == macrocycle_id
    assert updated_macrocycle.name == new_name
    assert updated_macrocycle.description == new_description
    assert updated_macrocycle.nb_mesocycles == new_nb_mesocycles

    # Delete macrocycle
    crud.delete_macrocycle(db_session, macrocycle_id)
    macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert macrocycle is None

    db_session.close()


def test_mesocycle_lifecycle(db_session):
    user_id = _create_user(db_session, "mesocycle_test@example.com")
    macrocycle_id = _create_macrocycle(db_session, user_id)
    new_macrocycle_id = _create_macrocycle(db_session, user_id)

    name = "Test Mesocycle"
    description = "A test mesocycle"
    new_name = "Updated Mesocycle"
    new_description = "An updated test mesocycle"

    # Create mesocycle
    mesocycle_in = schemas.MesocycleCreate(
        name=name,
        macrocycle_id=macrocycle_id,
        description=description,
    )
    crud.create_mesocycle(db_session, mesocycle_in)

    # Get mesocycles by macrocycle id
    mesocycles = crud.get_mesocycles(db_session, macrocycle_id=macrocycle_id)
    assert len(mesocycles) == 1
    mesocycle = mesocycles[0]
    assert mesocycle.id is not None
    assert mesocycle.macrocycle_id == macrocycle_id
    assert mesocycle.name == name
    assert mesocycle.description == description
    assert mesocycle.creation_date is not None

    # Get mesocycle by id
    mesocycle_id = mesocycle.id
    mesocycle = crud.get_mesocycle(db_session, mesocycle_id)
    assert mesocycle is not None
    assert mesocycle.id == mesocycle_id
    assert mesocycle.macrocycle_id == macrocycle_id
    assert mesocycle.name == name
    assert mesocycle.description == description

    # Update mesocycle
    mesocycle_in = schemas.MesocycleUpdate(
        name=new_name, description=new_description, macrocycle_id=new_macrocycle_id
    )
    crud.update_mesocycle(db_session, mesocycle_id, mesocycle_in)
    updated_mesocycle = crud.get_mesocycle(db_session, mesocycle_id)
    assert updated_mesocycle is not None
    assert updated_mesocycle.name == new_name
    assert updated_mesocycle.description == new_description
    assert updated_mesocycle.macrocycle_id == new_macrocycle_id

    # Delete mesocycle
    crud.delete_mesocycle(db_session, mesocycle_id)
    mesocycle = crud.get_mesocycle(db_session, mesocycle_id)
    assert mesocycle is None

    db_session.close()


def test_workout_lifecycle(db_session):
    user_id = _create_user(db_session, "workout_test@example.com")
    macrocycle_id = _create_macrocycle(db_session, user_id)
    mesocycle_id = _create_mesocycle(db_session, macrocycle_id)
    new_mesocycle_id = _create_mesocycle(db_session, macrocycle_id)

    name = "Test Workout"
    description = "A test workout"
    planned = True
    new_name = "Updated Workout"
    new_description = "An updated test workout"
    new_planned = False

    # Create workout
    workout_in = schemas.WorkoutCreate(
        name=name,
        user_id=user_id,
        mesocycle_id=mesocycle_id,
        description=description,
        planned=planned,
    )
    crud.create_workout(db_session, workout_in)

    # Get workouts by user id
    workouts = crud.get_workouts(db_session, user_id=user_id)
    assert len(workouts) == 1
    workout = workouts[0]
    assert workout.id is not None
    assert workout.user_id == user_id
    assert workout.mesocycle_id == mesocycle_id
    assert workout.name == name
    assert workout.description == description
    assert workout.planned == planned
    assert workout.creation_date is not None

    # Get workouts by mesocycle id
    workouts = crud.get_workouts(db_session, mesocycle_id=mesocycle_id)
    assert len(workouts) == 1
    assert workouts[0].id == workout.id

    # Get workout by id
    workout_id = workout.id
    workout = crud.get_workout(db_session, workout_id)
    assert workout is not None
    assert workout.id == workout_id
    assert workout.user_id == user_id
    assert workout.mesocycle_id == mesocycle_id
    assert workout.name == name
    assert workout.description == description
    assert workout.planned == planned

    # Update workout
    workout_in = schemas.WorkoutUpdate(
        name=new_name,
        description=new_description,
        planned=new_planned,
        mesocycle_id=new_mesocycle_id,
    )
    crud.update_workout(db_session, workout_id, workout_in)
    updated_workout = crud.get_workout(db_session, workout_id)
    assert updated_workout is not None
    assert updated_workout.name == new_name
    assert updated_workout.description == new_description
    assert updated_workout.planned == new_planned
    assert updated_workout.mesocycle_id == new_mesocycle_id

    # Delete workout
    crud.delete_workout(db_session, workout_id)
    workout = crud.get_workout(db_session, workout_id)
    assert workout is None

    db_session.close()


def test_exercise_lifecycle(db_session):
    user_id = _create_user(db_session, "exercise_test@example.com")

    name = "Test Exercise"
    description = "A test exercise"
    type_ = schemas.ExerciseType.REPS
    new_name = "Updated Exercise"
    new_description = "An updated test exercise"
    new_type = schemas.ExerciseType.DURATION

    # Create exercise
    exercise_in = schemas.ExerciseCreate(
        name=name,
        user_id=user_id,
        description=description,
        type=type_,
        equipment=schemas.Equipment.BODYWEIGHT,
    )
    crud.create_exercise(db_session, exercise_in)

    # Get exercises by user id
    exercises = crud.get_exercises(db_session, user_id=user_id)
    assert len(exercises) == 1
    exercise = exercises[0]
    assert exercise.id is not None
    assert exercise.user_id == user_id
    assert exercise.name == name
    assert exercise.description == description
    assert exercise.type == type_.value

    # Get exercise by id
    exercise_id = exercise.id
    exercise = crud.get_exercise(db_session, exercise_id)
    assert exercise is not None
    assert exercise.id == exercise_id
    assert exercise.user_id == user_id
    assert exercise.name == name
    assert exercise.description == description
    assert exercise.type == type_.value

    # Update exercise
    exercise_in = schemas.ExerciseUpdate(
        name=new_name, description=new_description, type=new_type
    )
    crud.update_exercise(db_session, exercise_id, exercise_in)
    updated_exercise = crud.get_exercise(db_session, exercise_id)
    assert updated_exercise is not None
    assert updated_exercise.name == new_name
    assert updated_exercise.description == new_description
    assert updated_exercise.type == new_type.value

    # Delete exercise
    crud.delete_exercise(db_session, exercise_id)
    exercise = crud.get_exercise(db_session, exercise_id)
    assert exercise is None

    db_session.close()


def test_set_lifecycle(db_session):
    user_id = _create_user(db_session, "set_test@example.com")
    macrocycle_id = _create_macrocycle(db_session, user_id)
    mesocycle_id = _create_mesocycle(db_session, macrocycle_id)
    workout_id = _create_workout(db_session, user_id, mesocycle_id)
    exercise_id = _create_exercise(db_session, user_id)
    new_workout_id = _create_workout(db_session, user_id, mesocycle_id)
    new_exercise_id = _create_exercise(db_session, user_id, "New test exercise")

    type_ = schemas.SetType.WORKSET
    weight = 100.0
    rpe = 8.5
    rest = 120
    new_type = schemas.SetType.WARMUP
    new_weight = 80.0
    new_rpe = 7.0
    new_rest = 90

    # Create set
    set_in = schemas.SetCreate(
        type_=type_,
        weight=weight,
        rpe=rpe,
        rest=rest,
        workout_id=workout_id,
        exercise_id=exercise_id,
    )
    crud.create_set(db_session, set_in)

    # Get sets by workout id
    sets = crud.get_sets(db_session, workout_id=workout_id)
    assert len(sets) == 1
    set_ = sets[0]
    assert set_.id is not None
    assert set_.workout_id == workout_id
    assert set_.exercise_id == exercise_id
    assert set_.type_ == type_.value
    assert set_.weight == weight
    assert set_.rpe == rpe
    assert set_.rest == rest

    # Get sets by exercise id
    sets = crud.get_sets(db_session, exercise_id=exercise_id)
    assert len(sets) == 1
    assert sets[0].id == set_.id

    # Get set by id
    set_id = set_.id
    set_ = crud.get_set(db_session, set_id)
    assert set_ is not None
    assert set_.id == set_id

    # Update set
    set_in = schemas.SetUpdate(
        type_=new_type,
        weight=new_weight,
        rpe=new_rpe,
        rest=new_rest,
        workout_id=new_workout_id,
        exercise_id=new_exercise_id,
    )
    crud.update_set(db_session, set_id, set_in)
    updated_set = crud.get_set(db_session, set_id)
    assert updated_set is not None
    assert updated_set.type_ == new_type.value
    assert updated_set.weight == new_weight
    assert updated_set.rpe == new_rpe
    assert updated_set.rest == new_rest
    assert updated_set.workout_id == new_workout_id
    assert updated_set.exercise_id == new_exercise_id

    # Delete set
    crud.delete_set(db_session, set_id)
    set_ = crud.get_set(db_session, set_id)
    assert set_ is None

    db_session.close()


def test_rep_set_lifecycle(db_session):
    user_id = _create_user(db_session, "rep_set_test@example.com")
    macrocycle_id = _create_macrocycle(db_session, user_id)
    mesocycle_id = _create_mesocycle(db_session, macrocycle_id)
    workout_id = _create_workout(db_session, user_id, mesocycle_id)
    exercise_id = _create_exercise(db_session, user_id)

    type_ = schemas.SetType.WORKSET
    weight = 100.0
    rpe = 9.0
    rest = 120
    reps = 8
    new_type = schemas.SetType.WARMUP
    new_weight = 60.0
    new_rpe = 7.5
    new_rest = 60
    new_reps = 12

    # Create rep set
    rep_set_in = schemas.RepSetCreate(
        type_=type_,
        weight=weight,
        rpe=rpe,
        rest=rest,
        reps=reps,
        workout_id=workout_id,
        exercise_id=exercise_id,
    )
    crud.create_rep_set(db_session, rep_set_in)

    # Get rep sets
    rep_sets = crud.get_rep_sets(db_session)
    assert len(rep_sets) == 1
    rep_set = rep_sets[0]
    assert rep_set.id is not None
    assert rep_set.set_id is not None
    assert rep_set.reps == reps
    assert rep_set.workout_id == workout_id
    assert rep_set.exercise_id == exercise_id
    assert rep_set.type_ == type_.value
    assert rep_set.weight == weight
    assert rep_set.rpe == rpe
    assert rep_set.rest == rest

    # Get rep set by id
    rep_set_id = rep_set.id
    rep_set = crud.get_rep_set(db_session, rep_set_id)
    assert rep_set is not None
    assert rep_set.id == rep_set_id

    # Update rep set
    rep_set_in = schemas.RepSetUpdate(
        type_=new_type,
        weight=new_weight,
        rpe=new_rpe,
        rest=new_rest,
        reps=new_reps,
    )
    crud.update_rep_set(db_session, rep_set_id, rep_set_in)
    updated_rep_set = crud.get_rep_set(db_session, rep_set_id)
    assert updated_rep_set is not None
    assert updated_rep_set.type_ == new_type.value
    assert updated_rep_set.weight == new_weight
    assert updated_rep_set.rpe == new_rpe
    assert updated_rep_set.rest == new_rest
    assert updated_rep_set.reps == new_reps

    # Delete rep set
    crud.delete_rep_set(db_session, rep_set_id)
    rep_set = crud.get_rep_set(db_session, rep_set_id)
    assert rep_set is None

    db_session.close()


def test_duration_set_lifecycle(db_session):
    user_id = _create_user(db_session, "duration_set_test@example.com")
    macrocycle_id = _create_macrocycle(db_session, user_id)
    mesocycle_id = _create_mesocycle(db_session, macrocycle_id)
    workout_id = _create_workout(db_session, user_id, mesocycle_id)
    exercise_id = _create_exercise(
        db_session, user_id, type_=schemas.ExerciseType.DURATION
    )

    type_ = schemas.SetType.WORKSET
    weight = 0.0
    rpe = 7.0
    rest = 60
    duration = 45
    new_type = schemas.SetType.WARMUP
    new_weight = 10.0
    new_rpe = 6.0
    new_rest = 30
    new_duration = 60

    # Create duration set
    duration_set_in = schemas.DurationSetCreate(
        type_=type_,
        weight=weight,
        rpe=rpe,
        rest=rest,
        duration=duration,
        workout_id=workout_id,
        exercise_id=exercise_id,
    )
    crud.create_duration_set(db_session, duration_set_in)

    # Get duration sets
    duration_sets = crud.get_duration_sets(db_session)
    assert len(duration_sets) == 1
    duration_set = duration_sets[0]
    assert duration_set.id is not None
    assert duration_set.set_id is not None
    assert duration_set.duration == duration
    assert duration_set.workout_id == workout_id
    assert duration_set.exercise_id == exercise_id
    assert duration_set.type_ == type_.value
    assert duration_set.weight == weight
    assert duration_set.rpe == rpe
    assert duration_set.rest == rest

    # Get duration set by id
    duration_set_id = duration_set.id
    duration_set = crud.get_duration_set(db_session, duration_set_id)
    assert duration_set is not None
    assert duration_set.id == duration_set_id

    # Update duration set
    duration_set_in = schemas.DurationSetUpdate(
        type_=new_type,
        weight=new_weight,
        rpe=new_rpe,
        rest=new_rest,
        duration=new_duration,
    )
    crud.update_duration_set(db_session, duration_set_id, duration_set_in)
    updated_duration_set = crud.get_duration_set(db_session, duration_set_id)
    assert updated_duration_set is not None
    assert updated_duration_set.type_ == new_type.value
    assert updated_duration_set.weight == new_weight
    assert updated_duration_set.rpe == new_rpe
    assert updated_duration_set.rest == new_rest
    assert updated_duration_set.duration == new_duration

    # Delete duration set
    crud.delete_duration_set(db_session, duration_set_id)
    duration_set = crud.get_duration_set(db_session, duration_set_id)
    assert duration_set is None

    db_session.close()
