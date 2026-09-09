from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

# --- EXAM SCHEMAS ---

class ExamBase(BaseModel):
    name: str = Field(..., description="Exam Title (e.g. Mid Term Examination 2026)")
    exam_type: str = Field(..., description="Monthly Test, Mid Term, Final Term, Quiz, Assignment")
    academic_year_id: int
    class_id: int
    section_id: Optional[int] = None
    subject_id: int
    exam_date: date
    total_marks: float = 100.0
    passing_marks: float = 40.0
    description: Optional[str] = None

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    name: Optional[str] = None
    exam_type: Optional[str] = None
    academic_year_id: Optional[int] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    subject_id: Optional[int] = None
    exam_date: Optional[date] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    description: Optional[str] = None

class ExamOut(ExamBase):
    id: int
    academic_year_name: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    marks_entered_count: int = 0
    total_enrolled_students: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- MARKS SCHEMAS ---

class ExamMarkItem(BaseModel):
    student_id: int
    marks_obtained: float = Field(0.0, ge=0.0)
    is_absent: bool = False
    remarks: Optional[str] = None

class ExamMarkBulkCreate(BaseModel):
    marks: List[ExamMarkItem]

class ExamMarkSingleUpdate(BaseModel):
    marks_obtained: Optional[float] = Field(None, ge=0.0)
    is_absent: Optional[bool] = None
    remarks: Optional[str] = None

class ExamMarkOut(BaseModel):
    id: int
    exam_id: int
    exam_name: Optional[str] = None
    exam_type: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    marks_obtained: float
    total_marks: float
    passing_marks: float
    percentage: float
    grade: str
    is_passed: bool
    is_absent: bool
    remarks: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- RESULT & REPORT CARD SCHEMAS ---

class SubjectScoreItem(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: str
    subject_id: int
    subject_name: str
    subject_code: Optional[str] = None
    marks_obtained: float
    total_marks: float
    passing_marks: float
    percentage: float
    grade: str
    is_passed: bool
    is_absent: bool
    remarks: Optional[str] = None

class StudentReportCardOut(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    roll_number: Optional[str] = None
    class_id: int
    class_name: str
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    academic_year_name: Optional[str] = None
    exam_name: Optional[str] = None
    subjects: List[SubjectScoreItem]
    total_max_marks: float
    total_obtained_marks: float
    overall_percentage: float
    overall_grade: str
    gpa: float
    result_status: str  # "PASS", "FAIL"
    passed_subjects_count: int
    failed_subjects_count: int
    rank_in_class: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class ClassResultReportOut(BaseModel):
    class_id: int
    class_name: str
    section_id: Optional[int] = None
    section_name: Optional[str] = None
    exam_id: Optional[int] = None
    exam_name: Optional[str] = None
    total_students: int = 0
    appeared_students: int = 0
    passed_students: int = 0
    failed_students: int = 0
    absent_students: int = 0
    pass_percentage: float = 0.0
    class_average_percentage: float = 0.0
    highest_percentage: float = 0.0
    lowest_percentage: float = 0.0
    students_summary: List[StudentReportCardOut] = []

    model_config = ConfigDict(from_attributes=True)
