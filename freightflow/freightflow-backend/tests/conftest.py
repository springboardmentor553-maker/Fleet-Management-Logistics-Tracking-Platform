import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Import every module's models so Base.metadata is fully populated before create_all
from app.modules.accounts import models as _accounts_models  # noqa: F401
from app.modules.drivers import models as _drivers_models  # noqa: F401
from app.modules.fleet import models as _fleet_models  # noqa: F401
from app.modules.maintenance import models as _maintenance_models  # noqa: F401
from app.modules.notifications import models as _notifications_models  # noqa: F401
from app.modules.routes_ops import models as _routes_models  # noqa: F401
from app.modules.shipments import models as _shipments_models  # noqa: F401
from app.modules.tracking import models as _tracking_models  # noqa: F401


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def login_as_admin(client, db_session):
    from app.core.security import hash_password
    from app.common.enums import AccountRole
    from app.modules.accounts.models import Account

    admin = Account(
        full_name="Test Admin",
        email="admin@test.local",
        hashed_password=hash_password("AdminPass123!"),
        role=AccountRole.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post("/api/v1/auth/login", json={"email": "admin@test.local", "password": "AdminPass123!"})
    assert response.status_code == 200
    return response.json()["access_token"]
