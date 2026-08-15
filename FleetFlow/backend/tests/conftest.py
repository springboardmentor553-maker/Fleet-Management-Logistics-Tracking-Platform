import os

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.auth.hashing import hash_password


load_dotenv(".env.test")

TEST_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    TEST_DATABASE_URL
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


@pytest.fixture(scope="session", autouse=True)
def setup_database():

    Base.metadata.create_all(
        bind=engine
    )

    session = TestingSessionLocal()

    existing_admin = (
        session.query(User)
        .filter(
            User.email == "testadmin@example.com"
        )
        .first()
    )

    if not existing_admin:

        admin = User(
            username="testadmin",
            email="testadmin@example.com",
            password_hash=hash_password(
                "TestPassword123!"
            ),
            role="Admin"
        )

        session.add(admin)
        session.commit()

    session.close()

    yield

    Base.metadata.drop_all(
        bind=engine
    )


@pytest.fixture
def db():

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):

    def override_get_db():

        try:
            yield db
        finally:
            pass

    app.dependency_overrides[
        get_db
    ] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client):

    response = client.post(
        "/users/login",
        data={
            "username": "testadmin@example.com",
            "password": "TestPassword123!"
        }
    )

    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):

    return {
        "Authorization": f"Bearer {admin_token}"
    }


@pytest.fixture
def test_admin(db):

    return (
        db.query(User)
        .filter(
            User.email == "testadmin@example.com"
        )
        .first()
    )