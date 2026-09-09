from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student, Teacher, Parent
from app.models.academic import SchoolClass, Section, Subject, AcademicYear
from app.models.attendance import StudentAttendance, TeacherAttendance
from app.models.finance import FeeInvoice, FeePayment
from app.models.examination import Exam, ExamMark
from app.models.timetable import TimetableEntry, Period
from app.models.extended import Assignment, AssignmentSubmission, SchoolEvent, Announcement
from app.dependencies.auth import get_current_active_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Real Statistics"])

@router.get("/stats")
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    role_name = current_user.role.name
    today = date.today()

    # --- 1. SUPER ADMIN / SCHOOL ADMIN / PRINCIPAL DASHBOARD ---
    if role_name in ["Super Admin", "School Admin", "Principal"]:
        total_students = db.query(Student).count()
        total_teachers = db.query(Teacher).count()
        total_classes = db.query(SchoolClass).count()
        total_subjects = db.query(Subject).count()

        # Today's attendance
        today_att = db.query(StudentAttendance).filter(StudentAttendance.attendance_date == today).all()
        today_present = sum(1 for a in today_att if a.status == "Present")
        today_absent = sum(1 for a in today_att if a.status == "Absent")

        # Today's teacher attendance
        teacher_att = db.query(TeacherAttendance).filter(TeacherAttendance.attendance_date == today).all()
        today_present_t = sum(1 for a in teacher_att if a.status == "Present")
        today_absent_t = sum(1 for a in teacher_att if a.status == "Absent")

        # Fee metrics
        invoices = db.query(FeeInvoice).all()
        total_fees_collected = sum(i.paid_amount for i in invoices)
        total_fees_pending = sum(i.remaining_amount for i in invoices if i.status in ["Pending", "Partial"])
        total_fees_overdue = sum(i.remaining_amount for i in invoices if i.status == "Overdue" or (today > i.due_date and i.remaining_amount > 0))

        today_payments = db.query(FeePayment).filter(FeePayment.payment_date == today).all()
        today_fees_collected = sum(p.amount_paid for p in today_payments)

        # Enrollment by class
        classes = db.query(SchoolClass).all()
        enrollment_by_class = [
            {"class_name": c.name, "students_count": db.query(Student).filter(Student.class_id == c.id).count()}
            for c in classes
        ]

        # Attendance trend (past 7 days)
        attendance_trends = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_records = db.query(StudentAttendance).filter(StudentAttendance.attendance_date == d).all()
            p_cnt = sum(1 for r in day_records if r.status == "Present")
            a_cnt = sum(1 for r in day_records if r.status == "Absent")
            attendance_trends.append({
                "date": d.strftime("%a %d"),
                "present": p_cnt,
                "absent": a_cnt,
                "rate": round((p_cnt / len(day_records) * 100), 1) if day_records else 100.0
            })

        # Monthly fee collection (past 6 months)
        all_payments = db.query(FeePayment).all()
        month_map = {}
        for p in all_payments:
            m_str = p.payment_date.strftime("%b %Y")
            month_map[m_str] = month_map.get(m_str, 0.0) + p.amount_paid
        monthly_fee_collection = [{"month": k, "amount": v} for k, v in month_map.items()]

        # Recent activities & Events
        pinned_announcements = db.query(Announcement).filter(
            Announcement.target_role.in_(["All", role_name])
        ).order_by(Announcement.is_pinned.desc(), Announcement.id.desc()).limit(5).all()

        upcoming_events = db.query(SchoolEvent).filter(
            SchoolEvent.end_date >= today
        ).order_by(SchoolEvent.start_date.asc()).limit(5).all()

        return {
            "role": role_name,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_classes": total_classes,
            "total_subjects": total_subjects,
            "today_present_students": today_present,
            "today_absent_students": today_absent,
            "today_present_teachers": today_present_t,
            "today_absent_teachers": today_absent_t,
            "total_fees_collected": round(total_fees_collected, 2),
            "total_fees_pending": round(total_fees_pending, 2),
            "total_fees_overdue": round(total_fees_overdue, 2),
            "today_fees_collected": round(today_fees_collected, 2),
            "enrollment_by_class": enrollment_by_class,
            "attendance_trends": attendance_trends,
            "monthly_fee_collection": monthly_fee_collection,
            "pinned_announcements": [
                {
                    "id": a.id,
                    "title": a.title,
                    "content": a.content,
                    "category": a.category,
                    "target_role": a.target_role,
                    "is_pinned": a.is_pinned,
                    "author_name": a.author.full_name if a.author else None,
                    "created_at": a.created_at,
                    "updated_at": a.updated_at
                }
                for a in pinned_announcements
            ],
            "upcoming_events": [
                {
                    "id": e.id,
                    "title": e.title,
                    "description": e.description,
                    "event_type": e.event_type,
                    "start_date": e.start_date,
                    "end_date": e.end_date,
                    "location": e.location,
                    "audience": e.audience,
                    "created_at": e.created_at
                }
                for e in upcoming_events
            ]
        }

    # --- 2. TEACHER DASHBOARD ---
    elif role_name == "Teacher":
        teacher = current_user.teacher_profile
        t_id = teacher.id if teacher else None

        # Assigned classes & subjects
        assigned_subjects = db.query(Subject).filter(Subject.teacher_id == t_id).all() if t_id else []
        assigned_classes = list({s.school_class.name for s in assigned_subjects if s.school_class})

        # Today's timetable
        day_name = today.strftime("%A")
        tt_entries = db.query(TimetableEntry).filter(
            TimetableEntry.teacher_id == t_id,
            TimetableEntry.day_of_week.ilike(day_name)
        ).all() if t_id else []

        # Assignments
        my_assignments = db.query(Assignment).filter(
            Assignment.teacher_id == t_id
        ).order_by(Assignment.id.desc()).limit(5).all() if t_id else []

        pending_sub = sum(
            db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.status == "Submitted"
            ).count()
            for a in my_assignments
        )

        announcements = db.query(Announcement).filter(
            Announcement.target_role.in_(["All", "Teacher"])
        ).order_by(Announcement.is_pinned.desc(), Announcement.id.desc()).limit(5).all()

        upcoming_events = db.query(SchoolEvent).filter(
            SchoolEvent.end_date >= today,
            SchoolEvent.audience.in_(["All", "Teachers"])
        ).order_by(SchoolEvent.start_date.asc()).limit(5).all()

        return {
            "role": role_name,
            "assigned_classes_count": len(assigned_classes),
            "assigned_subjects_count": len(assigned_subjects),
            "today_classes_count": len(tt_entries),
            "pending_submissions_count": pending_sub,
            "assigned_classes": assigned_classes,
            "assigned_subjects": [{"id": s.id, "name": s.name, "code": s.code, "class": s.school_class.name if s.school_class else None} for s in assigned_subjects],
            "today_timetable": [
                {
                    "id": t.id,
                    "day": t.day_of_week,
                    "period": t.period.name if t.period else None,
                    "start_time": t.period.start_time.strftime("%H:%M") if t.period and t.period.start_time else None,
                    "end_time": t.period.end_time.strftime("%H:%M") if t.period and t.period.end_time else None,
                    "subject": t.subject.name if t.subject else None,
                    "class": t.school_class.name if t.school_class else None,
                    "section": t.section.name if t.section else None,
                    "room": t.room_number
                }
                for t in tt_entries
            ],
            "announcements": [
                {"id": a.id, "title": a.title, "content": a.content, "category": a.category, "created_at": a.created_at}
                for a in announcements
            ],
            "upcoming_events": [
                {"id": e.id, "title": e.title, "event_type": e.event_type, "start_date": e.start_date, "end_date": e.end_date, "location": e.location}
                for e in upcoming_events
            ]
        }

    # --- 3. STUDENT DASHBOARD ---
    elif role_name == "Student":
        student = current_user.student_profile
        s_id = student.id if student else None

        if not student:
            return {"role": role_name, "error": "No student profile found"}

        # Attendance stats
        att_records = db.query(StudentAttendance).filter(StudentAttendance.student_id == s_id).all()
        total_days = len(att_records)
        present_days = sum(1 for a in att_records if a.status == "Present")
        absent_days = sum(1 for a in att_records if a.status == "Absent")
        att_rate = round((present_days / total_days * 100), 1) if total_days > 0 else 100.0

        # Pending fees
        invoices = db.query(FeeInvoice).filter(FeeInvoice.student_id == s_id).all()
        pending_fees = sum(i.remaining_amount for i in invoices)

        # Today's timetable
        day_name = today.strftime("%A")
        tt_query = db.query(TimetableEntry).filter(
            TimetableEntry.class_id == student.class_id,
            TimetableEntry.day_of_week.ilike(day_name)
        )
        if student.section_id:
            tt_query = tt_query.filter(
                (TimetableEntry.section_id == student.section_id) | (TimetableEntry.section_id.is_(None))
            )
        today_tt = tt_query.all()

        # Assignments
        assignments = db.query(Assignment).filter(
            Assignment.class_id == student.class_id
        ).order_by(Assignment.due_date.asc()).limit(5).all()

        # Recent marks
        recent_marks = db.query(ExamMark).join(Exam).filter(
            ExamMark.student_id == s_id
        ).order_by(Exam.exam_date.desc()).limit(5).all()

        announcements = db.query(Announcement).filter(
            Announcement.target_role.in_(["All", "Student"])
        ).order_by(Announcement.is_pinned.desc(), Announcement.id.desc()).limit(5).all()

        upcoming_events = db.query(SchoolEvent).filter(
            SchoolEvent.end_date >= today,
            SchoolEvent.audience.in_(["All", "Students"])
        ).order_by(SchoolEvent.start_date.asc()).limit(5).all()

        return {
            "role": role_name,
            "student_id": student.id,
            "student_name": current_user.full_name,
            "admission_number": student.admission_number,
            "class_name": student.school_class.name if student.school_class else "Class",
            "section_name": student.section.name if student.section else None,
            "attendance_percentage": att_rate,
            "total_classes": total_days,
            "present_days": present_days,
            "absent_days": absent_days,
            "total_fees_pending": round(pending_fees, 2),
            "today_timetable": [
                {
                    "id": t.id,
                    "period": t.period.name if t.period else None,
                    "start_time": t.period.start_time.strftime("%H:%M") if t.period and t.period.start_time else None,
                    "end_time": t.period.end_time.strftime("%H:%M") if t.period and t.period.end_time else None,
                    "subject": t.subject.name if t.subject else None,
                    "teacher": t.teacher.user.full_name if t.teacher and t.teacher.user else None,
                    "room": t.room_number
                }
                for t in today_tt
            ],
            "recent_assignments": [
                {
                    "id": a.id,
                    "title": a.title,
                    "subject": a.subject.name if a.subject else None,
                    "due_date": a.due_date,
                    "max_marks": a.max_marks
                }
                for a in assignments
            ],
            "recent_marks": [
                {
                    "exam_name": m.exam.name if m.exam else "Exam",
                    "subject": m.exam.subject.name if m.exam and m.exam.subject else "Subject",
                    "marks_obtained": m.marks_obtained,
                    "total_marks": m.exam.total_marks if m.exam else 100.0,
                    "percentage": round((m.marks_obtained / m.exam.total_marks * 100), 1) if m.exam and m.exam.total_marks else 0.0,
                    "grade": "A+" if m.marks_obtained >= 90 else "A" if m.marks_obtained >= 80 else "B" if m.marks_obtained >= 70 else "C" if m.marks_obtained >= 60 else "D" if m.marks_obtained >= 50 else "F"
                }
                for m in recent_marks
            ],
            "announcements": [
                {"id": a.id, "title": a.title, "content": a.content, "category": a.category, "created_at": a.created_at}
                for a in announcements
            ],
            "upcoming_events": [
                {"id": e.id, "title": e.title, "event_type": e.event_type, "start_date": e.start_date, "end_date": e.end_date, "location": e.location}
                for e in upcoming_events
            ]
        }

    # --- 4. PARENT DASHBOARD ---
    elif role_name == "Parent":
        parent = current_user.parent_profile
        children_data = []

        if parent:
            for child in parent.children:
                att_records = db.query(StudentAttendance).filter(StudentAttendance.student_id == child.id).all()
                total_days = len(att_records)
                present_days = sum(1 for a in att_records if a.status == "Present")
                att_rate = round((present_days / total_days * 100), 1) if total_days > 0 else 100.0

                invoices = db.query(FeeInvoice).filter(FeeInvoice.student_id == child.id).all()
                pending_fees = sum(i.remaining_amount for i in invoices)

                recent_marks = db.query(ExamMark).join(Exam).filter(
                    ExamMark.student_id == child.id
                ).order_by(Exam.exam_date.desc()).limit(5).all()

                children_data.append({
                    "student_id": child.id,
                    "student_name": child.user.full_name if child.user else f"{child.first_name} {child.last_name}",
                    "admission_number": child.admission_number,
                    "class_name": child.school_class.name if child.school_class else "Class",
                    "section_name": child.section.name if child.section else None,
                    "attendance_percentage": att_rate,
                    "total_fees_pending": round(pending_fees, 2),
                    "recent_marks": [
                        {
                            "exam_name": m.exam.name if m.exam else "Exam",
                            "subject": m.exam.subject.name if m.exam and m.exam.subject else "Subject",
                            "marks_obtained": m.marks_obtained,
                            "total_marks": m.exam.total_marks if m.exam else 100.0,
                            "percentage": round((m.marks_obtained / m.exam.total_marks * 100), 1) if m.exam and m.exam.total_marks else 0.0
                        }
                        for m in recent_marks
                    ]
                })

        announcements = db.query(Announcement).filter(
            Announcement.target_role.in_(["All", "Parent"])
        ).order_by(Announcement.is_pinned.desc(), Announcement.id.desc()).limit(5).all()

        upcoming_events = db.query(SchoolEvent).filter(
            SchoolEvent.end_date >= today,
            SchoolEvent.audience.in_(["All", "Parents"])
        ).order_by(SchoolEvent.start_date.asc()).limit(5).all()

        return {
            "role": role_name,
            "children": children_data,
            "announcements": [
                {"id": a.id, "title": a.title, "content": a.content, "category": a.category, "created_at": a.created_at}
                for a in announcements
            ],
            "upcoming_events": [
                {"id": e.id, "title": e.title, "event_type": e.event_type, "start_date": e.start_date, "end_date": e.end_date, "location": e.location}
                for e in upcoming_events
            ]
        }

    # --- 5. ACCOUNTANT DASHBOARD ---
    elif role_name == "Accountant":
        invoices = db.query(FeeInvoice).all()
        total_invoiced = sum(i.total_amount for i in invoices)
        total_collected = sum(i.paid_amount for i in invoices)
        total_pending = sum(i.remaining_amount for i in invoices if i.status in ["Pending", "Partial"])
        total_overdue = sum(i.remaining_amount for i in invoices if i.status == "Overdue" or (today > i.due_date and i.remaining_amount > 0))

        today_payments = db.query(FeePayment).filter(FeePayment.payment_date == today).all()
        today_collected = sum(p.amount_paid for p in today_payments)

        recent_payments = db.query(FeePayment).order_by(FeePayment.id.desc()).limit(10).all()
        overdue_invoices = [i for i in invoices if i.status == "Overdue" or (today > i.due_date and i.remaining_amount > 0)][:10]

        return {
            "role": role_name,
            "today_collected": round(today_collected, 2),
            "monthly_collected": round(total_collected, 2),
            "total_invoiced": round(total_invoiced, 2),
            "total_pending": round(total_pending, 2),
            "total_overdue": round(total_overdue, 2),
            "recent_payments": [
                {
                    "receipt_number": p.receipt_number,
                    "invoice_number": p.invoice.invoice_number if p.invoice else None,
                    "student_name": p.invoice.student.user.full_name if p.invoice and p.invoice.student and p.invoice.student.user else None,
                    "amount_paid": p.amount_paid,
                    "payment_method": p.payment_method,
                    "payment_date": p.payment_date
                }
                for p in recent_payments
            ],
            "overdue_invoices": [
                {
                    "invoice_number": i.invoice_number,
                    "student_name": i.student.user.full_name if i.student and i.student.user else None,
                    "class_name": i.student.school_class.name if i.student and i.student.school_class else None,
                    "due_date": i.due_date,
                    "remaining_amount": i.remaining_amount
                }
                for i in overdue_invoices
            ]
        }

    # Default fallback
    return {"role": role_name, "message": f"Welcome to {role_name} dashboard"}
