import os
import re
import datetime
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.database import get_db
from app.models.user import User
from app.models.profiles import Student, Parent, Teacher, Staff, AdminProfile
from app.models.academic import SchoolClass, Section, Subject
from app.models.attendance import StudentAttendance
from app.models.examination import ExamMark, Exam
from app.models.finance import FeeInvoice, FeePayment, FeeStructure
from app.dependencies.auth import get_current_active_user, get_role_category

from app.models.extended import AdmissionInfo

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])
public_router = APIRouter(prefix="/api/public", tags=["Public Admissions Assistant"])

class QueryRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    response: str
    action: Optional[Dict[str, str]] = None
    intent: str = "general_query"
    role_scope: str = "restricted"
    source: str = "two-step-claude-flow"

# Helper function to persist public admission inquiries into separate admission_inquiries table
def log_admission_inquiry(db: Session, query: str, response_text: str):
    try:
        # Extract phone or email if provided in the visitor query text
        contact_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+|\+?\d[\d -]{7,}\d', query)
        extracted_contact = contact_match.group(0) if contact_match else None

        inquiry = AdmissionInquiry(
            visitor_name="Public Visitor",
            contact_info=extracted_contact,
            query=query,
            response=response_text,
            status="New Lead"
        )
        db.add(inquiry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error persisting admission inquiry: {e}")

# =========================================================================
# SEPARATE PUBLIC ADMISSIONS ENDPOINT (POST /api/public/admission-assistant)
# NO ACCESS TO AUTHENTICATED USER DATA OR INTERNAL ROLE-BASED TABLES/GUARDS
# =========================================================================
@public_router.post("/admission-assistant", response_model=QueryResponse)
@router.post("/public-query", response_model=QueryResponse)
async def public_admission_assistant(
    req: QueryRequest,
    db: Session = Depends(get_db)
):
    user_query = req.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    q_lower = user_query.lower()
    api_key = os.getenv("ANTHROPIC_API_KEY", "")

    # STRICT DATA ISOLATION GUARD:
    # Query ONLY the standalone 'admission_info' table.
    # NEVER touch internal tables (students, teachers, staff, attendances, fee_invoices, users).
    admission_records = db.query(AdmissionInfo).filter(AdmissionInfo.is_active == True).all()

    isolated_admission_data = []
    for rec in admission_records:
        isolated_admission_data.append({
            "category": rec.category,
            "topic": rec.grade_or_topic,
            "details": rec.details,
            "fee_amount": rec.fee_amount,
            "available_seats": rec.available_seats
        })

    # Strict system prompt instructing the LLM to refuse private internal data
    system_prompt = (
        f"You are EduPulse Public AI Assistant on the School Admissions Portal. "
        f"You are strictly restricted to answering general admissions queries using ONLY data from the standalone 'admission_info' table: {isolated_admission_data}. "
        f"CRITICAL PRIVACY RULE: You NEVER have access to private student records, grades, attendance, staff details, or individual payments. "
        f"If asked about personal student/teacher data, politely inform the user that private internal records are protected and require logging in to the portal."
    )

    bot_text = None
    source_label = "isolated-admission-engine"

    if api_key and api_key != "your_anthropic_api_key_here":
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 400,
                        "system": system_prompt,
                        "messages": [{"role": "user", "content": user_query}]
                    }
                )
                if res.status_code == 200:
                    content = res.json().get("content", [])
                    bot_text = content[0].get("text", "") if content else None
                    source_label = "public-claude-haiku"
        except Exception as e:
            print(f"Public assistant LLM call error: {e}")

    # Fallback Synthesis Engine pulling ONLY from admission_info records
    if not bot_text:
        # Check for privacy violation attempts
        if any(k in q_lower for k in ["student record", "grade of", "marks of", "teacher", "salary", "invoice for", "my child"]):
            bot_text = "🔒 *Privacy Notice:* The Public Admissions Assistant does not have access to private student, attendance, or staff records. Please log in to the EduPulse Portal to view personal academic statements."

        # Category 1: Seat Vacancies (From admission_info)
        elif any(k in q_lower for k in ["seat", "vacancy", "available", "capacity", "space"]):
            seats = [r for r in isolated_admission_data if r["category"] == "Seat Availability"]
            if seats:
                s_lines = [f"• {s['topic']}: {s['details']}" for s in seats]
                bot_text = "Current Seat Availability (from official Admissions records):\n" + "\n".join(s_lines)
            else:
                bot_text = "Admissions for Academic Year 2026-2027 are open. Please contact admissions@edupulse-school.edu for seat availability."

        # Category 2: Fee Structure (From admission_info)
        elif any(k in q_lower for k in ["fee", "tuition", "cost", "price", "charge"]):
            fees = [r for r in isolated_admission_data if r["category"] == "Fee Structure"]
            if fees:
                f_lines = [f"• {f['topic']}: {f['details']}" for f in fees]
                bot_text = "Official Tuition & Fee Structure (2026-2027):\n" + "\n".join(f_lines)
            else:
                bot_text = "Tuition fees are structured per term/month. Contact admissions@edupulse-school.edu for full fee breakdowns."

        # Category 3: Required Documents
        elif any(k in q_lower for k in ["document", "paperwork", "certificate", "transcript", "require"]):
            docs = [r for r in isolated_admission_data if r["category"] == "Documents"]
            bot_text = docs[0]["details"] if docs else "Required Documents: Birth Certificate, 2 years Transcripts, TC, 4 Photos, Parent ID, Immunization Record."

        # Category 4: Age Criteria
        elif any(k in q_lower for k in ["age", "eligibility", "old", "criteria"]):
            ages = [r for r in isolated_admission_data if r["category"] == "Age Criteria"]
            bot_text = ages[0]["details"] if ages else "Grade 1: 5.5-6.5 years as of Sept 1. Grade 2: 6.5-7.5 years. Grade 5: 9.5-10.5 years."

        # Category 5: Deadlines & Calendar Dates
        elif any(k in q_lower for k in ["deadline", "date", "calendar", "when"]):
            deadlines = [r for r in isolated_admission_data if r["category"] == "Deadlines"]
            bot_text = deadlines[0]["details"] if deadlines else "Application Deadline: August 15, 2026. Academic Term 1 Begins: September 1, 2026."

        # Category 6: Application Process
        elif any(k in q_lower for k in ["process", "apply", "step", "how to"]):
            proc = [r for r in isolated_admission_data if r["category"] == "Process"]
            bot_text = proc[0]["details"] if proc else "Step 1: Fill Online Form. Step 2: Submit Documents. Step 3: Placement Assessment. Step 4: Seat Reservation."

        # Category 7: Timings, Contact & Location
        elif any(k in q_lower for k in ["timing", "time", "contact", "phone", "email", "address", "location"]):
            contact = [r for r in isolated_admission_data if r["category"] == "Contact & FAQ"]
            bot_text = contact[0]["details"] if contact else "Address: 100 EduPulse Campus Way. School Hours: Mon-Fri 8:00 AM - 3:00 PM. Phone: +1 (800) 555-EDU1."

        else:
            bot_text = "I couldn't find specific details regarding your question in our public admissions database.\n\nPlease contact our Admissions Office directly:\n• 📞 Phone: +1 (800) 555-EDU1\n• 📧 Email: admissions@edupulse-school.edu\n• 🏢 Office Hours: Mon-Sat, 8:00 AM - 4:00 PM\n\nOr click the button below to submit a 'Request a Callback' inquiry form!"

    # Log public chatbot interaction into separate 'admission_inquiries' table
    log_admission_inquiry(db, user_query, bot_text)

    return QueryResponse(
        response=bot_text,
        action={"label": "Request a Callback Form", "path": "/admissions"},
        intent="public_admissions_query",
        role_scope="Public Guest (Isolated Access)",
        source=source_label
    )


# =========================================================================
# PUBLIC ADMISSION INQUIRIES LEADS ENDPOINT (For Principal & Admissions Staff)
# =========================================================================
@public_router.get("/inquiries")
def get_admission_inquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    role_name = current_user.role.name if current_user.role else ""
    role_cat = get_role_category(role_name)

    # Allow Principal, School Admin, Super Admin, and Staff/Teacher to view admissions lead inquiries
    if role_cat not in ["Admin", "Teacher", "Staff"] and "Principal" not in role_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Principal and Admissions staff can access admission inquiries."
        )

    inquiries = db.query(AdmissionInquiry).order_by(AdmissionInquiry.timestamp.desc()).limit(200).all()
    
    result = []
    for inq in inquiries:
        result.append({
            "id": inq.id,
            "visitor_name": inq.visitor_name,
            "contact_info": inq.contact_info or "Not provided",
            "query": inq.query,
            "response": inq.response,
            "status": inq.status,
            "timestamp": inq.timestamp.isoformat() if inq.timestamp else None
        })

    return result


# =========================================================================
# STEP 1: CONVERT NATURAL LANGUAGE QUESTION -> STRUCTURED ROLE-SCOPED QUERY
# =========================================================================
def execute_step1_structured_query(db: Session, current_user: User, user_query: str) -> Dict[str, Any]:
    q_lower = user_query.lower()
    role_name = current_user.role.name if current_user.role else ""
    category = get_role_category(role_name)

    intent = "general_overview"
    is_allowed = True
    denial_reason = None
    data = {}

    # Category Intent Parsing
    if any(k in q_lower for k in ["fee", "invoice", "payment", "due", "revenue", "collect", "pending"]):
        intent = "fee_finance_query"
        if category not in ["Admin", "Staff", "Student", "Parent"] or (category == "Staff" and "Accountant" not in role_name and "Admin" not in role_name):
            if category == "Teacher":
                is_allowed = False
                denial_reason = "Teachers are not permitted to access financial fee records or fee revenue data."

    elif any(k in q_lower for k in ["mark", "exam", "grade", "result", "card", "score", "performance"]):
        intent = "exam_results_query"
        if category == "Staff" and "Accountant" in role_name:
            is_allowed = False
            denial_reason = "Accountants are not permitted to access student academic marks or exam results."

    elif any(k in q_lower for k in ["attendance", "absent", "present", "roll call"]):
        intent = "attendance_query"
        if category == "Staff" and "Accountant" in role_name:
            is_allowed = False
            denial_reason = "Accountants are not permitted to access student attendance records."

    elif any(k in q_lower for k in ["student", "census", "enroll", "admission"]):
        intent = "students_query"

    elif any(k in q_lower for k in ["teacher", "staff", "educator"]):
        intent = "teachers_query"

    if not is_allowed:
        return {
            "intent": "access_denied",
            "is_allowed": False,
            "denial_reason": denial_reason,
            "data": None
        }

    # Extract target class / grade number if present (e.g. "Grade 5", "Class 5", "5th")
    target_class_name = None
    grade_match = re.search(r'(?:grade|class)\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s*grade', q_lower)
    if grade_match:
        grade_num = grade_match.group(1) or grade_match.group(2)
        target_class_name = f"Grade {grade_num}"

    # Extract threshold percentage if present (e.g. "below 75%", "< 75%", "75%")
    pct_match = re.search(r'(?:below|under|<|less than)\s*(\d+)%?', q_lower)
    threshold_pct = float(pct_match.group(1)) if pct_match else 75.0

    today = datetime.date.today()
    current_month = today.month
    current_year = today.year

    # --- USE CASE 1: Grade X Pending Fees ---
    if intent == "fee_finance_query" and ("pending" in q_lower or "due" in q_lower) and target_class_name:
        query_class = db.query(SchoolClass).filter(SchoolClass.name.ilike(f"%{target_class_name}%")).first()
        if not query_class:
            data = {"message": f"No class found matching '{target_class_name}'.", "students_with_pending_fees": []}
        else:
            invoices = db.query(FeeInvoice).join(Student).filter(
                Student.class_id == query_class.id,
                FeeInvoice.status.in_(["Pending", "Partial", "Overdue"])
            ).all()
            
            pending_list = []
            for inv in invoices:
                student_user = inv.student.user if inv.student else None
                student_name = student_user.full_name if student_user else f"Student #{inv.student_id}"
                pending_list.append({
                    "student_name": student_name,
                    "admission_number": inv.student.admission_number if inv.student else "",
                    "invoice_number": inv.invoice_number,
                    "fee_month": inv.fee_month,
                    "remaining_amount": inv.remaining_amount,
                    "status": inv.status,
                    "due_date": str(inv.due_date)
                })

            data = {
                "class_name": query_class.name,
                "total_pending_count": len(pending_list),
                "total_pending_amount": sum(p["remaining_amount"] for p in pending_list),
                "students_with_pending_fees": pending_list
            }

    # --- USE CASE 4: Fee Revenue Collected This Month ---
    elif intent == "fee_finance_query" and any(k in q_lower for k in ["revenue", "collected", "collection", "total fee"]):
        payments_this_month = db.query(FeePayment).filter(
            extract('month', FeePayment.payment_date) == current_month,
            extract('year', FeePayment.payment_date) == current_year
        ).all()

        revenue_collected = sum(p.amount_paid for p in payments_this_month)
        
        invoices_this_month = db.query(FeeInvoice).filter(
            extract('month', FeeInvoice.issue_date) == current_month,
            extract('year', FeeInvoice.issue_date) == current_year
        ).all()
        invoiced_total = sum(i.total_amount for i in invoices_this_month)

        data = {
            "month": today.strftime("%B %Y"),
            "revenue_collected": revenue_collected,
            "payments_count": len(payments_this_month),
            "total_invoiced_this_month": invoiced_total,
            "collection_rate": f"{round((revenue_collected / invoiced_total * 100), 1)}%" if invoiced_total > 0 else "N/A"
        }

    # --- USE CASE 2: Student My Attendance Percentage This Month ---
    elif intent == "attendance_query" and category == "Student":
        s_rec = current_user.student_profile
        if s_rec:
            monthly_att = db.query(StudentAttendance).filter(
                StudentAttendance.student_id == s_rec.id,
                extract('month', StudentAttendance.attendance_date) == current_month,
                extract('year', StudentAttendance.attendance_date) == current_year
            ).all()

            total_days = len(monthly_att)
            present_days = sum(1 for a in monthly_att if a.status in ["Present", "Late"])
            absent_days = sum(1 for a in monthly_att if a.status == "Absent")
            pct = round((present_days / total_days * 100), 1) if total_days > 0 else 100.0

            data = {
                "student_name": current_user.full_name,
                "admission_number": s_rec.admission_number,
                "month": today.strftime("%B %Y"),
                "total_recorded_days": total_days,
                "present_days": present_days,
                "absent_days": absent_days,
                "attendance_percentage": pct
            }
        else:
            data = {"error": "Student profile not found."}

    # --- USE CASE 3: Students with Attendance Below X% ---
    elif intent == "attendance_query" and ("below" in q_lower or "under" in q_lower or "<" in q_lower or "low" in q_lower):
        class_id_filter = None
        if category == "Teacher" and current_user.teacher_profile:
            assigned_sec = current_user.teacher_profile.assigned_sections
            if assigned_sec:
                class_id_filter = assigned_sec[0].class_id

        if not class_id_filter and target_class_name:
            query_class = db.query(SchoolClass).filter(SchoolClass.name.ilike(f"%{target_class_name}%")).first()
            if query_class:
                class_id_filter = query_class.id

        students_query = db.query(Student)
        if class_id_filter:
            students_query = students_query.filter(Student.class_id == class_id_filter)
        students = students_query.all()

        low_att_students = []
        for s in students:
            att_records = db.query(StudentAttendance).filter(
                StudentAttendance.student_id == s.id,
                extract('month', StudentAttendance.attendance_date) == current_month,
                extract('year', StudentAttendance.attendance_date) == current_year
            ).all()

            if att_records:
                tot = len(att_records)
                pres = sum(1 for a in att_records if a.status in ["Present", "Late"])
                pct = round((pres / tot * 100), 1)
                if pct < threshold_pct:
                    s_user = s.user
                    low_att_students.append({
                        "student_name": s_user.full_name if s_user else f"Student #{s.id}",
                        "admission_number": s.admission_number,
                        "class": s.school_class.name if s.school_class else "N/A",
                        "attendance_percentage": pct,
                        "present_days": pres,
                        "total_days": tot
                    })

        data = {
            "threshold": f"{threshold_pct}%",
            "month": today.strftime("%B %Y"),
            "low_attendance_count": len(low_att_students),
            "students": low_att_students
        }

    # --- USE CASE 5: Summarize Exam Performance ---
    elif intent == "exam_results_query" and any(k in q_lower for k in ["performance", "summarize", "exam", "report"]):
        # Find target student by name or current student profile
        target_student = None
        if category in ["Student", "Parent"] and current_user.student_profile:
            target_student = current_user.student_profile
        else:
            # Check for student name or admission number in query or fetch top student
            for st in db.query(Student).all():
                if st.user and st.user.full_name and st.user.full_name.lower() in q_lower:
                    target_student = st
                    break
                if st.admission_number and st.admission_number.lower() in q_lower:
                    target_student = st
                    break
            if not target_student:
                target_student = db.query(Student).first()

        if target_student:
            marks = db.query(ExamMark).join(Exam).filter(ExamMark.student_id == target_student.id).all()
            subject_performance = []
            total_obtained = 0.0
            total_max = 0.0

            for m in marks:
                sub_name = m.exam.subject.name if m.exam and m.exam.subject else "General"
                tot = m.exam.total_marks if m.exam else 100.0
                obtained = m.marks_obtained
                total_obtained += obtained
                total_max += tot
                subject_performance.append({
                    "subject": sub_name,
                    "exam_name": m.exam.name if m.exam else "Exam",
                    "marks_obtained": obtained,
                    "total_marks": tot,
                    "percentage": round((obtained / tot * 100), 1) if tot > 0 else 0,
                    "status": "Absent" if m.is_absent else ("Pass" if obtained >= (m.exam.passing_marks if m.exam else 40) else "Fail")
                })

            overall_pct = round((total_obtained / total_max * 100), 1) if total_max > 0 else 0.0
            grade = "A+" if overall_pct >= 90 else ("A" if overall_pct >= 80 else ("B" if overall_pct >= 70 else ("C" if overall_pct >= 60 else "F")))

            s_user = target_student.user
            data = {
                "student_name": s_user.full_name if s_user else f"Student #{target_student.id}",
                "admission_number": target_student.admission_number,
                "class_name": target_student.school_class.name if target_student.school_class else "N/A",
                "total_exams_taken": len(marks),
                "total_obtained": total_obtained,
                "total_max": total_max,
                "overall_percentage": overall_pct,
                "overall_grade": grade,
                "subject_performance": subject_performance
            }
        else:
            data = {"message": "No student found to summarize performance."}

    # --- FALLBACK / GENERAL OVERVIEW ---
    else:
        if category == "Admin":
            invs = db.query(FeeInvoice).all()
            data = {
                "total_invoices": len(invs),
                "total_invoiced_amount": sum(i.total_amount for i in invs),
                "total_collected_amount": sum(i.paid_amount for i in invs),
                "overdue_count": sum(1 for i in invs if i.status == "Overdue"),
                "student_count": db.query(Student).count(),
                "teacher_count": db.query(Teacher).count(),
                "class_count": db.query(SchoolClass).count()
            }
        elif category == "Teacher":
            t_rec = current_user.teacher_profile
            subjects = db.query(Subject).filter(Subject.teacher_id == t_rec.id).all() if t_rec else []
            data = {
                "teacher_id": t_rec.employee_id if t_rec else None,
                "department": t_rec.department if t_rec else None,
                "assigned_subjects": [s.name for s in subjects]
            }
        elif category == "Staff" and "Accountant" in role_name:
            invs = db.query(FeeInvoice).all()
            data = {
                "total_invoices": len(invs),
                "pending_invoices": sum(1 for i in invs if i.status in ["Pending", "Partial"]),
                "overdue_invoices": sum(1 for i in invs if i.status == "Overdue"),
                "total_collected": sum(i.paid_amount for i in invs)
            }
        elif category == "Student":
            s_rec = current_user.student_profile
            if s_rec:
                my_invs = db.query(FeeInvoice).filter(FeeInvoice.student_id == s_rec.id).all()
                my_att = db.query(StudentAttendance).filter(StudentAttendance.student_id == s_rec.id).all()
                data = {
                    "admission_number": s_rec.admission_number,
                    "class_name": s_rec.school_class.name if s_rec.school_class else None,
                    "attendance_days_present": sum(1 for a in my_att if a.status in ["Present", "Late"]),
                    "total_attendance_days": len(my_att),
                    "my_invoices_count": len(my_invs)
                }
        else:
            data = {"user_name": current_user.full_name, "role": role_name}

    return {
        "intent": intent,
        "is_allowed": True,
        "denial_reason": None,
        "data": data
    }


def determine_action(intent: str, role_cat: str) -> Optional[Dict[str, str]]:
    if intent == "fee_finance_query" and role_cat in ["Admin", "Staff", "Student", "Parent"]:
        return {"label": "Open Fee Management", "path": "/fees"}
    if intent == "exam_results_query" and role_cat in ["Admin", "Teacher", "Student"]:
        return {"label": "Go to Exam Results", "path": "/results"}
    if intent == "attendance_query" and role_cat in ["Admin", "Teacher", "Student"]:
        return {"label": "Open Student Attendance", "path": "/attendance"}
    if intent == "students_query" and role_cat in ["Admin", "Teacher"]:
        return {"label": "View Students Directory", "path": "/students"}
    if intent == "teachers_query" and role_cat in ["Admin"]:
        return {"label": "View Teachers Directory", "path": "/teachers"}
    return None

from app.models.extended import AssistantLog

# Helper function to persist audit logs
def log_assistant_interaction(db: Session, user_id: int, role: str, query: str, response_text: str):
    try:
        log_entry = AssistantLog(
            user_id=user_id,
            role=role,
            query=query,
            response=response_text
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error persisting assistant log: {e}")

# =========================================================================
# STEP 2: SEND FETCHED DATA + QUESTION TO LLM FOR NATURAL RESPONSE
# =========================================================================
@router.post("/query", response_model=QueryResponse)
async def query_assistant(
    req: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_query = req.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    role_name = current_user.role.name if current_user.role else "User"
    role_cat = get_role_category(role_name)

    # ---------------------------------------------------------------------
    # STEP 1 EXECUTION: Intent Parsing & Pre-Scoped DB Query Fetching
    # ---------------------------------------------------------------------
    step1_result = execute_step1_structured_query(db, current_user, user_query)

    if not step1_result["is_allowed"]:
        denial_msg = f"Access Denied: Your role ({role_name}) is restricted from querying this category of data. {step1_result['denial_reason']}"
        
        # Log denied attempt for Principal audit
        log_assistant_interaction(db, current_user.id, role_name, user_query, denial_msg)
        
        return QueryResponse(
            response=denial_msg,
            action=None,
            intent=step1_result["intent"],
            role_scope="restricted",
            source="step1-guard-refusal"
        )

    # ---------------------------------------------------------------------
    # STEP 2 EXECUTION: LLM Synthesis with Fetched Data + Original Question
    # ---------------------------------------------------------------------
    step1_data = step1_result["data"]
    step1_intent = step1_result["intent"]

    system_prompt = (
        f"You are EduPulse AI, an intelligent assistant inside EduPulse School ERP. "
        f"User: '{current_user.full_name}' | Role: '{role_name}' ({role_cat}). "
        f"Step 1 Structured Query Result: {step1_data} (Parsed Intent: '{step1_intent}'). "
        f"Provide a natural, human-readable answer answering the user's question using ONLY the provided Step 1 data. "
        f"Be clear, precise, friendly, and format key lists/figures neatly."
    )

    final_bot_text = None
    source_label = "two-step-synthesis-engine"

    if api_key and api_key != "your_anthropic_api_key_here":
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 400,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": user_query}
                        ]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("content", [])
                    final_bot_text = content[0].get("text", "") if content else "I am ready to assist you."
                    source_label = "two-step-claude-haiku"
                else:
                    print(f"Anthropic API returned status {res.status_code}: {res.text}")
        except httpx.TimeoutException:
            print("Anthropic API request timed out after 12s. Falling back to local synthesis engine.")
        except Exception as e:
            print(f"Anthropic API error call: {e}. Falling back to local synthesis engine.")

    # Rich Structured Fallback Synthesis Engine (used if LLM not configured or fails)
    if not final_bot_text:
        if "students_with_pending_fees" in step1_data:
            students = step1_data["students_with_pending_fees"]
            c_name = step1_data.get("class_name", "the requested class")
            tot_amt = step1_data.get("total_pending_amount", 0)
            if not students:
                final_bot_text = f"Good news! There are currently no students in {c_name} with pending fee invoices."
            else:
                names = ", ".join([f"{s['student_name']} (${s['remaining_amount']:,.2f})" for s in students[:5]])
                more_str = f" and {len(students) - 5} more" if len(students) > 5 else ""
                final_bot_text = f"In {c_name}, there are {len(students)} students with pending fees totaling ${tot_amt:,.2f}. Pending students: {names}{more_str}."

        elif "revenue_collected" in step1_data:
            rev = step1_data["revenue_collected"]
            m_name = step1_data.get("month", "this month")
            rate = step1_data.get("collection_rate", "N/A")
            final_bot_text = f"Total fee revenue collected in {m_name} is ${rev:,.2f} across {step1_data.get('payments_count', 0)} payment transactions (Collection rate: {rate})."

        elif "attendance_percentage" in step1_data:
            pct = step1_data["attendance_percentage"]
            m_name = step1_data.get("month", "this month")
            final_bot_text = f"Your attendance for {m_name} is {pct}% ({step1_data.get('present_days', 0)} present days out of {step1_data.get('total_recorded_days', 0)} recorded academic days)."

        elif "low_attendance_count" in step1_data:
            thresh = step1_data.get("threshold", "75%")
            st_list = step1_data.get("students", [])
            if not st_list:
                final_bot_text = f"All students currently have attendance above the {thresh} threshold for this month."
            else:
                s_details = ", ".join([f"{s['student_name']} ({s['attendance_percentage']}%)" for s in st_list[:5]])
                more_str = f" and {len(st_list) - 5} others" if len(st_list) > 5 else ""
                final_bot_text = f"Found {len(st_list)} student(s) with attendance below {thresh}: {s_details}{more_str}."

        elif "overall_percentage" in step1_data:
            st_name = step1_data.get("student_name", "Student")
            pct = step1_data.get("overall_percentage", 0)
            grade = step1_data.get("overall_grade", "N/A")
            c_name = step1_data.get("class_name", "")
            tot_exams = step1_data.get("total_exams_taken", 0)
            final_bot_text = f"Exam Summary for {st_name} ({c_name}): Overall score is {pct}% (Grade {grade}) across {tot_exams} recorded exams."

        elif step1_intent == "fee_finance_query":
            final_bot_text = f"Financial summary: total collected amount is ${step1_data.get('total_collected_amount', step1_data.get('total_collected', 0)):,.2f} with {step1_data.get('overdue_count', step1_data.get('overdue_invoices', 0))} overdue invoices."

        elif step1_intent == "attendance_query":
            final_bot_text = f"Attendance summary: overall attendance rate is {step1_data.get('attendance_rate', '100%')} across recorded student logs."

        elif step1_intent == "exam_results_query":
            final_bot_text = f"Exam gradebook: student marks and report cards are recorded and formatted according to official grade range guidelines."

        else:
            final_bot_text = f"Hello {current_user.full_name}! EduPulse currently manages {step1_data.get('student_count', 'all active')} students and {step1_data.get('teacher_count', 'educators')} staff members."

    # Audit log persistence into assistant_logs table
    log_assistant_interaction(db, current_user.id, role_name, user_query, final_bot_text)

    return QueryResponse(
        response=final_bot_text,
        action=determine_action(step1_intent, role_cat),
        intent=step1_intent,
        role_scope=f"Role-Scoped Data ({role_name})",
        source=source_label
    )


# =========================================================================
# AUDIT LOGS ENDPOINT (Principal / Admin Only)
# =========================================================================
@router.get("/logs")
def get_assistant_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    role_name = current_user.role.name if current_user.role else ""
    role_cat = get_role_category(role_name)

    # Restrict viewing assistant audit logs strictly to Principal / Super Admin / School Admin
    if role_cat != "Admin" and "Principal" not in role_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Principal and School Administrators can audit AI Assistant logs."
        )

    logs = db.query(AssistantLog).order_by(AssistantLog.timestamp.desc()).limit(200).all()
    
    result = []
    for l in logs:
        user_name = l.user.full_name if l.user else f"User #{l.user_id}"
        result.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": user_name,
            "role": l.role,
            "query": l.query,
            "response": l.response,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })

    return result


