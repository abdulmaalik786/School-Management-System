from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.profiles import Parent, Student
from app.schemas.people import ParentCreate, ParentUpdate, ParentOut
from app.utils.security import get_password_hash
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/parents", tags=["Parent Management"])

def build_parent_out(parent: Parent) -> dict:
    children_data = [
        {
            "id": s.id,
            "full_name": s.user.full_name if s.user else "Unknown",
            "admission_number": s.admission_number,
            "class_name": s.school_class.name if s.school_class else None,
            "section_name": s.section.name if s.section else None
        }
        for s in parent.children
    ]
    return {
        "id": parent.id,
        "user_id": parent.user_id,
        "full_name": parent.user.full_name,
        "email": parent.user.email,
        "username": parent.user.username,
        "phone": parent.user.phone,
        "occupation": parent.occupation,
        "relationship_type": parent.relationship_type,
        "address": parent.address,
        "children_count": len(parent.children),
        "children": children_data,
        "created_at": parent.created_at,
        "updated_at": parent.updated_at
    }

@router.get("", response_model=List[ParentOut])
def get_parents(
    search: Optional[str] = Query(None, description="Search by parent name, email or occupation"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Parent).join(User)

    if current_user.role.name == "Parent" and current_user.parent_profile:
        query = query.filter(Parent.id == current_user.parent_profile.id)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt)) |
            (Parent.occupation.ilike(search_fmt))
        )

    parents = query.offset(skip).limit(limit).all()
    return [build_parent_out(p) for p in parents]


@router.post("", response_model=ParentOut, status_code=status.HTTP_201_CREATED)
def create_parent(
    data: ParentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    if db.query(User).filter((User.email == data.email) | (User.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    parent_role = db.query(Role).filter(Role.name == "Parent").first()
    if not parent_role:
        raise HTTPException(status_code=500, detail="Parent role not configured in database")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password or "password123"),
        full_name=f"{data.first_name} {data.last_name}".strip(),
        phone=data.phone,
        role_id=parent_role.id,
        is_active=True
    )
    db.add(user)
    db.flush()

    parent = Parent(
        user_id=user.id,
        occupation=data.occupation,
        relationship_type=data.relationship_type,
        address=data.address
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    return build_parent_out(parent)


@router.get("/{id}", response_model=ParentOut)
def get_parent(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    parent = db.query(Parent).filter(Parent.id == id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent record not found")

    if current_user.role.name == "Parent" and current_user.parent_profile:
        if parent.id != current_user.parent_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to access another parent's profile")

    return build_parent_out(parent)


@router.put("/{id}", response_model=ParentOut)
def update_parent(
    id: int,
    data: ParentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    parent = db.query(Parent).filter(Parent.id == id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent record not found")

    user = parent.user
    if data.first_name is not None or data.last_name is not None:
        fn = data.first_name if data.first_name is not None else user.full_name.split()[0]
        ln = data.last_name if data.last_name is not None else " ".join(user.full_name.split()[1:])
        user.full_name = f"{fn} {ln}".strip()
    if data.email is not None:
        user.email = data.email
    if data.phone is not None:
        user.phone = data.phone

    for field, val in data.model_dump(exclude_unset=True).items():
        if field not in ["first_name", "last_name", "email", "phone"] and hasattr(parent, field):
            setattr(parent, field, val)

    db.commit()
    db.refresh(parent)
    return build_parent_out(parent)


@router.delete("/{id}")
def delete_parent(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin"]))
):
    parent = db.query(Parent).filter(Parent.id == id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent record not found")
    
    parent.user.is_active = False
    db.commit()
    return {"message": "Parent account deactivated successfully"}
