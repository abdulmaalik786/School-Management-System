from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class StudentAttendance(Base):
    __tablename__ = "student_attendances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="SET NULL"), nullable=True)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False) # "Present", "Absent", "Late", "Leave"
    remarks = Column(Text, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("Student")
    school_class = relationship("SchoolClass")
    section = relationship("Section")
    subject = relationship("Subject")
    period = relationship("Period", back_populates="student_attendances")
    recorded_by = relationship("User")


class TeacherAttendance(Base):
    __tablename__ = "teacher_attendances"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False) # "Present", "Absent", "Late", "Leave"
    remarks = Column(Text, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    teacher = relationship("Teacher")
    recorded_by = relationship("User")
