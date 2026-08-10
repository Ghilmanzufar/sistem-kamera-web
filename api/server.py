import os
import time
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import FileResponse, RedirectResponse
import uvicorn

from .routes import sison_inbound_router, public_router, admin_protected_router
from core import stream_worker
from integrations import start_buffer_sync_worker

def cleanup_old_ng_records(days: int = 30):
    """Otomatis hapus file foto NG yang berumur > 30 hari untuk menghemat ruang harddisk."""
    folder = "ng_records"
    if not os.path.exists(folder):
        return
    now = time.time()
    cutoff = now - (days * 86400)
    deleted_count = 0
    try:
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            if os.path.isfile(file_path) and filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                if os.path.getmtime(file_path) < cutoff:
                    os.remove(file_path)
                    deleted_count += 1
        if deleted_count > 0:
            print(f"[CLEANUP] Otomatis menghapus {deleted_count} foto NG lama (> {days} hari).")
    except Exception as e:
        print(f"[CLEANUP WARN] Gagal menjalankan pembersihan foto NG: {e}")

def start_periodic_cleanup():
    def loop():
        while True:
            cleanup_old_ng_records(days=30)
            time.sleep(86400)  # Cek setiap 24 jam
    t = threading.Thread(target=loop, daemon=True, name="NGCleanupWorker")
    t.start()

class SPAStaticFiles(StaticFiles):
    """Custom StaticFiles yang mengalihkan 404 Not Found ke index.html (SPA Fallback)."""
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as ex:
            if ex.status_code == 404 and self.html:
                index_path = os.path.join(self.directory, "index.html")
                if os.path.exists(index_path):
                    return FileResponse(index_path)
            raise ex

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Mulai workers background
    stream_worker.start()
    start_periodic_cleanup()
    start_buffer_sync_worker()
    print("[SYSTEM] ✅ Seluruh background service inspeksi kamera & SISON aktif!")
    yield
    # Shutdown
    stream_worker.stop()
    print("[SYSTEM] Background stream worker dihentikan.")

def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(title="Sistem Kamera Inspeksi AI", version="2.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
        return response

    # 1. Rute Inbound SISON (/api/start)
    app.include_router(sison_inbound_router, prefix="/api")

    # 2. Rute Publik (/api/video_feed, /api/operator/*, /api/health, /api/admin-login, dll.)
    app.include_router(public_router, prefix="/api")

    # 3. Rute Admin Terproteksi (/api/admin/*)
    app.include_router(admin_protected_router, prefix="/api/admin")

    # 4. Mount Static Files
    os.makedirs("web_admin/dist", exist_ok=True)
    os.makedirs("ng_records", exist_ok=True)
    
    app.mount("/ng_records", StaticFiles(directory="ng_records"), name="ng_records")
    
    # Mount SPA Static Files di Root ('/')
    app.mount("/", SPAStaticFiles(directory="web_admin/dist", html=True), name="spa")

    return app

app_fastapi = create_app()

def run_fastapi(host: str = "0.0.0.0", port: int = 8000):
    """Jalankan uvicorn server."""
    uvicorn.run(app_fastapi, host=host, port=port, log_level="info")
