import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_headers():
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "superadmin", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_academic_years_crud():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # List years
    res = client.get("/api/academic-years", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Create new year
    create_res = client.post(
        "/api/academic-years",
        json={
            "name": f"AY-{uid}",
            "start_date": "2029-08-01",
            "end_date": "2030-06-30",
            "is_active": False
        },
        headers=headers
    )
    assert create_res.status_code == 201
    ay_id = create_res.json()["id"]

    # Activate new year
    act_res = client.post(f"/api/academic-years/{ay_id}/activate", headers=headers)
    assert act_res.status_code == 200
    assert act_res.json()["is_active"] is True


def test_classes_and_sections_crud():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:4].upper()

    # List classes
    res = client.get("/api/classes", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Create section
    cls_id = res.json()[0]["id"]
    sec_res = client.post(
        "/api/sections",
        json={"name": f"SEC-{uid}", "class_id": cls_id},
        headers=headers
    )
    assert sec_res.status_code == 201
    assert sec_res.json()["name"] == f"SEC-{uid}"


def test_subjects_crud():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6].upper()

    res = client.get("/api/subjects", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Create subject
    subj_res = client.post(
        "/api/subjects",
        json={
            "name": f"Subject {uid}",
            "code": f"SUBJ-{uid}",
            "weekly_periods": 3,
            "description": "Test subject"
        },
        headers=headers
    )
    assert subj_res.status_code == 201
    assert subj_res.json()["code"] == f"SUBJ-{uid}"


def test_teachers_crud():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    res = client.get("/api/teachers", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    create_res = client.post(
        "/api/teachers",
        json={
            "first_name": "Test",
            "last_name": f"Teacher-{uid}",
            "email": f"teacher_{uid}@school.com",
            "username": f"teacher_{uid}",
            "employee_id": f"TCH-{uid}",
            "department": "Computer Science",
            "designation": "Professor",
            "salary": 75000.0
        },
        headers=headers
    )
    assert create_res.status_code == 201
    teacher_data = create_res.json()
    assert teacher_data["department"] == "Computer Science"


def test_students_and_parents_crud():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # Create parent
    p_res = client.post(
        "/api/parents",
        json={
            "first_name": "Parent",
            "last_name": f"Test-{uid}",
            "email": f"parent_{uid}@school.com",
            "username": f"parent_{uid}",
            "occupation": "Philanthropist",
            "relationship_type": "Mother"
        },
        headers=headers
    )
    assert p_res.status_code == 201
    parent_id = p_res.json()["id"]

    # Create student linked to parent
    s_res = client.post(
        "/api/students",
        json={
            "first_name": "Student",
            "last_name": f"Test-{uid}",
            "email": f"student_{uid}@school.com",
            "username": f"student_{uid}",
            "admission_number": f"ADM-{uid}",
            "parent_id": parent_id
        },
        headers=headers
    )
    assert s_res.status_code == 201
    student_data = s_res.json()
    assert student_data["parent_id"] == parent_id

    # Filter student list by search
    search_res = client.get(f"/api/students?search={uid}", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
