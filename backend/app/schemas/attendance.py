from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

# --- STUDENT ATTENDANCE SCHEMAS ---

class StudentAttendanceMarkItem(BaseModel):
    student_id: int
    status: str = Field(..., description="Present, Absent, Late, Leave")
    remarks: Optional[str] = None

class StudentAttendanceBulkCreate(BaseModel):
    class_id: int
    section_id: int
    subject_id: Optional[int] = None
    period_id: Optional[int] = None
    attendance_date: date
    attendances: List[StudentAttendanceMarkItem]

class StudentAttendanceSingleUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None

class StudentAttendanceOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    class_id: int
    class_name: Optional[str] = None
    section_id: int
    section_name: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    period_id: Optional[int] = None
    period_name: Optional[str] = None
    attendance_date: date
    status: str
    remarks: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubjectAttendanceReportOut(BaseModel):
    subject_id: Optional[int] = None
    subject_name: str
    subject_code: Optional[str] = None
    total_classes: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class StudentAttendanceReportOut(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    roll_number: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    total_classes: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0
    subject_breakdown: List[SubjectAttendanceReportOut] = []
    recent_records: List[StudentAttendanceOut] = []

    model_config = ConfigDict(from_attributes=True)

class DailyAttendanceSummary(BaseModel):
    attendance_date: date
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    total_students: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class MonthlyAttendanceSummary(BaseModel):
    month: int
    year: int
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    total_classes: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# --- TEACHER ATTENDANCE SCHEMAS ---

class TeacherAttendanceMarkItem(BaseModel):
    teacher_id: int
    status: str = Field(..., description="Present, Absent, Late, Leave")
    remarks: Optional[str] = None

class TeacherAttendanceBulkCreate(BaseModel):
    attendance_date: date
    attendances: List[TeacherAttendanceMarkItem]

class TeacherAttendanceSingleUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None

class TeacherAttendanceOut(BaseModel):
    id: int
    teacher_id: int
    teacher_name: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    attendance_date: date
    status: str
    remarks: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TeacherAttendanceReportOut(BaseModel):
    teacher_id: int
    teacher_name: str
    employee_id: Optional[str] = None
    department: Optional[str] = None
    total_days: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0
    recent_records: List[TeacherAttendanceOut] = []

    model_config = ConfigDict(from_attributes=True)

class TeacherDailyReportOut(BaseModel):
    attendance_date: date
    total_teachers: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0
    records: List[TeacherAttendanceOut] = []

    model_config = ConfigDict(from_attributes=True)

class TeacherMonthlyReportOut(BaseModel):
    month: int
    year: int
    teacher_id: int
    teacher_name: str
    employee_id: Optional[str] = None
    department: Optional[str] = None
    total_days: int = 0
    present_count: int = 0
    absent_count: int = 0
    late_count: int = 0
    leave_count: int = 0
    attendance_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)
