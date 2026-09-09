import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ROLES_USERS = [
    ("superadmin", "password123", "Super Admin"),
    ("schooladmin", "password123", "School Admin"),
    ("principal", "password123", "Principal"),
    ("teacher", "password123", "Teacher"),
    ("accountant", "password123", "Accountant"),
    ("librarian", "password123", "Librarian"),
    ("parent", "password123", "Parent"),
    ("student", "password123", "Student"),
]

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.parametrize("username,password,role_name", ROLES_USERS)
def test_login_all_roles(username, password, role_name):
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": username, "password": password}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == role_name

def test_login_invalid_password():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "superadmin", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]

def test_get_me_endpoint():
    # Login as Super Admin first
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "superadmin", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    user_info = me_res.json()
    assert user_info["username"] == "superadmin"
    assert user_info["role"]["name"] == "Super Admin"

def test_protected_route_role_permission():
    # Student login
    student_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "student", "password": "password123"}
    )
    student_token = student_login.json()["access_token"]
    
    # Try accessing admin-only endpoint /api/users
    users_res = client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert users_res.status_code == 403

    # Super Admin login
    admin_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "superadmin", "password": "password123"}
    )
    admin_token = admin_login.json()["access_token"]

    admin_users_res = client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_users_res.status_code == 200
    assert len(admin_users_res.json()) >= 8
