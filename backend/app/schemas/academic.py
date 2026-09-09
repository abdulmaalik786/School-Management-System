from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

# Academic Year Schemas
class AcademicYearBase(BaseModel):
    name: str = Field(..., description="Academic Year Name (e.g. 2026-2027)")
    start_date: date
    end_date: date
    is_active: bool = False

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class AcademicYearOut(AcademicYearBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# School Class Schemas
class SchoolClassBase(BaseModel):
    name: str = Field(..., description="Class Name (e.g. Grade 1)")
    numeric_grade: Optional[int] = None
    description: Optional[str] = None

class SchoolClassCreate(SchoolClassBase):
    pass

class SchoolClassUpdate(BaseModel):
    name: Optional[str] = None
    numeric_grade: Optional[int] = None
    description: Optional[str] = None

class SectionSimpleOut(BaseModel):
    id: int
    name: str
    class_teacher_id: Optional[int] = None
    class_teacher_name: Optional[str] = None
    student_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class SchoolClassOut(SchoolClassBase):
    id: int
    sections: List[SectionSimpleOut] = []
    student_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Section Schemas
class SectionCreate(BaseModel):
    name: str = Field(..., description="Section Name (e.g. A, B, C)")
    class_id: int
    class_teacher_id: Optional[int] = None

class SectionUpdate(BaseModel):
    name: Optional[str] = None
    class_id: Optional[int] = None
    class_teacher_id: Optional[int] = None

class SectionOut(BaseModel):
    id: int
    name: str
    class_id: int
    class_name: Optional[str] = None
    class_teacher_id: Optional[int] = None
    class_teacher_name: Optional[str] = None
    student_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    weekly_periods: int = 4
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    weekly_periods: Optional[int] = None
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None

class SubjectOut(SubjectBase):
    id: int
    class_name: Optional[str] = None
    teacher_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
