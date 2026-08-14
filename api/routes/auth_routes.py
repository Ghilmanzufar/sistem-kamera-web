import os
import time
import socket
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db, User, verify_password, log_audit_event
from integrations import get_buffered_count
from core import state, model_cache
from api.auth import (
    create_admin_token,
    verify_admin_auth,
    check_rate_limit,
    record_failed_attempt,
    clear_failed_attempts
)

router = APIRouter()
SERVER_START_TIME = time.time()

class LoginSchema(BaseModel):
    username: str
    password: str
    shift: Optional[str] = "Shift 1"

def get_local_ip() -> str:
    """Ambil IP lokal PC saat ini."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_uptime_string(seconds: float) -> str:
    s = int(seconds)
    hours = s // 3600
    minutes = (s % 3600) // 60
    secs = s % 60
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s"
    elif minutes > 0:
        return f"{minutes}m {secs}s"
    return f"{secs}s"

from core import state, model_cache, stream_worker
from integrations import get_buffered_count
from integrations.sison_client import get_callback_url

try:
    import psutil
except ImportError:
    psutil = None

@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    """Telemetry status lengkap untuk frontend SystemHealth, Sidebar, & IT Enterprise Monitoring."""
    now = time.time()
    uptime_sec = round(now - SERVER_START_TIME, 1)
    
    # 1. Database Health & Latency
    db_status = "CONNECTED"
    db_latency_ms = 0.0
    try:
        t0 = time.time()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 1)
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    # 2. Offline Buffer Queue Status
    buffer_queue = get_buffered_count()

    # 3. Disk Space Telemetry
    try:
        total_b, used_b, free_b = shutil.disk_usage(os.getcwd())
        total_gb = round(total_b / (1024**3), 2)
        free_gb = round(free_b / (1024**3), 2)
        used_gb = round(used_b / (1024**3), 2)
        used_pct = round((used_b / total_b) * 100, 1) if total_b > 0 else 0.0
        free_pct = round((free_b / total_b) * 100, 1) if total_b > 0 else 0.0
        is_disk_low = free_pct < 10.0
    except Exception:
        total_gb, free_gb, used_gb, used_pct, free_pct, is_disk_low = 0, 0, 0, 0, 0, False

    # 4. CPU & RAM Telemetry
    cpu_pct, ram_pct, ram_used_gb, ram_total_gb = 0.0, 0.0, 0.0, 0.0
    if psutil:
        try:
            cpu_pct = round(psutil.cpu_percent(interval=None), 1)
            vmem = psutil.virtual_memory()
            ram_pct = round(vmem.percent, 1)
            ram_used_gb = round(vmem.used / (1024**3), 2)
            ram_total_gb = round(vmem.total / (1024**3), 2)
        except Exception:
            pass

    # 5. State & AI Model Telemetry
    with state.lock:
        app_status = state.status
        active_part = state.p_no
        qty_progress = f"{state.target_qty - state.qty}/{state.target_qty}" if state.target_qty > 0 else "-"
        inspection_mode = getattr(state, "inspection_mode", "AI")

    # 6. Camera Hardware & Stream Telemetry
    cam_active = bool(stream_worker.is_cam_active)
    cam_connected = bool(stream_worker.is_connected)
    if not cam_active:
        cam_status_str = "STANDBY"
    elif cam_connected:
        cam_status_str = "CONNECTED"
    elif stream_worker.is_reconnecting:
        cam_status_str = "RECONNECTING"
    else:
        cam_status_str = "DISCONNECTED"

    camera_telemetry = {
        "status": cam_status_str,
        "is_active": cam_active,
        "is_connected": cam_connected,
        "name": stream_worker.cam_name,
        "source": str(stream_worker.cam_source),
        "fps": stream_worker.current_fps,
        "reconnect_attempts": stream_worker.reconnect_attempts,
        "total_frames_processed": stream_worker.total_frames_processed,
        "last_pesan_ui": stream_worker.last_pesan_ui or "Standby"
    }

    # 7. SISON ERP/MES Status
    sison_callback = get_callback_url()

    # Evaluasi Status Keseluruhan
    is_healthy = (db_status == "CONNECTED") and not is_disk_low and (not cam_active or cam_connected)
    if is_healthy:
        overall_status = "HEALTHY"
    elif is_disk_low:
        overall_status = "DISK_SPACE_LOW"
    elif db_status != "CONNECTED":
        overall_status = "BUFFER_FAILOVER"
    elif cam_active and not cam_connected:
        overall_status = "CAMERA_FAULT"
    else:
        overall_status = "DEGRADED"

    ai_engine_data = {
        "system_state": app_status,
        "active_part_no": active_part or "STANDBY",
        "active_model_name": stream_worker.current_loaded_p_no or (f"{active_part}.pt" if active_part else "Default YOLO"),
        "inference_latency_ms": stream_worker.last_inference_ms,
        "progress": qty_progress,
        "mode": inspection_mode,
        "cached_models_count": len(model_cache._cache)
    }

    return {
        "status": overall_status,
        "timestamp": datetime.now().isoformat(),
        "uptime": {
            "seconds": uptime_sec,
            "human": get_uptime_string(uptime_sec)
        },
        "camera": camera_telemetry,
        "ai_engine": ai_engine_data,
        "inspection_engine": ai_engine_data, # Backward compatibility
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
            "offline_buffer_unsynced_count": buffer_queue,
            "is_failover_active": db_status != "CONNECTED" or buffer_queue > 0
        },
        "sison": {
            "callback_url": sison_callback,
            "pending_sync_count": buffer_queue
        },
        "system_resources": {
            "cpu_percent": cpu_pct,
            "ram_percent": ram_pct,
            "ram_used_gb": ram_used_gb,
            "ram_total_gb": ram_total_gb
        },
        "disk_storage": {
            "total_gb": total_gb,
            "used_gb": used_gb,
            "free_gb": free_gb,
            "used_percent": used_pct,
            "free_percent": free_pct,
            "is_low_space_warning": is_disk_low
        },
        "network": {
            "local_ip": get_local_ip(),
            "port": 8000
        }
    }

@router.get("/status")
def get_system_status():
    """Endpoint status cepat untuk memantau status inspeksi yang sedang berjalan."""
    with state.lock:
        return {
            "status": state.status,
            "id_trans": state.id_trans,
            "p_no": state.p_no,
            "qty_remaining": state.qty,
            "target_qty": state.target_qty,
            "current_side": state.current_side,
            "mode": getattr(state, "inspection_mode", "AI"),
            "operator": state.operator_name
        }

@router.post("/admin-login")
@router.post("/login")
def admin_login(creds: LoginSchema, request: Request, db: Session = Depends(get_db)):
    """Otentikasi Terpadu (Operator / Pengawas / Admin) dengan proteksi Brute-Force Rate Limiter."""
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    user = db.query(User).filter(User.username == creds.username).first()
    if not user or not verify_password(creds.password, user.password):
        record_failed_attempt(client_ip)
        raise HTTPException(status_code=401, detail="Username atau PIN/Password salah!")
    if not getattr(user, 'is_active', True) or user.role not in ["pengawas", "operator", "admin"]:
        record_failed_attempt(client_ip)
        raise HTTPException(status_code=403, detail="Akun tidak berwenang mengakses sistem!")
    
    clear_failed_attempts(client_ip)
    session_expire_seconds = (8 * 3600) if user.role == "operator" else 86400
    token = create_admin_token(user.username, user.role, expires_in_seconds=session_expire_seconds)
    fullname = user.fullname.strip() if (getattr(user, 'fullname', None) and user.fullname.strip()) else user.username
    shift = creds.shift.strip() if creds.shift else "Shift 1"

    # Sinkronkan info operator ke system state jika role operator
    if user.role == "operator":
        with state.lock:
            state.operator_name = fullname
            state.operator_username = user.username
            state.operator_role = user.role
            state.operator_shift = shift
            state.operator_login_time = time.time()
        state.update_operator_heartbeat(
            username=user.username,
            fullname=fullname,
            role=user.role,
            client_ip=client_ip
        )

    log_audit_event(db, user.username, "LOGIN", f"Berhasil masuk sebagai {user.role.upper()} (Shift: {shift}, IP: {client_ip})")
    return {
        "token": token,
        "role": user.role,
        "username": user.username,
        "fullname": fullname,
        "shift": shift
    }

@router.post("/logout")
def admin_logout_root(db: Session = Depends(get_db), auth: dict = Depends(verify_admin_auth)):
    username = auth.get("u", "ADMIN")
    state.remove_operator_session(username)
    log_audit_event(db, username, "LOGOUT", "User keluar dari Dashboard")
    return {"success": True}

@router.post("/admin/logout")
def admin_logout_admin(db: Session = Depends(get_db), auth: dict = Depends(verify_admin_auth)):
    username = auth.get("u", "ADMIN")
    state.remove_operator_session(username)
    log_audit_event(db, username, "LOGOUT", "User keluar dari Dashboard")
    return {"success": True}
