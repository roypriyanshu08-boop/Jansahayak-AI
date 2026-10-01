import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_1_login_empty_fields():
    res = client.post("/api/v1/auth/login", json={"email": "", "password": ""})
    assert res.status_code in [400, 422]
    assert "access_token" not in res.json()

def test_2_login_invalid_email_format():
    res = client.post("/api/v1/auth/login", json={"email": "invalid-email-format", "password": "password123"})
    assert res.status_code in [400, 401]
    assert "access_token" not in res.json()

def test_3_login_email_no_password():
    res = client.post("/api/v1/auth/login", json={"email": "citizen@jansahayak.gov.in", "password": ""})
    assert res.status_code in [400, 422]
    assert "access_token" not in res.json()

def test_4_login_wrong_credentials():
    res = client.post("/api/v1/auth/login", json={"email": "nonexistent@example.com", "password": "wrongpassword"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password."

def test_5_register_new_citizen():
    import uuid
    email = f"citizen_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Jane Citizen",
        "email": email,
        "phone": "9876543210",
        "password": "securepassword123",
        "role": "citizen"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == email
    assert data["name"] == "Jane Citizen"
    assert "password" not in data

def test_5_duplicate_email_registration_fails():
    import uuid
    email = f"citizen_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "First Citizen",
        "email": email,
        "phone": "9876543210",
        "password": "securepassword123",
        "role": "citizen"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert res2.json()["detail"] == "An account with this email already exists."

def test_6_logout_and_unauthorized_access():
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_token_xyz"})
    assert res.status_code == 401

def test_7_login_newly_registered_account():
    import uuid
    email = f"newuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "mysecretpassword"
    client.post("/api/v1/auth/register", json={
        "name": "New User",
        "email": email,
        "phone": "9876543210",
        "password": password,
        "role": "citizen"
    })

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    assert login_res.json()["user"]["email"] == email

def test_8_session_persistence_me_endpoint():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@jansahayak.gov.in", "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "citizen@jansahayak.gov.in"

def test_9_rbac_citizen_access_to_admin_route_fails():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@jansahayak.gov.in", "password": "password123"})
    token = login_res.json()["access_token"]

    admin_res = client.get("/api/v1/admin/officers", headers={"Authorization": f"Bearer {token}"})
    assert admin_res.status_code in [401, 403]

def test_15_submit_complaint_with_photo():
    login_res = client.post("/api/v1/auth/login", json={"email": "citizen@jansahayak.gov.in", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    complaint_payload = {
        "title": "Severe Pothole on Main Road",
        "description": "Deep gaddha causing severe traffic congestion and accidents.",
        "category": "Roads & Transport",
        "address": "Sector 14, New Delhi",
        "image_url": "http://localhost:8000/uploads/test_photo.jpg",
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    comp_res = client.post("/api/v1/complaints/", json=complaint_payload, headers=headers)
    assert comp_res.status_code == 201
    comp_data = comp_res.json()
    assert comp_data["title"] == complaint_payload["title"]
    assert comp_data["image_url"] == complaint_payload["image_url"]
