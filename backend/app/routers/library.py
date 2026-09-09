from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student
from app.models.extended import Book, BookIssue
from app.schemas.extended import (
    BookCreate, BookUpdate, BookOut,
    BookIssueCreate, BookReturnRequest, BookIssueOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/library", tags=["Library Management"])

def build_book_out(b: Book) -> dict:
    issued = b.total_copies - b.available_copies
    return {
        "id": b.id,
        "title": b.title,
        "author": b.author,
        "isbn": b.isbn,
        "category": b.category,
        "publisher": b.publisher,
        "rack_number": b.rack_number,
        "total_copies": b.total_copies,
        "available_copies": b.available_copies,
        "issued_count": max(0, issued),
        "created_at": b.created_at,
        "updated_at": b.updated_at
    }

def build_book_issue_out(bi: BookIssue) -> dict:
    stu = bi.student
    usr = bi.user
    today = date.today()
    stat = bi.status
    if stat == "Issued" and today > bi.due_date:
        stat = "Overdue"

    return {
        "id": bi.id,
        "book_id": bi.book_id,
        "book_title": bi.book.title if bi.book else None,
        "book_author": bi.book.author if bi.book else None,
        "student_id": bi.student_id,
        "student_name": stu.user.full_name if stu and stu.user else f"{stu.first_name} {stu.last_name}" if stu else None,
        "admission_number": stu.admission_number if stu else None,
        "user_id": bi.user_id,
        "user_name": usr.full_name if usr else None,
        "issue_date": bi.issue_date,
        "due_date": bi.due_date,
        "return_date": bi.return_date,
        "fine_amount": bi.fine_amount,
        "status": stat,
        "remarks": bi.remarks,
        "issued_by_name": bi.issued_by.full_name if bi.issued_by else None,
        "created_at": bi.created_at
    }


@router.get("/books", response_model=List[BookOut])
def get_books(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Book)
    if search:
        query = query.filter(
            Book.title.ilike(f"%{search}%") |
            Book.author.ilike(f"%{search}%") |
            Book.isbn.ilike(f"%{search}%")
        )
    if category:
        query = query.filter(Book.category.ilike(category))

    books = query.order_by(Book.title.asc()).all()
    return [build_book_out(b) for b in books]


@router.post("/books", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    data: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Librarian"]))
):
    if data.isbn:
        existing = db.query(Book).filter(Book.isbn == data.isbn).first()
        if existing:
            raise HTTPException(status_code=400, detail="A book with this ISBN already exists")

    book = Book(
        title=data.title,
        author=data.author,
        isbn=data.isbn,
        category=data.category,
        publisher=data.publisher,
        rack_number=data.rack_number,
        total_copies=data.total_copies,
        available_copies=data.total_copies
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return build_book_out(book)


@router.put("/books/{id}", response_model=BookOut)
def update_book(
    id: int,
    data: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Librarian"]))
):
    book = db.query(Book).filter(Book.id == id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(book, k, v)

    db.commit()
    db.refresh(book)
    return build_book_out(book)


@router.delete("/books/{id}")
def delete_book(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Librarian"]))
):
    book = db.query(Book).filter(Book.id == id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    active_issues = db.query(BookIssue).filter(BookIssue.book_id == id, BookIssue.status == "Issued").count()
    if active_issues > 0:
        raise HTTPException(status_code=400, detail="Cannot delete book with active issued copies")

    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"}


@router.get("/issues", response_model=List[BookIssueOut])
def get_book_issues(
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(BookIssue)

    if current_user.role.name == "Student" and current_user.student_profile:
        query = query.filter(BookIssue.student_id == current_user.student_profile.id)
    elif student_id:
        query = query.filter(BookIssue.student_id == student_id)

    if status:
        query = query.filter(BookIssue.status == status)

    issues = query.order_by(BookIssue.id.desc()).all()
    return [build_book_issue_out(bi) for bi in issues]


@router.post("/issues", response_model=BookIssueOut, status_code=status.HTTP_201_CREATED)
def issue_book(
    data: BookIssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Librarian"]))
):
    book = db.query(Book).filter(Book.id == data.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No available copies of this book in stock")

    book.available_copies -= 1

    issue = BookIssue(
        book_id=data.book_id,
        student_id=data.student_id,
        user_id=data.user_id,
        issue_date=date.today(),
        due_date=data.due_date,
        status="Issued",
        remarks=data.remarks,
        issued_by_id=current_user.id
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return build_book_issue_out(issue)


@router.put("/issues/{id}/return", response_model=BookIssueOut)
def return_book(
    id: int,
    data: BookReturnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Librarian"]))
):
    issue = db.query(BookIssue).filter(BookIssue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")

    if issue.status == "Returned":
        raise HTTPException(status_code=400, detail="Book has already been returned")

    issue.status = "Returned"
    issue.return_date = date.today()
    issue.fine_amount = data.fine_amount
    if data.remarks:
        issue.remarks = data.remarks

    # Restore available copies
    book = issue.book
    if book:
        book.available_copies = min(book.total_copies, book.available_copies + 1)

    db.commit()
    db.refresh(issue)
    return build_book_issue_out(issue)
