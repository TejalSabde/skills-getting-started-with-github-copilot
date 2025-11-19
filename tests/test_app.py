from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # ensure a known activity is present
    assert "Chess Club" in data


def test_signup_and_unregister_lifecycle():
    activity = "Chess Club"
    test_email = "testuser+pytest@example.com"

    # Ensure test_email is not present at start
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert test_email not in data[activity]["participants"]

    # Sign up the test user
    resp = client.post(f"/activities/{activity}/signup", params={"email": test_email})
    assert resp.status_code == 200
    json_data = resp.json()
    assert "Signed up" in json_data.get("message", "")

    # Verify in-memory activities structure was updated
    assert test_email in activities[activity]["participants"]

    # GET should reflect the new participant
    resp = client.get("/activities")
    data = resp.json()
    assert test_email in data[activity]["participants"]

    # Now unregister
    resp = client.delete(f"/activities/{activity}/unregister", params={"email": test_email})
    assert resp.status_code == 200
    json_data = resp.json()
    assert "Unregistered" in json_data.get("message", "")

    # Verify removal from in-memory data
    assert test_email not in activities[activity]["participants"]

    # GET should no longer show the participant
    resp = client.get("/activities")
    data = resp.json()
    assert test_email not in data[activity]["participants"]


def test_signup_duplicate_rejected():
    activity = "Chess Club"
    existing = activities[activity]["participants"][0]

    # Try signing up an existing participant and expect 400
    resp = client.post(f"/activities/{activity}/signup?email={existing}")
    assert resp.status_code == 400
    data = resp.json()
    assert data.get("detail") == "Student already signed up for this activity"
