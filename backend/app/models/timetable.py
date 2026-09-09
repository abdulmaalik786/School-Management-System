from sqlalchemy import Column, Integer, String, Text, Time, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Period(Base):
    __tablename__ = "periods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False) # e.g. "Period 1" or "Break"
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    sort_order = Column(Integer, default=1, nullable=False)
    is_break = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    timetable_entries = relationship("TimetableEntry", back_populates="period", cascade="all, delete-orphan")
    student_attendances = relationship("StudentAttendance", back_populates="period")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
    room_number = Column(String(50), nullable=True) # e.g. "Room 101"

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    academic_year = relationship("AcademicYear")
    school_class = relationship("SchoolClass")
    section = relationship("Section")
    subject = relationship("Subject")
    teacher = relationship("Teacher")
    period = relationship("Period", back_populates="timetable_entries")
