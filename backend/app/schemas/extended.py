from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Any
from datetime import date, datetime

# --- ASSIGNMENT SCHEMAS ---

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    class_id: int
    section_id: Optional[int] = None
    subject_id: int
    due_date: date
    max_marks: float = 100.0
    attachment_url: Optional[str] = None

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    max_marks: Optional[float] = None
    attachment_url: Optional[str] = None

class SubmissionCreate(BaseModel):
    submission_text: Optional[str] = None
    attachment_url: Optional[str] = None

class SubmissionGrade(BaseModel):
    marks_obtained: float = Field(..., ge=0.0)
    feedback: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    class_name: Optional[str] = None
    submission_text: Optional[str] = None
    attachment_url: Optional[str] = None
    submitted_at: datetime
    marks_obtained: Optional[float] = None
    feedback: Optional[str] = None
    status: str
    graded_at: Optional[datetime] = None
    graded_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    class_id: int
    class_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    subject_id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    due_date: date
    max_marks: float
    attachment_url: Optional[str] = None
    submissions_count: int = 0
    graded_count: int = 0
    my_submission: Optional[SubmissionOut] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- LIBRARY SCHEMAS ---

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    category: str = "General"
    publisher: Optional[str] = None
    rack_number: Optional[str] = None
    total_copies: int = 1

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    category: Optional[str] = None
    publisher: Optional[str] = None
    rack_number: Optional[str] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None

class BookOut(BaseModel):
    id: int
    title: str
    author: str
    isbn: Optional[str] = None
    category: str
    publisher: Optional[str] = None
    rack_number: Optional[str] = None
    total_copies: int
    available_copies: int
    issued_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BookIssueCreate(BaseModel):
    book_id: int
    student_id: Optional[int] = None
    user_id: Optional[int] = None
    due_date: date
    remarks: Optional[str] = None

class BookReturnRequest(BaseModel):
    fine_amount: float = 0.0
    remarks: Optional[str] = None

class BookIssueOut(BaseModel):
    id: int
    book_id: int
    book_title: Optional[str] = None
    book_author: Optional[str] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    issue_date: date
    due_date: date
    return_date: Optional[date] = None
    fine_amount: float
    status: str
    remarks: Optional[str] = None
    issued_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- TRANSPORT SCHEMAS ---

class VehicleCreate(BaseModel):
    vehicle_number: str
    model: Optional[str] = None
    capacity: int = 30
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    license_number: Optional[str] = None
    status: str = "Active"

class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    capacity: Optional[int] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    license_number: Optional[str] = None
    status: Optional[str] = None

class VehicleOut(BaseModel):
    id: int
    vehicle_number: str
    model: Optional[str] = None
    capacity: int
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    license_number: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RouteStopCreate(BaseModel):
    stop_name: str
    pickup_time: Optional[str] = None
    drop_time: Optional[str] = None
    stop_order: int = 1
    stop_fee: float = 0.0

class RouteStopOut(BaseModel):
    id: int
    route_id: int
    stop_name: str
    pickup_time: Optional[str] = None
    drop_time: Optional[str] = None
    stop_order: int
    stop_fee: float

    model_config = ConfigDict(from_attributes=True)

class TransportRouteCreate(BaseModel):
    route_name: str
    start_point: str
    end_point: str
    vehicle_id: Optional[int] = None
    fare_amount: float = 0.0
    stops: List[RouteStopCreate] = []

class TransportRouteUpdate(BaseModel):
    route_name: Optional[str] = None
    start_point: Optional[str] = None
    end_point: Optional[str] = None
    vehicle_id: Optional[int] = None
    fare_amount: Optional[float] = None

class TransportRouteOut(BaseModel):
    id: int
    route_name: str
    start_point: str
    end_point: str
    vehicle_id: Optional[int] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    fare_amount: float
    stops: List[RouteStopOut] = []
    assigned_students_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentTransportCreate(BaseModel):
    student_id: int
    route_id: int
    stop_id: Optional[int] = None
    academic_year_id: int

class StudentTransportOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    class_name: Optional[str] = None
    route_id: int
    route_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    stop_id: Optional[int] = None
    stop_name: Optional[str] = None
    pickup_time: Optional[str] = None
    drop_time: Optional[str] = None
    academic_year_name: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- EVENTS & CALENDAR SCHEMAS ---

class SchoolEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str = "General"  # "Exam", "Holiday", "Parent Teacher Meeting", "Sports Day", "Annual Day", "School Trip", "Other"
    start_date: date
    end_date: date
    location: Optional[str] = None
    audience: str = "All"

class SchoolEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    audience: Optional[str] = None

class SchoolEventOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    event_type: str
    start_date: date
    end_date: date
    location: Optional[str] = None
    audience: str
    created_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- ANNOUNCEMENTS & NOTIFICATIONS SCHEMAS ---

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    category: str = "General"  # "General", "Exam", "Fee", "Holiday", "Attendance", "Emergency"
    target_role: str = "All"
    is_pinned: bool = False

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    target_role: Optional[str] = None
    is_pinned: Optional[bool] = None

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    category: str
    target_role: str
    is_pinned: bool
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- DASHBOARD REAL STATS SCHEMAS ---

class AdminDashboardStatsOut(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    total_subjects: int
    today_present_students: int
    today_absent_students: int
    today_present_teachers: int
    today_absent_teachers: int
    total_fees_collected: float
    total_fees_pending: float
    total_fees_overdue: float
    today_fees_collected: float
    enrollment_by_class: List[dict] = []
    attendance_trends: List[dict] = []
    monthly_fee_collection: List[dict] = []
    recent_activities: List[dict] = []
    pinned_announcements: List[AnnouncementOut] = []
    upcoming_events: List[SchoolEventOut] = []

class TeacherDashboardStatsOut(BaseModel):
    assigned_classes_count: int
    assigned_subjects_count: int
    today_classes_count: int
    pending_submissions_count: int
    my_classes: List[dict] = []
    today_timetable: List[dict] = []
    recent_assignments: List[AssignmentOut] = []
    upcoming_events: List[SchoolEventOut] = []
    announcements: List[AnnouncementOut] = []

class StudentDashboardStatsOut(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    class_name: str
    section_name: Optional[str] = None
    attendance_percentage: float
    total_classes: int
    present_days: int
    absent_days: int
    pending_assignments_count: int
    total_fees_pending: float
    today_timetable: List[dict] = []
    my_assignments: List[AssignmentOut] = []
    my_recent_marks: List[dict] = []
    announcements: List[AnnouncementOut] = []
    upcoming_events: List[SchoolEventOut] = []

class ParentDashboardStatsOut(BaseModel):
    children: List[StudentDashboardStatsOut] = []
    announcements: List[AnnouncementOut] = []
    upcoming_events: List[SchoolEventOut] = []

class AccountantDashboardStatsOut(BaseModel):
    today_collected: float
    monthly_collected: float
    total_invoiced: float
    total_pending: float
    total_overdue: float
    recent_payments: List[dict] = []
    overdue_invoices: List[dict] = []


# --- SETTINGS SCHEMAS ---

class SchoolSettingCreate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    category: str = "General"

class SchoolSettingOut(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    category: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
