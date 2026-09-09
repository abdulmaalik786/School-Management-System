import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student
from app.models.academic import SchoolClass, AcademicYear
from app.models.finance import FeeStructure, FeeInvoice, FeeInvoiceItem, FeePayment
from app.schemas.finance import (
    FeeStructureCreate, FeeStructureUpdate, FeeStructureOut,
    FeeInvoiceCreate, FeeInvoiceBulkGenerate, FeeInvoiceUpdate, FeeInvoiceOut,
    FeePaymentCreate, FeePaymentOut, FeeDashboardOut, StudentFeeReportOut, ClassFeeCollectionOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/fees", tags=["Fees & Finance"])

# --- FORMATTERS & HELPERS ---

def generate_invoice_number(db: Session) -> str:
    count = db.query(FeeInvoice).count() + 1
    uid = uuid.uuid4().hex[:4].upper()
    return f"INV-{date.today().year}-{count:04d}-{uid}"

def generate_receipt_number(db: Session) -> str:
    count = db.query(FeePayment).count() + 1
    uid = uuid.uuid4().hex[:4].upper()
    return f"REC-{date.today().year}-{count:04d}-{uid}"

def update_invoice_status(invoice: FeeInvoice):
    today = date.today()
    if invoice.paid_amount >= invoice.total_amount:
        invoice.status = "Paid"
        invoice.remaining_amount = 0.0
    elif invoice.paid_amount > 0:
        invoice.status = "Partial"
        invoice.remaining_amount = max(0.0, invoice.total_amount - invoice.paid_amount)
    else:
        invoice.remaining_amount = invoice.total_amount
        if today > invoice.due_date:
            invoice.status = "Overdue"
        else:
            invoice.status = "Pending"

def build_fee_structure_out(fs: FeeStructure) -> dict:
    return {
        "id": fs.id,
        "academic_year_id": fs.academic_year_id,
        "academic_year_name": fs.academic_year.name if fs.academic_year else None,
        "class_id": fs.class_id,
        "class_name": fs.school_class.name if fs.school_class else None,
        "fee_type": fs.fee_type,
        "amount": fs.amount,
        "frequency": fs.frequency,
        "description": fs.description,
        "created_at": fs.created_at,
        "updated_at": fs.updated_at
    }

def build_fee_invoice_out(inv: FeeInvoice) -> dict:
    update_invoice_status(inv)
    student = inv.student
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "student_id": inv.student_id,
        "student_name": student.user.full_name if student and student.user else None,
        "admission_number": student.admission_number if student else None,
        "roll_number": student.roll_number if student else None,
        "class_name": student.school_class.name if student and student.school_class else None,
        "section_name": student.section.name if student and student.section else None,
        "academic_year_id": inv.academic_year_id,
        "academic_year_name": inv.academic_year.name if inv.academic_year else None,
        "fee_month": inv.fee_month,
        "issue_date": inv.issue_date,
        "due_date": inv.due_date,
        "subtotal_amount": inv.subtotal_amount,
        "discount_amount": inv.discount_amount,
        "fine_amount": inv.fine_amount,
        "total_amount": inv.total_amount,
        "paid_amount": inv.paid_amount,
        "remaining_amount": inv.remaining_amount,
        "status": inv.status,
        "remarks": inv.remarks,
        "items": [
            {
                "id": itm.id,
                "fee_type": itm.fee_type,
                "description": itm.description,
                "amount": itm.amount
            }
            for itm in inv.items
        ],
        "payments": [
            {
                "id": p.id,
                "receipt_number": p.receipt_number,
                "payment_date": p.payment_date,
                "amount_paid": p.amount_paid,
                "discount_applied": p.discount_applied,
                "fine_applied": p.fine_applied,
                "payment_method": p.payment_method,
                "transaction_reference": p.transaction_reference,
                "remarks": p.remarks,
                "recorded_by_name": p.recorded_by.full_name if p.recorded_by else None,
                "created_at": p.created_at
            }
            for p in inv.payments
        ],
        "created_at": inv.created_at,
        "updated_at": inv.updated_at
    }

def build_fee_payment_out(p: FeePayment) -> dict:
    inv = p.invoice
    stu = inv.student if inv else None
    return {
        "id": p.id,
        "receipt_number": p.receipt_number,
        "invoice_id": p.invoice_id,
        "invoice_number": inv.invoice_number if inv else None,
        "student_id": stu.id if stu else None,
        "student_name": stu.user.full_name if stu and stu.user else None,
        "admission_number": stu.admission_number if stu else None,
        "class_name": stu.school_class.name if stu and stu.school_class else None,
        "section_name": stu.section.name if stu and stu.section else None,
        "fee_month": inv.fee_month if inv else None,
        "payment_date": p.payment_date,
        "amount_paid": p.amount_paid,
        "discount_applied": p.discount_applied,
        "fine_applied": p.fine_applied,
        "payment_method": p.payment_method,
        "transaction_reference": p.transaction_reference,
        "remarks": p.remarks,
        "recorded_by_name": p.recorded_by.full_name if p.recorded_by else None,
        "invoice_total_amount": inv.total_amount if inv else None,
        "invoice_paid_amount": inv.paid_amount if inv else None,
        "invoice_remaining_amount": inv.remaining_amount if inv else None,
        "invoice_status": inv.status if inv else None,
        "created_at": p.created_at
    }


# --- FEE STRUCTURES ENDPOINTS ---

@router.get("/structures", response_model=List[FeeStructureOut])
def get_fee_structures(
    academic_year_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    fee_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(FeeStructure)
    if academic_year_id:
        query = query.filter(FeeStructure.academic_year_id == academic_year_id)
    if class_id:
        query = query.filter(FeeStructure.class_id == class_id)
    if fee_type:
        query = query.filter(FeeStructure.fee_type.ilike(fee_type))

    structures = query.all()
    return [build_fee_structure_out(fs) for fs in structures]


@router.post("/structures", response_model=FeeStructureOut, status_code=status.HTTP_201_CREATED)
def create_fee_structure(
    data: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    existing = db.query(FeeStructure).filter(
        FeeStructure.academic_year_id == data.academic_year_id,
        FeeStructure.class_id == data.class_id,
        FeeStructure.fee_type == data.fee_type
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Fee structure for '{data.fee_type}' already exists for this class and academic year."
        )

    fs = FeeStructure(**data.model_dump())
    db.add(fs)
    db.commit()
    db.refresh(fs)
    return build_fee_structure_out(fs)


@router.put("/structures/{id}", response_model=FeeStructureOut)
def update_fee_structure(
    id: int,
    data: FeeStructureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    fs = db.query(FeeStructure).filter(FeeStructure.id == id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(fs, k, v)

    db.commit()
    db.refresh(fs)
    return build_fee_structure_out(fs)


@router.delete("/structures/{id}")
def delete_fee_structure(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    fs = db.query(FeeStructure).filter(FeeStructure.id == id).first()
    if not fs:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    db.delete(fs)
    db.commit()
    return {"message": "Fee structure deleted successfully"}


# --- FEE INVOICES ENDPOINTS ---

@router.get("/invoices", response_model=List[FeeInvoiceOut])
def get_invoices(
    student_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    fee_month: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(FeeInvoice)

    # Scoped permissions: Student/Parent view only self
    if current_user.role.name == "Student" and current_user.student_profile:
        query = query.filter(FeeInvoice.student_id == current_user.student_profile.id)
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [c.id for c in current_user.parent_profile.children]
        query = query.filter(FeeInvoice.student_id.in_(child_ids))
    elif student_id:
        query = query.filter(FeeInvoice.student_id == student_id)

    if class_id:
        query = query.join(Student).filter(Student.class_id == class_id)
    if fee_month:
        query = query.filter(FeeInvoice.fee_month.ilike(f"%{fee_month}%"))
    if status:
        query = query.filter(FeeInvoice.status.ilike(status))
    if academic_year_id:
        query = query.filter(FeeInvoice.academic_year_id == academic_year_id)

    invoices = query.order_by(FeeInvoice.id.desc()).all()
    return [build_fee_invoice_out(inv) for inv in invoices]


@router.get("/invoices/{id}", response_model=FeeInvoiceOut)
def get_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    inv = db.query(FeeInvoice).filter(FeeInvoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Fee invoice not found")

    if current_user.role.name == "Student" and current_user.student_profile:
        if inv.student_id != current_user.student_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [c.id for c in current_user.parent_profile.children]
        if inv.student_id not in child_ids:
            raise HTTPException(status_code=403, detail="Access denied")

    return build_fee_invoice_out(inv)


@router.post("/invoices", response_model=FeeInvoiceOut, status_code=status.HTTP_201_CREATED)
def create_single_invoice(
    data: FeeInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subtotal = sum(item.amount for item in data.items)
    total = max(0.0, subtotal - data.discount_amount + data.fine_amount)
    inv_num = generate_invoice_number(db)

    invoice = FeeInvoice(
        invoice_number=inv_num,
        student_id=data.student_id,
        academic_year_id=data.academic_year_id,
        fee_month=data.fee_month,
        due_date=data.due_date,
        subtotal_amount=subtotal,
        discount_amount=data.discount_amount,
        fine_amount=data.fine_amount,
        total_amount=total,
        paid_amount=0.0,
        remaining_amount=total,
        status="Pending",
        remarks=data.remarks
    )
    db.add(invoice)
    db.flush()

    for item in data.items:
        inv_item = FeeInvoiceItem(
            invoice_id=invoice.id,
            fee_type=item.fee_type,
            description=item.description,
            amount=item.amount
        )
        db.add(inv_item)

    db.commit()
    db.refresh(invoice)
    return build_fee_invoice_out(invoice)


@router.post("/invoices/bulk-generate", response_model=List[FeeInvoiceOut])
def bulk_generate_class_invoices(
    data: FeeInvoiceBulkGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    students = db.query(Student).filter(Student.class_id == data.class_id).all()
    if not students:
        raise HTTPException(status_code=400, detail="No students enrolled in the selected class")

    # Fetch fee structures configured for this class & year
    fee_structures = db.query(FeeStructure).filter(
        FeeStructure.class_id == data.class_id,
        FeeStructure.academic_year_id == data.academic_year_id
    ).all()

    if not fee_structures:
        raise HTTPException(
            status_code=400,
            detail="No fee structures found for this class. Please configure fee structures first."
        )

    subtotal = sum(fs.amount for fs in fee_structures)
    total = max(0.0, subtotal - data.discount_amount + data.fine_amount)

    generated_invoices = []
    for s in students:
        # Check if already generated for this student & month
        existing = db.query(FeeInvoice).filter(
            FeeInvoice.student_id == s.id,
            FeeInvoice.fee_month == data.fee_month
        ).first()

        if not existing:
            inv_num = generate_invoice_number(db)
            invoice = FeeInvoice(
                invoice_number=inv_num,
                student_id=s.id,
                academic_year_id=data.academic_year_id,
                fee_month=data.fee_month,
                due_date=data.due_date,
                subtotal_amount=subtotal,
                discount_amount=data.discount_amount,
                fine_amount=data.fine_amount,
                total_amount=total,
                paid_amount=0.0,
                remaining_amount=total,
                status="Pending",
                remarks=data.remarks
            )
            db.add(invoice)
            db.flush()

            for fs in fee_structures:
                itm = FeeInvoiceItem(
                    invoice_id=invoice.id,
                    fee_type=fs.fee_type,
                    description=fs.description or f"{fs.fee_type} for {data.fee_month}",
                    amount=fs.amount
                )
                db.add(itm)

            generated_invoices.append(invoice)

    db.commit()
    for inv in generated_invoices:
        db.refresh(inv)

    return [build_fee_invoice_out(inv) for inv in generated_invoices]


@router.put("/invoices/{id}", response_model=FeeInvoiceOut)
def update_invoice(
    id: int,
    data: FeeInvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    inv = db.query(FeeInvoice).filter(FeeInvoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Fee invoice not found")

    if data.due_date is not None:
        inv.due_date = data.due_date
    if data.discount_amount is not None:
        inv.discount_amount = data.discount_amount
    if data.fine_amount is not None:
        inv.fine_amount = data.fine_amount
    if data.remarks is not None:
        inv.remarks = data.remarks

    inv.total_amount = max(0.0, inv.subtotal_amount - inv.discount_amount + inv.fine_amount)
    update_invoice_status(inv)

    db.commit()
    db.refresh(inv)
    return build_fee_invoice_out(inv)


@router.delete("/invoices/{id}")
def delete_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    inv = db.query(FeeInvoice).filter(FeeInvoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Fee invoice not found")

    if inv.paid_amount > 0:
        raise HTTPException(status_code=400, detail="Cannot delete an invoice with recorded payments.")

    db.delete(inv)
    db.commit()
    return {"message": "Fee invoice deleted successfully"}


# --- FEE PAYMENTS & RECEIPTS ENDPOINTS ---

@router.get("/payments", response_model=List[FeePaymentOut])
def get_payments(
    invoice_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(FeePayment).join(FeeInvoice)

    if current_user.role.name == "Student" and current_user.student_profile:
        query = query.filter(FeeInvoice.student_id == current_user.student_profile.id)
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [c.id for c in current_user.parent_profile.children]
        query = query.filter(FeeInvoice.student_id.in_(child_ids))
    elif student_id:
        query = query.filter(FeeInvoice.student_id == student_id)

    if invoice_id:
        query = query.filter(FeePayment.invoice_id == invoice_id)
    if payment_method:
        query = query.filter(FeePayment.payment_method == payment_method)
    if start_date:
        query = query.filter(FeePayment.payment_date >= start_date)
    if end_date:
        query = query.filter(FeePayment.payment_date <= end_date)

    payments = query.order_by(FeePayment.id.desc()).all()
    return [build_fee_payment_out(p) for p in payments]


@router.post("/payments", response_model=FeePaymentOut, status_code=status.HTTP_201_CREATED)
def record_fee_payment(
    data: FeePaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    inv = db.query(FeeInvoice).filter(FeeInvoice.id == data.invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Apply any extra discount or fine directly during payment
    if data.discount_applied > 0:
        inv.discount_amount += data.discount_applied
    if data.fine_applied > 0:
        inv.fine_amount += data.fine_applied

    inv.total_amount = max(0.0, inv.subtotal_amount - inv.discount_amount + inv.fine_amount)

    rec_num = generate_receipt_number(db)
    payment = FeePayment(
        receipt_number=rec_num,
        invoice_id=inv.id,
        payment_date=date.today(),
        amount_paid=data.amount_paid,
        discount_applied=data.discount_applied,
        fine_applied=data.fine_applied,
        payment_method=data.payment_method,
        transaction_reference=data.transaction_reference,
        remarks=data.remarks,
        recorded_by_id=current_user.id
    )
    db.add(payment)

    # Recalculate invoice totals
    inv.paid_amount += data.amount_paid
    update_invoice_status(inv)

    db.commit()
    db.refresh(payment)
    return build_fee_payment_out(payment)


@router.get("/receipts/{receipt_number}", response_model=FeePaymentOut)
def get_receipt(
    receipt_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    payment = db.query(FeePayment).filter(FeePayment.receipt_number == receipt_number).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Receipt not found")

    inv = payment.invoice
    if current_user.role.name == "Student" and current_user.student_profile:
        if inv.student_id != current_user.student_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [c.id for c in current_user.parent_profile.children]
        if inv.student_id not in child_ids:
            raise HTTPException(status_code=403, detail="Access denied")

    return build_fee_payment_out(payment)


# --- FEE DASHBOARD & REPORTS ---

@router.get("/dashboard", response_model=FeeDashboardOut)
def get_fee_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    invoices = db.query(FeeInvoice).all()

    # Update statuses
    for inv in invoices:
        update_invoice_status(inv)

    total_invoiced = sum(i.total_amount for i in invoices)
    total_collected = sum(i.paid_amount for i in invoices)
    total_pending = sum(i.remaining_amount for i in invoices if i.status in ["Pending", "Partial"])
    total_overdue = sum(i.remaining_amount for i in invoices if i.status == "Overdue")

    today = date.today()
    today_payments = db.query(FeePayment).filter(FeePayment.payment_date == today).all()
    today_collected = sum(p.amount_paid for p in today_payments)

    total_inv_count = len(invoices)
    paid_count = sum(1 for i in invoices if i.status == "Paid")
    partial_count = sum(1 for i in invoices if i.status == "Partial")
    pending_count = sum(1 for i in invoices if i.status == "Pending")
    overdue_count = sum(1 for i in invoices if i.status == "Overdue")

    # Monthly Trend (Past 6 months)
    payments = db.query(FeePayment).all()
    month_map = {}
    for p in payments:
        m_str = p.payment_date.strftime("%b %Y")
        month_map[m_str] = month_map.get(m_str, 0.0) + p.amount_paid

    monthly_trend = [{"month": k, "amount": v} for k, v in month_map.items()]

    # Payment Methods
    method_map = {}
    for p in payments:
        pm = p.payment_method or "Cash"
        if pm not in method_map:
            method_map[pm] = {"total_amount": 0.0, "count": 0}
        method_map[pm]["total_amount"] += p.amount_paid
        method_map[pm]["count"] += 1

    method_breakdown = [
        {"method": k, "total_amount": v["total_amount"], "count": v["count"]}
        for k, v in method_map.items()
    ]

    return {
        "total_invoiced_amount": round(total_invoiced, 2),
        "total_collected_amount": round(total_collected, 2),
        "total_pending_amount": round(total_pending, 2),
        "total_overdue_amount": round(total_overdue, 2),
        "today_collected_amount": round(today_collected, 2),
        "total_invoices_count": total_inv_count,
        "paid_invoices_count": paid_count,
        "partial_invoices_count": partial_count,
        "pending_invoices_count": pending_count,
        "overdue_invoices_count": overdue_count,
        "monthly_collection_trend": monthly_trend,
        "payment_method_breakdown": method_breakdown
    }


@router.get("/reports/student/{student_id}", response_model=StudentFeeReportOut)
def get_student_fee_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role.name == "Student" and current_user.student_profile:
        if student.id != current_user.student_profile.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role.name == "Parent" and current_user.parent_profile:
        child_ids = [c.id for c in current_user.parent_profile.children]
        if student.id not in child_ids:
            raise HTTPException(status_code=403, detail="Access denied")

    invoices = db.query(FeeInvoice).filter(FeeInvoice.student_id == student_id).order_by(FeeInvoice.id.desc()).all()

    tot_invoiced = sum(i.total_amount for i in invoices)
    tot_paid = sum(i.paid_amount for i in invoices)
    tot_discount = sum(i.discount_amount for i in invoices)
    tot_fine = sum(i.fine_amount for i in invoices)
    tot_outstanding = sum(i.remaining_amount for i in invoices)

    return {
        "student_id": student.id,
        "student_name": student.user.full_name if student.user else f"{student.first_name} {student.last_name}",
        "admission_number": student.admission_number,
        "class_name": student.school_class.name if student.school_class else None,
        "section_name": student.section.name if student.section else None,
        "total_invoiced": round(tot_invoiced, 2),
        "total_paid": round(tot_paid, 2),
        "total_discount": round(tot_discount, 2),
        "total_fine": round(tot_fine, 2),
        "total_outstanding": round(tot_outstanding, 2),
        "invoices": [build_fee_invoice_out(inv) for inv in invoices]
    }


@router.get("/reports/class-wise", response_model=List[ClassFeeCollectionOut])
def get_class_wise_fee_report(
    academic_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    classes = db.query(SchoolClass).all()
    results = []

    for c in classes:
        invoices_q = db.query(FeeInvoice).join(Student).filter(Student.class_id == c.id)
        if academic_year_id:
            invoices_q = invoices_q.filter(FeeInvoice.academic_year_id == academic_year_id)
        invoices = invoices_q.all()

        students_count = db.query(Student).filter(Student.class_id == c.id).count()
        tot_inv = sum(i.total_amount for i in invoices)
        tot_col = sum(i.paid_amount for i in invoices)
        tot_pen = sum(i.remaining_amount for i in invoices)
        col_pct = round((tot_col / tot_inv * 100), 2) if tot_inv > 0 else 0.0

        results.append({
            "class_id": c.id,
            "class_name": c.name,
            "total_students": students_count,
            "total_invoiced": round(tot_inv, 2),
            "total_collected": round(tot_col, 2),
            "total_pending": round(tot_pen, 2),
            "collection_percentage": col_pct
        })
    return results
