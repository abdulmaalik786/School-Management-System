from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import date, datetime

# --- FEE STRUCTURE SCHEMAS ---

class FeeStructureBase(BaseModel):
    academic_year_id: int
    class_id: int
    fee_type: str = Field(..., description="Admission Fee, Tuition Fee, Exam Fee, Transport Fee, Library Fee, Other Fee")
    amount: float = Field(..., ge=0.0)
    frequency: str = "Monthly"
    description: Optional[str] = None

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureUpdate(BaseModel):
    amount: Optional[float] = Field(None, ge=0.0)
    frequency: Optional[str] = None
    description: Optional[str] = None

class FeeStructureOut(FeeStructureBase):
    id: int
    academic_year_name: Optional[str] = None
    class_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- FEE INVOICE SCHEMAS ---

class FeeInvoiceItemCreate(BaseModel):
    fee_type: str
    description: Optional[str] = None
    amount: float = Field(..., ge=0.0)

class FeeInvoiceItemOut(BaseModel):
    id: int
    fee_type: str
    description: Optional[str] = None
    amount: float

    model_config = ConfigDict(from_attributes=True)

class FeeInvoiceCreate(BaseModel):
    student_id: int
    academic_year_id: int
    fee_month: str
    due_date: date
    discount_amount: float = 0.0
    fine_amount: float = 0.0
    remarks: Optional[str] = None
    items: List[FeeInvoiceItemCreate]

class FeeInvoiceBulkGenerate(BaseModel):
    class_id: int
    academic_year_id: int
    fee_month: str
    due_date: date
    discount_amount: float = 0.0
    fine_amount: float = 0.0
    remarks: Optional[str] = None

class FeeInvoiceUpdate(BaseModel):
    due_date: Optional[date] = None
    discount_amount: Optional[float] = None
    fine_amount: Optional[float] = None
    remarks: Optional[str] = None

class FeePaymentSummaryOut(BaseModel):
    id: int
    receipt_number: str
    payment_date: date
    amount_paid: float
    discount_applied: float
    fine_applied: float
    payment_method: str
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FeeInvoiceOut(BaseModel):
    id: int
    invoice_number: str
    student_id: int
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    roll_number: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    academic_year_id: int
    academic_year_name: Optional[str] = None
    fee_month: str
    issue_date: date
    due_date: date
    subtotal_amount: float
    discount_amount: float
    fine_amount: float
    total_amount: float
    paid_amount: float
    remaining_amount: float
    status: str
    remarks: Optional[str] = None
    items: List[FeeInvoiceItemOut] = []
    payments: List[FeePaymentSummaryOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- FEE PAYMENT SCHEMAS ---

class FeePaymentCreate(BaseModel):
    invoice_id: int
    amount_paid: float = Field(..., gt=0.0)
    discount_applied: float = 0.0
    fine_applied: float = 0.0
    payment_method: str = "Cash"  # "Cash", "Bank Transfer", "Cheque", "Online"
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None

class FeePaymentOut(BaseModel):
    id: int
    receipt_number: str
    invoice_id: int
    invoice_number: Optional[str] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    admission_number: Optional[str] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    fee_month: Optional[str] = None
    payment_date: date
    amount_paid: float
    discount_applied: float
    fine_applied: float
    payment_method: str
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None
    recorded_by_name: Optional[str] = None
    invoice_total_amount: Optional[float] = None
    invoice_paid_amount: Optional[float] = None
    invoice_remaining_amount: Optional[float] = None
    invoice_status: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- FEE DASHBOARD & REPORTS SCHEMAS ---

class MonthlyCollectionItem(BaseModel):
    month: str
    amount: float

class PaymentMethodDistribution(BaseModel):
    method: str
    total_amount: float
    count: int

class FeeDashboardOut(BaseModel):
    total_invoiced_amount: float
    total_collected_amount: float
    total_pending_amount: float
    total_overdue_amount: float
    today_collected_amount: float
    total_invoices_count: int
    paid_invoices_count: int
    partial_invoices_count: int
    pending_invoices_count: int
    overdue_invoices_count: int
    monthly_collection_trend: List[MonthlyCollectionItem] = []
    payment_method_breakdown: List[PaymentMethodDistribution] = []

class StudentFeeReportOut(BaseModel):
    student_id: int
    student_name: str
    admission_number: str
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    total_invoiced: float
    total_paid: float
    total_discount: float
    total_fine: float
    total_outstanding: float
    invoices: List[FeeInvoiceOut] = []

class ClassFeeCollectionOut(BaseModel):
    class_id: int
    class_name: str
    total_students: int
    total_invoiced: float
    total_collected: float
    total_pending: float
    collection_percentage: float
