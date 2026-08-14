from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, User, hash_password, log_audit_event
from api.auth import get_current_user_name, verify_supervisor_only

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    fullname: str
    nik: Optional[str] = None
    is_active: bool = True

class UserUpdate(BaseModel):
    username: str
    password: Optional[str] = None
    role: str
    fullname: str
    nik: Optional[str] = None
    is_active: bool = True

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    fullname: Optional[str] = None
    nik: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True

@router.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Mengambil daftar seluruh user (tanpa mengekspos hash password)."""
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), uname: str = Depends(get_current_user_name)):
    existing = db.query(User).filter(User.username == user.username.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan oleh akun lain")
    
    clean_nik = user.nik.strip() if (user.nik and user.nik.strip()) else None
    if clean_nik:
        existing_nik = db.query(User).filter(User.nik == clean_nik).first()
        if existing_nik:
            raise HTTPException(status_code=400, detail=f"NIK '{clean_nik}' sudah digunakan oleh user lain ({existing_nik.username})")

    db_user = User(
        username=user.username.strip(),
        password=hash_password(user.password),
        role=user.role,
        fullname=user.fullname.strip(),
        nik=clean_nik,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    log_audit_event(db, uname, "CREATE_USER", f"Membuat user baru: {user.username} ({user.fullname}, NIK: {clean_nik or '-'}, Role: {user.role.upper()})")
    return db_user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), uname: str = Depends(get_current_user_name)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validasi username unik
    existing = db.query(User).filter(User.username == user.username.strip(), User.id != user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan oleh akun lain")

    # Validasi NIK unik
    clean_nik = user.nik.strip() if (user.nik and user.nik.strip()) else None
    if clean_nik:
        existing_nik = db.query(User).filter(User.nik == clean_nik, User.id != user_id).first()
        if existing_nik:
            raise HTTPException(status_code=400, detail=f"NIK '{clean_nik}' sudah digunakan oleh user lain ({existing_nik.username})")

    db_user.username = user.username.strip()
    if user.password:
        db_user.password = hash_password(user.password)
    db_user.role = user.role
    db_user.fullname = user.fullname.strip()
    db_user.nik = clean_nik
    db_user.is_active = user.is_active
    db.commit()
    db.refresh(db_user)
    log_audit_event(db, uname, "UPDATE_USER", f"Mengubah data user {user.username} (NIK: {clean_nik or '-'}, Role: {user.role.upper()})")
    return db_user

class UserDeleteRequest(BaseModel):
    admin_password: str

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    payload: Optional[UserDeleteRequest] = None,
    admin_password: Optional[str] = None,
    db: Session = Depends(get_db), 
    uname: str = Depends(get_current_user_name)
):
    pwd_to_check = (payload.admin_password if payload and payload.admin_password else admin_password)
    if not pwd_to_check or not pwd_to_check.strip():
        raise HTTPException(
            status_code=400, 
            detail="Password admin yang sedang login wajib diisi untuk konfirmasi penghapusan user"
        )

    # Ambil data user admin/pengawas yang sedang login
    current_admin = db.query(User).filter(User.username == uname).first()
    if not current_admin or not verify_password(pwd_to_check.strip(), current_admin.password):
        raise HTTPException(
            status_code=403, 
            detail="Password admin salah! Penghapusan akun dibatalkan."
        )

    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cegah admin menghapus akunnya sendiri yang sedang aktif
    if db_user.username.lower() == uname.lower():
        raise HTTPException(
            status_code=400, 
            detail="Tidak dapat menghapus akun admin yang sedang aktif login!"
        )

    target_username = db_user.username
    target_fullname = db_user.fullname or "-"
    target_nik = db_user.nik or "-"
    target_role = db_user.role

    db.delete(db_user)
    db.commit()

    log_audit_event(
        db, 
        uname, 
        "DELETE_USER", 
        f"Admin '{uname}' menghapus user: '{target_username}' (Nama: {target_fullname}, NIK: {target_nik}, Role: {target_role.upper()})"
    )
    return {"status": "ok", "message": f"User {target_username} berhasil dihapus"}
