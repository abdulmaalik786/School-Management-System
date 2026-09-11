from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return current_user

ADMIN_ROLES = {"Super Admin", "School Admin", "Principal", "Admin"}

ROLE_CATEGORIES = {
    "Admin": ["Super Admin", "School Admin", "Principal", "Admin"],
    "Teacher": ["Teacher"],
    "Student": ["Student"],
    "Parent": ["Parent"],
    "Staff": ["Accountant", "Librarian", "Staff"]
}

def get_role_category(role_name: str) -> str:
    for category, roles in ROLE_CATEGORIES.items():
        if role_name in roles:
            return category
    return "Staff"

def require_roles(allowed_roles: list[str]):
    expanded_allowed = set(allowed_roles)
    for role in list(expanded_allowed):
        if role in ROLE_CATEGORIES:
            expanded_allowed.update(ROLE_CATEGORIES[role])
        if role in ADMIN_ROLES:
            expanded_allowed.update(ADMIN_ROLES)

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = current_user.role.name if current_user.role else ""
        if not user_role or user_role not in expanded_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


require_admin = require_roles(["Admin"])
require_teacher = require_roles(["Teacher"])
require_student = require_roles(["Student"])
require_parent = require_roles(["Parent"])
require_staff = require_roles(["Staff"])

# Explicit Route Guards
PrincipalGuard = require_roles(["Principal", "Super Admin", "School Admin"])
AdminGuard = require_roles(["Admin", "Super Admin", "School Admin", "Principal"])
TeacherGuard = require_roles(["Teacher", "Admin"])
AccountantGuard = require_roles(["Accountant", "Admin"])
StaffGuard = require_roles(["Staff", "Accountant", "Librarian", "Admin"])
StudentGuard = require_roles(["Student", "Admin"])
ParentGuard = require_roles(["Parent", "Admin"])


