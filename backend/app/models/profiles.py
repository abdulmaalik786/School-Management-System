from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    admission_number = Column(String(50), unique=True, nullable=False, index=True)
    roll_number = Column(String(50), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    admission_date = Column(Date, nullable=True)
    photo_url = Column(String(255), nullable=True)
    status = Column(String(20), default="Active", nullable=False) # "Active", "Inactive", "Graduated", "Transferred"
    
    parent_id = Column(Integer, ForeignKey("parents.id", ondelete="SET NULL"), nullable=True)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="student_profile")
    parent = relationship("Parent", back_populates="children")
    school_class = relationship("SchoolClass", back_populates="students")
    section = relationship("Section", back_populates="students")
    academic_year = relationship("AcademicYear", back_populates="students")


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    occupation = Column(String(100), nullable=True)
    relationship_type = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="parent_profile")
    children = relationship("Student", back_populates="parent")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    qualification = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    joining_date = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    salary = Column(Float, nullable=True)
    status = Column(String(20), default="Active", nullable=False) # "Active", "Inactive", "On Leave"

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="teacher_profile")
    assigned_sections = relationship("Section", back_populates="class_teacher")
    subjects = relationship("Subject", back_populates="teacher")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    joining_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="staff_profile")


class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    admin_code = Column(String(50), unique=True, nullable=True, index=True)
    access_level = Column(String(50), default="Full", nullable=False) # "Full", "Super", "Operational", "Academic"
    department_oversight = Column(String(100), nullable=True)
    office_location = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="admin_profile")

