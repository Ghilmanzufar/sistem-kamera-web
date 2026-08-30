@echo off
title Sistem Kamera Inspeksi AI
echo ========================================================
echo   MENJALANKAN SISTEM KAMERA INSPEKSI AI
echo ========================================================
echo.

:: Cek apakah venv sudah ada
if not exist "venv" (
    echo [PERINGATAN] Virtual Environment 'venv' belum ditemukan!
    echo Menjalankan setup otomatis terlebih dahulu...
    echo.
    call setup.bat
)

echo Mengaktifkan Virtual Environment...
call .\venv\Scripts\activate.bat

echo.
echo Meluncurkan Server Inspeksi (FastAPI + AI Engine)...
echo Web UI akan terbuka otomatis di browser (http://localhost:8000).
echo.
python main.py

pause
