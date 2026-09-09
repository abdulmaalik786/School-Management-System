from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.timetable import Period, TimetableEntry
from app.models.academic import AcademicYear, SchoolClass, Section, Subject
from app.models.profiles import Teacher
from app.schemas.timetable import (
    PeriodCreate, PeriodUpdate, PeriodOut,
    TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api", tags=["Timetable Management"])

# --- PERIOD MANAGEMENT ---

@router.get("/periods", response_model=List[PeriodOut])
def get_periods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    periods = db.query(Period).order_by(Period.sort_order.asc(), Period.start_time.asc()).all()
    return periods

@router.post("/periods", response_model=PeriodOut, status_code=status.HTTP_201_CREATED)
def create_period(
    data: PeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    period = Period(**data.model_dump())
    db.add(period)
    db.commit()
    db.refresh(period)
    return period

@router.put("/periods/{id}", response_model=PeriodOut)
def update_period(
    id: int,
    data: PeriodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    period = db.query(Period).filter(Period.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(period, k, v)

    db.commit()
    db.refresh(period)
    return period

@router.delete("/periods/{id}")
def delete_period(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    period = db.query(Period).filter(Period.id == id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    
    db.delete(period)
    db.commit()
    return {"message": "Period deleted successfully"}


# --- TIMETABLE ENTRIES & CONFLICT DETECTION ---

def build_timetable_out(entry: TimetableEntry) -> dict:
    teacher_name = entry.teacher.user.full_name if entry.teacher and entry.teacher.user else None
    return {
        "id": entry.id,
        "academic_year_id": entry.academic_year_id,
        "academic_year_name": entry.academic_year.name if entry.academic_year else None,
        "class_id": entry.class_id,
        "class_name": entry.school_class.name if entry.school_class else None,
        "section_id": entry.section_id,
        "section_name": entry.section.name if entry.section else None,
        "subject_id": entry.subject_id,
        "subject_name": entry.subject.name if entry.subject else None,
        "subject_code": entry.subject.code if entry.subject else None,
        "teacher_id": entry.teacher_id,
        "teacher_name": teacher_name,
        "period_id": entry.period_id,
        "period_name": entry.period.name if entry.period else None,
        "period_start": entry.period.start_time if entry.period else None,
        "period_end": entry.period.end_time if entry.period else None,
        "is_break": entry.period.is_break if entry.period else False,
        "day_of_week": entry.day_of_week,
        "room_number": entry.room_number,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at
    }

def check_timetable_conflicts(
    db: Session,
    day_of_week: str,
    period_id: int,
    class_id: int,
    section_id: int,
    teacher_id: Optional[int] = None,
    room_number: Optional[str] = None,
    exclude_entry_id: Optional[int] = None
):
    period = db.query(Period).filter(Period.id == period_id).first()
    period_name = period.name if period else f"Period #{period_id}"

    # 1. Class / Section Conflict: Same class/section already has a class scheduled at this day and period
    cls_conflict_q = db.query(TimetableEntry).filter(
        TimetableEntry.day_of_week == day_of_week,
        TimetableEntry.period_id == period_id,
        TimetableEntry.class_id == class_id,
        TimetableEntry.section_id == section_id
    )
    if exclude_entry_id:
        cls_conflict_q = cls_conflict_q.filter(TimetableEntry.id != exclude_entry_id)
    cls_conflict = cls_conflict_q.first()
    if cls_conflict:
        subj_name = cls_conflict.subject.name if cls_conflict.subject else "another subject"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CLASS CONFLICT: This section already has {subj_name} scheduled on {day_of_week} during {period_name}."
        )

    # 2. Teacher Conflict: Same teacher is assigned to another class/section at the same day & period
    if teacher_id:
        tch_conflict_q = db.query(TimetableEntry).filter(
            TimetableEntry.day_of_week == day_of_week,
            TimetableEntry.period_id == period_id,
            TimetableEntry.teacher_id == teacher_id
        )
        if exclude_entry_id:
            tch_conflict_q = tch_conflict_q.filter(TimetableEntry.id != exclude_entry_id)
        tch_conflict = tch_conflict_q.first()
        if tch_conflict:
            tch_name = tch_conflict.teacher.user.full_name if tch_conflict.teacher and tch_conflict.teacher.user else "Teacher"
            other_cls = tch_conflict.school_class.name if tch_conflict.school_class else "another class"
            other_sec = tch_conflict.section.name if tch_conflict.section else ""
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"TEACHER CONFLICT: {tch_name} is already teaching {other_cls} (Sec {other_sec}) on {day_of_week} during {period_name}."
            )

    # 3. Room Conflict: Same room is assigned to another class at the same day & period
    if room_number and room_number.strip():
        rm_conflict_q = db.query(TimetableEntry).filter(
            TimetableEntry.day_of_week == day_of_week,
            TimetableEntry.period_id == period_id,
            TimetableEntry.room_number.ilike(room_number.strip())
        )
        if exclude_entry_id:
            rm_conflict_q = rm_conflict_q.filter(TimetableEntry.id != exclude_entry_id)
        rm_conflict = rm_conflict_q.first()
        if rm_conflict:
            other_cls = rm_conflict.school_class.name if rm_conflict.school_class else "another class"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ROOM CONFLICT: Room {room_number} is already occupied by {other_cls} on {day_of_week} during {period_name}."
            )


@router.get("/timetable", response_model=List[TimetableEntryOut])
def get_timetable(
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    room_number: Optional[str] = Query(None),
    day_of_week: Optional[str] = Query(None),
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(TimetableEntry)

    # Teacher permission filter: Teacher viewing own schedule
    if current_user.role.name == "Teacher" and current_user.teacher_profile and not (class_id or section_id):
        query = query.filter(TimetableEntry.teacher_id == current_user.teacher_profile.id)

    if class_id:
        query = query.filter(TimetableEntry.class_id == class_id)
    if section_id:
        query = query.filter(TimetableEntry.section_id == section_id)
    if teacher_id:
        query = query.filter(TimetableEntry.teacher_id == teacher_id)
    if room_number:
        query = query.filter(TimetableEntry.room_number.ilike(f"%{room_number}%"))
    if day_of_week:
        query = query.filter(TimetableEntry.day_of_week == day_of_week)
    if academic_year_id:
        query = query.filter(TimetableEntry.academic_year_id == academic_year_id)

    entries = query.all()
    return [build_timetable_out(e) for e in entries]


@router.post("/timetable", response_model=TimetableEntryOut, status_code=status.HTTP_201_CREATED)
def create_timetable_entry(
    data: TimetableEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    # Mandatory Conflict Checking
    check_timetable_conflicts(
        db=db,
        day_of_week=data.day_of_week,
        period_id=data.period_id,
        class_id=data.class_id,
        section_id=data.section_id,
        teacher_id=data.teacher_id,
        room_number=data.room_number
    )

    entry = TimetableEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return build_timetable_out(entry)


@router.put("/timetable/{id}", response_model=TimetableEntryOut)
def update_timetable_entry(
    id: int,
    data: TimetableEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    update_data = data.model_dump(exclude_unset=True)

    day_of_week = update_data.get("day_of_week", entry.day_of_week)
    period_id = update_data.get("period_id", entry.period_id)
    class_id = update_data.get("class_id", entry.class_id)
    section_id = update_data.get("section_id", entry.section_id)
    teacher_id = update_data.get("teacher_id", entry.teacher_id)
    room_number = update_data.get("room_number", entry.room_number)

    check_timetable_conflicts(
        db=db,
        day_of_week=day_of_week,
        period_id=period_id,
        class_id=class_id,
        section_id=section_id,
        teacher_id=teacher_id,
        room_number=room_number,
        exclude_entry_id=entry.id
    )

    for k, v in update_data.items():
        setattr(entry, k, v)

    db.commit()
    db.refresh(entry)
    return build_timetable_out(entry)


@router.delete("/timetable/{id}")
def delete_timetable_entry(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Timetable entry deleted successfully"}
