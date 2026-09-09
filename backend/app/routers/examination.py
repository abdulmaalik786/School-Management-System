from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student, Teacher
from app.models.academic import SchoolClass, Section, Subject, AcademicYear
from app.models.examination import Exam, ExamMark
from app.schemas.examination import (
    ExamCreate, ExamUpdate, ExamOut,
    ExamMarkBulkCreate, ExamMarkSingleUpdate, ExamMarkOut,
    StudentReportCardOut, SubjectScoreItem, ClassResultReportOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api", tags=["Examination & Results"])

# --- GRADING HELPER FUNCTIONS ---

def calculate_grade_and_gpa(percentage: float, is_absent: bool = False, is_passed: bool = True):
    if is_absent:
        return "ABS", 0.0
    if not is_passed or percentage < 50.0:
        return "F", 0.0
    if percentage >= 90.0:
        return "A+", 4.0
    elif percentage >= 80.0:
        return "A", 3.5
    elif percentage >= 70.0:
        return "B", 3.0
    elif percentage >= 60.0:
        return "C", 2.5
    elif percentage >= 50.0:
        return "D", 2.0
    else:
        return "F", 0.0

def build_exam_out(exam: Exam, db: Session) -> dict:
    marks_entered = db.query(ExamMark).filter(ExamMark.exam_id == exam.id).count()
    student_query = db.query(Student).filter(Student.class_id == exam.class_id)
    if exam.section_id:
        student_query = student_query.filter(Student.section_id == exam.section_id)
    total_students = student_query.count()

    return {
        "id": exam.id,
        "name": exam.name,
        "exam_type": exam.exam_type,
        "academic_year_id": exam.academic_year_id,
        "academic_year_name": exam.academic_year.name if exam.academic_year else None,
        "class_id": exam.class_id,
        "class_name": exam.school_class.name if exam.school_class else None,
        "section_id": exam.section_id,
        "section_name": exam.section.name if exam.section else None,
        "subject_id": exam.subject_id,
        "subject_name": exam.subject.name if exam.subject else None,
        "subject_code": exam.subject.code if exam.subject else None,
        "exam_date": exam.exam_date,
        "total_marks": exam.total_marks,
        "passing_marks": exam.passing_marks,
        "description": exam.description,
        "marks_entered_count": marks_entered,
        "total_enrolled_students": total_students,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at
    }

def build_exam_mark_out(mark: ExamMark) -> dict:
    exam = mark.exam
    total_marks = exam.total_marks if exam else 100.0
    passing_marks = exam.passing_marks if exam else 40.0

    if mark.is_absent:
        percentage = 0.0
        is_passed = False
        grade, _ = calculate_grade_and_gpa(0.0, is_absent=True, is_passed=False)
    else:
        percentage = round((mark.marks_obtained / total_marks * 100), 2) if total_marks > 0 else 0.0
        is_passed = mark.marks_obtained >= passing_marks
        grade, _ = calculate_grade_and_gpa(percentage, is_absent=False, is_passed=is_passed)

    return {
        "id": mark.id,
        "exam_id": mark.exam_id,
        "exam_name": exam.name if exam else None,
        "exam_type": exam.exam_type if exam else None,
        "subject_id": exam.subject_id if exam else None,
        "subject_name": exam.subject.name if exam and exam.subject else None,
        "subject_code": exam.subject.code if exam and exam.subject else None,
        "student_id": mark.student_id,
        "student_name": mark.student.user.full_name if mark.student and mark.student.user else None,
        "admission_number": mark.student.admission_number if mark.student else None,
        "roll_number": mark.student.roll_number if mark.student else None,
        "class_name": mark.student.school_class.name if mark.student and mark.student.school_class else None,
        "section_name": mark.student.section.name if mark.student and mark.student.section else None,
        "marks_obtained": mark.marks_obtained,
        "total_marks": total_marks,
        "passing_marks": passing_marks,
        "percentage": percentage,
        "grade": grade,
        "is_passed": is_passed,
        "is_absent": mark.is_absent,
        "remarks": mark.remarks,
        "recorded_by_name": mark.recorded_by.full_name if mark.recorded_by else None,
        "created_at": mark.created_at
    }


# --- EXAM CRUD ENDPOINTS ---

@router.get("/exams", response_model=List[ExamOut])
def get_exams(
    academic_year_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    exam_type: Optional[str] = Query(None),
    exam_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Exam)

    if academic_year_id:
        query = query.filter(Exam.academic_year_id == academic_year_id)
    if class_id:
        query = query.filter(Exam.class_id == class_id)
    if section_id:
        query = query.filter((Exam.section_id == section_id) | (Exam.section_id.is_(None)))
    if subject_id:
        query = query.filter(Exam.subject_id == subject_id)
    if exam_type:
        query = query.filter(Exam.exam_type.ilike(f"%{exam_type}%"))
    if exam_date:
        query = query.filter(Exam.exam_date == exam_date)

    exams = query.order_by(Exam.exam_date.desc(), Exam.id.desc()).all()
    return [build_exam_out(e, db) for e in exams]


@router.get("/exams/{id}", response_model=ExamOut)
def get_exam(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return build_exam_out(exam, db)


@router.post("/exams", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    if data.passing_marks > data.total_marks:
        raise HTTPException(status_code=400, detail="Passing marks cannot exceed total marks")

    exam = Exam(**data.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return build_exam_out(exam, db)


@router.put("/exams/{id}", response_model=ExamOut)
def update_exam(
    id: int,
    data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    update_dict = data.model_dump(exclude_unset=True)
    tot = update_dict.get("total_marks", exam.total_marks)
    pas = update_dict.get("passing_marks", exam.passing_marks)
    if pas > tot:
        raise HTTPException(status_code=400, detail="Passing marks cannot exceed total marks")

    for k, v in update_dict.items():
        setattr(exam, k, v)

    db.commit()
    db.refresh(exam)
    return build_exam_out(exam, db)


@router.delete("/exams/{id}")
def delete_exam(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}


# --- MARKS ENTRY ENDPOINTS ---

@router.get("/exams/{id}/marks", response_model=List[ExamMarkOut])
def get_exam_marks(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Scoped permissions: Student/Parent view only self
    if current_user.role.name == "Student" and current_user.student_profile:
        marks = db.query(ExamMark).filter(
            ExamMark.exam_id == id,
            ExamMark.student_id == current_user.student_profile.id
        ).all()
        return [build_exam_mark_out(m) for m in marks]
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [c.id for c in current_user.parent_profile.children]
        marks = db.query(ExamMark).filter(
            ExamMark.exam_id == id,
            ExamMark.student_id.in_(child_ids)
        ).all()
        return [build_exam_mark_out(m) for m in marks]

    # For Teachers / Admins: Return all students in the class/section with existing marks (or empty marks)
    student_query = db.query(Student).filter(Student.class_id == exam.class_id)
    if exam.section_id:
        student_query = student_query.filter(Student.section_id == exam.section_id)
    students = student_query.order_by(Student.roll_number.asc(), Student.id.asc()).all()

    existing_marks = {m.student_id: m for m in db.query(ExamMark).filter(ExamMark.exam_id == id).all()}

    results = []
    for s in students:
        if s.id in existing_marks:
            results.append(build_exam_mark_out(existing_marks[s.id]))
        else:
            # Synthetic default object for marks entry UI
            results.append({
                "id": 0,
                "exam_id": exam.id,
                "exam_name": exam.name,
                "exam_type": exam.exam_type,
                "subject_id": exam.subject_id,
                "subject_name": exam.subject.name if exam.subject else None,
                "subject_code": exam.subject.code if exam.subject else None,
                "student_id": s.id,
                "student_name": s.user.full_name if s.user else None,
                "admission_number": s.admission_number,
                "roll_number": s.roll_number,
                "class_name": s.school_class.name if s.school_class else None,
                "section_name": s.section.name if s.section else None,
                "marks_obtained": 0.0,
                "total_marks": exam.total_marks,
                "passing_marks": exam.passing_marks,
                "percentage": 0.0,
                "grade": "N/A",
                "is_passed": False,
                "is_absent": False,
                "remarks": None,
                "recorded_by_name": None,
                "created_at": datetime.now()
            })
    return results


@router.post("/exams/{id}/marks", response_model=List[ExamMarkOut])
def bulk_save_exam_marks(
    id: int,
    data: ExamMarkBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    saved_marks = []
    for item in data.marks:
        if not item.is_absent and (item.marks_obtained < 0 or item.marks_obtained > exam.total_marks):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid score {item.marks_obtained}. Marks must be between 0 and total marks ({exam.total_marks})"
            )

        mark = db.query(ExamMark).filter(
            ExamMark.exam_id == id,
            ExamMark.student_id == item.student_id
        ).first()

        if not mark:
            mark = ExamMark(
                exam_id=id,
                student_id=item.student_id,
                marks_obtained=0.0 if item.is_absent else item.marks_obtained,
                is_absent=item.is_absent,
                remarks=item.remarks,
                recorded_by_id=current_user.id
            )
            db.add(mark)
        else:
            mark.marks_obtained = 0.0 if item.is_absent else item.marks_obtained
            mark.is_absent = item.is_absent
            mark.remarks = item.remarks
            mark.recorded_by_id = current_user.id

        db.flush()
        saved_marks.append(mark)

    db.commit()
    for m in saved_marks:
        db.refresh(m)
    return [build_exam_mark_out(m) for m in saved_marks]


@router.put("/marks/{id}", response_model=ExamMarkOut)
def update_single_mark(
    id: int,
    data: ExamMarkSingleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    mark = db.query(ExamMark).filter(ExamMark.id == id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Exam mark record not found")

    exam = mark.exam
    if data.marks_obtained is not None:
        if data.marks_obtained < 0 or (exam and data.marks_obtained > exam.total_marks):
            raise HTTPException(
                status_code=400,
                detail=f"Marks must be between 0 and {exam.total_marks if exam else 100}"
            )
        mark.marks_obtained = data.marks_obtained

    if data.is_absent is not None:
        mark.is_absent = data.is_absent
        if mark.is_absent:
            mark.marks_obtained = 0.0

    if data.remarks is not None:
        mark.remarks = data.remarks

    mark.recorded_by_id = current_user.id
    db.commit()
    db.refresh(mark)
    return build_exam_mark_out(mark)


def build_student_report_card_data(
    student: Student,
    academic_year_id: Optional[int],
    exam_type: Optional[str],
    exam_name: Optional[str],
    db: Session
) -> dict:
    # Fetch marks for this student
    query = db.query(ExamMark).join(Exam).filter(ExamMark.student_id == student.id)
    if academic_year_id:
        query = query.filter(Exam.academic_year_id == academic_year_id)
    if exam_type:
        query = query.filter(Exam.exam_type == exam_type)
    if exam_name:
        query = query.filter(Exam.name == exam_name)

    marks = query.order_by(Exam.exam_date.asc(), Exam.id.asc()).all()

    subjects_scores: List[SubjectScoreItem] = []
    total_max = 0.0
    total_obtained = 0.0
    passed_count = 0
    failed_count = 0

    for m in marks:
        e = m.exam
        tot = e.total_marks if e else 100.0
        pas = e.passing_marks if e else 40.0

        if m.is_absent:
            pct = 0.0
            is_pass = False
            grd, _ = calculate_grade_and_gpa(0.0, is_absent=True, is_passed=False)
        else:
            pct = round((m.marks_obtained / tot * 100), 2) if tot > 0 else 0.0
            is_pass = m.marks_obtained >= pas
            grd, _ = calculate_grade_and_gpa(pct, is_absent=False, is_passed=is_pass)

        total_max += tot
        total_obtained += m.marks_obtained if not m.is_absent else 0.0

        if is_pass:
            passed_count += 1
        else:
            failed_count += 1

        subjects_scores.append({
            "exam_id": e.id if e else 0,
            "exam_name": e.name if e else "Exam",
            "exam_type": e.exam_type if e else "General",
            "subject_id": e.subject_id if e else 0,
            "subject_name": e.subject.name if e and e.subject else "Subject",
            "subject_code": e.subject.code if e and e.subject else None,
            "marks_obtained": m.marks_obtained if not m.is_absent else 0.0,
            "total_marks": tot,
            "passing_marks": pas,
            "percentage": pct,
            "grade": grd,
            "is_passed": is_pass,
            "is_absent": m.is_absent,
            "remarks": m.remarks
        })

    overall_pct = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0.0
    overall_grd, overall_gpa = calculate_grade_and_gpa(overall_pct, is_absent=False, is_passed=(failed_count == 0))
    result_status = "PASS" if (failed_count == 0 and len(subjects_scores) > 0) else "FAIL"

    # Calculate class rank if applicable
    class_students = db.query(Student).filter(Student.class_id == student.class_id).all()
    class_totals = []
    for cs in class_students:
        cs_marks = db.query(ExamMark).join(Exam).filter(ExamMark.student_id == cs.id)
        if academic_year_id:
            cs_marks = cs_marks.filter(Exam.academic_year_id == academic_year_id)
        if exam_name:
            cs_marks = cs_marks.filter(Exam.name == exam_name)
        cs_tot = sum(m.marks_obtained for m in cs_marks.all() if not m.is_absent)
        class_totals.append((cs.id, cs_tot))
    
    class_totals.sort(key=lambda x: x[1], reverse=True)
    rank = 1
    for idx, (cid, score) in enumerate(class_totals):
        if cid == student.id:
            rank = idx + 1
            break

    return {
        "student_id": student.id,
        "student_name": student.user.full_name if student.user else f"{student.first_name} {student.last_name}",
        "admission_number": student.admission_number,
        "roll_number": student.roll_number,
        "class_id": student.class_id,
        "class_name": student.school_class.name if student.school_class else "Class",
        "section_id": student.section_id,
        "section_name": student.section.name if student.section else None,
        "academic_year_name": student.academic_year.name if student.academic_year else None,
        "exam_name": exam_name or exam_type or "Cumulative Term Result",
        "subjects": subjects_scores,
        "total_max_marks": total_max,
        "total_obtained_marks": total_obtained,
        "overall_percentage": overall_pct,
        "overall_grade": overall_grd,
        "gpa": overall_gpa,
        "result_status": result_status,
        "passed_subjects_count": passed_count,
        "failed_subjects_count": failed_count,
        "rank_in_class": rank
    }


# --- RESULTS & REPORT CARD ENDPOINTS ---

@router.get("/results/student/{student_id}", response_model=StudentReportCardOut)
def get_student_report_card(
    student_id: int,
    academic_year_id: Optional[int] = Query(None),
    exam_type: Optional[str] = Query(None),
    exam_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Scoped permissions: Student only self, Parent only children
    if current_user.role.name == "Student" and current_user.student_profile:
        if student.id != current_user.student_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        if student.parent_id != current_user.parent_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return build_student_report_card_data(
        student=student,
        academic_year_id=academic_year_id,
        exam_type=exam_type,
        exam_name=exam_name,
        db=db
    )


@router.get("/results/class/{class_id}", response_model=ClassResultReportOut)
def get_class_result_report(
    class_id: int,
    section_id: Optional[int] = Query(None),
    exam_name: Optional[str] = Query(None),
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    school_class = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    student_query = db.query(Student).filter(Student.class_id == class_id)
    if section_id:
        student_query = student_query.filter(Student.section_id == section_id)
    students = student_query.order_by(Student.roll_number.asc(), Student.id.asc()).all()

    student_summaries = []
    passed_students = 0
    failed_students = 0
    absent_students = 0
    total_pct_sum = 0.0
    highest_pct = 0.0
    lowest_pct = 100.0 if students else 0.0

    for s in students:
        rep = build_student_report_card_data(
            student=s,
            academic_year_id=academic_year_id,
            exam_type=None,
            exam_name=exam_name,
            db=db
        )
        student_summaries.append(rep)

        if rep["result_status"] == "PASS":
            passed_students += 1
        else:
            failed_students += 1

        total_pct_sum += rep["overall_percentage"]
        if rep["overall_percentage"] > highest_pct:
            highest_pct = rep["overall_percentage"]
        if rep["overall_percentage"] < lowest_pct:
            lowest_pct = rep["overall_percentage"]

    total_count = len(students)
    pass_pct = round((passed_students / total_count * 100), 2) if total_count > 0 else 0.0
    avg_pct = round((total_pct_sum / total_count), 2) if total_count > 0 else 0.0

    section_obj = db.query(Section).filter(Section.id == section_id).first() if section_id else None

    return {
        "class_id": school_class.id,
        "class_name": school_class.name,
        "section_id": section_id,
        "section_name": section_obj.name if section_obj else None,
        "exam_name": exam_name or "All Exams",
        "total_students": total_count,
        "appeared_students": total_count - absent_students,
        "passed_students": passed_students,
        "failed_students": failed_students,
        "absent_students": absent_students,
        "pass_percentage": pass_pct,
        "class_average_percentage": avg_pct,
        "highest_percentage": highest_pct,
        "lowest_percentage": lowest_pct if total_count > 0 else 0.0,
        "students_summary": student_summaries
    }


@router.get("/results/exam/{exam_id}")
def get_exam_result_analytics(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    marks = db.query(ExamMark).filter(ExamMark.exam_id == exam_id).all()
    total_entered = len(marks)
    appeared = [m for m in marks if not m.is_absent]
    absent_count = total_entered - len(appeared)

    scores = [m.marks_obtained for m in appeared]
    passed_count = sum(1 for m in appeared if m.marks_obtained >= exam.passing_marks)
    failed_count = len(appeared) - passed_count

    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    highest_score = max(scores) if scores else 0.0
    lowest_score = min(scores) if scores else 0.0
    pass_pct = round((passed_count / len(appeared) * 100), 2) if appeared else 0.0

    return {
        "exam_id": exam.id,
        "exam_name": exam.name,
        "exam_type": exam.exam_type,
        "subject_name": exam.subject.name if exam.subject else None,
        "class_name": exam.school_class.name if exam.school_class else None,
        "section_name": exam.section.name if exam.section else None,
        "total_marks": exam.total_marks,
        "passing_marks": exam.passing_marks,
        "total_marks_entered": total_entered,
        "appeared_count": len(appeared),
        "absent_count": absent_count,
        "passed_count": passed_count,
        "failed_count": failed_count,
        "pass_percentage": pass_pct,
        "average_score": avg_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "marks": [build_exam_mark_out(m) for m in marks]
    }
