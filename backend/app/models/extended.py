from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, Boolean, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

# --- ASSIGNMENTS & HOMEWORK ---

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(Date, nullable=False, index=True)
    max_marks = Column(Float, default=100.0, nullable=False)
    attachment_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    school_class = relationship("SchoolClass")
    section = relationship("Section")
    subject = relationship("Subject")
    teacher = relationship("Teacher")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_text = Column(Text, nullable=True)
    attachment_url = Column(String(255), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    marks_obtained = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String(20), default="Submitted", nullable=False)  # "Submitted", "Graded", "Late", "Pending"
    graded_at = Column(DateTime(timezone=True), nullable=True)
    graded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student")
    graded_by = relationship("User")


# --- LIBRARY MANAGEMENT ---

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    author = Column(String(100), nullable=False, index=True)
    isbn = Column(String(50), unique=True, nullable=True, index=True)
    category = Column(String(50), default="General", nullable=False, index=True)
    publisher = Column(String(100), nullable=True)
    rack_number = Column(String(30), nullable=True)
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    issues = relationship("BookIssue", back_populates="book", cascade="all, delete-orphan")


class BookIssue(Base):
    __tablename__ = "book_issues"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)  # borrower user account
    issue_date = Column(Date, nullable=False, server_default=func.current_date())
    due_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)
    fine_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), default="Issued", nullable=False, index=True)  # "Issued", "Returned", "Overdue"
    remarks = Column(Text, nullable=True)
    issued_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    book = relationship("Book", back_populates="issues")
    student = relationship("Student")
    user = relationship("User", foreign_keys=[user_id])
    issued_by = relationship("User", foreign_keys=[issued_by_id])


# --- TRANSPORT MANAGEMENT ---

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "BUS-01", "VAN-04"
    model = Column(String(100), nullable=True)
    capacity = Column(Integer, default=30, nullable=False)
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(30), nullable=True)
    license_number = Column(String(50), nullable=True)
    status = Column(String(20), default="Active", nullable=False)  # "Active", "Maintenance", "Inactive"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    routes = relationship("TransportRoute", back_populates="vehicle")


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(100), nullable=False)  # e.g. "Route 1 - Downtown to Campus"
    start_point = Column(String(100), nullable=False)
    end_point = Column(String(100), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    fare_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    vehicle = relationship("Vehicle", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")
    student_assignments = relationship("StudentTransport", back_populates="route")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_name = Column(String(100), nullable=False)
    pickup_time = Column(String(20), nullable=True)  # e.g. "07:15 AM"
    drop_time = Column(String(20), nullable=True)    # e.g. "02:45 PM"
    stop_order = Column(Integer, default=1, nullable=False)
    stop_fee = Column(Float, default=0.0, nullable=False)

    route = relationship("TransportRoute", back_populates="stops")


class StudentTransport(Base):
    __tablename__ = "student_transports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    route_id = Column(Integer, ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_id = Column(Integer, ForeignKey("route_stops.id", ondelete="SET NULL"), nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="Active", nullable=False)  # "Active", "Cancelled"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "academic_year_id", name="uq_student_academic_transport"),
    )

    student = relationship("Student")
    route = relationship("TransportRoute", back_populates="student_assignments")
    stop = relationship("RouteStop")
    academic_year = relationship("AcademicYear")


# --- EVENTS & CALENDAR ---

class SchoolEvent(Base):
    __tablename__ = "school_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False)  # "Exam", "Holiday", "Parent Teacher Meeting", "Sports Day", "Annual Day", "School Trip", "Other"
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False)
    location = Column(String(100), nullable=True)
    audience = Column(String(50), default="All", nullable=False)  # "All", "Students", "Teachers", "Parents"
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_by = relationship("User")


# --- ANNOUNCEMENTS & NOTIFICATIONS ---

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="General", nullable=False)  # "General", "Exam", "Fee", "Holiday", "Attendance", "Emergency"
    target_role = Column(String(50), default="All", nullable=False)    # "All", "Student", "Parent", "Teacher", "Accountant", "Staff"
    is_pinned = Column(Boolean, default=False, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    author = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")


# --- SYSTEM SETTINGS ---

class SchoolSetting(Base):
    __tablename__ = "school_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="General", nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
