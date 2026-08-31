import os
import re
import subprocess
from .connection import SessionLocal
from .models import User, CameraConfig, AudioConfig, PartRule, GlobalSettings
from .security import hash_password

def seed_default_audio_config():
    """Seeding konfigurasi audio default jika belum ada di database."""
    try:
        with SessionLocal() as db:
            cfg = db.query(AudioConfig).first()
            if not cfg:
                default_audio = AudioConfig(
                    is_enabled=True,
                    volume=80,
                    ok_custom_url="/uploads/audio/default_ok.mp3",
                    flip_custom_url="/uploads/audio/default_flip.mp3",
                    ng_custom_url="/uploads/audio/default_ng.mp3",
                    finish_custom_url="/uploads/audio/default_finish.mp3",
                    ok_sound_type="custom",
                    flip_sound_type="custom",
                    ng_sound_type="custom",
                    finish_sound_type="custom"
                )
                db.add(default_audio)
                db.commit()
                print("[SYSTEM] Default audio configuration seeded with AI generated voices.")
            else:
                # Update null or empty URLs with default AI audio
                changed = False
                if not cfg.ok_custom_url:
                    cfg.ok_custom_url = "/uploads/audio/default_ok.mp3"
                    changed = True
                if not cfg.flip_custom_url:
                    cfg.flip_custom_url = "/uploads/audio/default_flip.mp3"
                    changed = True
                if not cfg.ng_custom_url:
                    cfg.ng_custom_url = "/uploads/audio/default_ng.mp3"
                    changed = True
                if not cfg.finish_custom_url:
                    cfg.finish_custom_url = "/uploads/audio/default_finish.mp3"
                    changed = True
                if changed:
                    db.commit()
    except Exception as e:
        print(f"[WARN] Auto-seed audio config: {e}")

def seed_default_users():
    """Seeding akun pengawas default jika database kosong."""
    try:
        with SessionLocal() as db:
            # Seed default user pengawas jika database kosong
            if not db.query(User).first():
                default_pengawas = User(
                    username="pengawas",
                    password=hash_password("1234"),
                    role="pengawas",
                    fullname="Default Pengawas",
                    is_active=True
                )
                db.add(default_pengawas)
                db.commit()
                print("[SYSTEM] Default pengawas seeded (username: pengawas, pin: 1234).")
    except Exception as e:
        print(f"[WARN] Gagal seeding default user: {e}")

def auto_seed_camera_hardware():
    """Deteksi otomatis kamera USB yang tercolok saat startup jika DB masih kosong."""
    try:
        with SessionLocal() as db:
            if db.query(CameraConfig).count() == 0:
                pnp_names = []
                try:
                    cmd = ['powershell', '-NoProfile', '-Command', 'Get-PnpDevice -Class Camera, Image -Status OK | Select-Object -ExpandProperty FriendlyName']
                    res = subprocess.check_output(cmd, timeout=5).decode(errors='ignore')
                    pnp_names = [line.strip() for line in res.splitlines() if line.strip()]
                except Exception:
                    pass
                sources = pnp_names if pnp_names else ["USB 2.0 Camera"]
                for idx, cam_name in enumerate(sources):
                    db_cam = CameraConfig(name=cam_name, source=str(idx), is_active=(idx == 0))
                    db.add(db_cam)
                db.commit()
                print(f"[SYSTEM] Auto-detected {len(sources)} hardware camera(s) on startup.")
    except Exception as e:
        print(f"[WARN] Auto-seed camera: {e}")

def auto_seed_part_rules_from_weights():
    """Sinkronisasi otomatis aturan PartRule jika ada berkas model .pt di direktori weights yang belum memiliki rule di database."""
    weights_dir = os.path.join(os.getcwd(), "weights")
    if not os.path.exists(weights_dir):
        return

    try:
        from core.detector import extract_model_labels_dict
    except ImportError:
        return

    try:
        with SessionLocal() as db:
            gs = db.query(GlobalSettings).first()
            if not gs:
                gs = GlobalSettings()
                db.add(gs)
                db.commit()
                db.refresh(gs)

            for filename in os.listdir(weights_dir):
                if filename.endswith(".pt"):
                    p_no = filename[:-3]
                    existing_count = db.query(PartRule).filter(PartRule.p_no == p_no).count()
                    if existing_count == 0:
                        pt_path = os.path.join(weights_dir, filename)
                        raw_dict = extract_model_labels_dict(pt_path)
                        if raw_dict:
                            added_count = 0
                            for _, label in sorted(raw_dict.items(), key=lambda x: int(x[0])):
                                raw_lbl = str(label).strip()
                                first_tok = raw_lbl.split('-')[0].strip().upper() if '-' in raw_lbl else (raw_lbl.split('_')[0].strip().upper() if '_' in raw_lbl else raw_lbl[:1].upper())
                                detected_sisi = first_tok if first_tok in ['F', 'R', 'FRONT', 'REAR'] else (first_tok or "-")

                                # Skip defect / NG labels
                                tokens = [t.lower() for t in re.split(r'[-_\s]+', raw_lbl)]
                                if any(token in {'ng', 'defect', 'cacat', 'reject', 'broken', 'patah', 'scratch', 'dent', 'missing', 'crack', 'miss'} for token in tokens):
                                    continue

                                db.add(PartRule(
                                    p_no=p_no,
                                    sisi=detected_sisi,
                                    nama_komponen=label,
                                    qty=1,
                                    min_confidence=gs.default_min_conf,
                                    avg_confidence=gs.default_avg_conf,
                                    min_coverage=gs.default_min_coverage
                                ))
                                added_count += 1
                            if added_count > 0:
                                db.commit()
                                print(f"[SYSTEM] Auto-seeded {added_count} PartRule(s) for model {p_no} from {filename}.")
    except Exception as e:
        print(f"[WARN] Auto-seed part rules: {e}")

