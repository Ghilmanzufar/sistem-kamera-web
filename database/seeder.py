import subprocess
from .connection import SessionLocal
from .models import User, CameraConfig, AudioConfig
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
    """Seeding akun pengawas default & migrasi role admin lama."""
    try:
        with SessionLocal() as db:
            # Migrasi user lama ber-role 'admin' menjadi 'pengawas'
            admins = db.query(User).filter(User.role == "admin").all()
            if admins:
                for a in admins:
                    a.role = "pengawas"
                db.commit()
                print(f"[SYSTEM] Auto-migrated {len(admins)} user(s) from 'admin' role to 'pengawas'.")

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
        print(f"[WARN] Gagal seeding/migrasi default user: {e}")

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
