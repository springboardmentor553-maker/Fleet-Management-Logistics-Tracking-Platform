from tests.conftest import login_as_admin


def test_login_rejects_unknown_email(client, db_session):
    response = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever"})
    assert response.status_code == 401


def test_login_succeeds_for_seeded_admin(client, db_session):
    token = login_as_admin(client, db_session)
    assert token

    me = client.get("/api/v1/accounts/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["role"] == "admin"


def test_protected_route_without_token_is_rejected(client, db_session):
    response = client.get("/api/v1/accounts/me")
    assert response.status_code == 401


def test_non_admin_cannot_create_accounts(client, db_session):
    from app.core.security import hash_password
    from app.modules.accounts.models import Account
    from app.common.enums import AccountRole

    dispatcher = Account(
        full_name="Dispatch One",
        email="dispatch@example.com",
        hashed_password=hash_password("Dispatch123!"),
        role=AccountRole.DISPATCHER,
    )
    db_session.add(dispatcher)
    db_session.commit()

    login = client.post("/api/v1/auth/login", json={"email": "dispatch@example.com", "password": "Dispatch123!"})
    token = login.json()["access_token"]

    response = client.post(
        "/api/v1/accounts",
        json={"full_name": "New Person", "email": "new@example.com", "password": "Whatever123!", "role": "driver"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403