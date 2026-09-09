from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.extended import SchoolEvent, Announcement, Notification
from app.schemas.extended import (
    SchoolEventCreate, SchoolEventUpdate, SchoolEventOut,
    AnnouncementCreate, AnnouncementUpdate, AnnouncementOut,
    NotificationOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api", tags=["Events & Announcements"])

# --- SCHOOL EVENTS ENDPOINTS ---

@router.get("/events", response_model=List[SchoolEventOut])
def get_events(
    event_type: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(SchoolEvent)

    if event_type:
        query = query.filter(SchoolEvent.event_type.ilike(event_type))
    if start_date:
        query = query.filter(SchoolEvent.start_date >= start_date)
    if end_date:
        query = query.filter(SchoolEvent.end_date <= end_date)

    events = query.order_by(SchoolEvent.start_date.asc()).all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "event_type": e.event_type,
            "start_date": e.start_date,
            "end_date": e.end_date,
            "location": e.location,
            "audience": e.audience,
            "created_by_name": e.created_by.full_name if e.created_by else None,
            "created_at": e.created_at
        }
        for e in events
    ]


@router.post("/events", response_model=SchoolEventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    data: SchoolEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    event = SchoolEvent(**data.model_dump(), created_by_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "location": event.location,
        "audience": event.audience,
        "created_by_name": current_user.full_name,
        "created_at": event.created_at
    }


@router.put("/events/{id}", response_model=SchoolEventOut)
def update_event(
    id: int,
    data: SchoolEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    event = db.query(SchoolEvent).filter(SchoolEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(event, k, v)

    db.commit()
    db.refresh(event)
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "location": event.location,
        "audience": event.audience,
        "created_by_name": event.created_by.full_name if event.created_by else None,
        "created_at": event.created_at
    }


@router.delete("/events/{id}")
def delete_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    event = db.query(SchoolEvent).filter(SchoolEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}


# --- ANNOUNCEMENTS ENDPOINTS ---

@router.get("/announcements", response_model=List[AnnouncementOut])
def get_announcements(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Announcement)

    role_name = current_user.role.name
    if role_name not in ["Super Admin", "School Admin", "Principal"]:
        query = query.filter(Announcement.target_role.in_(["All", role_name]))

    if category:
        query = query.filter(Announcement.category.ilike(category))

    announcements = query.order_by(Announcement.is_pinned.desc(), Announcement.id.desc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "category": a.category,
            "target_role": a.target_role,
            "is_pinned": a.is_pinned,
            "author_name": a.author.full_name if a.author else None,
            "created_at": a.created_at,
            "updated_at": a.updated_at
        }
        for a in announcements
    ]


@router.post("/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    ann = Announcement(**data.model_dump(), author_id=current_user.id)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return {
        "id": ann.id,
        "title": ann.title,
        "content": ann.content,
        "category": ann.category,
        "target_role": ann.target_role,
        "is_pinned": ann.is_pinned,
        "author_name": current_user.full_name,
        "created_at": ann.created_at,
        "updated_at": ann.updated_at
    }


@router.delete("/announcements/{id}")
def delete_announcement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Teacher"]))
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully"}


# --- NOTIFICATIONS ENDPOINTS ---

@router.get("/notifications", response_model=List[NotificationOut])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.id.desc()).limit(20).all()
    return notifs


@router.put("/notifications/{id}/read")
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    n = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Marked as read"}
