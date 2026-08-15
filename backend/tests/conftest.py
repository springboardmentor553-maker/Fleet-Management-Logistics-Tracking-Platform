import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Override environment variable for testing
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/fleetflow_test_db"
os.environ["SECRET_KEY"] = "test_secret_key"

from app.database import Base, get_db
from app.main import app

# We might need sqlalchemy_utils, let's just use raw sqlalchemy to drop/create
TEST_DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    from sqlalchemy_utils import database_exists, create_database, drop_database
    # Setup
    if database_exists(TEST_DATABASE_URL):
        drop_database(TEST_DATABASE_URL)
    create_database(TEST_DATABASE_URL)
    
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown
    engine.dispose()
    from app.database import engine as app_engine
    app_engine.dispose()

    # Force close any remaining connections to the test database
    from sqlalchemy import create_engine as create_sa_engine, text
    admin_url = TEST_DATABASE_URL.replace("fleetflow_test_db", "postgres")
    admin_engine = create_sa_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            conn.execute(text("""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = 'fleetflow_test_db'
                  AND pid <> pg_backend_pid()
            """))
    except Exception as e:
        print(f"Warning: Failed to terminate connections: {e}")
    finally:
        admin_engine.dispose()

    drop_database(TEST_DATABASE_URL)
@pytest.fixture(scope="function")
def db_session():
    """Returns an sqlalchemy session, and after the test tears down everything properly."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    from fastapi.testclient import TestClient
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch):
    from app.services.geocoding_service import GeocodingService
    from app.services.route_service import RouteService
    
    def mock_geocode(address):
        return (40.7128, -74.0060)
        
    def mock_get_route(origin_lat, origin_lng, dest_lat, dest_lng):
        return {
            "distance_km": 100.0,
            "estimated_duration": "2 Hours",
            "route_summary": "Test Route",
            "route_geometry": [[origin_lat, origin_lng], [dest_lat, dest_lng]]
        }
        
    monkeypatch.setattr(GeocodingService, "geocode", mock_geocode)
    monkeypatch.setattr(RouteService, "get_route", mock_get_route)

from app.models.user import User, UserRole
from app.utils.auth import create_access_token

def _create_user_token(db_session, email, role):
    user = db_session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password="hashed_password",
            role=role,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
    return create_access_token(subject=user.email)

@pytest.fixture(scope="function")
def admin_token(db_session):
    return _create_user_token(db_session, "admin@example.com", UserRole.ADMIN)

@pytest.fixture(scope="function")
def manager_token(db_session):
    return _create_user_token(db_session, "manager@example.com", UserRole.MANAGER)

@pytest.fixture(scope="function")
def dispatcher_token(db_session):
    return _create_user_token(db_session, "dispatcher@example.com", UserRole.DISPATCHER)

@pytest.fixture(scope="function")
def driver_token(db_session):
    return _create_user_token(db_session, "driver@example.com", UserRole.DRIVER)
