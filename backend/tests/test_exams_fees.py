import pytest
import uuid
from datetime import date, timedelta
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

def get_teacher_headers():
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "teacher", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def get_accountant_headers():
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "accountant", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_exams_crud_and_validation():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # Setup class, subject, year
    ay_res = client.get("/api/academic-years", headers=headers)
    ay_id = ay_res.json()[0]["id"]

    cls_res = client.post("/api/classes", json={"name": f"ExamClass-{uid}"}, headers=headers)
    cls_id = cls_res.json()["id"]

    subj_res = client.post("/api/subjects", json={"name": f"Math-{uid}", "code": f"EM-{uid}"}, headers=headers)
    subj_id = subj_res.json()["id"]

    # 1. Test passing_marks > total_marks validation error
    inv_res = client.post(
        "/api/exams",
        json={
            "name": f"Invalid Exam {uid}",
            "exam_type": "Mid Term",
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "subject_id": subj_id,
            "exam_date": date.today().isoformat(),
            "total_marks": 50.0,
            "passing_marks": 60.0  # Invalid!
        },
        headers=headers
    )
    assert inv_res.status_code == 400

    # 2. Create valid Exam
    ex_res = client.post(
        "/api/exams",
        json={
            "name": f"Mid Term Math {uid}",
            "exam_type": "Mid Term",
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "subject_id": subj_id,
            "exam_date": date.today().isoformat(),
            "total_marks": 100.0,
            "passing_marks": 40.0
        },
        headers=headers
    )
    assert ex_res.status_code == 201
    exam_id = ex_res.json()["id"]
    assert ex_res.json()["name"] == f"Mid Term Math {uid}"

    # 3. Update exam
    up_res = client.put(
        f"/api/exams/{exam_id}",
        json={"name": f"Mid Term Math {uid} (Updated)"},
        headers=headers
    )
    assert up_res.status_code == 200
    assert up_res.json()["name"] == f"Mid Term Math {uid} (Updated)"

    # 4. List exams with filters
    list_res = client.get(f"/api/exams?class_id={cls_id}&subject_id={subj_id}", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_marks_entry_grading_and_report_cards():
    headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    ay_res = client.get("/api/academic-years", headers=headers)
    ay_id = ay_res.json()[0]["id"]

    cls_res = client.post("/api/classes", json={"name": f"GradeClass-{uid}"}, headers=headers)
    cls_id = cls_res.json()["id"]

    sec_res = client.post("/api/sections", json={"name": "A", "class_id": cls_id}, headers=headers)
    sec_id = sec_res.json()["id"]

    # Create 3 subjects: Math, English, Computer
    m_res = client.post("/api/subjects", json={"name": f"Math-{uid}", "code": f"M-{uid}"}, headers=headers)
    m_id = m_res.json()["id"]

    e_res = client.post("/api/subjects", json={"name": f"English-{uid}", "code": f"E-{uid}"}, headers=headers)
    e_id = e_res.json()["id"]

    c_res = client.post("/api/subjects", json={"name": f"Computer-{uid}", "code": f"C-{uid}"}, headers=headers)
    c_id = c_res.json()["id"]

    # Create 2 Students: Ali and Ahmed
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
            "first_name": "Ahmed",
            "last_name": uid,
            "email": f"ahmed_{uid}@school.com",
            "username": f"ahmed_{uid}",
            "admission_number": f"AHM-{uid}",
            "class_id": cls_id,
            "section_id": sec_id
        },
        headers=headers
    )
    s2_id = s2_res.json()["id"]

    # Create exams for Math, English, Computer
    exam_m = client.post(
        "/api/exams",
        json={
            "name": f"Final Term {uid}",
            "exam_type": "Final Term",
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec_id,
            "subject_id": m_id,
            "exam_date": date.today().isoformat(),
            "total_marks": 100.0,
            "passing_marks": 40.0
        },
        headers=headers
    ).json()

    exam_e = client.post(
        "/api/exams",
        json={
            "name": f"Final Term {uid}",
            "exam_type": "Final Term",
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec_id,
            "subject_id": e_id,
            "exam_date": date.today().isoformat(),
            "total_marks": 100.0,
            "passing_marks": 40.0
        },
        headers=headers
    ).json()

    exam_c = client.post(
        "/api/exams",
        json={
            "name": f"Final Term {uid}",
            "exam_type": "Final Term",
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "section_id": sec_id,
            "subject_id": c_id,
            "exam_date": date.today().isoformat(),
            "total_marks": 100.0,
            "passing_marks": 40.0
        },
        headers=headers
    ).json()

    # 1. Validation test: Marks > Total marks should fail
    inv_marks = client.post(
        f"/api/exams/{exam_m['id']}/marks",
        json={
            "marks": [{"student_id": s1_id, "marks_obtained": 150.0, "is_absent": False}]
        },
        headers=headers
    )
    assert inv_marks.status_code == 400

    # 2. Enter Math Marks: Ali = 85 (Grade A), Ahmed = 35 (Grade F)
    m_marks_res = client.post(
        f"/api/exams/{exam_m['id']}/marks",
        json={
            "marks": [
                {"student_id": s1_id, "marks_obtained": 85.0, "is_absent": False},
                {"student_id": s2_id, "marks_obtained": 35.0, "is_absent": False}
            ]
        },
        headers=headers
    )
    assert m_marks_res.status_code == 200
    marks_data = m_marks_res.json()
    assert marks_data[0]["grade"] == "A"
    assert marks_data[0]["is_passed"] is True
    assert marks_data[1]["grade"] == "F"
    assert marks_data[1]["is_passed"] is False

    # 3. Enter English Marks: Ali = 78 (Grade B), Ahmed = 80 (Grade A)
    client.post(
        f"/api/exams/{exam_e['id']}/marks",
        json={
            "marks": [
                {"student_id": s1_id, "marks_obtained": 78.0, "is_absent": False},
                {"student_id": s2_id, "marks_obtained": 80.0, "is_absent": False}
            ]
        },
        headers=headers
    )

    # 4. Enter Computer Marks: Ali = 92 (Grade A+), Ahmed = 75 (Grade B)
    client.post(
        f"/api/exams/{exam_c['id']}/marks",
        json={
            "marks": [
                {"student_id": s1_id, "marks_obtained": 92.0, "is_absent": False},
                {"student_id": s2_id, "marks_obtained": 75.0, "is_absent": False}
            ]
        },
        headers=headers
    )

    # 5. Check Multi-Subject Report Card for Ali:
    # Math: 85, English: 78, Computer: 92 -> Total: 255/300 -> 85.0% -> Grade A -> PASS
    rc_ali = client.get(
        f"/api/results/student/{s1_id}?exam_name=Final Term {uid}",
        headers=headers
    )
    assert rc_ali.status_code == 200
    ali_data = rc_ali.json()
    assert ali_data["total_max_marks"] == 300.0
    assert ali_data["total_obtained_marks"] == 255.0
    assert ali_data["overall_percentage"] == 85.0
    assert ali_data["overall_grade"] == "A"
    assert ali_data["result_status"] == "PASS"
    assert ali_data["rank_in_class"] == 1

    # 6. Check Class Result Sheet
    cls_rep = client.get(
        f"/api/results/class/{cls_id}?exam_name=Final Term {uid}",
        headers=headers
    )
    assert cls_rep.status_code == 200
    cls_data = cls_rep.json()
    assert cls_data["total_students"] == 2
    assert len(cls_data["students_summary"]) == 2

    # 7. Check Exam Result Analytics for Math Exam
    ex_ana = client.get(f"/api/results/exam/{exam_m['id']}", headers=headers)
    assert ex_ana.status_code == 200
    ana_data = ex_ana.json()
    assert ana_data["highest_score"] == 85.0
    assert ana_data["lowest_score"] == 35.0
    assert ana_data["passed_count"] == 1
    assert ana_data["failed_count"] == 1


def test_fee_management_lifecycle():
    accountant_headers = get_accountant_headers()
    admin_headers = get_admin_headers()
    uid = uuid.uuid4().hex[:6]

    # Setup Academic Year, Class, Student
    ay_res = client.get("/api/academic-years", headers=admin_headers)
    ay_id = ay_res.json()[0]["id"]

    cls_res = client.post("/api/classes", json={"name": f"FeeClass-{uid}"}, headers=admin_headers)
    cls_id = cls_res.json()["id"]

    stu_res = client.post(
        "/api/students",
        json={
            "first_name": "FeeStudent",
            "last_name": uid,
            "email": f"feestu_{uid}@school.com",
            "username": f"feestu_{uid}",
            "admission_number": f"FEE-{uid}",
            "class_id": cls_id
        },
        headers=admin_headers
    )
    stu_id = stu_res.json()["id"]

    # 1. Create Fee Structures (Tuition Fee $10,000, Exam Fee $2,000)
    fs1 = client.post(
        "/api/fees/structures",
        json={
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "fee_type": "Tuition Fee",
            "amount": 10000.0,
            "frequency": "Monthly"
        },
        headers=accountant_headers
    )
    assert fs1.status_code == 201

    fs2 = client.post(
        "/api/fees/structures",
        json={
            "academic_year_id": ay_id,
            "class_id": cls_id,
            "fee_type": "Exam Fee",
            "amount": 2000.0,
            "frequency": "Termly"
        },
        headers=accountant_headers
    )
    assert fs2.status_code == 201

    # 2. Bulk Generate Invoices for the class for month "March 2026"
    due_date = (date.today() + timedelta(days=15)).isoformat()
    bulk_inv = client.post(
        "/api/fees/invoices/bulk-generate",
        json={
            "class_id": cls_id,
            "academic_year_id": ay_id,
            "fee_month": f"March-{uid}",
            "due_date": due_date,
            "discount_amount": 0.0,
            "fine_amount": 0.0
        },
        headers=accountant_headers
    )
    assert bulk_inv.status_code == 200
    assert len(bulk_inv.json()) == 1
    invoice = bulk_inv.json()[0]
    invoice_id = invoice["id"]

    # Verify subtotal: $10,000 + $2,000 = $12,000, Status = "Pending"
    assert invoice["total_amount"] == 12000.0
    assert invoice["paid_amount"] == 0.0
    assert invoice["remaining_amount"] == 12000.0
    assert invoice["status"] == "Pending"

    # 3. Record Partial Payment ($5,000)
    pay1 = client.post(
        "/api/fees/payments",
        json={
            "invoice_id": invoice_id,
            "amount_paid": 5000.0,
            "discount_applied": 0.0,
            "fine_applied": 0.0,
            "payment_method": "Cash",
            "remarks": "Partial 1st installment"
        },
        headers=accountant_headers
    )
    assert pay1.status_code == 201
    pay1_data = pay1.json()
    assert pay1_data["invoice_paid_amount"] == 5000.0
    assert pay1_data["invoice_remaining_amount"] == 7000.0
    assert pay1_data["invoice_status"] == "Partial"
    receipt1_num = pay1_data["receipt_number"]

    # 4. Fetch Receipt by Receipt Number
    rec1 = client.get(f"/api/fees/receipts/{receipt1_num}", headers=accountant_headers)
    assert rec1.status_code == 200
    assert rec1.json()["amount_paid"] == 5000.0

    # 5. Record Remaining Payment with $500 Discount applied ($6,500 cash + $500 discount = $7,000 cleared)
    pay2 = client.post(
        "/api/fees/payments",
        json={
            "invoice_id": invoice_id,
            "amount_paid": 6500.0,
            "discount_applied": 500.0,
            "fine_applied": 0.0,
            "payment_method": "Bank Transfer",
            "transaction_reference": f"TXN-{uid}",
            "remarks": "Final clearance with scholarship discount"
        },
        headers=accountant_headers
    )
    assert pay2.status_code == 201
    pay2_data = pay2.json()
    assert pay2_data["invoice_status"] == "Paid"
    assert pay2_data["invoice_remaining_amount"] == 0.0

    # 6. Check Fee Dashboard Metrics
    dash = client.get("/api/fees/dashboard", headers=accountant_headers)
    assert dash.status_code == 200
    dash_data = dash.json()
    assert dash_data["total_collected_amount"] >= 11500.0

    # 7. Check Student Fee Ledger Report
    stu_report = client.get(f"/api/fees/reports/student/{stu_id}", headers=accountant_headers)
    assert stu_report.status_code == 200
    assert stu_report.json()["total_paid"] == 11500.0
    assert stu_report.json()["total_outstanding"] == 0.0

    # 8. Check Class-wise Fee Report
    class_report = client.get("/api/fees/reports/class-wise", headers=accountant_headers)
    assert class_report.status_code == 200
    matching_cls = next(c for c in class_report.json() if c["class_id"] == cls_id)
    assert matching_cls["total_collected"] == 11500.0
