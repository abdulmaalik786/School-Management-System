from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, Boolean, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g. "Mid Term Examination 2026", "Monthly Test - March"
    exam_type = Column(String(50), nullable=False)  # "Monthly Test", "Mid Term", "Final Term", "Quiz", "Assignment"
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_date = Column(Date, nullable=False, index=True)
    total_marks = Column(Float, nullable=False, default=100.0)
    passing_marks = Column(Float, nullable=False, default=40.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    academic_year = relationship("AcademicYear")
    school_class = relationship("SchoolClass")
    section = relationship("Section")
    subject = relationship("Subject")
    marks = relationship("ExamMark", back_populates="exam", cascade="all, delete-orphan")


class ExamMark(Base):
    __tablename__ = "exam_marks"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    marks_obtained = Column(Float, nullable=False, default=0.0)
    is_absent = Column(Boolean, default=False, nullable=False)
    remarks = Column(Text, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", name="uq_exam_student_mark"),
    )

    exam = relationship("Exam", back_populates="marks")
    student = relationship("Student")
    recorded_by = relationship("User")
