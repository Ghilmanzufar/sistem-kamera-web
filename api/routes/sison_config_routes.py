from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db, SisonConfig, log_audit_event
from api.auth import get_current_user_name, create_admin_token, verify_supervisor_only
from integrations import SisonSender
from .auth_routes import get_local_ip

router = APIRouter()

SERVICE_TOKEN_DAYS = 30  # Masa berlaku Service Token SISON (30 hari)
SERVICE_ACCOUNT   = "sison_service"
SERVICE_ROLE      = "sison"


class SisonConfigUpdate(BaseModel):
    callback_url: str
    api_key: Optional[str] = None


class SisonTestPingRequest(BaseModel):
    callback_url: str


def get_or_create_sison_config(db: Session) -> SisonConfig:
    cfg = db.query(SisonConfig).first()
    if not cfg:
        cfg = SisonConfig()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@router.get("/sison-config")
def get_sison_config(db: Session = Depends(get_db)):
    cfg = get_or_create_sison_config(db)

    # Hitung info kedaluwarsa service token
    token_info = None
    if cfg.service_token and cfg.service_token_expires_at:
        now = datetime.utcnow()
        exp = cfg.service_token_expires_at
        days_left = (exp - now).days
        is_expired = now > exp
        token_info = {
            "token": cfg.service_token,
            "expires_at": exp.isoformat(),
            "days_left": max(0, days_left),
            "is_expired": is_expired,
            "is_expiring_soon": days_left <= 5 and not is_expired,
        }

    return {
        "callback_url": cfg.callback_url,
        "api_key": cfg.api_key or "",
        "server_ip": get_local_ip(),
        "server_port": 8000,
        "service_token_info": token_info,
    }


@router.put("/sison-config")
def update_sison_config(
    data: SisonConfigUpdate,
    db: Session = Depends(get_db),
    uname: str = Depends(get_current_user_name),
):
    cfg = get_or_create_sison_config(db)
    cfg.callback_url = data.callback_url
    if data.api_key is not None:
        cfg.api_key = data.api_key
    db.commit()
    log_audit_event(db, uname, "UPDATE_SISON_CONFIG", f"Mengubah konfigurasi Sison Callback ke {data.callback_url}")
    return {"success": True, "message": "Konfigurasi Sison Callback berhasil disimpan"}


@router.post("/sison-generate-token")
def generate_sison_service_token(
    db: Session = Depends(get_db),
    auth: dict = Depends(verify_supervisor_only),
    uname: str = Depends(get_current_user_name),
):
    """
    Generate Service Token SISON jangka panjang (30 hari).
    Token ini digunakan oleh sistem SISON untuk memanggil POST /api/start
    tanpa perlu login ulang setiap hari.
    Hanya dapat dibuat oleh Pengawas / Admin.
    """
    expires_seconds = SERVICE_TOKEN_DAYS * 24 * 3600  # 30 hari dalam detik
    token = create_admin_token(
        username=SERVICE_ACCOUNT,
        role=SERVICE_ROLE,
        expires_in_seconds=expires_seconds,
    )

    expires_at = datetime.utcnow() + timedelta(days=SERVICE_TOKEN_DAYS)

    cfg = get_or_create_sison_config(db)
    cfg.service_token = token
    cfg.service_token_expires_at = expires_at
    db.commit()

    log_audit_event(
        db, uname,
        "GENERATE_SISON_SERVICE_TOKEN",
        f"Service Token SISON baru diterbitkan — berlaku 30 hari hingga {expires_at.strftime('%Y-%m-%d %H:%M')} UTC"
    )

    return {
        "success": True,
        "token": token,
        "expires_at": expires_at.isoformat(),
        "days_valid": SERVICE_TOKEN_DAYS,
        "message": f"Service Token SISON berhasil diterbitkan — berlaku {SERVICE_TOKEN_DAYS} hari.",
    }


@router.post("/sison-test-ping")
def test_sison_ping(req: SisonTestPingRequest):
    """Uji konektivitas webhook ke endpoint server SISON."""
    if not req.callback_url or not req.callback_url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL Webhook tidak valid (harus diawali http:// atau https://)")
    res = SisonSender.test_ping(req.callback_url)
    return res
