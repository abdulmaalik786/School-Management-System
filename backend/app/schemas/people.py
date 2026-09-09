from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

# STUDENT SCHEMAS
class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    password: Optional[str] = "password123"
    phone: Optional[str] = None
    admission_number: str
    roll_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    admission_date: Optional[date] = None
    photo_url: Optional[str] = None
    parent_id: Optional[int] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    academic_year_id: Optional[int] = None

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    roll_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    admission_date: Optional[date] = None
    photo_url: Optional[str] = None
    status: Optional[str] = None
    parent_id: Optional[int] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    academic_year_id: Optional[int] = None

class StudentOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    username: str
    phone: Optional[str] = None
    admission_number: str
    roll_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    admission_date: Optional[date] = None
    photo_url: Optional[str] = None
    status: str
    parent_id: Optional[int] = None
    parent_name: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    academic_year_id: Optional[int] = None
    academic_year_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# TEACHER SCHEMAS
class TeacherCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    password: Optional[str] = "password123"
    phone: Optional[str] = None
    employee_id: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    qualification: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    salary: Optional[float] = None

class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    qualification: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    status: Optional[str] = None

class TeacherOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    username: str
    phone: Optional[str] = None
    employee_id: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    qualification: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    status: str
    assigned_sections_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# PARENT SCHEMAS
class ParentCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    password: Optional[str] = "password123"
    phone: Optional[str] = None
    occupation: Optional[str] = None
    relationship_type: Optional[str] = None
    address: Optional[str] = None

class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    relationship_type: Optional[str] = None
    address: Optional[str] = None

class StudentSimpleOut(BaseModel):
    id: int
    full_name: str
    admission_number: str
    class_name: Optional[str] = None
    section_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ParentOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    username: str
    phone: Optional[str] = None
    occupation: Optional[str] = None
    relationship_type: Optional[str] = None
    address: Optional[str] = None
    children_count: int = 0
    children: List[StudentSimpleOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
