from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserOut, RoleOut
from app.dependencies.auth import get_current_active_user, require_roles, get_role_category, ROLE_CATEGORIES

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
def get_all_users(
    role_category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    query = db.query(User)
    users = query.all()
    
    result = []
    for user in users:
        cat = get_role_category(user.role.name if user.role else "")
        if role_category and cat.lower() != role_category.lower():
            continue
        user_dict = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "role_id": user.role_id,
            "role_category": cat,
            "role": user.role,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
        result.append(user_dict)
    return result

@router.get("/roles", response_model=List[RoleOut])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    roles = db.query(Role).all()
    return roles

