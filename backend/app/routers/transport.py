from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.profiles import Student
from app.models.extended import Vehicle, TransportRoute, RouteStop, StudentTransport
from app.schemas.extended import (
    VehicleCreate, VehicleUpdate, VehicleOut,
    TransportRouteCreate, TransportRouteUpdate, TransportRouteOut,
    StudentTransportCreate, StudentTransportOut
)
from app.dependencies.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/api/transport", tags=["Transport Management"])

def build_vehicle_out(v: Vehicle) -> dict:
    return {
        "id": v.id,
        "vehicle_number": v.vehicle_number,
        "model": v.model,
        "capacity": v.capacity,
        "driver_name": v.driver_name,
        "driver_phone": v.driver_phone,
        "license_number": v.license_number,
        "status": v.status,
        "created_at": v.created_at,
        "updated_at": v.updated_at
    }

def build_route_out(r: TransportRoute) -> dict:
    veh = r.vehicle
    return {
        "id": r.id,
        "route_name": r.route_name,
        "start_point": r.start_point,
        "end_point": r.end_point,
        "vehicle_id": r.vehicle_id,
        "vehicle_number": veh.vehicle_number if veh else None,
        "driver_name": veh.driver_name if veh else None,
        "driver_phone": veh.driver_phone if veh else None,
        "fare_amount": r.fare_amount,
        "stops": [
            {
                "id": s.id,
                "route_id": s.route_id,
                "stop_name": s.stop_name,
                "pickup_time": s.pickup_time,
                "drop_time": s.drop_time,
                "stop_order": s.stop_order,
                "stop_fee": s.stop_fee
            }
            for s in r.stops
        ],
        "assigned_students_count": len(r.student_assignments),
        "created_at": r.created_at,
        "updated_at": r.updated_at
    }

def build_student_transport_out(st: StudentTransport) -> dict:
    stu = st.student
    rt = st.route
    veh = rt.vehicle if rt else None
    stp = st.stop
    return {
        "id": st.id,
        "student_id": st.student_id,
        "student_name": stu.user.full_name if stu and stu.user else None,
        "admission_number": stu.admission_number if stu else None,
        "class_name": stu.school_class.name if stu and stu.school_class else None,
        "route_id": st.route_id,
        "route_name": rt.route_name if rt else None,
        "vehicle_number": veh.vehicle_number if veh else None,
        "driver_name": veh.driver_name if veh else None,
        "driver_phone": veh.driver_phone if veh else None,
        "stop_id": st.stop_id,
        "stop_name": stp.stop_name if stp else None,
        "pickup_time": stp.pickup_time if stp else None,
        "drop_time": stp.drop_time if stp else None,
        "academic_year_name": st.academic_year.name if st.academic_year else None,
        "status": st.status,
        "created_at": st.created_at
    }


# --- VEHICLES ENDPOINTS ---

@router.get("/vehicles", response_model=List[VehicleOut])
def get_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    vehicles = db.query(Vehicle).order_by(Vehicle.vehicle_number.asc()).all()
    return [build_vehicle_out(v) for v in vehicles]


@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == data.vehicle_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle number already exists")

    veh = Vehicle(**data.model_dump())
    db.add(veh)
    db.commit()
    db.refresh(veh)
    return build_vehicle_out(veh)


@router.put("/vehicles/{id}", response_model=VehicleOut)
def update_vehicle(
    id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    veh = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(veh, k, v)

    db.commit()
    db.refresh(veh)
    return build_vehicle_out(veh)


@router.delete("/vehicles/{id}")
def delete_vehicle(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    veh = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    db.delete(veh)
    db.commit()
    return {"message": "Vehicle deleted successfully"}


# --- ROUTES & STOPS ENDPOINTS ---

@router.get("/routes", response_model=List[TransportRouteOut])
def get_routes(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    routes = db.query(TransportRoute).all()
    return [build_route_out(r) for r in routes]


@router.post("/routes", response_model=TransportRouteOut, status_code=status.HTTP_201_CREATED)
def create_route(
    data: TransportRouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    route = TransportRoute(
        route_name=data.route_name,
        start_point=data.start_point,
        end_point=data.end_point,
        vehicle_id=data.vehicle_id,
        fare_amount=data.fare_amount
    )
    db.add(route)
    db.flush()

    for idx, stop in enumerate(data.stops):
        rs = RouteStop(
            route_id=route.id,
            stop_name=stop.stop_name,
            pickup_time=stop.pickup_time,
            drop_time=stop.drop_time,
            stop_order=stop.stop_order or (idx + 1),
            stop_fee=stop.stop_fee
        )
        db.add(rs)

    db.commit()
    db.refresh(route)
    return build_route_out(route)


@router.delete("/routes/{id}")
def delete_route(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal"]))
):
    route = db.query(TransportRoute).filter(TransportRoute.id == id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    db.delete(route)
    db.commit()
    return {"message": "Route deleted successfully"}


# --- STUDENT TRANSPORT ALLOCATION ---

@router.get("/allocations", response_model=List[StudentTransportOut])
def get_student_transport_allocations(
    student_id: Optional[int] = Query(None),
    route_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(StudentTransport)

    if current_user.role.name == "Student" and current_user.student_profile:
        query = query.filter(StudentTransport.student_id == current_user.student_profile.id)
    elif student_id:
        query = query.filter(StudentTransport.student_id == student_id)

    if route_id:
        query = query.filter(StudentTransport.route_id == route_id)

    allocations = query.all()
    return [build_student_transport_out(st) for st in allocations]


@router.post("/allocations", response_model=StudentTransportOut, status_code=status.HTTP_201_CREATED)
def assign_student_transport(
    data: StudentTransportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    existing = db.query(StudentTransport).filter(
        StudentTransport.student_id == data.student_id,
        StudentTransport.academic_year_id == data.academic_year_id
    ).first()

    if existing:
        existing.route_id = data.route_id
        existing.stop_id = data.stop_id
        existing.status = "Active"
        db.commit()
        db.refresh(existing)
        return build_student_transport_out(existing)

    st = StudentTransport(**data.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return build_student_transport_out(st)


@router.delete("/allocations/{id}")
def delete_student_transport(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "School Admin", "Principal", "Accountant"]))
):
    st = db.query(StudentTransport).filter(StudentTransport.id == id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Transport allocation record not found")

    db.delete(st)
    db.commit()
    return {"message": "Transport assignment removed successfully"}
