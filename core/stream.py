import os
import time
import threading
import cv2
import numpy as np
from database import SessionLocal, CameraConfig
from core import state, KameraProses, create_capture_device, log_ng_db

class CameraStreamWorker:
    """
    Background worker singleton untuk membaca video feed hardware kamera,
    menjalankan engine inferensi AI YOLOv8, menangani reconnect otomatis,
    dan menyediakan frame buffer JPEG terkompresi untuk streaming web.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(CameraStreamWorker, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        self.cap = None
        self.cam_source = 0
        self.cam_name = "Kamera QC Utama"
        self.is_cam_active = False
        self.is_connected = False
        self.current_fps = 0.0
        self.last_inference_ms = 0.0
        self.last_frame_ts = 0.0
        self.total_frames_processed = 0
        self.last_cam_check_time = 0.0
        self.is_reconnecting = False
        self.reconnect_attempts = 0
        self.last_pesan_ui = "STANDBY"
        
        self.model = None
        self.current_loaded_p_no = ""
        self.last_model_mtime = 0.0
        
        self.latest_frame_bytes = None
        self.latest_frame_raw = None
        self.frame_lock = threading.Lock()
        self.running = False
        self.worker_thread = None

        # State NG snapshot
        self.last_ng_image_path = ""
        self.ng_active = False
        self.ng_event_id = 0

        self._init_camera_config()

    def _init_camera_config(self):
        try:
            db = SessionLocal()
            active_cam = db.query(CameraConfig).filter(CameraConfig.is_active == True).first()
            if active_cam:
                cam_source = active_cam.source
                if isinstance(cam_source, str) and cam_source.isdigit():
                    cam_source = int(cam_source)
                self.cam_source = cam_source
                self.cam_name = active_cam.name or f"Camera {cam_source}"
                self.is_cam_active = True
            else:
                self.cam_source = 0
                self.cam_name = "Camera 0"
                self.is_cam_active = False
            db.close()
            print(f"[STREAM SYSTEM] Sumber kamera aktif dari DB: {self.cam_source} (Aktif: {self.is_cam_active})")
        except Exception as e:
            print(f"[STREAM SYSTEM WARN] Gagal membaca konfigurasi kamera DB: {e}")
            self.cam_source = 0
            self.cam_name = "Camera 0"
            self.is_cam_active = False

    def start(self):
        if self.running:
            return
        self.running = True
        if self.is_cam_active:
            self._open_camera()
        self.worker_thread = threading.Thread(target=self._capture_loop, daemon=True, name="CameraCaptureWorker")
        self.worker_thread.start()
        print("[STREAM SYSTEM] 🚀 Background Camera Stream Worker aktif!")

    def stop(self):
        self.running = False
        if self.cap and self.cap.isOpened():
            self.cap.release()

    def _open_camera(self):
        try:
            if self.cap and self.cap.isOpened():
                self.cap.release()
            self.cap = create_capture_device(self.cam_source)
            print(f"[STREAM SYSTEM] Kamera [{self.cam_source}] diinisialisasi.")
        except Exception as e:
            print(f"[STREAM SYSTEM ERROR] Gagal inisialisasi kamera [{self.cam_source}]: {e}")

    def _attempt_reconnect_async(self):
        if self.is_reconnecting or not self.is_cam_active:
            return
        self.is_reconnecting = True
        self.reconnect_attempts += 1

        def worker():
            try:
                try:
                    if self.cap and self.cap.isOpened():
                        self.cap.release()
                except Exception:
                    pass

                time.sleep(1.0)
                new_cap = create_capture_device(self.cam_source)
                if new_cap.isOpened():
                    ret, test_frame = new_cap.read()
                    if ret and test_frame is not None:
                        self.cap = new_cap
                        self.reconnect_attempts = 0
                        print(f"[STREAM WATCHDOG] ✅ Kamera ({self.cam_source}) berhasil terhubung kembali!")
                    else:
                        new_cap.release()
            except Exception as e:
                print(f"[STREAM WATCHDOG WARN] Percobaan reconnect ke-{self.reconnect_attempts} gagal: {e}")
            finally:
                self.is_reconnecting = False

        t = threading.Thread(target=worker, daemon=True)
        t.start()

    def _create_placeholder_frame(self, title: str, subtitle: str, color=(30, 41, 59), text_color=(203, 213, 225)):
        """Membuat frame placeholder elegan saat kamera standby / reconnecting."""
        h, w = 720, 1280
        frame = np.full((h, w, 3), color, dtype=np.uint8)
        
        # Draw central info box
        cv2.rectangle(frame, (100, 200), (w - 100, h - 200), (15, 23, 42), -1)
        cv2.rectangle(frame, (100, 200), (w - 100, h - 200), (51, 65, 85), 2)

        font = cv2.FONT_HERSHEY_SIMPLEX
        # Title
        t_size = cv2.getTextSize(title, font, 1.3, 3)[0]
        t_x = (w - t_size[0]) // 2
        cv2.putText(frame, title, (t_x, 340), font, 1.3, text_color, 3, cv2.LINE_AA)

        # Subtitle
        s_size = cv2.getTextSize(subtitle, font, 0.8, 2)[0]
        s_x = (w - s_size[0]) // 2
        cv2.putText(frame, subtitle, (s_x, 410), font, 0.8, (148, 163, 184), 2, cv2.LINE_AA)

        return frame

    def _capture_loop(self):
        while self.running:
            t_start = time.time()

            # 1. Sinkronisasi status saklar kamera dari database setiap 1 detik
            now_ts = time.time()
            if now_ts - self.last_cam_check_time >= 1.0:
                self.last_cam_check_time = now_ts
                try:
                    db_cam_session = SessionLocal()
                    active_cam = db_cam_session.query(CameraConfig).filter(CameraConfig.is_active == True).first()
                    if active_cam:
                        new_src = active_cam.source
                        if isinstance(new_src, str) and new_src.isdigit():
                            new_src = int(new_src)
                        if not self.is_cam_active or self.cam_source != new_src or (self.cap and not self.cap.isOpened()):
                            self.is_cam_active = True
                            self.cam_source = new_src
                            self._open_camera()
                            print(f"[STREAM SYSTEM] Saklar Kamera Aktif: {active_cam.name} (Source: {new_src})")
                    else:
                        if self.is_cam_active:
                            self.is_cam_active = False
                            if self.cap and self.cap.isOpened():
                                self.cap.release()
                            print("[STREAM SYSTEM] Saklar Kamera Standby (OFF).")
                    db_cam_session.close()
                except Exception:
                    pass

            # 2. Status Reset jika COMPLETED > 5 detik
            with state.lock:
                current_status = state.status
                completed_time = state.completed_time
                p_no = state.p_no

            if current_status == "COMPLETED" and completed_time > 0 and (now_ts - completed_time) >= 5.0:
                state.reset_to_standby()

            # 3. Lazy & Hot-reload model AI YOLOv8
            model_path = os.path.join(os.getcwd(), "weights", f"{p_no}.pt")
            curr_mtime = os.path.getmtime(model_path) if os.path.exists(model_path) else 0.0
            if p_no != "" and (p_no != self.current_loaded_p_no or curr_mtime > self.last_model_mtime):
                self.model = KameraProses.load_model(p_no)
                self.current_loaded_p_no = p_no
                self.last_model_mtime = curr_mtime

            # 4. Tangani jika kamera Standby (OFF)
            if not self.is_cam_active:
                self.is_connected = False
                self.current_fps = 0.0
                frame = self._create_placeholder_frame(
                    "KAMERA STANDBY (OFF)",
                    "Nyalakan saklar kamera di pengaturan admin untuk mengaktifkan video stream.",
                    color=(15, 23, 42),
                    text_color=(148, 163, 184)
                )
                self._update_encoded_frame(frame)
                time.sleep(0.06)
                continue

            # 5. Baca frame dari capture device
            try:
                ret, frame = self.cap.read() if (self.cap and self.cap.isOpened()) else (False, None)
            except Exception:
                ret, frame = False, None

            # 6. Tangani jika kamera gagal membaca frame
            if not ret or frame is None:
                self.is_connected = False
                self.current_fps = 0.0
                attempt_str = f"Mencoba reconnect ke-{self.reconnect_attempts}..." if self.reconnect_attempts > 0 else "Periksa kabel USB atau koneksi kamera."
                frame = self._create_placeholder_frame(
                    "KAMERA TERPUTUS / TIDAK TERDETEKSI",
                    attempt_str,
                    color=(30, 15, 15),
                    text_color=(239, 68, 68)
                )
                self._update_encoded_frame(frame)
                self._attempt_reconnect_async()
                time.sleep(0.1)
                continue

            # Berhasil baca frame normal
            self.is_connected = True
            self.last_frame_ts = time.time()
            self.total_frames_processed += 1

            # 7. Proses Frame dengan AI YOLO & Aturan Inspeksi
            try:
                t_inf_start = time.time()
                frame, pesan_ui = KameraProses.proses_frame(frame, self.model)
                self.last_inference_ms = round((time.time() - t_inf_start) * 1000, 1)
                self.last_pesan_ui = pesan_ui
            except Exception as e:
                print(f"[STREAM PROCESS WARN] Error saat memproses frame AI: {e}")

            # 8. Tangani Event NG Abnormality (Snapshot & Database Logging)
            with state.lock:
                status_kamera = state.status
                cur_id = state.id_trans
                cur_pno = state.p_no
                op_name = state.operator_name

            if status_kamera == "NG" and not self.ng_active:
                self.ng_active = True
                self.ng_event_id += 1
                os.makedirs("ng_records", exist_ok=True)
                cleanup_old_ng_records(directory="ng_records", days=30)
                timestamp = int(time.time())
                filename = f"ng_records/NG_{cur_id}_{timestamp}.jpg"
                try:
                    cv2.imwrite(filename, frame)
                    self.last_ng_image_path = filename
                    print(f"[STREAM SYSTEM] ⚠️ NG Terdeteksi! Foto bukti disimpan di: {filename}")
                    threading.Thread(target=log_ng_db, args=(cur_id, cur_pno, filename, op_name), daemon=True).start()
                except Exception as e:
                    print(f"[STREAM SYSTEM WARN] Gagal menyimpan snapshot foto NG: {e}")
            elif status_kamera != "NG" and self.ng_active:
                self.ng_active = False

            # 9. Update buffer frame JPEG terkompresi
            self._update_encoded_frame(frame)

            # Cap frame rate ~30 FPS & ukur FPS rolling
            elapsed = time.time() - t_start
            sleep_time = max(0.005, (1.0 / 30.0) - elapsed)
            time.sleep(sleep_time)
            
            total_loop_time = time.time() - t_start
            if total_loop_time > 0:
                instant_fps = 1.0 / total_loop_time
                self.current_fps = round(self.current_fps * 0.7 + instant_fps * 0.3, 1) if self.current_fps > 0 else round(instant_fps, 1)

    def _update_encoded_frame(self, frame):
        try:
            # Encode frame ke format JPEG dengan kualitas optimal
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            with self.frame_lock:
                self.latest_frame_bytes = buffer.tobytes()
                self.latest_frame_raw = frame
        except Exception as e:
            print(f"[STREAM ENCODE WARN] Error encoding JPEG frame: {e}")

    def get_latest_jpeg(self) -> bytes:
        with self.frame_lock:
            return self.latest_frame_bytes

def cleanup_old_ng_records(directory: str = "ng_records", days: int = 30):
    """Menghapus otomatis foto bukti cacat NG yang lebih tua dari batas retensi (default: 30 hari)."""
    try:
        if not os.path.exists(directory):
            return
        now = time.time()
        cutoff = now - (days * 86400)
        deleted_count = 0
        for fname in os.listdir(directory):
            fpath = os.path.join(directory, fname)
            if os.path.isfile(fpath) and os.path.getmtime(fpath) < cutoff:
                try:
                    os.remove(fpath)
                    deleted_count += 1
                except Exception:
                    pass
        if deleted_count > 0:
            print(f"[STORAGE CLEANUP] Berhasil membersihkan {deleted_count} file foto NG lama (> {days} hari).")
    except Exception as e:
        print(f"[STORAGE CLEANUP WARN] Gagal auto-cleanup foto NG: {e}")

stream_worker = CameraStreamWorker()

