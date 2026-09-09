from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student, Teacher
from app.models.academic import SchoolClass, Section, Subject
from app.models.extended import Assignment, AssignmentSubmission
from app.schemas.extended import (
    AssignmentCreate, AssignmentUpdate, AssignmentOut,
    SubmissionCreate, SubmissionGrade, SubmissionOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/assignments", tags=["Assignments & Homework"])

def build_submission_out(s: AssignmentSubmission) -> dict:
    stu = s.student
    return {
        "id": s.id,
        "assignment_id": s.assignment_id,
        "student_id": s.student_id,
        "student_name": stu.user.full_name if stu and stu.user else f"{stu.first_name} {stu.last_name}" if stu else None,
        "admission_number": stu.admission_number if stu else None,
        "roll_number": stu.roll_number if stu else None,
        "class_name": stu.school_class.name if stu and stu.school_class else None,
        "submission_text": s.submission_text,
        "attachment_url": s.attachment_url,
        "submitted_at": s.submitted_at,
        "marks_obtained": s.marks_obtained,
        "feedback": s.feedback,
        "status": s.status,
        "graded_at": s.graded_at,
        "graded_by_name": s.graded_by.full_name if s.graded_by else None
    }

def build_assignment_out(a: Assignment, db: Session, current_user: Optional[User] = None) -> dict:
    sub_count = len(a.submissions)
    graded_count = sum(1 for s in a.submissions if s.status == "Graded")

    my_sub = None
    if current_user and current_user.role.name == "Student" and current_user.student_profile:
        s_obj = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.student_id == current_user.student_profile.id
        ).first()
        if s_obj:
            my_sub = build_submission_out(s_obj)

    return {
        "id": a.id,
        "title": a.title,
        "description": a.description,
        "class_id": a.class_id,
        "class_name": a.school_class.name if a.school_class else None,
        "section_id": a.section_id,
        "section_name": a.section.name if a.section else None,
        "subject_id": a.subject_id,
        "subject_name": a.subject.name if a.subject else None,
        "subject_code": a.subject.code if a.subject else None,
        "teacher_id": a.teacher_id,
        "teacher_name": a.teacher.user.full_name if a.teacher and a.teacher.user else None,
        "due_date": a.due_date,
        "max_marks": a.max_marks,
        "attachment_url": a.attachment_url,
        "submissions_count": sub_count,
        "graded_count": graded_count,
        "my_submission": my_sub,
        "created_at": a.created_at,
        "updated_at": a.updated_at
    }


@router.get("", response_model=List[AssignmentOut])
def get_assignments(
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Assignment)

    if current_user.role.name == "Student" and current_user.student_profile:
        stu = current_user.student_profile
        query = query.filter(Assignment.class_id == stu.class_id)
        if stu.section_id:
            query = query.filter((Assignment.section_id == stu.section_id) | (Assignment.section_id.is_(None)))
    elif current_user.role.name == "Teacher" and current_user.teacher_profile:
        t_id = current_user.teacher_profile.id
        query = query.filter(Assignment.teacher_id == t_id)
    elif class_id:
        query = query.filter(Assignment.class_id == class_id)
        if section_id:
            query = query.filter((Assignment.section_id == section_id) | (Assignment.section_id.is_(None)))

    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)

    assignments = query.order_by(Assignment.due_date.asc(), Assignment.id.desc()).all()
    return [build_assignment_out(a, db, current_user) for a in assignments]


@router.post("", response_model=AssignmentOut, status_code=status.HTTP_201_CREATED)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    teacher_id = current_user.teacher_profile.id if current_user.teacher_profile else None

    assignment = Assignment(
        title=data.title,
        description=data.description,
        class_id=data.class_id,
        section_id=data.section_id,
        subject_id=data.subject_id,
        teacher_id=teacher_id,
        due_date=data.due_date,
        max_marks=data.max_marks,
        attachment_url=data.attachment_url
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return build_assignment_out(assignment, db, current_user)


@router.put("/{id}", response_model=AssignmentOut)
def update_assignment(
    id: int,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    a = db.query(Assignment).filter(Assignment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(a, k, v)

    db.commit()
    db.refresh(a)
    return build_assignment_out(a, db, current_user)


@router.delete("/{id}")
def delete_assignment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    a = db.query(Assignment).filter(Assignment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(a)
    db.commit()
    return {"message": "Assignment deleted successfully"}


@router.post("/{id}/submit", response_model=SubmissionOut)
def submit_assignment(
    id: int,
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Student", "Super Admin"]))
):
    a = db.query(Assignment).filter(Assignment.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    student_id = current_user.student_profile.id if current_user.student_profile else None
    if not student_id:
        raise HTTPException(status_code=400, detail="User does not have an active student profile")

    sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == id,
        AssignmentSubmission.student_id == student_id
    ).first()

    today = date.today()
    stat = "Late" if today > a.due_date else "Submitted"

    if not sub:
        sub = AssignmentSubmission(
            assignment_id=id,
            student_id=student_id,
            submission_text=data.submission_text,
            attachment_url=data.attachment_url,
            status=stat
        )
        db.add(sub)
    else:
        sub.submission_text = data.submission_text
        sub.attachment_url = data.attachment_url
        sub.submitted_at = datetime.now()
        sub.status = stat

    db.commit()
    db.refresh(sub)
    return build_submission_out(sub)


@router.get("/{id}/submissions", response_model=List[SubmissionOut])
def get_assignment_submissions(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == id).all()
    return [build_submission_out(s) for s in subs]


@router.put("/submissions/{submission_id}/grade", response_model=SubmissionOut)
def grade_submission(
    submission_id: int,
    data: SubmissionGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if data.marks_obtained > sub.assignment.max_marks:
        raise HTTPException(status_code=400, detail=f"Score cannot exceed max marks ({sub.assignment.max_marks})")

    sub.marks_obtained = data.marks_obtained
    sub.feedback = data.feedback
    sub.status = "Graded"
    sub.graded_at = datetime.now()
    sub.graded_by_id = current_user.id

    db.commit()
    db.refresh(sub)
    return build_submission_out(sub)
