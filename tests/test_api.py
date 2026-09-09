import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_api_trains_list(client):
    response = client.get("/api/trains")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Check Vande Bharat is present
    train_numbers = [t["number"] for t in data]
    assert "22436" in train_numbers


def test_api_train_detail_forecast(client):
    response = client.get("/api/trains/22436")
    assert response.status_code == 200
    data = response.json()
    assert data["train"]["number"] == "22436"
    assert "forecast_stops" in data
    assert "summary" in data


def test_api_corridor_overview(client):
    response = client.get("/api/corridor")
    assert response.status_code == 200
    data = response.json()
    assert "stations" in data
    assert "sections" in data
    assert len(data["stations"]) >= 8


def test_api_tsr_log_and_update(client):
    # Test station master logging arrival
    payload = {
        "station_code": "CNB",
        "train_number": "12004",
        "event_type": "ARRIVAL",
        "platform": "PF-3",
        "line_number": "Line 3",
        "delay_at_event": 10.0,
        "recorded_by": "SM-CNB",
        "remarks": "Safe arrival on Platform 3"
    }
    response = client.post("/api/tsr/log", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "SUCCESS"
    assert res_data["updated_forecast"]["current_delay_minutes"] == 10.0


def test_api_string_chart(client):
    response = client.get("/api/controller/string-chart")
    assert response.status_code == 200
    lines = response.json()
    assert isinstance(lines, list)
    assert len(lines) > 0
    first_line = lines[0]
    assert "coordinates" in first_line
    assert len(first_line["coordinates"]) > 0


def test_api_simulation(client):
    payload = {
        "held_train_number": "12420",
        "hold_station_code": "ETW",
        "extra_hold_minutes": 15,
        "priority_override_train": "22436"
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["held_train"] == "12420"
    assert len(res["impacted_trains"]) == 2
    assert "RECOMMENDED DECISION" in res["dispatcher_recommendation"]


def test_frontend_static_served(client):
    # Test that root serves the single-page application
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "RailGati" in response.text or "root" in response.text

