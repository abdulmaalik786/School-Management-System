from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import time, datetime

# Period Schemas
class PeriodBase(BaseModel):
    name: str = Field(..., description="Period Name (e.g. Period 1, Break)")
    start_time: time
    end_time: time
    sort_order: int = 1
    is_break: bool = False

class PeriodCreate(PeriodBase):
    pass

class PeriodUpdate(BaseModel):
    name: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    sort_order: Optional[int] = None
    is_break: Optional[bool] = None

class PeriodOut(PeriodBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# TimetableEntry Schemas
class TimetableEntryBase(BaseModel):
    academic_year_id: int
    class_id: int
    section_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    period_id: int
    day_of_week: str = Field(..., description="Monday, Tuesday, Wednesday, Thursday, Friday, Saturday")
    room_number: Optional[str] = None

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntryUpdate(BaseModel):
    academic_year_id: Optional[int] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    period_id: Optional[int] = None
    day_of_week: Optional[str] = None
    room_number: Optional[str] = None

class TimetableEntryOut(TimetableEntryBase):
    id: int
    academic_year_name: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    teacher_name: Optional[str] = None
    period_name: Optional[str] = None
    period_start: Optional[time] = None
    period_end: Optional[time] = None
    is_break: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
