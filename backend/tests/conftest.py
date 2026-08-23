import os

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://user:password@localhost:5432/workout_test",
)

import pytest
from sqlalchemy import text

from workout.database import Base, SessionLocal, engine


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    table_names = ", ".join(f'"{table.name}"' for table in Base.metadata.sorted_tables)
    if table_names:
        with engine.begin() as conn:
            conn.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
