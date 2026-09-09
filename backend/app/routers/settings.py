from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.extended import SchoolSetting
from app.schemas.extended import SchoolSettingCreate, SchoolSettingOut
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/settings", tags=["System Settings"])

DEFAULT_SETTINGS = {
    "school_name": "Army Public School and College Islamabad",
    "school_tagline": "Excellence in Academic Mastery & Leadership",
    "school_email": "admin@aps-islamabad.edu.pk",
    "school_phone": "+92 (51) 926-0000",
    "school_address": "Sector E-9, Islamabad, Pakistan",
    "currency": "PKR (Rs)",
    "current_session": "2026-2027",
    "timezone": "UTC+05:00",
    "enable_student_portal": "true",
    "enable_parent_portal": "true"
}

@router.get("", response_model=Dict[str, Any])
def get_all_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    settings_db = db.query(SchoolSetting).all()
    results = dict(DEFAULT_SETTINGS)
    for s in settings_db:
        results[s.key] = s.value
    return results


@router.post("", response_model=Dict[str, Any])
def update_settings(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    for k, v in data.items():
        s = db.query(SchoolSetting).filter(SchoolSetting.key == k).first()
        if not s:
            s = SchoolSetting(key=k, value=str(v), category="General")
            db.add(s)
        else:
            s.value = str(v)

    db.commit()
    return get_all_settings(db, current_user)
