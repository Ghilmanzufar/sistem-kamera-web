# 🎥 Sistem Kamera Inspeksi AI — Web Edition

Sistem inspeksi kualitas berbasis AI (YOLOv8) yang terintegrasi dengan SISON (Sistem Informasi Operasional Nasional). Dijalankan sebagai **web application** dengan backend FastAPI dan frontend React/Vite.

---

## 🚀 Cara Menjalankan

### 1. Persiapan Environment

```bash
# Salin file konfigurasi lalu isi sesuai environment Anda
cp .env.example .env
```

Isi variabel penting di `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nama_db
SECRET_KEY=isi-dengan-random-string-panjang
SISON_CALLBACK_URL=http://url-sison-anda/callback
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

### 2. Install Dependencies Python

```bash
pip install -r requirements.txt
```

### 3. Build Frontend (sekali saja, atau setelah ada perubahan UI)

```bash
cd web_admin
npm install
npm run build
cd ..
```

### 4. Jalankan Server

```bash
python main.py
```

Browser akan terbuka otomatis ke `http://localhost:8000/`. Jika tidak, buka manual.

---

## 📁 Struktur Folder

```
sistem-kamera-web/
│
├── main.py                 # Entry point — jalankan ini untuk start server
├── requirements.txt        # Python dependencies
├── .env.example            # Template konfigurasi environment
│
├── core/                   # Engine inti sistem
│   ├── state.py            # Global state inspeksi (singleton, thread-safe)
│   ├── detector.py         # Pipeline inferensi YOLOv8 & logging ke DB
│   ├── stream.py           # Camera stream worker (background thread)
│   ├── rules.py            # Logika aturan inspeksi per part/sisi
│   └── camera.py           # Utilitas kamera (list device, test koneksi)
│
├── database/               # Lapisan data
│   ├── connection.py       # Koneksi PostgreSQL via SQLAlchemy
│   ├── models.py           # ORM model (InspectionLog, Transaction, User, dll)
│   ├── migrations.py       # Auto-migrasi schema saat startup
│   ├── seeder.py           # Data awal (admin default, part rules contoh)
│   └── security.py         # Hash & verifikasi password
│
├── api/                    # Backend FastAPI
│   ├── server.py           # Inisialisasi app FastAPI, CORS, static files
│   ├── auth.py             # JWT auth, token generation & validation
│   └── routes/             # REST API endpoints
│       ├── sison_inbound.py        # POST /api/sison/start — terima trigger dari SISON
│       ├── operator_routes.py      # Operator kiosk: state, SSE, manual pass/reject
│       ├── auth_routes.py          # Login, logout, health check
│       ├── inspection_routes.py    # Riwayat & data inspeksi
│       ├── camera_routes.py        # Kontrol & status kamera
│       ├── rule_routes.py          # CRUD aturan inspeksi part
│       ├── model_routes.py         # Upload & manajemen model YOLOv8
│       ├── user_routes.py          # Manajemen user & role
│       ├── system_routes.py        # Status sistem & monitoring
│       └── sison_config_routes.py  # Konfigurasi koneksi SISON
│
├── integrations/           # Integrasi eksternal
│   ├── sison_client.py     # Kirim callback hasil inspeksi ke SISON
│   └── offline_sync.py     # SQLite buffer saat PostgreSQL tidak tersedia
│
├── web_admin/              # Frontend React/Vite
│   ├── src/
│   │   ├── pages/          # Halaman utama (Dashboard, History, Operator, dll)
│   │   ├── components/     # Komponen reusable (Sidebar, Navbar, Modal, dll)
│   │   ├── api/            # Axios instance & helper pemanggilan API
│   │   └── utils/          # Helper & utilitas frontend
│   └── dist/               # Build hasil produksi (di-serve oleh FastAPI)
│
├── weights/                # Taruh file model YOLOv8 (.pt) di sini
│                           # Contoh: weights/model_part_A.pt
│
└── ng_records/             # Foto otomatis disimpan di sini saat part NG terdeteksi
```

---

## 👥 Role Pengguna

| Role | Akses |
|---|---|
| **Operator** | Layar inspeksi kiosk (fullscreen), melihat status real-time |
| **Supervisor** | Override NG, approval manual, lihat riwayat |
| **Admin** | Semua akses termasuk manajemen user, model, dan konfigurasi |

---

## 🔗 Alur Kerja Singkat

```
SISON → POST /api/sison/start
          ↓ (set state: part, qty, lot)
     Operator Kiosk
          ↓ (kamera aktif, inferensi YOLOv8 per frame)
     Deteksi OK / NG
          ↓
     Log ke PostgreSQL (atau SQLite buffer jika offline)
          ↓
     Callback hasil ke SISON
```

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, OpenCV, Ultralytics YOLOv8
- **Frontend**: React 18, Vite, TailwindCSS, Recharts
- **Database**: PostgreSQL (primary), SQLite (offline buffer)
- **Integrasi**: REST Webhook ke/dari SISON
