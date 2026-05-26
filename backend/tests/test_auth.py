"""Tests for /api/v1/auth endpoints."""
import pytest
from fastapi.testclient import TestClient


REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
ME_URL = "/api/v1/auth/me"
CHANGE_PASSWORD_URL = "/api/v1/auth/change-password"


VALID_PAYLOAD = {
    "username": "testuser",
    "password": "securepass123",
    "full_name": "Test User",
    "phone": "+380501234567",
    "email": "test@example.com",
}


def _get_token(client: TestClient, username: str = "testuser", password: str = "securepass123") -> str:
    resp = client.post(LOGIN_URL, json={"username": username, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------


def test_register_success(client: TestClient) -> None:
    resp = client.post(REGISTER_URL, json=VALID_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "testuser"
    assert data["full_name"] == "Test User"
    assert data["role"] == "patient"
    assert data["is_active"] is True
    assert data["email"] == "test@example.com"
    assert data["phone"] == "+380501234567"
    assert "id" in data
    # password must never be returned
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_username(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    resp = client.post(REGISTER_URL, json=VALID_PAYLOAD)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"].lower()


def test_register_without_optional_fields(client: TestClient) -> None:
    payload = {"username": "minuser", "password": "pass1234", "full_name": "Min User"}
    resp = client.post(REGISTER_URL, json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["phone"] is None
    assert data["email"] is None


def test_register_invalid_phone(client: TestClient) -> None:
    payload = {**VALID_PAYLOAD, "username": "phonetest", "phone": "bad-phone"}
    resp = client.post(REGISTER_URL, json=payload)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


def test_login_success(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    resp = client.post(LOGIN_URL, json={"username": "testuser", "password": "securepass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    resp = client.post(LOGIN_URL, json={"username": "testuser", "password": "wrongpass"})
    assert resp.status_code == 401


def test_login_unknown_user(client: TestClient) -> None:
    resp = client.post(LOGIN_URL, json={"username": "nobody", "password": "anything"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /me
# ---------------------------------------------------------------------------


def test_get_me_authenticated(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    token = _get_token(client)
    resp = client.get(ME_URL, headers=_auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "testuser"
    assert data["role"] == "patient"


def test_get_me_unauthenticated(client: TestClient) -> None:
    resp = client.get(ME_URL)
    assert resp.status_code == 401


def test_get_me_invalid_token(client: TestClient) -> None:
    resp = client.get(ME_URL, headers={"Authorization": "Bearer not.a.valid.token"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# POST /change-password
# ---------------------------------------------------------------------------


def test_change_password_success(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    token = _get_token(client)
    resp = client.post(
        CHANGE_PASSWORD_URL,
        json={"current_password": "securepass123", "new_password": "newpassword456"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Пароль змінено успішно"

    # Old password should no longer work
    old_login = client.post(LOGIN_URL, json={"username": "testuser", "password": "securepass123"})
    assert old_login.status_code == 401

    # New password should work
    new_login = client.post(LOGIN_URL, json={"username": "testuser", "password": "newpassword456"})
    assert new_login.status_code == 200


def test_change_password_wrong_current(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    token = _get_token(client)
    resp = client.post(
        CHANGE_PASSWORD_URL,
        json={"current_password": "wrongcurrent", "new_password": "newpassword456"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 401


def test_change_password_unauthenticated(client: TestClient) -> None:
    resp = client.post(
        CHANGE_PASSWORD_URL,
        json={"current_password": "securepass123", "new_password": "newpassword456"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /me (update profile)
# ---------------------------------------------------------------------------


def test_update_profile_success(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    token = _get_token(client)
    resp = client.patch(
        ME_URL,
        json={"full_name": "Updated Name", "email": "updated@example.com"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Updated Name"
    assert data["email"] == "updated@example.com"
    # Phone should remain unchanged
    assert data["phone"] == "+380501234567"


def test_update_profile_partial(client: TestClient) -> None:
    client.post(REGISTER_URL, json=VALID_PAYLOAD)
    token = _get_token(client)
    resp = client.patch(
        ME_URL,
        json={"phone": "+380991112233"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    assert resp.json()["phone"] == "+380991112233"
    assert resp.json()["full_name"] == "Test User"


def test_update_profile_unauthenticated(client: TestClient) -> None:
    resp = client.patch(ME_URL, json={"full_name": "Hacker"})
    assert resp.status_code == 401
