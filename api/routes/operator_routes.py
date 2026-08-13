import os
import time
import asyncio
import json
import threading
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User, verify_password, SisonConfig, log_audit_event
from core import state, stream_worker, log_inspeksi_db
from integrations import SisonSender
from api.auth import create_admin_token

router = APIRouter()

class OperatorLoginRequest(BaseModel):
    username: str
    pin: str
    shift: Optional[str] = "Shift 1"

class OperatorHeartbeatRequest(BaseModel):
    username: Optional[str] = "op"
    fullname: Optional[str] = "Operator"
    role: Optional[str] = "operator"

class NGResolveRequest(BaseModel):
    action: Optional[str] = "CONFIRM_NG"
    username: Optional[str] = ""
    pin: Optional[str] = ""

class ClearPopupRequest(BaseModel):
    popup_type: Optional[str] = "ALL"

@router.get("/video_feed")
def video_feed():
    """Streaming video MJPEG real-time dengan anotasi AI YOLOv8."""
    def gen_frames():
        while True:
            frame_bytes = stream_worker.get_latest_jpeg()
            if frame_bytes is None:
                time.sleep(0.03)
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.03)

    return StreamingResponse(
        gen_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

def _get_operator_state_dict() -> dict:
    with state.lock:
        cur_status = state.status
        cur_id = state.id_trans
        cur_pno = state.p_no
        qty_rem = state.qty
        tgt_qty = state.target_qty
        qty_comp = max(0, tgt_qty - qty_rem) if tgt_qty > 0 else 0
        side = state.current_side
        mode = getattr(state, 'inspection_mode', 'AI')
        op_name = state.operator_name
        op_uname = state.operator_username
        op_role = state.operator_role
        op_login_ts = state.operator_login_time
        part_ok = getattr(state, 'part_ok_popup', False)
        flip_part = getattr(state, 'flip_part_popup', False)
        details = dict(state.last_inspection_details) if hasattr(state, 'last_inspection_details') else {}
        live_metrics = dict(state.live_metrics) if hasattr(state, 'live_metrics') else {}

    ng_active = bool(stream_worker.ng_active or cur_status == "NG")
    ng_img_path = stream_worker.last_ng_image_path.replace("\\", "/") if stream_worker.last_ng_image_path else ""
    if ng_img_path and not ng_img_path.startswith("/"):
        ng_img_path = "/" + ng_img_path

    return {
        "status": cur_status,
        "id_trans": cur_id,
        "p_no": cur_pno,
        "qty_remaining": qty_rem,
        "target_qty": tgt_qty,
        "qty_completed": qty_comp,
        "current_side": "FRONT" if side == "F" else "REAR",
        "inspection_mode": mode,
        "pesan_ui": stream_worker.last_pesan_ui,
        "live_metrics": live_metrics,
        "is_cam_active": stream_worker.is_cam_active,
        "reconnect_attempts": stream_worker.reconnect_attempts,
        "operator": {
            "name": op_name,
            "username": op_uname,
            "role": op_role,
            "login_time": op_login_ts
        },
        "popups": {
            "part_ok": part_ok,
            "flip_part": flip_part,
            "ng_active": ng_active,
            "ng_image_url": ng_img_path,
            "details": details
        }
    }

@router.get("/operator/state")
def get_operator_state():
    """Telemetry status lengkap untuk antarmuka Operator Inspection."""
    return _get_operator_state_dict()

@router.get("/operator/events")
async def operator_events(request: Request):
    """Server-Sent Events (SSE) untuk real-time update tampilan HUD & Popups."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            payload = _get_operator_state_dict()
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/operator/heartbeat")
def operator_heartbeat(req: OperatorHeartbeatRequest, request: Request):
    """Heartbeat berkala dari browser layar operator untuk sinkronisasi state aktif per-operator."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    uname = req.username or "op"
    fname = req.fullname or uname
    u_role = req.role or "operator"

    state.update_operator_heartbeat(
        username=uname,
        fullname=fname,
        role=u_role,
        client_ip=client_ip
    )
    return {"success": True, "active_count": len(state.get_all_active_operators())}

@router.post("/operator/login")
def operator_login(req: OperatorLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Otentikasi operator sebelum memasuki layar kamera inspeksi AI."""
    username = req.username.strip()
    pin = req.pin.strip()

    if not username or not pin:
        raise HTTPException(status_code=400, detail="Username dan PIN tidak boleh kosong!")

    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user or not verify_password(pin, user.password):
        raise HTTPException(status_code=401, detail="Username atau PIN salah!")

    if user.role not in ["operator", "pengawas", "admin"]:
        raise HTTPException(status_code=403, detail="Role pengguna tidak diizinkan masuk ke layar inspeksi!")

    fullname = user.fullname.strip() if (getattr(user, 'fullname', None) and user.fullname.strip()) else username
    client_ip = request.client.host if request.client else "127.0.0.1"

    state.update_operator_heartbeat(
        username=user.username,
        fullname=fullname,
        role=user.role,
        client_ip=client_ip
    )

    token = create_admin_token(user.username, user.role, expires_in_seconds=86400)
    log_audit_event(db, user.username, "OPERATOR_LOGIN", f"Operator {fullname} masuk ke layar inspeksi (IP: {client_ip}).")

    return {
        "success": True,
        "token": token,
        "username": user.username,
        "fullname": fullname,
        "role": user.role
    }

class OperatorLogoutPayload(BaseModel):
    username: Optional[str] = ""

@router.post("/operator/logout")
def operator_logout(req: Optional[OperatorLogoutPayload] = None, db: Session = Depends(get_db)):
    """Keluar dari sesi operator aktif."""
    uname = req.username if (req and req.username) else (state.operator_username or "OPERATOR")
    state.remove_operator_session(uname)
    log_audit_event(db, uname, "OPERATOR_LOGOUT", f"Operator {uname} logout dari layar inspeksi.")
    return {"success": True}

@router.post("/operator/manual-pass")
def manual_pass():
    """Trigger manual pass OK saat mode inspeksi manual atau part OK diverifikasi operator."""
    with state.lock:
        curr_status = state.status
        if curr_status not in ["RUNNING", "OK"]:
            raise HTTPException(status_code=400, detail="Sistem dalam posisi STANDBY. Tidak ada transaksi aktif.")
        
        state.qty -= 1
        rem_qty = state.qty
        cur_pno = state.p_no
        cur_id = state.id_trans
        op_name = state.operator_name
        state.part_ok_popup = True
        state.last_inspection_details = {
            "label_terdeteksi": "Pemeriksaan Visual Manual",
            "avg_confidence": "100% (Manual Pass)",
            "found_labels": "- INSPEKSI VISUAL OPERATOR : OK"
        }
        
        if rem_qty <= 0:
            state.status = "COMPLETED"
            state.completed_time = time.time()
            stream_worker.last_pesan_ui = "INSPEKSI MANUAL SELESAI (OK)!"
        else:
            stream_worker.last_pesan_ui = f"Part Manual OK! Sisa: {rem_qty} PCS"

    threading.Thread(target=log_inspeksi_db, args=(cur_id, cur_pno, "OK", 1.0, "MANUAL", op_name), daemon=True).start()
    if rem_qty <= 0:
        threading.Thread(target=SisonSender.send_callback, args=(cur_id, 1), daemon=True).start()
        
    return {"success": True, "message": f"Part Manual OK! Sisa: {max(0, rem_qty)} PCS"}

@router.post("/operator/manual-reject")
def manual_reject():
    """Trigger manual reject NG saat operator menemukan kecacatan secara visual."""
    with state.lock:
        curr_status = state.status
        if curr_status not in ["RUNNING", "OK"]:
            raise HTTPException(status_code=400, detail="Sistem dalam posisi STANDBY. Tidak ada transaksi aktif.")
        
        state.status = "NG"
        cur_pno = state.p_no
        cur_id = state.id_trans
        op_name = state.operator_name
        stream_worker.last_pesan_ui = "STATUS: NG (MANUAL REJECT)! INPUT PIN UNTUK VALIDASI."
        stream_worker.ng_active = True

    threading.Thread(target=log_inspeksi_db, args=(cur_id, cur_pno, "NG", 0.0, "MANUAL", op_name), daemon=True).start()
    threading.Thread(target=SisonSender.send_callback, args=(cur_id, 2), daemon=True).start()
    return {"success": True, "message": "Manual reject triggered. Status: NG."}

@router.post("/operator/mock-detect")
def mock_detect():
    """Simulasi trigger deteksi AI untuk testing / demo inspeksi."""
    with state.lock:
        curr_status = state.status
        if curr_status not in ["RUNNING", "OK"]:
            raise HTTPException(status_code=400, detail="Sistem dalam posisi STANDBY. Mulai transaksi SISON terlebih dahulu!")
        
        cur_side = state.current_side
        rules = state.aturan_sisi
        cur_pno = state.p_no
        cur_id = state.id_trans
        op_name = state.operator_name
        
        # Cek apakah part memiliki dua sisi (Front & Rear)
        has_rear = any(r.get("nama_komponen", "").lower().startswith("r-") for r in rules)
        
        if cur_side == "F" and has_rear:
            state.current_side = "R"
            state.flip_part_popup = True
            
            front_rules = [r for r in rules if r.get("nama_komponen", "").lower().startswith("f-")]
            found_labels_list = [f"- {r.get('nama_komponen', '').upper()} : 96%" for r in front_rules] if front_rules else ["- SISI DEPAN (FRONT) : 95%"]
            state.last_inspection_details = {
                "label_terdeteksi": f"{len(found_labels_list)}/{len(found_labels_list)} (100% Sisi Depan)",
                "avg_confidence": "96%",
                "found_labels": "\n".join(found_labels_list)
            }
            stream_worker.last_pesan_ui = "Sisi Depan OK! Balik Part ke sisi Belakang."
            return {"success": True, "action": "flip_part", "message": "Sisi Depan OK! Balik Part ke sisi Belakang."}
        else:
            state.qty -= 1
            rem_qty = state.qty
            state.current_side = "F"
            state.part_ok_popup = True
            
            rear_rules = [r for r in rules if r.get("nama_komponen", "").lower().startswith("r-")]
            found_labels_list = [f"- {r.get('nama_komponen', '').upper()} : 95%" for r in rear_rules] if rear_rules else [f"- {r.get('nama_komponen', '').upper()} : 95%" for r in rules if r.get("nama_komponen")]
            if not found_labels_list:
                found_labels_list = ["- KOMPONEN TERVERIFIKASI : 95%"]

            state.last_inspection_details = {
                "label_terdeteksi": f"{len(found_labels_list)}/{len(found_labels_list)} (100%)",
                "avg_confidence": "95%",
                "found_labels": "\n".join(found_labels_list)
            }
            
            if rem_qty <= 0:
                state.status = "COMPLETED"
                state.completed_time = time.time()
                stream_worker.last_pesan_ui = "INSPEKSI SELESAI (OK)!"
            else:
                stream_worker.last_pesan_ui = f"Part OK! Sisa: {rem_qty} PCS. Lanjut part berikutnya."

    threading.Thread(target=log_inspeksi_db, args=(cur_id, cur_pno, "OK", 0.95, "AI", op_name), daemon=True).start()
    if rem_qty <= 0:
        threading.Thread(target=SisonSender.send_callback, args=(cur_id, 1), daemon=True).start()

    return {
        "success": True, 
        "action": "completed" if rem_qty <= 0 else "part_ok", 
        "message": f"Mock detect berhasil! Sisa: {max(0, rem_qty)} PCS"
    }

@router.api_route("/operator/demo-ng", methods=["GET", "POST"])
def operator_demo_ng(db: Session = Depends(get_db)):
    """Memicu simulasi abnormalitas cacat (NG) untuk demo dan preview desain modal alarm."""
    import numpy as np
    import cv2
    from core.stream import cleanup_old_ng_records
    
    with state.lock:
        state.status = "NG"
        if not state.id_trans:
            state.id_trans = f"DEMO-{int(time.time())}"
        if not state.p_no:
            state.p_no = "74231-0K550-00"
        cur_id = state.id_trans
        cur_pno = state.p_no
        op_name = state.operator_name or "Operator Demo"
        
    stream_worker.ng_active = True
    os.makedirs("ng_records", exist_ok=True)
    cleanup_old_ng_records(directory="ng_records", days=30)
    
    timestamp = int(time.time())
    filename = f"ng_records/NG_{cur_id}_{timestamp}.jpg"
    
    # Ambil frame saat ini atau buat simulasi frame cacat
    frame = None
    if hasattr(stream_worker, 'latest_frame_raw') and stream_worker.latest_frame_raw is not None:
        frame = stream_worker.latest_frame_raw.copy()
    
    if frame is None:
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:] = (20, 20, 30)
        cv2.putText(frame, "SIMULASI SNAPSHOT CACAT NG", (60, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        cv2.putText(frame, f"PART: {cur_pno}", (60, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        cv2.putText(frame, "STATUS: DEFECT DETECTED (98%)", (60, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
    else:
        # Gambar kotak anotasi cacat simulasi
        h, w = frame.shape[:2]
        x1, y1 = int(w * 0.35), int(h * 0.35)
        x2, y2 = int(w * 0.65), int(h * 0.65)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(frame, "NG-SCRATCH (98%)", (x1, max(25, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    try:
        cv2.imwrite(filename, frame)
        stream_worker.last_ng_image_path = filename
        stream_worker.last_pesan_ui = "⚠️ STATUS: NG TERDETEKSI! SILAKAN KONFIRMASI."
        threading.Thread(target=log_ng_db, args=(cur_id, cur_pno, filename, op_name), daemon=True).start()
    except Exception as e:
        print(f"[DEMO NG WARN] Gagal menyimpan snapshot demo NG: {e}")

    return {
        "success": True,
        "message": "Demo alarm NG berhasil dipicu! Periksa modal alarm merah."
    }

@router.api_route("/operator/resolve-ng", methods=["GET", "POST"])
def resolve_ng(req: Optional[NGResolveRequest] = None, db: Session = Depends(get_db)):
    """Konfirmasi abnormalitas NG (Cacat Terkonfirmasi atau False Alarm / Abaikan) langsung dari modal."""
    action_type = (req.action if req and req.action else "CONFIRM_NG").upper()
    
    with state.lock:
        state.status = "RUNNING"
        state.cooldown_until = time.time() + 2.0
        cur_op = state.operator_name or state.operator_username or "Operator"
        cur_id = state.id_trans
        cur_pno = state.p_no

    stream_worker.ng_active = False

    if action_type in ["CONFIRM_NG", "CONFIRM", "YES"]:
        msg = f"Part dikonfirmasi cacat (NG) oleh {cur_op}."
    else:
        msg = f"Alarm NG diabaikan / False Alarm oleh {cur_op}."

    try:
        log_audit_event(db, cur_op, "RESOLVE_NG", f"{msg} (Trans: {cur_id}, Part: {cur_pno})")
    except Exception:
        pass

    return {"success": True, "message": msg}

@router.post("/operator/clear-popup")
def clear_popup(req: ClearPopupRequest):
    """Menutup modal popup Part OK atau Balik Part dari antarmuka web."""
    with state.lock:
        if req.popup_type in ["ALL", "part_ok"]:
            state.part_ok_popup = False
        if req.popup_type in ["ALL", "flip_part"]:
            state.flip_part_popup = False
    return {"success": True}

@router.post("/operator/demo-start")
@router.post("/operator/start-demo")
def operator_demo_start(req: dict, db: Session = Depends(get_db)):
    """Memicu simulasi transaksi SISON khusus untuk antarmuka demo operator."""
    from api.routes.sison_inbound import StartRequest, execute_sison_start
    start_req = StartRequest(
        id_trans=req.get("id_trans", f"DEMO-{int(time.time())}"),
        p_no=req.get("p_no", "74231-0K550-00"),
        lot=req.get("lot", "LOT-DEMO-01"),
        unique_no=req.get("unique_no", f"UNQ-{int(time.time()) % 10000:04d}"),
        p_name=req.get("p_name", "Demo Part Multi-Sisi"),
        qty=max(1, int(req.get("qty", 2)))
    )
    return execute_sison_start(start_req, db)
