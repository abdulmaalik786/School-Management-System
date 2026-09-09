import pytest
import uuid
from datetime import date, time
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


def test_periods_crud():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:4]

    # 1. Create Period
    res = client.post(
        "/api/periods",
        json={
            "name": f"Period {uid}",
            "start_time": "08:00:00",
            "end_time": "08:40:00",
            "sort_order": 1,
            "is_break": False
        },
        headers=headers
    )
    assert res.status_code == 201
    period_id = res.json()["id"]
    assert res.json()["name"] == f"Period {uid}"
    assert res.json()["is_break"] is False

    # 2. Get Periods
    list_res = client.get("/api/periods", headers=headers)
    assert list_res.status_code == 200
    assert any(p["id"] == period_id for p in list_res.json())

    # 3. Update Period
    up_res = client.put(
        f"/api/periods/{period_id}",
        json={"name": f"P-{uid} Updated", "is_break": True},
        headers=headers
    )
    assert up_res.status_code == 200
    assert up_res.json()["name"] == f"P-{uid} Updated"
    assert up_res.json()["is_break"] is True

    # 4. Delete Period
    del_res = client.delete(f"/api/periods/{period_id}", headers=headers)
    assert del_res.status_code == 200


def test_timetable_and_conflicts():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # Setup dependencies: Academic Year, Class, Section 1 & 2, Subject 1 & 2, Teachers 1 & 2, Period
    ay_res = client.get("/api/academic-years", headers=headers)
    ay_id = ay_res.json()[0]["id"]

    cls_res = client.post(
        "/api/classes",
        json={"name": f"Grade-{uid}", "numeric_grade": 10},
        headers=headers
    )
    cls_id = cls_res.json()["id"]

    sec1_res = client.post(
        "/api/sections",
        json={"name": "A", "class_id": cls_id},
        headers=headers
    )
    sec1_id = sec1_res.json()["id"]

    sec2_res = client.post(
        "/api/sections",
        json={"name": "B", "class_id": cls_id},
        headers=headers
    )
    sec2_id = sec2_res.json()["id"]

    subj1_res = client.post(
        "/api/subjects",
        json={"name": f"Math-{uid}", "code": f"MTH-{uid}"},
        headers=headers
    )
    subj1_id = subj1_res.json()["id"]

    subj2_res = client.post(
        "/api/subjects",
        json={"name": f"Physics-{uid}", "code": f"PHY-{uid}"},
        headers=headers
    )
    subj2_id = subj2_res.json()["id"]

    tch1_res = client.post(
        "/api/teachers",
        json={
            "first_name": "Teacher1",
            "last_name": uid,
            "email": f"tch1_{uid}@school.com",
            "username": f"tch1_{uid}",
            "employee_id": f"EMP1-{uid}",
            "department": "Science"
        },
        headers=headers
    )
    tch1_id = tch1_res.json()["id"]

    tch2_res = client.post(
        "/api/teachers",
        json={
            "first_name": "Teacher2",
            "last_name": uid,
            "email": f"tch2_{uid}@school.com",
            "username": f"tch2_{uid}",
            "employee_id": f"EMP2-{uid}",
            "department": "Math"
        },
        headers=headers
    )
    tch2_id = tch2_res.json()["id"]

    period_res = client.post(
        "/api/periods",
        json={
            "name": f"Period-TT-{uid}",
            "start_time": "09:00:00",
            "end_time": "09:40:00",
            "sort_order": 2,
            "is_break": False
        },
        headers=headers
    )
    period_id = period_res.json()["id"]

    # 1. Create Base Timetable Entry: Monday, Period, Grade-uid Sec A, Math, Teacher 1, Room 101
    tt1_res = client.post(
        "/api/timetable",
        json={
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec1_id,
            "subject_id": subj1_id,
            "teacher_id": tch1_id,
            "period_id": period_id,
            "day_of_week": "Monday",
            "room_number": f"Room-{uid}"
        },
        headers=headers
    )
    assert tt1_res.status_code == 201
    tt1_id = tt1_res.json()["id"]
    assert tt1_res.json()["day_of_week"] == "Monday"
    assert tt1_res.json()["room_number"] == f"Room-{uid}"

    # 2. CONFLICT 1: Class Conflict (Same class/section already booked at Monday + Period)
    conflict_cls = client.post(
        "/api/timetable",
        json={
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec1_id,
            "subject_id": subj2_id,
            "teacher_id": tch2_id,
            "period_id": period_id,
            "day_of_week": "Monday",
            "room_number": f"Room-Other-{uid}"
        },
        headers=headers
    )
    assert conflict_cls.status_code == 400
    assert "CLASS CONFLICT" in conflict_cls.json()["detail"]

    # 3. CONFLICT 2: Teacher Conflict (Same teacher 1 assigned to Section B at Monday + Period)
    conflict_tch = client.post(
        "/api/timetable",
        json={
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec2_id,
            "subject_id": subj2_id,
            "teacher_id": tch1_id,
            "period_id": period_id,
            "day_of_week": "Monday",
            "room_number": f"Room-Other-{uid}"
        },
        headers=headers
    )
    assert conflict_tch.status_code == 400
    assert "TEACHER CONFLICT" in conflict_tch.json()["detail"]

    # 4. CONFLICT 3: Room Conflict (Same Room-uid assigned to Section B at Monday + Period)
    conflict_rm = client.post(
        "/api/timetable",
        json={
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec2_id,
            "subject_id": subj2_id,
            "teacher_id": tch2_id,
            "period_id": period_id,
            "day_of_week": "Monday",
            "room_number": f"Room-{uid}"
        },
        headers=headers
    )
    assert conflict_rm.status_code == 400
    assert "ROOM CONFLICT" in conflict_rm.json()["detail"]

    # 5. Update TT1 without false self-conflict
    up_tt1 = client.put(
        f"/api/timetable/{tt1_id}",
        json={"room_number": f"Room-{uid}-Updated"},
        headers=headers
    )
    assert up_tt1.status_code == 200
    assert up_tt1.json()["room_number"] == f"Room-{uid}-Updated"

    # 6. Test Timetable Queries (Class, Teacher, Room)
    cls_tt = client.get(f"/api/timetable?class_id={cls_id}&section_id={sec1_id}", headers=headers)
    assert cls_tt.status_code == 200
    assert len(cls_tt.json()) >= 1

    tch_tt = client.get(f"/api/timetable?teacher_id={tch1_id}", headers=headers)
    assert tch_tt.status_code == 200
    assert len(tch_tt.json()) >= 1

    rm_tt = client.get(f"/api/timetable?room_number=Room-{uid}-Updated", headers=headers)
    assert rm_tt.status_code == 200
    assert len(rm_tt.json()) >= 1

    # Cleanup
    del_tt = client.delete(f"/api/timetable/{tt1_id}", headers=headers)
    assert del_tt.status_code == 200


def test_student_attendance_and_reports():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # Create Class, Section, Subject, Students
    cls_res = client.post("/api/classes", json={"name": f"AttClass-{uid}"}, headers=headers)
    cls_id = cls_res.json()["id"]

    sec_res = client.post("/api/sections", json={"name": "A", "class_id": cls_id}, headers=headers)
    sec_id = sec_res.json()["id"]

    subj_res = client.post("/api/subjects", json={"name": f"AttSubj-{uid}", "code": f"AS-{uid}"}, headers=headers)
    subj_id = subj_res.json()["id"]

    # Create 2 Students: Ali and Usman
    s1_res = client.post(
        "/api/students",
        json={
            "first_name": "Ali",
            "last_name": uid,
            "email": f"ali_{uid}@school.com",
            "username": f"ali_{uid}",
            "admission_number": f"ALI-{uid}",
            "class_id": cls_id,
            "section_id": sec_id
        },
        headers=headers
    )
    s1_id = s1_res.json()["id"]

    s2_res = client.post(
        "/api/students",
        json={
            "first_name": "Usman",
            "last_name": uid,
            "email": f"usman_{uid}@school.com",
            "username": f"usman_{uid}",
            "admission_number": f"USM-{uid}",
            "class_id": cls_id,
            "section_id": sec_id
        },
        headers=headers
    )
    s2_id = s2_res.json()["id"]

    today_str = date.today().isoformat()

    # 1. Bulk Mark Attendance: Ali = Present, Usman = Late
    mark_res = client.post(
        "/api/attendance",
        json={
            "class_id": cls_id,
            "section_id": sec_id,
            "subject_id": subj_id,
            "attendance_date": today_str,
            "attendances": [
                {"student_id": s1_id, "status": "Present", "remarks": "On time"},
                {"student_id": s2_id, "status": "Late", "remarks": "Traffic delay"}
            ]
        },
        headers=headers
    )
    assert mark_res.status_code == 200
    assert len(mark_res.json()) == 2
    att1_id = mark_res.json()[0]["id"]

    # 2. Update single attendance
    up_res = client.put(
        f"/api/attendance/{att1_id}",
        json={"status": "Present", "remarks": "Perfect attendance"},
        headers=headers
    )
    assert up_res.status_code == 200
    assert up_res.json()["remarks"] == "Perfect attendance"

    # 3. Student Attendance Report
    rep_res = client.get(f"/api/attendance/reports/student/{s1_id}", headers=headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["student_id"] == s1_id
    assert rep_data["total_classes"] >= 1
    assert rep_data["present_count"] >= 1
    assert rep_data["attendance_percentage"] == 100.0
    assert len(rep_data["subject_breakdown"]) >= 1

    # 4. Class Attendance Report
    cls_rep = client.get(f"/api/attendance/reports/class/{cls_id}?section_id={sec_id}", headers=headers)
    assert cls_rep.status_code == 200
    assert len(cls_rep.json()) == 2

    # 5. Daily Attendance Report
    daily_rep = client.get(f"/api/attendance/reports/daily?attendance_date={today_str}", headers=headers)
    assert daily_rep.status_code == 200
    assert any(d["section_id"] == sec_id for d in daily_rep.json())

    # 6. Monthly Attendance Report
    m_now = date.today().month
    y_now = date.today().year
    month_rep = client.get(
        f"/api/attendance/reports/monthly?month={m_now}&year={y_now}&class_id={cls_id}&section_id={sec_id}",
        headers=headers
    )
    assert month_rep.status_code == 200
    assert len(month_rep.json()) >= 1

    # 7. Subject Attendance Report
    subj_rep = client.get(
        f"/api/attendance/reports/subject?subject_id={subj_id}&class_id={cls_id}",
        headers=headers
    )
    assert subj_rep.status_code == 200
    assert subj_rep.json()[0]["total_classes"] >= 1


def test_teacher_attendance_and_reports():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # Create teacher
    tch_res = client.post(
        "/api/teachers",
        json={
            "first_name": "TchAtt",
            "last_name": uid,
            "email": f"tchatt_{uid}@school.com",
            "username": f"tchatt_{uid}",
            "employee_id": f"TEA-{uid}",
            "department": "Languages"
        },
        headers=headers
    )
    assert tch_res.status_code == 201
    tch_id = tch_res.json()["id"]

    today_str = date.today().isoformat()

    # 1. Bulk Mark Teacher Attendance
    mark_res = client.post(
        "/api/attendance/teachers",
        json={
            "attendance_date": today_str,
            "attendances": [
                {"teacher_id": tch_id, "status": "Present", "remarks": "Regular schedule"}
            ]
        },
        headers=headers
    )
    assert mark_res.status_code == 200
    assert len(mark_res.json()) >= 1
    att_id = mark_res.json()[0]["id"]

    # 2. Update Teacher Attendance
    up_res = client.put(
        f"/api/attendance/teachers/{att_id}",
        json={"status": "Late", "remarks": "Late check-in 10 min"},
        headers=headers
    )
    assert up_res.status_code == 200
    assert up_res.json()["status"] == "Late"

    # 3. Individual Teacher Report
    tch_rep = client.get(f"/api/attendance/reports/teacher/{tch_id}", headers=headers)
    assert tch_rep.status_code == 200
    assert tch_rep.json()["teacher_id"] == tch_id
    assert tch_rep.json()["total_days"] >= 1
    assert tch_rep.json()["late_count"] >= 1

    # 4. Daily Teacher Attendance Report
    daily_rep = client.get(f"/api/attendance/reports/teachers/daily?attendance_date={today_str}", headers=headers)
    assert daily_rep.status_code == 200
    assert daily_rep.json()["total_teachers"] >= 1

    # 5. Monthly Teacher Attendance Report
    m_now = date.today().month
    y_now = date.today().year
    month_rep = client.get(f"/api/attendance/reports/teachers/monthly?month={m_now}&year={y_now}", headers=headers)
    assert month_rep.status_code == 200
    assert any(t["teacher_id"] == tch_id for t in month_rep.json())
