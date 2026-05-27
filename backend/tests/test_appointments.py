"""Tests for /api/v1/appointments endpoints."""
from datetime import date, timedelta

from fastapi.testclient import TestClient


REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
APPOINTMENTS_URL = "/api/v1/appointments"
AVAILABLE_SLOTS_URL = "/api/v1/appointments/available-slots"


PATIENT_PAYLOAD = {
    "username": "patient_test",
    "password": "patientpass123",
    "full_name": "Patient Test",
}


def _get_token(client: TestClient, username: str, password: str) -> str:
    resp = client.post(LOGIN_URL, json={"username": username, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.json()}"
    return resp.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# GET /available-slots
# ---------------------------------------------------------------------------


def test_available_slots_returns_404_for_nonexistent_doctor(client: TestClient) -> None:
    """available-slots returns 404 when the requested doctor does not exist."""
    future_date = (date.today() + timedelta(days=7)).isoformat()
    resp = client.get(
        AVAILABLE_SLOTS_URL,
        params={"doctor_id": 9999, "service_id": 1, "date": future_date},
    )
    assert resp.status_code == 404


def test_available_slots_missing_params(client: TestClient) -> None:
    """Without required query params the endpoint should return 422."""
    resp = client.get(AVAILABLE_SLOTS_URL)
    assert resp.status_code == 422


def test_available_slots_invalid_date(client: TestClient) -> None:
    """Malformed date should result in 422 validation error."""
    resp = client.get(
        AVAILABLE_SLOTS_URL,
        params={"doctor_id": 1, "service_id": 1, "date": "not-a-date"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /appointments — authentication required
# ---------------------------------------------------------------------------


def test_book_appointment_without_auth_returns_401(client: TestClient) -> None:
    """Booking an appointment without a token must be rejected."""
    payload = {
        "doctor_id": 1,
        "service_id": 1,
        "starts_at": f"{(date.today() + timedelta(days=7)).isoformat()}T10:00:00",
    }
    resp = client.post(APPOINTMENTS_URL, json=payload)
    assert resp.status_code == 401


def test_list_appointments_without_auth_returns_401(client: TestClient) -> None:
    """Listing appointments without a token must be rejected."""
    resp = client.get(APPOINTMENTS_URL)
    assert resp.status_code == 401


def test_list_appointments_with_auth(client: TestClient) -> None:
    """An authenticated patient can list appointments (empty list for new account)."""
    client.post(REGISTER_URL, json=PATIENT_PAYLOAD)
    token = _get_token(client, PATIENT_PAYLOAD["username"], PATIENT_PAYLOAD["password"])
    resp = client.get(APPOINTMENTS_URL, headers=_auth_headers(token))
    # Either 200 with a list or some business-logic status — must not be 401/403
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_patient_me_appointments_with_auth(client: TestClient) -> None:
    """GET /appointments/patient/me returns 200 for a patient."""
    client.post(REGISTER_URL, json=PATIENT_PAYLOAD)
    token = _get_token(client, PATIENT_PAYLOAD["username"], PATIENT_PAYLOAD["password"])
    resp = client.get(f"{APPOINTMENTS_URL}/patient/me", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_patient_me_appointments_without_auth(client: TestClient) -> None:
    """GET /appointments/patient/me without token must return 401."""
    resp = client.get(f"{APPOINTMENTS_URL}/patient/me")
    assert resp.status_code == 401
