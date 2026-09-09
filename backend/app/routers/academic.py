from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.academic import AcademicYear, SchoolClass, Section, Subject
from app.models.profiles import Student, Teacher
from app.schemas.academic import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearOut,
    SchoolClassCreate, SchoolClassUpdate, SchoolClassOut,
    SectionCreate, SectionUpdate, SectionOut,
    SubjectCreate, SubjectUpdate, SubjectOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api", tags=["Academic Management"])

# --- ACADEMIC YEARS ---

@router.get("/academic-years", response_model=List[AcademicYearOut])
def get_academic_years(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    years = db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).all()
    return years

@router.post("/academic-years", response_model=AcademicYearOut, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    if db.query(AcademicYear).filter(AcademicYear.name == data.name).first():
        raise HTTPException(status_code=400, detail="Academic year name already exists")

    if data.is_active:
        db.query(AcademicYear).update({AcademicYear.is_active: False})

    ay = AcademicYear(**data.model_dump())
    db.add(ay)
    db.commit()
    db.refresh(ay)
    return ay

@router.put("/academic-years/{id}", response_model=AcademicYearOut)
def update_academic_year(
    id: int,
    data: AcademicYearUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    ay = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")

    update_dict = data.model_dump(exclude_unset=True)
    if update_dict.get("is_active"):
        db.query(AcademicYear).update({AcademicYear.is_active: False})

    for k, v in update_dict.items():
        setattr(ay, k, v)

    db.commit()
    db.refresh(ay)
    return ay

@router.post("/academic-years/{id}/activate", response_model=AcademicYearOut)
def activate_academic_year(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    ay = db.query(AcademicYear).filter(AcademicYear.id == id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")

    db.query(AcademicYear).update({AcademicYear.is_active: False})
    ay.is_active = True
    db.commit()
    db.refresh(ay)
    return ay


# --- CLASSES & SECTIONS ---

def build_class_out(sc: SchoolClass) -> dict:
    total_class_students = len(sc.students)
    sections_out = []
    for sec in sc.sections:
        teacher_name = sec.class_teacher.user.full_name if sec.class_teacher and sec.class_teacher.user else None
        sections_out.append({
            "id": sec.id,
            "name": sec.name,
            "class_teacher_id": sec.class_teacher_id,
            "class_teacher_name": teacher_name,
            "student_count": len(sec.students)
        })
    return {
        "id": sc.id,
        "name": sc.name,
        "numeric_grade": sc.numeric_grade,
        "description": sc.description,
        "sections": sections_out,
        "student_count": total_class_students,
        "created_at": sc.created_at,
        "updated_at": sc.updated_at
    }

@router.get("/classes", response_model=List[SchoolClassOut])
def get_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    classes = db.query(SchoolClass).order_by(SchoolClass.numeric_grade.asc(), SchoolClass.name.asc()).all()
    return [build_class_out(c) for c in classes]

@router.post("/classes", response_model=SchoolClassOut, status_code=status.HTTP_201_CREATED)
def create_class(
    data: SchoolClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    if db.query(SchoolClass).filter(SchoolClass.name == data.name).first():
        raise HTTPException(status_code=400, detail="Class name already exists")

    sc = SchoolClass(**data.model_dump())
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return build_class_out(sc)

@router.put("/classes/{id}", response_model=SchoolClassOut)
def update_class(
    id: int,
    data: SchoolClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    sc = db.query(SchoolClass).filter(SchoolClass.id == id).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Class not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(sc, k, v)

    db.commit()
    db.refresh(sc)
    return build_class_out(sc)

@router.delete("/classes/{id}")
def delete_class(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    sc = db.query(SchoolClass).filter(SchoolClass.id == id).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(sc)
    db.commit()
    return {"message": "Class deleted successfully"}


# SECTIONS
def build_section_out(sec: Section) -> dict:
    teacher_name = sec.class_teacher.user.full_name if sec.class_teacher and sec.class_teacher.user else None
    return {
        "id": sec.id,
        "name": sec.name,
        "class_id": sec.class_id,
        "class_name": sec.school_class.name if sec.school_class else None,
        "class_teacher_id": sec.class_teacher_id,
        "class_teacher_name": teacher_name,
        "student_count": len(sec.students),
        "created_at": sec.created_at,
        "updated_at": sec.updated_at
    }

@router.post("/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED)
def create_section(
    data: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    sc = db.query(SchoolClass).filter(SchoolClass.id == data.class_id).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Class not found")

    if db.query(Section).filter(Section.class_id == data.class_id, Section.name == data.name).first():
        raise HTTPException(status_code=400, detail=f"Section {data.name} already exists in {sc.name}")

    sec = Section(**data.model_dump())
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return build_section_out(sec)

@router.put("/sections/{id}", response_model=SectionOut)
def update_section(
    id: int,
    data: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    sec = db.query(Section).filter(Section.id == id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(sec, k, v)

    db.commit()
    db.refresh(sec)
    return build_section_out(sec)

@router.delete("/sections/{id}")
def delete_section(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    sec = db.query(Section).filter(Section.id == id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    
    db.delete(sec)
    db.commit()
    return {"message": "Section deleted successfully"}


# --- SUBJECTS ---

def build_subject_out(subj: Subject) -> dict:
    teacher_name = subj.teacher.user.full_name if subj.teacher and subj.teacher.user else None
    return {
        "id": subj.id,
        "name": subj.name,
        "code": subj.code,
        "description": subj.description,
        "weekly_periods": subj.weekly_periods,
        "class_id": subj.class_id,
        "class_name": subj.school_class.name if subj.school_class else None,
        "teacher_id": subj.teacher_id,
        "teacher_name": teacher_name,
        "created_at": subj.created_at,
        "updated_at": subj.updated_at
    }

@router.get("/subjects", response_model=List[SubjectOut])
def get_subjects(
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Subject)
    if class_id:
        query = query.filter(Subject.class_id == class_id)
    if teacher_id:
        query = query.filter(Subject.teacher_id == teacher_id)

    subjects = query.order_by(Subject.name.asc()).all()
    return [build_subject_out(s) for s in subjects]

@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    if db.query(Subject).filter(Subject.code == data.code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subj = Subject(**data.model_dump())
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return build_subject_out(subj)

@router.put("/subjects/{id}", response_model=SubjectOut)
def update_subject(
    id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    subj = db.query(Subject).filter(Subject.id == id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(subj, k, v)

    db.commit()
    db.refresh(subj)
    return build_subject_out(subj)

@router.delete("/subjects/{id}")
def delete_subject(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    subj = db.query(Subject).filter(Subject.id == id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subj)
    db.commit()
    return {"message": "Subject deleted successfully"}
