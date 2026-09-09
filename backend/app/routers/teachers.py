from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.profiles import Teacher
from app.schemas.people import TeacherCreate, TeacherUpdate, TeacherOut
from app.utils.security import get_password_hash
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/teachers", tags=["Teacher Management"])

def build_teacher_out(teacher: Teacher) -> dict:
    return {
        "id": teacher.id,
        "user_id": teacher.user_id,
        "full_name": teacher.user.full_name,
        "email": teacher.user.email,
        "username": teacher.user.username,
        "phone": teacher.user.phone,
        "employee_id": teacher.employee_id,
        "gender": teacher.gender,
        "date_of_birth": teacher.date_of_birth,
        "address": teacher.address,
        "qualification": teacher.qualification,
        "designation": teacher.designation,
        "department": teacher.department,
        "joining_date": teacher.joining_date,
        "salary": teacher.salary,
        "status": teacher.status,
        "assigned_sections_count": len(teacher.assigned_sections),
        "created_at": teacher.created_at,
        "updated_at": teacher.updated_at
    }

@router.get("", response_model=List[TeacherOut])
def get_teachers(
    search: Optional[str] = Query(None, description="Search by name, employee_id, email or department"),
    department: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Teacher).join(User)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt)) |
            (Teacher.employee_id.ilike(search_fmt)) |
            (Teacher.department.ilike(search_fmt))
        )
    if department:
        query = query.filter(Teacher.department == department)
    if status_filter:
        query = query.filter(Teacher.status == status_filter)

    teachers = query.offset(skip).limit(limit).all()
    return [build_teacher_out(t) for t in teachers]


@router.post("", response_model=TeacherOut, status_code=status.HTTP_201_CREATED)
def create_teacher(
    data: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    if db.query(User).filter((User.email == data.email) | (User.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    if db.query(Teacher).filter(Teacher.employee_id == data.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    teacher_role = db.query(Role).filter(Role.name == "Teacher").first()
    if not teacher_role:
        raise HTTPException(status_code=500, detail="Teacher role not configured in database")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password or "password123"),
        full_name=f"{data.first_name} {data.last_name}".strip(),
        phone=data.phone,
        role_id=teacher_role.id,
        is_active=True
    )
    db.add(user)
    db.flush()

    teacher = Teacher(
        user_id=user.id,
        employee_id=data.employee_id,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        address=data.address,
        qualification=data.qualification,
        designation=data.designation,
        department=data.department,
        joining_date=data.joining_date,
        salary=data.salary,
        status="Active"
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return build_teacher_out(teacher)


@router.get("/{id}", response_model=TeacherOut)
def get_teacher(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    teacher = db.query(Teacher).filter(Teacher.id == id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")
    return build_teacher_out(teacher)


@router.put("/{id}", response_model=TeacherOut)
def update_teacher(
    id: int,
    data: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    teacher = db.query(Teacher).filter(Teacher.id == id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")

    user = teacher.user
    if data.first_name is not None or data.last_name is not None:
        fn = data.first_name if data.first_name is not None else user.full_name.split()[0]
        ln = data.last_name if data.last_name is not None else " ".join(user.full_name.split()[1:])
        user.full_name = f"{fn} {ln}".strip()
    if data.email is not None:
        user.email = data.email
    if data.phone is not None:
        user.phone = data.phone

    for field, val in data.model_dump(exclude_unset=True).items():
        if field not in ["first_name", "last_name", "email", "phone"] and hasattr(teacher, field):
            setattr(teacher, field, val)

    db.commit()
    db.refresh(teacher)
    return build_teacher_out(teacher)


@router.delete("/{id}")
def delete_teacher(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    teacher = db.query(Teacher).filter(Teacher.id == id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher record not found")
    
    teacher.status = "Inactive"
    teacher.user.is_active = False
    db.commit()
    return {"message": "Teacher deactivated successfully"}
