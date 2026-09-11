from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest
from app.schemas.user import UserOut
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.dependencies.auth import get_current_active_user, get_role_category

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    username_or_email = ""
    password = ""

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        username_or_email = body.get("username_or_email") or body.get("username") or ""
        password = body.get("password") or ""
    else:
        form = await request.form()
        username_or_email = form.get("username") or form.get("username_or_email") or ""
        password = form.get("password") or ""

    if not username_or_email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/email and password are required"
        )

    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled"
        )

    role_category = get_role_category(user.role.name)
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.name, "role_category": role_category})

    user_dict = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.name,
        "role_category": role_category,
        "role_id": user.role_id
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_active_user)):
    role_category = get_role_category(current_user.role.name)
    profile_data = None
    
    if current_user.admin_profile:
        profile_data = {
            "type": "Admin",
            "admin_code": current_user.admin_profile.admin_code,
            "access_level": current_user.admin_profile.access_level,
            "department_oversight": current_user.admin_profile.department_oversight,
            "office_location": current_user.admin_profile.office_location
        }
    elif current_user.teacher_profile:
        profile_data = {
            "type": "Teacher",
            "employee_id": current_user.teacher_profile.employee_id,
            "department": current_user.teacher_profile.department,
            "designation": current_user.teacher_profile.designation,
            "qualification": current_user.teacher_profile.qualification,
            "salary": current_user.teacher_profile.salary
        }
    elif current_user.student_profile:
        profile_data = {
            "type": "Student",
            "admission_number": current_user.student_profile.admission_number,
            "roll_number": current_user.student_profile.roll_number,
            "emergency_contact": current_user.student_profile.emergency_contact,
            "class_id": current_user.student_profile.class_id,
            "section_id": current_user.student_profile.section_id
        }
    elif current_user.parent_profile:
        profile_data = {
            "type": "Parent",
            "occupation": current_user.parent_profile.occupation,
            "relationship_type": current_user.parent_profile.relationship_type,
            "address": current_user.parent_profile.address
        }
    elif current_user.staff_profile:
        profile_data = {
            "type": "Staff",
            "employee_id": current_user.staff_profile.employee_id,
            "department": current_user.staff_profile.department,
            "designation": current_user.staff_profile.designation
        }

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "is_active": current_user.is_active,
        "role_id": current_user.role_id,
        "role_category": role_category,
        "role": {
            "id": current_user.role.id,
            "name": current_user.role.name,
            "description": current_user.role.description
        },
        "profile": profile_data,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }



@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
