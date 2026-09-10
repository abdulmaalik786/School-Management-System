import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import (
    auth, users, students, teachers, parents, academic,
    timetable, attendance, examination, finance,
    dashboard, assignments, library, transport, events_announcements, settings
)

app = FastAPI(
    title=os.getenv("PROJECT_NAME", "School ERP API"),
    version="1.0.0",
    description="REST API for School Management System (ERP)"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(parents.router)
app.include_router(academic.router)
app.include_router(timetable.router)
app.include_router(attendance.router)
app.include_router(examination.router)
app.include_router(finance.router)
app.include_router(dashboard.router)
app.include_router(assignments.router)
app.include_router(library.router)
app.include_router(transport.router)
app.include_router(events_announcements.router)
app.include_router(settings.router)

@app.on_event("startup")
def on_startup():
    try:
        from app.database import engine, Base
        from app.services.seed import seed_database
        Base.metadata.create_all(bind=engine)
        seed_database()
        print("Database initialized and seeded successfully.")
    except Exception as e:
        print(f"Startup DB init info: {e}")

@app.get("/")
def root():
    return {
        "system": "School Management System API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
