from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Transaction, AuditLog, CameraConfig, User, InspectionLog, log_audit_event
from api.auth import get_current_user_name
from core import state, stream_worker

router = APIRouter()

@router.get("/line-monitoring")
def get_line_monitoring_data(db: Session = Depends(get_db)):
    """Mengambil status real-time stasiun/line kerja, operator aktif, dan metrik inspeksi untuk Office Admin."""
    with state.lock:
        cur_status = state.status
        p_no = state.p_no
        qty_rem = state.qty
        tgt_qty = state.target_qty
        qty_comp = max(0, tgt_qty - qty_rem) if tgt_qty > 0 else 0
        side = state.current_side
        op_name = state.operator_name
        op_uname = state.operator_username
        op_role = state.operator_role
        op_login_ts = state.operator_login_time

    cams = db.query(CameraConfig).all()
    active_cam = next((c for c in cams if c.is_active), None)
    
    # Hitung total inspeksi hari ini
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs = db.query(InspectionLog).filter(InspectionLog.created_at >= today_start).all()
    today_total = len(today_logs)
    today_ok = len([l for l in today_logs if (l.detection_status or '').upper() == 'OK'])
    today_ng = len([l for l in today_logs if (l.detection_status or '').upper() == 'NG'])

    stations = [
        {
            "id": "STATION-01",
            "line_name": "Line 1 - QC Inspection Camera",
            "camera_name": active_cam.name if active_cam else "Kamera Utama",
            "camera_source": active_cam.source if active_cam else "0",
            "is_camera_active": stream_worker.is_cam_active,
            "status": cur_status,
            "part_no": p_no or "STANDBY",
            "target_qty": tgt_qty,
            "qty_completed": qty_comp,
            "qty_remaining": qty_rem,
            "current_side": "FRONT" if side == "F" else "REAR",
            "operator": {
                "name": op_name or "Tidak Ada Operator",
                "username": op_uname or "-",
                "role": op_role or "-",
                "login_time": op_login_ts,
                "is_active": bool(op_name)
            },
            "video_feed_url": "/api/video_feed",
            "last_pesan_ui": stream_worker.last_pesan_ui,
            "ng_active": bool(stream_worker.ng_active or cur_status == "NG")
        }
    ]

    return {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_stations": len(stations),
            "active_operators": 1 if op_name else 0,
            "today_total_inspections": today_total,
            "today_ok": today_ok,
            "today_ng": today_ng,
            "alarm_ng_active": bool(stream_worker.ng_active or cur_status == "NG")
        },
        "stations": stations
    }

@router.get("/transactions")
def get_transactions(date_filter: Optional[str] = None, db: Session = Depends(get_db)):
    """Mengambil 50 transaksi terbaru untuk Dashboard monitoring."""
    query = db.query(Transaction)
    
    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            start_date = datetime(filter_date.year, filter_date.month, filter_date.day, 0, 0, 0)
            end_date = datetime(filter_date.year, filter_date.month, filter_date.day, 23, 59, 59)
            query = query.filter(Transaction.start_time >= start_date, Transaction.start_time <= end_date)
            return query.order_by(Transaction.start_time.desc()).all()
        except ValueError:
            pass
            
    trans = query.order_by(Transaction.start_time.desc()).limit(50).all()
    return trans

@router.delete("/transactions/running")
def clear_running_transactions(db: Session = Depends(get_db), uname: str = Depends(get_current_user_name)):
    """Hapus seluruh transaksi berstatus RUNNING (status=2) dari database."""
    deleted_count = db.query(Transaction).filter(Transaction.status == 2).delete()
    db.commit()
    log_audit_event(db, uname, "DELETE_RUNNING_TRANS", f"Menghapus {deleted_count} transaksi ber-status RUNNING")
    return {"success": True, "count": deleted_count, "message": f"Berhasil menghapus {deleted_count} transaksi RUNNING."}

@router.get("/audit-logs")
def get_audit_logs(date_filter: Optional[str] = None, db: Session = Depends(get_db)):
    """Mengambil riwayat audit aktivitas user dan sistem."""
    query = db.query(AuditLog)
    if date_filter:
        try:
            f_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            start_date = datetime(f_date.year, f_date.month, f_date.day, 0, 0, 0)
            end_date = datetime(f_date.year, f_date.month, f_date.day, 23, 59, 59)
            query = query.filter(AuditLog.timestamp >= start_date, AuditLog.timestamp <= end_date)
        except ValueError:
            pass
    raw_logs = query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    result = []
    for log in raw_logs:
        ts_str = log.timestamp.isoformat() if log.timestamp else datetime.now().isoformat()
        result.append({
            "id": log.id,
            "timestamp": ts_str,
            "created_at": ts_str,
            "username": log.username or "SYSTEM",
            "action": log.action,
            "details": log.details or ""
        })
    return result
