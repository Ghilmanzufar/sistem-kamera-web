"""
🚀 Sistem Kamera Inspeksi AI & Quality Control
Entry point aplikasi Web FastAPI & Live Inspection Kiosk.

Seluruh modul terorganisasi secara clean & modular:
- core/         : Engine inferensi YOLOv8, State, Rules, Camera capture, & Stream Worker
- database/     : Koneksi DB, Model ORM, Seeder, dan Migrasi
- api/          : FastAPI server, Auth, SSE Telemetry, REST API, & Video Stream
- integrations/ : Webhook SISON dan SQLite Offline Buffer
- web_admin/    : Web Application React/Vite (Operator Kiosk & Admin Dashboard)
"""
import sys
import os
import time
import logging
import warnings
import threading
import webbrowser
from dotenv import load_dotenv
import uvicorn

# 1. Load Environment Configuration
load_dotenv()

# 2. Mute verbose OpenCV & Ultralytics terminal logging
os.environ["OPENCV_LOG_LEVEL"] = "FATAL"
os.environ["OPENCV_VIDEOIO_DEBUG"] = "0"
os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"
warnings.filterwarnings("ignore", category=DeprecationWarning)
logging.getLogger('ultralytics').setLevel(logging.WARNING)
logging.getLogger().setLevel(logging.INFO)

import cv2
if hasattr(cv2, 'setLogLevel'):
    cv2.setLogLevel(0)

from api.server import app_fastapi

def open_browser_delayed(url: str = "http://localhost:8000/", delay: float = 1.5):
    """Otomatis membuka browser web default ke aplikasi inspeksi."""
    def _open():
        time.sleep(delay)
        try:
            print(f"[LAUNCHER] 🌐 Membuka browser ke {url}...")
            webbrowser.open(url)
        except Exception as e:
            print(f"[LAUNCHER WARN] Gagal membuka browser otomatis: {e}")
    threading.Thread(target=_open, daemon=True).start()

def main():
    """Jalankan Web Server FastAPI & Kamera Stream."""
    host = os.getenv("SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("SERVER_PORT", "8000"))
    
    print("=" * 65)
    print("   🚀 SISTEM KAMERA INSPEKSI (WEB EDITION)")
    print(f"   🌐 Web Application URL : http://localhost:{port}/")
    print("=" * 65)

    # Otomatis buka browser setelah server menyala
    open_browser_delayed(f"http://localhost:{port}/", delay=1.5)

    # Jalankan Uvicorn ASGI Server
    uvicorn.run(app_fastapi, host=host, port=port, log_level="info", access_log=False)

if __name__ == '__main__':
    main()
