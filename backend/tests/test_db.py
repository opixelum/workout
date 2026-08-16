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
