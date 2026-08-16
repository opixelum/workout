from workout import crud, schemas


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

    # Update email address
    user_in = schemas.UserUpdate(email=new_email)
    crud.update_user(db_session, user_id, user_in)
    updated_user = crud.get_user_by_email(db_session, new_email)
    assert updated_user is not None
    assert updated_user.id == user_id
    assert updated_user.email == new_email
    assert updated_user.password == password
    assert updated_user.bodyweight == bodyweight

    # Update password
    user_in = schemas.UserUpdate(password=new_password)
    crud.update_user(db_session, user_id, user_in)
    updated_user = crud.get_user(db_session, user_id)
    assert updated_user is not None
    assert updated_user.id == user_id
    assert updated_user.email == new_email
    assert updated_user.password == new_password
    assert updated_user.bodyweight == bodyweight

    # Update bodyweight
    user_in = schemas.UserUpdate(bodyweight=new_bodyweight)
    crud.update_user(db_session, user_id, user_in)
    updated_user = crud.get_user(db_session, user_id)
    assert updated_user is not None
    assert updated_user.id == user_id
    assert updated_user.email == new_email
    assert updated_user.password == new_password
    assert updated_user.bodyweight == new_bodyweight

    # Update everything
    user_in = schemas.UserUpdate(email=email, password=password, bodyweight=bodyweight)
    crud.update_user(db_session, user_id, user_in)
    updated_user = crud.get_user_by_email(db_session, email)
    assert updated_user is not None
    assert updated_user.id == user_id
    assert updated_user.email == email
    assert updated_user.password == password
    assert updated_user.bodyweight == bodyweight

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

    # Update name
    macrocycle_in = schemas.MacrocycleUpdate(name=new_name)
    crud.update_macrocycle(db_session, macrocycle_id, macrocycle_in)
    updated_macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert updated_macrocycle is not None
    assert updated_macrocycle.id == macrocycle_id
    assert updated_macrocycle.name == new_name
    assert updated_macrocycle.description == description
    assert updated_macrocycle.nb_mesocycles == nb_mesocycles

    # Update description
    macrocycle_in = schemas.MacrocycleUpdate(description=new_description)
    crud.update_macrocycle(db_session, macrocycle_id, macrocycle_in)
    updated_macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert updated_macrocycle is not None
    assert updated_macrocycle.id == macrocycle_id
    assert updated_macrocycle.name == new_name
    assert updated_macrocycle.description == new_description
    assert updated_macrocycle.nb_mesocycles == nb_mesocycles

    # Update nb_mesocycles
    macrocycle_in = schemas.MacrocycleUpdate(nb_mesocycles=new_nb_mesocycles)
    crud.update_macrocycle(db_session, macrocycle_id, macrocycle_in)
    updated_macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert updated_macrocycle is not None
    assert updated_macrocycle.id == macrocycle_id
    assert updated_macrocycle.name == new_name
    assert updated_macrocycle.description == new_description
    assert updated_macrocycle.nb_mesocycles == new_nb_mesocycles

    # Update everything
    macrocycle_in = schemas.MacrocycleUpdate(
        name=name, description=description, nb_mesocycles=nb_mesocycles
    )
    crud.update_macrocycle(db_session, macrocycle_id, macrocycle_in)
    updated_macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert updated_macrocycle is not None
    assert updated_macrocycle.id == macrocycle_id
    assert updated_macrocycle.name == name
    assert updated_macrocycle.description == description
    assert updated_macrocycle.nb_mesocycles == nb_mesocycles

    # Delete macrocycle
    crud.delete_macrocycle(db_session, macrocycle_id)
    macrocycle = crud.get_macrocycle(db_session, macrocycle_id)
    assert macrocycle is None

    crud.delete_user(db_session, user_id)
    db_session.close()
