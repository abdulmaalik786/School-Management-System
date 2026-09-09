from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False)
    fee_type = Column(String(50), nullable=False)  # "Admission Fee", "Tuition Fee", "Exam Fee", "Transport Fee", "Library Fee", "Other Fee"
    amount = Column(Float, nullable=False, default=0.0)
    frequency = Column(String(30), default="Monthly", nullable=False)  # "Monthly", "Termly", "Annually", "One-Time"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("academic_year_id", "class_id", "fee_type", name="uq_fee_structure_class_type"),
    )

    academic_year = relationship("AcademicYear")
    school_class = relationship("SchoolClass")


class FeeInvoice(Base):
    __tablename__ = "fee_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "INV-2026-0001"
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    fee_month = Column(String(30), nullable=False)  # e.g. "March 2026"
    issue_date = Column(Date, nullable=False, default=func.current_date())
    due_date = Column(Date, nullable=False)
    subtotal_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    fine_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    remaining_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), default="Pending", nullable=False, index=True)  # "Paid", "Partial", "Pending", "Overdue"
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("Student")
    academic_year = relationship("AcademicYear")
    items = relationship("FeeInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("FeePayment", back_populates="invoice", cascade="all, delete-orphan")


class FeeInvoiceItem(Base):
    __tablename__ = "fee_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("fee_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_type = Column(String(50), nullable=False)  # "Admission Fee", "Tuition Fee", etc.
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False, default=0.0)

    invoice = relationship("FeeInvoice", back_populates="items")


class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "REC-2026-0001"
    invoice_id = Column(Integer, ForeignKey("fee_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_date = Column(Date, nullable=False, default=func.current_date())
    amount_paid = Column(Float, nullable=False)
    discount_applied = Column(Float, default=0.0, nullable=False)
    fine_applied = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String(30), default="Cash", nullable=False)  # "Cash", "Bank Transfer", "Cheque", "Online"
    transaction_reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    invoice = relationship("FeeInvoice", back_populates="payments")
    recorded_by = relationship("User")
