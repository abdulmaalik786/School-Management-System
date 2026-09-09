from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student, Teacher
from app.models.academic import SchoolClass, Section, Subject
from app.models.timetable import Period
from app.models.attendance import StudentAttendance, TeacherAttendance
from app.schemas.attendance import (
    StudentAttendanceBulkCreate, StudentAttendanceSingleUpdate, StudentAttendanceOut,
    StudentAttendanceReportOut, SubjectAttendanceReportOut, DailyAttendanceSummary, MonthlyAttendanceSummary,
    TeacherAttendanceBulkCreate, TeacherAttendanceSingleUpdate, TeacherAttendanceOut,
    TeacherAttendanceReportOut, TeacherDailyReportOut, TeacherMonthlyReportOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/attendance", tags=["Attendance System"])

# --- HELPER FORMATTERS ---

def build_student_attendance_out(att: StudentAttendance) -> dict:
    return {
        "id": att.id,
        "student_id": att.student_id,
        "student_name": att.student.user.full_name if att.student and att.student.user else None,
        "admission_number": att.student.admission_number if att.student else None,
        "roll_number": att.student.roll_number if att.student else None,
        "class_id": att.class_id,
        "class_name": att.school_class.name if att.school_class else None,
        "section_id": att.section_id,
        "section_name": att.section.name if att.section else None,
        "subject_id": att.subject_id,
        "subject_name": att.subject.name if att.subject else None,
        "period_id": att.period_id,
        "period_name": att.period.name if att.period else None,
        "attendance_date": att.attendance_date,
        "status": att.status,
        "remarks": att.remarks,
        "recorded_by_name": att.recorded_by.full_name if att.recorded_by else None,
        "created_at": att.created_at
    }

def build_teacher_attendance_out(att: TeacherAttendance) -> dict:
    return {
        "id": att.id,
        "teacher_id": att.teacher_id,
        "teacher_name": att.teacher.user.full_name if att.teacher and att.teacher.user else None,
        "employee_id": att.teacher.employee_id if att.teacher else None,
        "department": att.teacher.department if att.teacher else None,
        "attendance_date": att.attendance_date,
        "status": att.status,
        "remarks": att.remarks,
        "recorded_by_name": att.recorded_by.full_name if att.recorded_by else None,
        "created_at": att.created_at
    }


# --- STUDENT ATTENDANCE CRUD & BULK ---

@router.get("", response_model=List[StudentAttendanceOut])
@router.get("/students", response_model=List[StudentAttendanceOut])
def get_student_attendances(
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    period_id: Optional[int] = Query(None),
    attendance_date: Optional[date] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    student_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(StudentAttendance)

    # Scoped permissions: Parent only own children, Student only self
    if current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [s.id for s in current_user.parent_profile.children]
        query = query.filter(StudentAttendance.student_id.in_(child_ids))
    elif current_user.role.name == "Student" and current_user.student_profile:
        query = query.filter(StudentAttendance.student_id == current_user.student_profile.id)

    if class_id:
        query = query.filter(StudentAttendance.class_id == class_id)
    if section_id:
        query = query.filter(StudentAttendance.section_id == section_id)
    if subject_id:
        query = query.filter(StudentAttendance.subject_id == subject_id)
    if period_id:
        query = query.filter(StudentAttendance.period_id == period_id)
    if attendance_date:
        query = query.filter(StudentAttendance.attendance_date == attendance_date)
    if start_date:
        query = query.filter(StudentAttendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(StudentAttendance.attendance_date <= end_date)
    if student_id:
        query = query.filter(StudentAttendance.student_id == student_id)
    if status_filter:
        query = query.filter(StudentAttendance.status.ilike(status_filter))

    records = query.order_by(StudentAttendance.attendance_date.desc(), StudentAttendance.id.desc()).all()
    return [build_student_attendance_out(r) for r in records]


@router.post("", response_model=List[StudentAttendanceOut])
@router.post("/students", response_model=List[StudentAttendanceOut])
def mark_student_attendance(
    data: StudentAttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    out_list = []
    for item in data.attendances:
        # Check if record exists for this student, date, class, section, subject, and period
        q = db.query(StudentAttendance).filter(
            StudentAttendance.student_id == item.student_id,
            StudentAttendance.attendance_date == data.attendance_date,
            StudentAttendance.class_id == data.class_id,
            StudentAttendance.section_id == data.section_id
        )
        if data.subject_id:
            q = q.filter(StudentAttendance.subject_id == data.subject_id)
        if data.period_id:
            q = q.filter(StudentAttendance.period_id == data.period_id)
        
        att_rec = q.first()
        if not att_rec:
            att_rec = StudentAttendance(
                student_id=item.student_id,
                class_id=data.class_id,
                section_id=data.section_id,
                subject_id=data.subject_id,
                period_id=data.period_id,
                attendance_date=data.attendance_date,
                status=item.status,
                remarks=item.remarks,
                recorded_by_id=current_user.id
            )
            db.add(att_rec)
        else:
            att_rec.status = item.status
            att_rec.remarks = item.remarks
            att_rec.recorded_by_id = current_user.id
        
        db.flush()
        out_list.append(att_rec)

    db.commit()
    for rec in out_list:
        db.refresh(rec)
    return [build_student_attendance_out(r) for r in out_list]


@router.put("/{id}", response_model=StudentAttendanceOut)
@router.put("/students/{id}", response_model=StudentAttendanceOut)
def update_student_attendance(
    id: int,
    data: StudentAttendanceSingleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    rec = db.query(StudentAttendance).filter(StudentAttendance.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Student attendance record not found")

    if data.status is not None:
        rec.status = data.status
    if data.remarks is not None:
        rec.remarks = data.remarks
    rec.recorded_by_id = current_user.id

    db.commit()
    db.refresh(rec)
    return build_student_attendance_out(rec)


@router.delete("/{id}")
@router.delete("/students/{id}")
def delete_student_attendance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    rec = db.query(StudentAttendance).filter(StudentAttendance.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Student attendance record not found")

    db.delete(rec)
    db.commit()
    return {"message": "Attendance record deleted successfully"}


# --- ATTENDANCE REPORT ENDPOINTS ---

@router.get("/reports/student/{student_id}", response_model=StudentAttendanceReportOut)
def get_student_attendance_report(
    student_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role.name == "Parent" and current_user.parent_profile:
        if student.parent_id != current_user.parent_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role.name == "Student" and current_user.student_profile:
        if student.id != current_user.student_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(StudentAttendance).filter(StudentAttendance.student_id == student_id)
    if start_date:
        query = query.filter(StudentAttendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(StudentAttendance.attendance_date <= end_date)

    records = query.order_by(StudentAttendance.attendance_date.desc()).all()
    total_classes = len(records)
    present_cnt = sum(1 for r in records if r.status == "Present")
    absent_cnt = sum(1 for r in records if r.status == "Absent")
    late_cnt = sum(1 for r in records if r.status == "Late")
    leave_cnt = sum(1 for r in records if r.status == "Leave")

    # Attendance % = (Present + Late) / Total * 100
    pct = round(((present_cnt + late_cnt) / total_classes * 100), 1) if total_classes > 0 else 0.0

    # Subject breakdown
    subject_map = {}
    for r in records:
        sid = r.subject_id or 0
        sname = r.subject.name if r.subject else "General Daily Attendance"
        scode = r.subject.code if r.subject else "GEN"
        if sid not in subject_map:
            subject_map[sid] = {
                "subject_id": r.subject_id,
                "subject_name": sname,
                "subject_code": scode,
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "late_count": 0,
                "leave_count": 0
            }
        subject_map[sid]["total_classes"] += 1
        if r.status == "Present":
            subject_map[sid]["present_count"] += 1
        elif r.status == "Absent":
            subject_map[sid]["absent_count"] += 1
        elif r.status == "Late":
            subject_map[sid]["late_count"] += 1
        elif r.status == "Leave":
            subject_map[sid]["leave_count"] += 1

    subject_breakdown = []
    for sid, sdata in subject_map.items():
        stot = sdata["total_classes"]
        spresent = sdata["present_count"]
        slate = sdata["late_count"]
        spct = round(((spresent + slate) / stot * 100), 1) if stot > 0 else 0.0
        subject_breakdown.append({
            **sdata,
            "attendance_percentage": spct
        })

    return {
        "student_id": student.id,
        "student_name": student.user.full_name,
        "admission_number": student.admission_number,
        "roll_number": student.roll_number,
        "class_name": student.school_class.name if student.school_class else None,
        "section_name": student.section.name if student.section else None,
        "total_classes": total_classes,
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "late_count": late_cnt,
        "leave_count": leave_cnt,
        "attendance_percentage": pct,
        "subject_breakdown": subject_breakdown,
        "recent_records": [build_student_attendance_out(r) for r in records[:10]]
    }


@router.get("/reports/class/{class_id}", response_model=List[StudentAttendanceReportOut])
def get_class_attendance_reports(
    class_id: int,
    section_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    query = db.query(Student).filter(Student.class_id == class_id)
    if section_id:
        query = query.filter(Student.section_id == section_id)
    
    students = query.order_by(Student.roll_number.asc(), Student.id.asc()).all()
    reports = []
    for s in students:
        att_query = db.query(StudentAttendance).filter(StudentAttendance.student_id == s.id)
        if start_date:
            att_query = att_query.filter(StudentAttendance.attendance_date >= start_date)
        if end_date:
            att_query = att_query.filter(StudentAttendance.attendance_date <= end_date)

        records = att_query.all()
        total_classes = len(records)
        present_cnt = sum(1 for r in records if r.status == "Present")
        absent_cnt = sum(1 for r in records if r.status == "Absent")
        late_cnt = sum(1 for r in records if r.status == "Late")
        leave_cnt = sum(1 for r in records if r.status == "Leave")
        pct = round(((present_cnt + late_cnt) / total_classes * 100), 1) if total_classes > 0 else 0.0

        reports.append({
            "student_id": s.id,
            "student_name": s.user.full_name,
            "admission_number": s.admission_number,
            "roll_number": s.roll_number,
            "class_name": s.school_class.name if s.school_class else None,
            "section_name": s.section.name if s.section else None,
            "total_classes": total_classes,
            "present_count": present_cnt,
            "absent_count": absent_cnt,
            "late_count": late_cnt,
            "leave_count": leave_cnt,
            "attendance_percentage": pct,
            "subject_breakdown": [],
            "recent_records": []
        })
    return reports


@router.get("/reports/daily", response_model=List[DailyAttendanceSummary])
def get_daily_attendance_report(
    attendance_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    sections = db.query(Section).all()
    results = []

    for sec in sections:
        records = db.query(StudentAttendance).filter(
            StudentAttendance.section_id == sec.id,
            StudentAttendance.attendance_date == attendance_date
        ).all()

        total = len(records)
        present_cnt = sum(1 for r in records if r.status == "Present")
        absent_cnt = sum(1 for r in records if r.status == "Absent")
        late_cnt = sum(1 for r in records if r.status == "Late")
        leave_cnt = sum(1 for r in records if r.status == "Leave")
        pct = round(((present_cnt + late_cnt) / total * 100), 1) if total > 0 else 0.0

        results.append({
            "attendance_date": attendance_date,
            "class_id": sec.class_id,
            "class_name": sec.school_class.name if sec.school_class else "Class",
            "section_id": sec.id,
            "section_name": sec.name,
            "total_students": total,
            "present_count": present_cnt,
            "absent_count": absent_cnt,
            "late_count": late_cnt,
            "leave_count": leave_cnt,
            "attendance_percentage": pct
        })

    return results


@router.get("/reports/monthly", response_model=List[MonthlyAttendanceSummary])
def get_monthly_attendance_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    query = db.query(StudentAttendance).filter(
        extract('month', StudentAttendance.attendance_date) == month,
        extract('year', StudentAttendance.attendance_date) == year
    )
    if class_id:
        query = query.filter(StudentAttendance.class_id == class_id)
    if section_id:
        query = query.filter(StudentAttendance.section_id == section_id)

    records = query.all()
    grouped = {}

    for r in records:
        sid = r.student_id
        if sid not in grouped:
            grouped[sid] = {
                "month": month,
                "year": year,
                "class_id": r.class_id,
                "class_name": r.school_class.name if r.school_class else None,
                "section_id": r.section_id,
                "section_name": r.section.name if r.section else None,
                "student_id": sid,
                "student_name": r.student.user.full_name if r.student and r.student.user else None,
                "admission_number": r.student.admission_number if r.student else None,
                "total_classes": 0,
                "present_count": 0,
                "absent_count": 0,
                "late_count": 0,
                "leave_count": 0,
            }
        grouped[sid]["total_classes"] += 1
        if r.status == "Present":
            grouped[sid]["present_count"] += 1
        elif r.status == "Absent":
            grouped[sid]["absent_count"] += 1
        elif r.status == "Late":
            grouped[sid]["late_count"] += 1
        elif r.status == "Leave":
            grouped[sid]["leave_count"] += 1

    out = []
    for sid, item in grouped.items():
        tot = item["total_classes"]
        p = item["present_count"]
        l = item["late_count"]
        pct = round(((p + l) / tot * 100), 1) if tot > 0 else 0.0
        out.append({
            **item,
            "attendance_percentage": pct
        })
    return out


@router.get("/reports/subject", response_model=List[SubjectAttendanceReportOut])
def get_subject_attendance_report(
    subject_id: int = Query(...),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    query = db.query(StudentAttendance).filter(StudentAttendance.subject_id == subject_id)
    if class_id:
        query = query.filter(StudentAttendance.class_id == class_id)
    if section_id:
        query = query.filter(StudentAttendance.section_id == section_id)
    if start_date:
        query = query.filter(StudentAttendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(StudentAttendance.attendance_date <= end_date)

    records = query.all()
    total_classes = len(records)
    present_cnt = sum(1 for r in records if r.status == "Present")
    absent_cnt = sum(1 for r in records if r.status == "Absent")
    late_cnt = sum(1 for r in records if r.status == "Late")
    leave_cnt = sum(1 for r in records if r.status == "Leave")
    pct = round(((present_cnt + late_cnt) / total_classes * 100), 1) if total_classes > 0 else 0.0

    return [{
        "subject_id": subject.id,
        "subject_name": subject.name,
        "subject_code": subject.code,
        "total_classes": total_classes,
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "late_count": late_cnt,
        "leave_count": leave_cnt,
        "attendance_percentage": pct
    }]


# --- TEACHER ATTENDANCE CRUD & REPORTS ---

@router.get("/teachers", response_model=List[TeacherAttendanceOut])
def get_teacher_attendances(
    attendance_date: Optional[date] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    teacher_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(TeacherAttendance)

    if current_user.role.name == "Teacher" and current_user.teacher_profile:
        query = query.filter(TeacherAttendance.teacher_id == current_user.teacher_profile.id)
    elif teacher_id:
        query = query.filter(TeacherAttendance.teacher_id == teacher_id)

    if attendance_date:
        query = query.filter(TeacherAttendance.attendance_date == attendance_date)
    if start_date:
        query = query.filter(TeacherAttendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(TeacherAttendance.attendance_date <= end_date)
    if status_filter:
        query = query.filter(TeacherAttendance.status.ilike(status_filter))

    records = query.order_by(TeacherAttendance.attendance_date.desc(), TeacherAttendance.id.desc()).all()
    return [build_teacher_attendance_out(r) for r in records]


@router.post("/teachers", response_model=List[TeacherAttendanceOut])
def mark_teacher_attendance(
    data: TeacherAttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    out_list = []
    for item in data.attendances:
        att_rec = db.query(TeacherAttendance).filter(
            TeacherAttendance.teacher_id == item.teacher_id,
            TeacherAttendance.attendance_date == data.attendance_date
        ).first()

        if not att_rec:
            att_rec = TeacherAttendance(
                teacher_id=item.teacher_id,
                attendance_date=data.attendance_date,
                status=item.status,
                remarks=item.remarks,
                recorded_by_id=current_user.id
            )
            db.add(att_rec)
        else:
            att_rec.status = item.status
            att_rec.remarks = item.remarks
            att_rec.recorded_by_id = current_user.id

        db.flush()
        out_list.append(att_rec)

    db.commit()
    for rec in out_list:
        db.refresh(rec)
    return [build_teacher_attendance_out(r) for r in out_list]


@router.put("/teachers/{id}", response_model=TeacherAttendanceOut)
def update_teacher_attendance(
    id: int,
    data: TeacherAttendanceSingleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    rec = db.query(TeacherAttendance).filter(TeacherAttendance.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Teacher attendance record not found")

    if data.status is not None:
        rec.status = data.status
    if data.remarks is not None:
        rec.remarks = data.remarks
    rec.recorded_by_id = current_user.id

    db.commit()
    db.refresh(rec)
    return build_teacher_attendance_out(rec)


@router.delete("/teachers/{id}")
def delete_teacher_attendance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    rec = db.query(TeacherAttendance).filter(TeacherAttendance.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Teacher attendance record not found")

    db.delete(rec)
    db.commit()
    return {"message": "Teacher attendance record deleted successfully"}


@router.get("/reports/teacher/{teacher_id}", response_model=TeacherAttendanceReportOut)
def get_single_teacher_attendance_report(
    teacher_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if current_user.role.name == "Teacher" and current_user.teacher_profile:
        if teacher.id != current_user.teacher_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(TeacherAttendance).filter(TeacherAttendance.teacher_id == teacher_id)
    if start_date:
        query = query.filter(TeacherAttendance.attendance_date >= start_date)
    if end_date:
        query = query.filter(TeacherAttendance.attendance_date <= end_date)

    records = query.order_by(TeacherAttendance.attendance_date.desc()).all()
    total_days = len(records)
    present_cnt = sum(1 for r in records if r.status == "Present")
    absent_cnt = sum(1 for r in records if r.status == "Absent")
    late_cnt = sum(1 for r in records if r.status == "Late")
    leave_cnt = sum(1 for r in records if r.status == "Leave")
    pct = round(((present_cnt + late_cnt) / total_days * 100), 1) if total_days > 0 else 0.0

    return {
        "teacher_id": teacher.id,
        "teacher_name": teacher.user.full_name,
        "employee_id": teacher.employee_id,
        "department": teacher.department,
        "total_days": total_days,
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "late_count": late_cnt,
        "leave_count": leave_cnt,
        "attendance_percentage": pct,
        "recent_records": [build_teacher_attendance_out(r) for r in records[:10]]
    }


@router.get("/reports/teachers/daily", response_model=TeacherDailyReportOut)
def get_daily_teacher_attendance_report(
    attendance_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    records = db.query(TeacherAttendance).filter(
        TeacherAttendance.attendance_date == attendance_date
    ).all()

    total = len(records)
    present_cnt = sum(1 for r in records if r.status == "Present")
    absent_cnt = sum(1 for r in records if r.status == "Absent")
    late_cnt = sum(1 for r in records if r.status == "Late")
    leave_cnt = sum(1 for r in records if r.status == "Leave")
    pct = round(((present_cnt + late_cnt) / total * 100), 1) if total > 0 else 0.0

    return {
        "attendance_date": attendance_date,
        "total_teachers": total,
        "present_count": present_cnt,
        "absent_count": absent_cnt,
        "late_count": late_cnt,
        "leave_count": leave_cnt,
        "attendance_percentage": pct,
        "records": [build_teacher_attendance_out(r) for r in records]
    }


@router.get("/reports/teachers/monthly", response_model=List[TeacherMonthlyReportOut])
def get_monthly_teacher_attendance_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    records = db.query(TeacherAttendance).filter(
        extract('month', TeacherAttendance.attendance_date) == month,
        extract('year', TeacherAttendance.attendance_date) == year
    ).all()

    grouped = {}
    for r in records:
        tid = r.teacher_id
        if tid not in grouped:
            grouped[tid] = {
                "month": month,
                "year": year,
                "teacher_id": tid,
                "teacher_name": r.teacher.user.full_name if r.teacher and r.teacher.user else None,
                "employee_id": r.teacher.employee_id if r.teacher else None,
                "department": r.teacher.department if r.teacher else None,
                "total_days": 0,
                "present_count": 0,
                "absent_count": 0,
                "late_count": 0,
                "leave_count": 0
            }
        grouped[tid]["total_days"] += 1
        if r.status == "Present":
            grouped[tid]["present_count"] += 1
        elif r.status == "Absent":
            grouped[tid]["absent_count"] += 1
        elif r.status == "Late":
            grouped[tid]["late_count"] += 1
        elif r.status == "Leave":
            grouped[tid]["leave_count"] += 1

    out = []
    for tid, item in grouped.items():
        tot = item["total_days"]
        p = item["present_count"]
        l = item["late_count"]
        pct = round(((p + l) / tot * 100), 1) if tot > 0 else 0.0
        out.append({
            **item,
            "attendance_percentage": pct
        })
    return out
