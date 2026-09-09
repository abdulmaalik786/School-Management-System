import pytest
import uuid
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_headers_for(username: str):
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": username, "password": "password123"}
    )
    assert res.status_code == 200, f"Failed to login with {username}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_dashboard_stats_all_roles():
    # 1. Super Admin Dashboard Stats
    admin_headers = get_headers_for("superadmin")
    admin_dash = client.get("/api/dashboard/stats", headers=admin_headers)
    assert admin_dash.status_code == 200
    d_data = admin_dash.json()
    assert d_data["role"] == "Super Admin"
    assert "total_students" in d_data
    assert "total_teachers" in d_data
    assert "total_classes" in d_data
    assert "attendance_trends" in d_data
    assert "monthly_fee_collection" in d_data

    # 2. Teacher Dashboard Stats
    teacher_headers = get_headers_for("teacher")
    t_dash = client.get("/api/dashboard/stats", headers=teacher_headers)
    assert t_dash.status_code == 200
    assert t_dash.json()["role"] == "Teacher"

    # 3. Student Dashboard Stats
    student_headers = get_headers_for("student")
    s_dash = client.get("/api/dashboard/stats", headers=student_headers)
    assert s_dash.status_code == 200
    assert s_dash.json()["role"] == "Student"

    # 4. Parent Dashboard Stats
    parent_headers = get_headers_for("parent")
    p_dash = client.get("/api/dashboard/stats", headers=parent_headers)
    assert p_dash.status_code == 200
    assert p_dash.json()["role"] == "Parent"

    # 5. Accountant Dashboard Stats
    accountant_headers = get_headers_for("accountant")
    acc_dash = client.get("/api/dashboard/stats", headers=accountant_headers)
    assert acc_dash.status_code == 200
    assert acc_dash.json()["role"] == "Accountant"
    assert "total_invoiced" in acc_dash.json()


def test_assignments_lifecycle():
    admin_headers = get_headers_for("superadmin")
    student_headers = get_headers_for("student")
    teacher_headers = get_headers_for("teacher")
    uid = uuid.uuid4().hex[:6]

    cls_res = client.post("/api/classes", json={"name": f"AssignClass-{uid}"}, headers=admin_headers)
    cls_id = cls_res.json()["id"]

    sub_res = client.post("/api/subjects", json={"name": f"Sci-{uid}", "code": f"SC-{uid}"}, headers=admin_headers)
    sub_id = sub_res.json()["id"]

    # 1. Create Assignment
    due = (date.today() + timedelta(days=5)).isoformat()
    assign_res = client.post(
        "/api/assignments",
        json={
            "title": f"Science Lab Report {uid}",
            "description": "Complete experiment analysis",
            "class_id": cls_id,
            "subject_id": sub_id,
            "due_date": due,
            "max_marks": 50.0
        },
        headers=teacher_headers
    )
    assert assign_res.status_code == 201
    assign_id = assign_res.json()["id"]

    # 2. Student Submits Assignment
    sub_submit = client.post(
        f"/api/assignments/{assign_id}/submit",
        json={
            "submission_text": "Here is my completed lab experiment conclusion.",
            "attachment_url": "https://school.edu/files/report.pdf"
        },
        headers=student_headers
    )
    assert sub_submit.status_code == 200
    sub_id_val = sub_submit.json()["id"]
    assert sub_submit.json()["status"] == "Submitted"

    # 3. Teacher Views Submissions
    sub_list = client.get(f"/api/assignments/{assign_id}/submissions", headers=teacher_headers)
    assert sub_list.status_code == 200
    assert len(sub_list.json()) >= 1

    # 4. Teacher Grades Submission
    grade_res = client.put(
        f"/api/assignments/submissions/{sub_id_val}/grade",
        json={
            "marks_obtained": 48.0,
            "feedback": "Outstanding work and accurate lab measurements!"
        },
        headers=teacher_headers
    )
    assert grade_res.status_code == 200
    assert grade_res.json()["status"] == "Graded"
    assert grade_res.json()["marks_obtained"] == 48.0


def test_library_management_lifecycle():
    admin_headers = get_headers_for("superadmin")
    student_headers = get_headers_for("student")
    uid = uuid.uuid4().hex[:6]

    # 1. Add Book to Library
    book_res = client.post(
        "/api/library/books",
        json={
            "title": f"Introduction to Algorithms {uid}",
            "author": "Cormen et al.",
            "isbn": f"ISBN-{uid}",
            "category": "Computer Science",
            "rack_number": "CS-04",
            "total_copies": 3
        },
        headers=admin_headers
    )
    assert book_res.status_code == 201
    book_id = book_res.json()["id"]
    assert book_res.json()["available_copies"] == 3

    # 2. Issue Book to Student
    stu_res = client.get("/api/students", headers=admin_headers)
    student_id = stu_res.json()[0]["id"]

    due = (date.today() + timedelta(days=14)).isoformat()
    issue_res = client.post(
        "/api/library/issues",
        json={
            "book_id": book_id,
            "student_id": student_id,
            "due_date": due,
            "remarks": "Standard 14-day borrowing"
        },
        headers=admin_headers
    )
    assert issue_res.status_code == 201
    issue_id = issue_res.json()["id"]

    # Verify available copies decremented to 2
    b_check = client.get(f"/api/library/books?search={uid}", headers=admin_headers)
    assert b_check.json()[0]["available_copies"] == 2

    # 3. Return Book with Late Fine $5.00
    ret_res = client.put(
        f"/api/library/issues/{issue_id}/return",
        json={"fine_amount": 5.0, "remarks": "Returned with minor late fee paid"},
        headers=admin_headers
    )
    assert ret_res.status_code == 200
    assert ret_res.json()["status"] == "Returned"
    assert ret_res.json()["fine_amount"] == 5.0

    # Verify available copies restored to 3
    b_check2 = client.get(f"/api/library/books?search={uid}", headers=admin_headers)
    assert b_check2.json()[0]["available_copies"] == 3


def test_transport_and_events_announcements():
    admin_headers = get_headers_for("superadmin")
    student_headers = get_headers_for("student")
    uid = uuid.uuid4().hex[:6]

    # 1. Add Vehicle
    veh_res = client.post(
        "/api/transport/vehicles",
        json={
            "vehicle_number": f"BUS-{uid}",
            "model": "Toyota Coaster",
            "capacity": 32,
            "driver_name": "Tariq Mahmood",
            "driver_phone": "+1 555 0192"
        },
        headers=admin_headers
    )
    assert veh_res.status_code == 201
    veh_id = veh_res.json()["id"]

    # 2. Add Route & Stops
    route_res = client.post(
        "/api/transport/routes",
        json={
            "route_name": f"Route Blue {uid}",
            "start_point": "Downtown",
            "end_point": "School Campus",
            "vehicle_id": veh_id,
            "fare_amount": 2500.0,
            "stops": [
                {"stop_name": "Main Square", "pickup_time": "07:15 AM", "drop_time": "02:45 PM", "stop_fee": 2000.0},
                {"stop_name": "Green Park", "pickup_time": "07:30 AM", "drop_time": "02:30 PM", "stop_fee": 2500.0}
            ]
        },
        headers=admin_headers
    )
    assert route_res.status_code == 201
    route_id = route_res.json()["id"]
    assert len(route_res.json()["stops"]) == 2

    # 3. Create Event
    ev_res = client.post(
        "/api/events",
        json={
            "title": f"Annual Sports Gala {uid}",
            "description": "Inter-house athletics competitions",
            "event_type": "Sports Day",
            "start_date": (date.today() + timedelta(days=10)).isoformat(),
            "end_date": (date.today() + timedelta(days=11)).isoformat(),
            "location": "School Sports Complex",
            "audience": "All"
        },
        headers=admin_headers
    )
    assert ev_res.status_code == 201

    # 4. Create Announcement
    ann_res = client.post(
        "/api/announcements",
        json={
            "title": f"Emergency Holiday Notice {uid}",
            "content": "School will remain closed tomorrow due to weather forecast.",
            "category": "Emergency",
            "target_role": "All",
            "is_pinned": True
        },
        headers=admin_headers
    )
    assert ann_res.status_code == 201
    assert ann_res.json()["is_pinned"] is True

    # 5. Check Settings Update
    set_res = client.post(
        "/api/settings",
        json={"school_name": f"Oakridge Academy {uid}"},
        headers=admin_headers
    )
    assert set_res.status_code == 200
    assert set_res.json()["school_name"] == f"Oakridge Academy {uid}"
