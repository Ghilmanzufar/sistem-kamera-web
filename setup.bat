@echo off
title Setup Sistem Kamera Inspeksi AI
echo ========================================================
echo   INSTALASI DEPENDENSI SISTEM KAMERA INSPEKSI AI
echo ========================================================
echo.

:: 1. Cek ketersediaan Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan di sistem ini!
    echo Pastikan Python 3.10 / 3.11 sudah terpasang dan opsi 'Add Python to PATH' dicentang.
    echo.
    pause
    exit /b 1
)

:: 2. Buat virtual environment
echo [1/3] Menyiapkan Virtual Environment Python (venv)...
if not exist "venv" (
    python -m venv venv
    echo [OK] Virtual Environment berhasil dibuat.
) else (
    echo [INFO] Folder venv sudah ada, melanjutkan...
)

:: 3. Aktivasi dan instalasi dependensi
echo.
echo [2/3] Mengaktifkan venv dan memperbarui pip...
call .\venv\Scripts\activate.bat
python -m pip install --upgrade pip

echo.
echo [3/3] Mengunduh dan memasang dependensi (requirements.txt)...
pip install -r requirements.txt

echo.
echo ========================================================
echo   [BERHASIL] Seluruh dependensi Python telah terpasang!
echo.
echo   Langkah selanjutnya:
echo   1. Pastikan PostgreSQL berjalan dan buat DB: sugity_camera_db
echo   2. Periksa kecocokan password DB di file .env
echo   3. Colokkan kamera USB ke PC
echo   4. Jalankan: start_system.bat
echo ========================================================
echo.
pause
