from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.profiles import Student, Parent
from app.models.academic import SchoolClass, Section, AcademicYear
from app.schemas.people import StudentCreate, StudentUpdate, StudentOut
from app.utils.security import get_password_hash
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/students", tags=["Student Management"])

def build_student_out(student: Student) -> dict:
    return {
        "id": student.id,
        "user_id": student.user_id,
        "full_name": student.user.full_name,
        "email": student.user.email,
        "username": student.user.username,
        "phone": student.user.phone,
        "admission_number": student.admission_number,
        "roll_number": student.roll_number,
        "gender": student.gender,
        "date_of_birth": student.date_of_birth,
        "blood_group": student.blood_group,
        "address": student.address,
        "emergency_contact": student.emergency_contact,
        "admission_date": student.admission_date,
        "photo_url": student.photo_url,
        "status": student.status,
        "parent_id": student.parent_id,
        "parent_name": student.parent.user.full_name if student.parent and student.parent.user else None,
        "class_id": student.class_id,
        "class_name": student.school_class.name if student.school_class else None,
        "section_id": student.section_id,
        "section_name": student.section.name if student.section else None,
        "academic_year_id": student.academic_year_id,
        "academic_year_name": student.academic_year.name if student.academic_year else None,
        "created_at": student.created_at,
        "updated_at": student.updated_at
    }

@router.get("", response_model=List[StudentOut])
def get_students(
    search: Optional[str] = Query(None, description="Search by name, roll, email or admission number"),
    class_id: Optional[int] = Query(None),
    section_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Student).join(User)

    # Permission filter: Parent can only see own children, Student only self
    if current_user.role.name == "Parent" and current_user.parent_profile:
        query = query.filter(Student.parent_id == current_user.parent_profile.id)
    elif current_user.role.name == "Student" and current_user.student_profile:
        query = query.filter(Student.id == current_user.student_profile.id)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt)) |
            (Student.admission_number.ilike(search_fmt)) |
            (Student.roll_number.ilike(search_fmt))
        )
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if section_id:
        query = query.filter(Student.section_id == section_id)
    if status_filter:
        query = query.filter(Student.status == status_filter)

    students = query.offset(skip).limit(limit).all()
    return [build_student_out(s) for s in students]


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    # Verify uniqueness of email, username, admission_number
    if db.query(User).filter((User.email == data.email) | (User.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    if db.query(Student).filter(Student.admission_number == data.admission_number).first():
        raise HTTPException(status_code=400, detail="Admission number already registered")

    student_role = db.query(Role).filter(Role.name == "Student").first()
    if not student_role:
        raise HTTPException(status_code=500, detail="Student role not configured in database")

    # Create User entity
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password or "password123"),
        full_name=f"{data.first_name} {data.last_name}".strip(),
        phone=data.phone,
        role_id=student_role.id,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create Student profile entity
    student = Student(
        user_id=user.id,
        admission_number=data.admission_number,
        roll_number=data.roll_number,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        blood_group=data.blood_group,
        address=data.address,
        emergency_contact=data.emergency_contact,
        admission_date=data.admission_date,
        photo_url=data.photo_url,
        parent_id=data.parent_id,
        class_id=data.class_id,
        section_id=data.section_id,
        academic_year_id=data.academic_year_id,
        status="Active"
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return build_student_out(student)


@router.get("/{id}", response_model=StudentOut)
def get_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    
    if current_user.role.name == "Parent" and current_user.parent_profile:
        if student.parent_id != current_user.parent_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this student profile")
    elif current_user.role.name == "Student" and current_user.student_profile:
        if student.id != current_user.student_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this student profile")

    return build_student_out(student)


@router.put("/{id}", response_model=StudentOut)
def update_student(
    id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    user = student.user
    if data.first_name is not None or data.last_name is not None:
        fn = data.first_name if data.first_name is not None else user.full_name.split()[0]
        ln = data.last_name if data.last_name is not None else " ".join(user.full_name.split()[1:])
        user.full_name = f"{fn} {ln}".strip()
    if data.email is not None:
        user.email = data.email
    if data.phone is not None:
        user.phone = data.phone

    for field, val in data.model_dump(exclude_unset=True).items():
        if field not in ["first_name", "last_name", "email", "phone"] and hasattr(student, field):
            setattr(student, field, val)

    db.commit()
    db.refresh(student)
    return build_student_out(student)


@router.delete("/{id}")
def delete_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    
    # Set inactive status & disable user
    student.status = "Inactive"
    student.user.is_active = False
    db.commit()
    return {"message": "Student deactivated successfully"}
