import sys
import os
from sqlalchemy.orm import Session
from datetime import date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database import SessionLocal, engine, Base
from app.models.role import Role
from app.models.user import User
from app.models.profiles import Student, Parent, Teacher, Staff, AdminProfile
from app.models.academic import AcademicYear, SchoolClass, Section, Subject

from app.utils.security import get_password_hash

ROLES_DATA = [
    {"name": "Super Admin", "description": "Full system control across all schools and settings"},
    {"name": "School Admin", "description": "Administrative access to school operations"},
    {"name": "Principal", "description": "Academic oversight and institutional reporting"},
    {"name": "Teacher", "description": "Classroom management, grading, and attendance"},
    {"name": "Accountant", "description": "Financial operations, fee collection, and payroll"},
    {"name": "Librarian", "description": "Library cataloging, book issuance, and inventory"},
    {"name": "Parent", "description": "Child performance monitoring and communication"},
    {"name": "Student", "description": "Personal portal for grades, timetable, and assignments"}
]

USERS_DATA = [
    {
        "role_name": "Super Admin",
        "username": "superadmin",
        "email": "superadmin@school.com",
        "full_name": "Dr. Ali Awan",
        "phone": "+92 300-5550101"
    },
    {
        "role_name": "School Admin",
        "username": "schooladmin",
        "email": "admin@school.com",
        "full_name": "Muhammad Usman",
        "phone": "+92 300-5550102"
    },
    {
        "role_name": "Principal",
        "username": "principal",
        "email": "principal@school.com",
        "full_name": "Prof. Abdul Rehman",
        "phone": "+92 300-5550103"
    },
    {
        "role_name": "Teacher",
        "username": "teacher",
        "email": "teacher@school.com",
        "full_name": "Syeda Fatima Zahra",
        "phone": "+92 300-5550104"
    },
    {
        "role_name": "Accountant",
        "username": "accountant",
        "email": "accountant@school.com",
        "full_name": "Bilal Ahmed",
        "phone": "+92 300-5550105"
    },
    {
        "role_name": "Librarian",
        "username": "librarian",
        "email": "librarian@school.com",
        "full_name": "Ayesha Siddiqua",
        "phone": "+92 300-5550106"
    },
    {
        "role_name": "Parent",
        "username": "parent",
        "email": "parent@school.com",
        "full_name": "Zubair Khan",
        "phone": "+92 300-5550107"
    },
    {
        "role_name": "Student",
        "username": "student",
        "email": "student@school.com",
        "full_name": "Zaid Khan",
        "phone": "+92 300-5550108"
    }
]

def seed_database():
    print("Starting database seeding...")
    db: Session = SessionLocal()
    try:
        # Seed Roles
        role_map = {}
        for r_data in ROLES_DATA:
            role = db.query(Role).filter(Role.name == r_data["name"]).first()
            if not role:
                role = Role(name=r_data["name"], description=r_data["description"])
                db.add(role)
                db.flush()
                print(f"Created role: {role.name}")
            role_map[role.name] = role

        db.commit()

        default_hashed_password = get_password_hash("password123")

        # Seed Academic Years
        ay_curr = db.query(AcademicYear).filter(AcademicYear.name == "2026-2027").first()
        if not ay_curr:
            ay_curr = AcademicYear(
                name="2026-2027",
                start_date=date(2026, 8, 1),
                end_date=date(2027, 6, 30),
                is_active=True
            )
            db.add(ay_curr)
            print("Created Academic Year: 2026-2027 (Active)")

        ay_next = db.query(AcademicYear).filter(AcademicYear.name == "2027-2028").first()
        if not ay_next:
            ay_next = AcademicYear(
                name="2027-2028",
                start_date=date(2027, 8, 1),
                end_date=date(2028, 6, 30),
                is_active=False
            )
            db.add(ay_next)
            print("Created Academic Year: 2027-2028")

        db.commit()

        # Seed Classes
        classes_data = [
            {"name": "Grade 1", "numeric_grade": 1, "description": "Class 1"},
            {"name": "Grade 2", "numeric_grade": 2, "description": "Class 2"},
            {"name": "Grade 3", "numeric_grade": 3, "description": "Class 3"},
            {"name": "Grade 4", "numeric_grade": 4, "description": "Class 4"},
            {"name": "Grade 5", "numeric_grade": 5, "description": "Class 5"},
            {"name": "Grade 6", "numeric_grade": 6, "description": "Class 6"},
            {"name": "Grade 7", "numeric_grade": 7, "description": "Class 7"},
            {"name": "Grade 8", "numeric_grade": 8, "description": "Class 8"},
            {"name": "Grade 9", "numeric_grade": 9, "description": "Class 9"},
            {"name": "Grade 10", "numeric_grade": 10, "description": "Class 10"},
        ]
        class_map = {}
        for c_data in classes_data:
            sc = db.query(SchoolClass).filter(SchoolClass.name == c_data["name"]).first()
            if not sc:
                sc = SchoolClass(**c_data)
                db.add(sc)
                db.flush()
                print(f"Created Class: {sc.name}")
            class_map[sc.name] = sc

        db.commit()

        # Seed Users and Profiles
        parent_record = None
        teacher_record = None
        student_record = None

        for u_data in USERS_DATA:
            role = role_map[u_data["role_name"]]
            user = db.query(User).filter(User.username == u_data["username"]).first()

            if not user:
                user = User(
                    email=u_data["email"],
                    username=u_data["username"],
                    hashed_password=default_hashed_password,
                    full_name=u_data["full_name"],
                    phone=u_data["phone"],
                    is_active=True,
                    role_id=role.id
                )
                db.add(user)
                db.flush()
                print(f"Created user: {user.username} ({user.role.name})")
            else:
                user.full_name = u_data["full_name"]
                user.email = u_data["email"]
                user.phone = u_data["phone"]
                user.role_id = role.id
                db.flush()
                print(f"Updated user name: {user.username} -> {user.full_name}")

            # Profiles
            if u_data["role_name"] in ["Super Admin", "School Admin", "Principal"]:
                if not user.admin_profile:
                    admin_rec = AdminProfile(
                        user_id=user.id,
                        admin_code=f"ADM-00{user.id}",
                        access_level="Full" if u_data["role_name"] == "Super Admin" else "Operational",
                        department_oversight="Executive Board" if u_data["role_name"] == "Super Admin" else "School Operations",
                        office_location="Main Administrative Block"
                    )
                    db.add(admin_rec)
                    print(f"  -> Created Admin profile for {user.username}")

            elif u_data["role_name"] == "Parent":
                if not user.parent_profile:
                    parent_rec = Parent(
                        user_id=user.id,
                        occupation="Software Engineer",
                        relationship_type="Father",
                        address="House 12, Street 5, F-8/3, Islamabad"
                    )
                    db.add(parent_rec)
                    db.flush()
                    parent_record = parent_rec
                    print(f"  -> Created Parent profile for {user.username}")
                else:
                    parent_record = user.parent_profile

            elif u_data["role_name"] == "Teacher":
                if not user.teacher_profile:
                    teacher_rec = Teacher(
                        user_id=user.id,
                        employee_id="TCH-2026-01",
                        qualification="M.Sc. Advanced Mathematics",
                        designation="Senior Math Educator",
                        department="Mathematics",
                        joining_date=date(2020, 8, 1),
                        gender="Female",
                        date_of_birth=date(1985, 4, 12),
                        salary=65000.00,
                        status="Active"
                    )
                    db.add(teacher_rec)
                    db.flush()
                    teacher_record = teacher_rec
                    print(f"  -> Created Teacher profile for {user.username}")
                else:
                    teacher_record = user.teacher_profile

            elif u_data["role_name"] == "Student":
                g1 = class_map.get("Grade 1")
                if not user.student_profile:
                    student_rec = Student(
                        user_id=user.id,
                        admission_number="ADM-2026-001",
                        roll_number="101",
                        date_of_birth=date(2018, 5, 15),
                        gender="Male",
                        blood_group="O+",
                        address="House 12, Street 5, F-8/3, Islamabad",
                        emergency_contact="+92 300-5550107",
                        admission_date=date(2026, 8, 1),
                        status="Active",
                        parent_id=parent_record.id if parent_record else None,
                        class_id=g1.id if g1 else None,
                        academic_year_id=ay_curr.id if ay_curr else None
                    )
                    db.add(student_rec)
                    db.flush()
                    student_record = student_rec
                    print(f"  -> Created Student profile for {user.username}")
                else:
                    student_record = user.student_profile

            elif u_data["role_name"] == "Accountant":
                if not user.staff_profile:
                    staff_rec = Staff(
                        user_id=user.id,
                        employee_id="STF-2026-01",
                        department="Finance & Accounts",
                        designation="Senior Accountant",
                        joining_date=date(2021, 3, 15)
                    )
                    db.add(staff_rec)
                    print(f"  -> Created Staff profile (Accountant) for {user.username}")

            elif u_data["role_name"] == "Librarian":
                if not user.staff_profile:
                    staff_rec = Staff(
                        user_id=user.id,
                        employee_id="STF-2026-02",
                        department="Library Services",
                        designation="Head Librarian",
                        joining_date=date(2019, 11, 10)
                    )
                    db.add(staff_rec)
                    print(f"  -> Created Staff profile (Librarian) for {user.username}")


        db.commit()

        # Seed Sections A and B for ALL classes (Grade 1 to 10)
        for c_name, cls_obj in class_map.items():
            for sec_name in ["A", "B"]:
                existing_sec = db.query(Section).filter(Section.class_id == cls_obj.id, Section.name == sec_name).first()
                if not existing_sec:
                    sec_item = Section(name=sec_name, class_id=cls_obj.id)
                    db.add(sec_item)
                    print(f"Created Section {c_name}-{sec_name}")

        db.commit()

        # Assign student record section if needed
        g1 = class_map.get("Grade 1")
        if g1 and student_record and not student_record.section_id:
            g1_sec_a = db.query(Section).filter(Section.class_id == g1.id, Section.name == "A").first()
            if g1_sec_a:
                student_record.section_id = g1_sec_a.id
                db.commit()

        # Seed Subjects
        subjects_data = [
            {"name": "Mathematics", "code": "MATH-101", "description": "Elementary Mathematics", "weekly_periods": 5, "class_name": "Grade 1"},
            {"name": "General Science", "code": "SCI-101", "description": "Basic Science & Environment", "weekly_periods": 4, "class_name": "Grade 1"},
            {"name": "English Language", "code": "ENG-101", "description": "Grammar & Reading Skills", "weekly_periods": 5, "class_name": "Grade 1"},
            {"name": "Social Studies", "code": "SST-101", "description": "History & Geography basics", "weekly_periods": 3, "class_name": "Grade 1"},
            {"name": "Computer Science", "code": "CS-101", "description": "Digital literacy & coding basics", "weekly_periods": 2, "class_name": "Grade 1"},
        ]
        for s_data in subjects_data:
            subj = db.query(Subject).filter(Subject.code == s_data["code"]).first()
            if not subj:
                cls_obj = class_map.get(s_data["class_name"])
                subj = Subject(
                    name=s_data["name"],
                    code=s_data["code"],
                    description=s_data["description"],
                    weekly_periods=s_data["weekly_periods"],
                    class_id=cls_obj.id if cls_obj else None,
                    teacher_id=teacher_record.id if (s_data["code"] == "MATH-101" and teacher_record) else None
                )
                db.add(subj)
                print(f"Created Subject: {subj.name} ({subj.code})")

        db.commit()
        print("Database seeding for Chunk 2 completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
