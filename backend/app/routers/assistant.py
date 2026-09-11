import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.database import get_db
from app.models.user import User
from app.models.profiles import Student, Parent, Teacher, Staff, AdminProfile
from app.models.academic import SchoolClass, Section, Subject
from app.models.attendance import StudentAttendance
from app.models.examination import ExamMark
from app.models.finance import FeeInvoice, FeePayment, FeeStructure
from app.dependencies.auth import get_current_active_user, get_role_category

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

class QueryRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    response: str
    action: Optional[Dict[str, str]] = None
    intent: str = "general_query"
    role_scope: str = "restricted"
    source: str = "two-step-claude-flow"

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
    if any(k in q_lower for k in ["fee", "invoice", "payment", "due", "revenue", "collect"]):
        intent = "fee_finance_query"
        if category not in ["Admin", "Staff", "Student", "Parent"] or (category == "Staff" and "Accountant" not in role_name and "Admin" not in role_name):
            if category == "Teacher":
                is_allowed = False
                denial_reason = "Teachers are not permitted to access financial fee records."

    elif any(k in q_lower for k in ["mark", "exam", "grade", "result", "card", "score"]):
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

    # Fetch Structured DB Data based on Intent & Role Scope
    if category == "Admin":
        if intent == "fee_finance_query":
            invs = db.query(FeeInvoice).all()
            data = {
                "total_invoices": len(invs),
                "total_invoiced_amount": sum(i.total_amount for i in invs),
                "total_collected_amount": sum(i.paid_amount for i in invs),
                "overdue_count": sum(1 for i in invs if i.status == "Overdue")
            }
        elif intent == "attendance_query":
            total = db.query(StudentAttendance).count()
            present = db.query(StudentAttendance).filter(StudentAttendance.status == "Present").count()
            data = {"total_logs": total, "present_count": present, "attendance_rate": f"{round(present/total*100, 1)}%" if total > 0 else "100%"}
        else:
            data = {
                "student_count": db.query(Student).count(),
                "teacher_count": db.query(Teacher).count(),
                "staff_count": db.query(Staff).count(),
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
                "attendance_days_present": sum(1 for a in my_att if a.status == "Present"),
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
        f"Keep the answer friendly, clear, professional, and under 3 sentences."
    )

    if api_key and api_key != "your_anthropic_api_key_here":
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 250,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": user_query}
                        ]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("content", [])
                    bot_text = content[0].get("text", "") if content else "I am ready to assist you."
                    return QueryResponse(
                        response=bot_text,
                        action=determine_action(step1_intent, role_cat),
                        intent=step1_intent,
                        role_scope=f"Role-Scoped Data ({role_name})",
                        source="two-step-claude-haiku"
                    )
        except Exception as e:
            print(f"Anthropic API error call: {e}")

    # Fallback Synthesis Engine for Step 2
    if step1_intent == "fee_finance_query":
        bot_answer = f"Here is your financial summary: total collected amount is ${step1_data.get('total_collected_amount', step1_data.get('total_collected', 0)):,.2f} with {step1_data.get('overdue_count', step1_data.get('overdue_invoices', 0))} overdue invoices."
    elif step1_intent == "attendance_query":
        bot_answer = f"Attendance summary: overall attendance rate is {step1_data.get('attendance_rate', '100%')} across recorded student logs."
    elif step1_intent == "exam_results_query":
        bot_answer = f"Exam gradebook: student marks and report cards are recorded and formatted according to official grade range guidelines."
    else:
        bot_answer = f"Hello {current_user.full_name}! EduPulse currently manages {step1_data.get('student_count', 'all active')} students and {step1_data.get('teacher_count', 'educators')} staff members."

    return QueryResponse(
        response=bot_answer,
        action=determine_action(step1_intent, role_cat),
        intent=step1_intent,
        role_scope=f"Role-Scoped Data ({role_name})",
        source="two-step-synthesis-engine"
    )
