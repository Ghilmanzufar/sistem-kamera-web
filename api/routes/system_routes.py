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
    """Mengambil status real-time stasiun/line kerja, seluruh operator aktif, dan metrik inspeksi untuk Office Admin."""
    with state.lock:
        cur_status = state.status
        p_no = state.p_no
        qty_rem = state.qty
        tgt_qty = state.target_qty
        qty_comp = max(0, tgt_qty - qty_rem) if tgt_qty > 0 else 0
        side = state.current_side

    # Dapatkan seluruh operator yang aktif (Edge, Opera, Chrome, berbagai PC)
    active_operators = state.get_all_active_operators(timeout_seconds=90.0)

    # Ambil seluruh daftar kamera dari database
    cams = db.query(CameraConfig).order_by(CameraConfig.id.asc()).all()
    if not cams:
        cams = [CameraConfig(id=1, name="Kamera QC Station 1", source="0", is_active=True)]

    # Hitung total inspeksi hari ini
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs = db.query(InspectionLog).filter(InspectionLog.created_at >= today_start).all()
    today_total = len(today_logs)
    today_ok = len([l for l in today_logs if (l.detection_status or '').upper() == 'OK'])
    today_ng = len([l for l in today_logs if (l.detection_status or '').upper() == 'NG'])

    stations = []
    # Buat slot stasiun (misal 4 stasiun line kerja seperti rencana 1 line 4 PC)
    for idx, cam in enumerate(cams, 1):
        station_id = f"STATION-0{idx}"
        assigned_op = active_operators[idx - 1] if idx - 1 < len(active_operators) else None

        stations.append({
            "id": station_id,
            "line_name": f"Line 1 - Station {idx} ({cam.name})",
            "camera_id": cam.id,
            "camera_name": cam.name,
            "camera_source": cam.source,
            "is_camera_active": stream_worker.is_cam_active if cam.is_active else False,
            "status": cur_status if cam.is_active else "STANDBY",
            "part_no": p_no if cam.is_active else "STANDBY",
            "target_qty": tgt_qty if cam.is_active else 0,
            "qty_completed": qty_comp if cam.is_active else 0,
            "qty_remaining": qty_rem if cam.is_active else 0,
            "current_side": "FRONT" if side == "F" else "REAR",
            "operator": {
                "name": assigned_op["fullname"] if assigned_op else "Tidak Ada Operator",
                "username": assigned_op["username"] if assigned_op else "-",
                "role": assigned_op["role"] if assigned_op else "-",
                "login_time": assigned_op["login_time"] if assigned_op else 0,
                "client_ip": assigned_op.get("client_ip", "-") if assigned_op else "-",
                "is_active": bool(assigned_op)
            },
            "video_feed_url": "/api/video_feed",
            "last_pesan_ui": stream_worker.last_pesan_ui if cam.is_active else "Standby",
            "ng_active": bool((stream_worker.ng_active or cur_status == "NG") and cam.is_active)
        })

    # Tambahkan slot stasiun hingga 4 komputer stasiun line
    while len(stations) < 4:
        s_idx = len(stations) + 1
        assigned_op = active_operators[s_idx - 1] if s_idx - 1 < len(active_operators) else None
        stations.append({
            "id": f"STATION-0{s_idx}",
            "line_name": f"Line 1 - Station {s_idx} (Kamera QC {s_idx})",
            "camera_id": None,
            "camera_name": f"Kamera Station {s_idx}",
            "camera_source": f"{s_idx - 1}",
            "is_camera_active": False,
            "status": "STANDBY",
            "part_no": "STANDBY",
            "target_qty": 0,
            "qty_completed": 0,
            "qty_remaining": 0,
            "current_side": "FRONT",
            "operator": {
                "name": assigned_op["fullname"] if assigned_op else "Tidak Ada Operator",
                "username": assigned_op["username"] if assigned_op else "-",
                "role": assigned_op["role"] if assigned_op else "-",
                "login_time": assigned_op["login_time"] if assigned_op else 0,
                "client_ip": assigned_op.get("client_ip", "-") if assigned_op else "-",
                "is_active": bool(assigned_op)
            },
            "video_feed_url": "/api/video_feed",
            "last_pesan_ui": "Slot Stasiun Standby",
            "ng_active": False
        })

    return {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_stations": len(stations),
            "active_operators": len(active_operators),
            "today_total_inspections": today_total,
            "today_ok": today_ok,
            "today_ng": today_ng,
            "alarm_ng_active": bool(stream_worker.ng_active or cur_status == "NG")
        },
        "active_operators_list": active_operators,
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
