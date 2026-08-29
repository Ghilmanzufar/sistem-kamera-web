# 📡 Dokumentasi Spesifikasi API Integrasi SISON ↔ Sistem Kamera AI

> **Versi Dokumen:** 2.0.0  
> **Terakhir Diperbarui:** 29 Agustus 2026  
> **Target Audiens:** Tim Pengembang SISON (MES Backend Team), DevOps, & System Integrator  
> **Protokol:** REST API / HTTP Webhook (JSON)  

---

## 📑 Daftar Isi
1. [Ringkasan Arsitektur Integrasi](#1-ringkasan-arsitektur-integrasi)
2. [Autentikasi & Keamanan (Bearer Token)](#2-autentikasi--keamanan-bearer-token)
3. [API Inbound: Pemicu Mulai Transaksi (`POST /api/start`)](#3-api-inbound-pemicu-mulai-transaksi-post-apistart)
4. [API Outbound: Webhook Callback Hasil (`POST <CALLBACK_URL>`)](#4-api-outbound-webhook-callback-hasil-post-callback_url)
5. [Toleransi Kegagalan & Resiliensi Jaringan (Zero Data Loss)](#5-toleransi-kegagalan--resiliensi-jaringan-zero-data-loss)
6. [Koleksi Contoh cURL & Postman](#6-koleksi-contoh-curl--postman)
7. [Tabel Kode Respon & Troubleshooting](#7-tabel-kode-respon--troubleshooting)

---

## 1. Ringkasan Arsitektur Integrasi

Sistem Kamera Inspeksi AI beroperasi secara *Decoupled Edge Computing*. Alur komunikasi dua arah antara **Server SISON (MES)** dan **Sistem Kamera**:

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Operator Pabrik
    participant SISON as Server SISON (MES)
    participant Kamera as Sistem Kamera AI (Port 8000)
    participant Model as AI YOLOv8 Engine

    Operator->>SISON: Scan Barcode Part / Input Order
    SISON->>Kamera: POST /api/start (Header: Bearer Token, Body: id_trans, p_no, qty)
    Note over Kamera: Validasi Token & Daftarkan Transaksi
    Kamera-->>SISON: 200 OK (Status: SUCCESS, Sistem Kamera RUNNING)
    
    Kamera->>Model: Aktifkan Pipeline AI & Inspeksi Sisi Part
    Note over Kamera,Model: Operator memposisikan komponen sesuai panduan visual
    
    alt Inspeksi Selesai (Semua Sisi OK)
        Kamera->>SISON: POST <CALLBACK_URL> (id_trans, status: 2 [OK])
        SISON-->>Kamera: 200 OK (Ack Callback)
    else Part NG & Stok Pengganti Habis (Cancel Kanban)
        Kamera->>SISON: POST <CALLBACK_URL> (id_trans, status: 99 [Cancel])
        SISON-->>Kamera: 200 OK (Ack Callback)
    end
```

---

## 2. Autentikasi & Keamanan (Bearer Token)

Semua endpoint inbound yang dipanggil oleh SISON diamankan dengan mekanisme **HTTP Bearer Authorization Header**.

### HTTP Header Format
```http
Authorization: Bearer <SERVICE_TOKEN>
Content-Type: application/json
```

### Prosedur Mendapatkan Service Token:
1. Akses dashboard **Web Admin Kamera** (`http://<IP_KAMERA>:8000/sison-config`).
2. Masuk ke card **Service Token Integrasi SISON** dan klik tombol **Generate Service Token**.
3. Service Token memiliki masa aktif **30 hari**.
4. Salin token tersebut dan simpan di file environment/konfigurasi backend SISON (`SISON_KAMERA_BEARER_TOKEN`).

> ⚠️ **Catatan Penting:** Jika token kedaluwarsa atau tidak disertakan, server kamera akan merespon dengan kode `401 Unauthorized`.

---

## 3. API Inbound: Pemicu Mulai Transaksi (`POST /api/start`)

Endpoint ini dipanggil oleh SISON ketika sebuah part/komponen telah siap di stasiun kerja dan siap untuk diverifikasi visual oleh kamera.

### Spesifikasi Endpoint
- **URL Path**: `/api/start`
- **Full URL**: `http://<IP_SERVER_KAMERA>:8000/api/start`
- **Method**: `POST`
- **Auth**: `Bearer <SERVICE_TOKEN>`
- **Content-Type**: `application/json`

### Skema Data Request Body

```json
{
  "id_trans": "string (wajib)",
  "p_no": "string (wajib)",
  "p_name": "string (opsional, default: '-')",
  "lot": "string (opsional, default: '-')",
  "unique_no": "string (opsional, default: '-')",
  "qty": "integer (opsional, default: 1)"
}
```

### Rincian Parameter Request

| Field | Tipe Data | Wajib? | Default | Deskripsi |
| :--- | :--- | :---: | :---: | :--- |
| `id_trans` | `string` | **YA** | - | Unique Transaction ID dari SISON (misal: `TRX-20260829-001`). |
| `p_no` | `string` | **YA** | - | Kode Part Number yang terdaftar di master model AI (misal: `FR-LH-74232-0K561`). |
| `p_name` | `string` | Tidak | `"-"` | Deskripsi nama part (misal: `DOOR SUB-ASSY, FRONT`). |
| `lot` | `string` | Tidak | `"-"` | Nomor Lot batch produksi (misal: `LOT-2026-A`). |
| `unique_no` | `string` | Tidak | `"-"` | Nomor barcode unik per piece / serial number. |
| `qty` | `integer` | Tidak | `1` | Jumlah target part yang harus diinspeksi. Minimal `1`. |

---

### Contoh Payload Request

```json
{
  "id_trans": "TRX-20260829-001",
  "p_no": "FR-LH-74232-0K561",
  "p_name": "DOOR SUB-ASSY, FRONT",
  "lot": "LOT-2026-A",
  "unique_no": "UNQ-99812",
  "qty": 1
}
```

---

### Contoh Respon API

#### A. Sukses (`200 OK`)
Transaksi berhasil diterima, kamera langsung masuk mode `RUNNING` untuk part yang ditentukan.

```json
{
  "status": "SUCCESS",
  "message": "Transaksi TRX-20260829-001 diterima. Sistem Kamera Inspeksi RUNNING.",
  "id_trans": "TRX-20260829-001",
  "p_no": "FR-LH-74232-0K561",
  "qty": 1,
  "sisi": "F"
}
```

#### B. Parameter Tidak Lengkap (`400 Bad Request`)
```json
{
  "detail": "Field 'id_trans' wajib diisi (Tidak boleh kosong)!"
}
```
atau
```json
{
  "detail": "Field 'p_no' (Part Number) wajib diisi!"
}
```

#### C. Autentikasi Gagal (`401 Unauthorized`)
```json
{
  "detail": "Header Authorization: Bearer <SERVICE_TOKEN> diperlukan! Hubungi Admin untuk mendapatkan Service Token SISON."
}
```
atau
```json
{
  "detail": "Service Token SISON telah kedaluwarsa. Minta Admin untuk menerbitkan Service Token baru."
}
```

---

## 4. API Outbound: Webhook Callback Hasil (`POST <CALLBACK_URL>`)

Setelah operator selesai melakukan inspeksi seluruh sisi part pada kamera, kamera secara otomatis memanggil endpoint webhook milik SISON.

### Spesifikasi Webhook
- **URL Target**: Dikonfigurasi pada menu Web Admin Kamera (`http://<IP_SISON_SERVER>:3000/api/kamera/callback`)
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Timeout**: `2.5 detik` per request

### Skema Data Payload Webhook

```json
{
  "id_trans": "string",
  "status": "integer (0, 1, 2, 99)"
}
```

### Rincian Field Payload

| Field | Tipe Data | Nilai | Deskripsi Status |
| :--- | :--- | :---: | :--- |
| `id_trans` | `string` | Sesuai pemicu | ID Transaksi yang sama dengan pemicu `POST /api/start`. |
| `status` | `integer` | **`0`** | **Standby** — Transaksi belum mulai diproses / sistem menunggu. |
| `status` | `integer` | **`1`** | **Processing** — Transaksi sedang berlangsung / dalam proses inspeksi. |
| `status` | `integer` | **`2`** | **OK (Passed)** — Semua sisi dan komponen part terverifikasi lengkap & lolos threshold AI. |
| `status` | `integer` | **`99`** | **Cancel (Dibatalkan)** — Transaksi Kanban dibatalkan (misal: part NG & stok pengganti habis). |

#### Contoh Payload Webhook Hasil OK (Status 2):
```json
{
  "id_trans": "TRX-20260829-001",
  "status": 2
}
```

#### Contoh Payload Webhook Batalkan Kanban (Status 99):
```json
{
  "id_trans": "TRX-20260829-001",
  "status": 99
}
```

#### Respon yang Diharapkan dari Server SISON:
Server SISON diharapkan membalas dengan status HTTP `200 OK`, `201 Created`, atau `204 No Content`.

---

## 5. Toleransi Kegagalan & Resiliensi Jaringan (Zero Data Loss)

Sistem Kamera dilengkapi sistem proteksi jaringan industri:

1. **Automatic Retry 3x**:
   - Jika saat callback jaringan SISON mengalami *micro-disconnection* atau latency tinggi (>2.5s), kamera akan melakukan percobaan ulang otomatis hingga **3 kali** (interval jeda 1.0s).
2. **Offline Buffer Engine (SQLite `offline_buffer.db`)**:
   - Jika setelah 3x percobaan server SISON masih tidak merespon (misal: server SISON restart / down), status callback disimpan ke antrean offline lokal.
   - Background sync worker pada kamera akan otomatis mengirimkan ulang data saat koneksi ke SISON kembali normal (*Self-Healing*).

---

## 6. Koleksi Contoh cURL & Postman

### A. cURL Request (`POST /api/start`)
```bash
curl --location --request POST 'http://192.168.1.100:8000/api/start' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id_trans": "TRX-20260829-001",
    "p_no": "FR-LH-74232-0K561",
    "p_name": "DOOR SUB-ASSY, FRONT",
    "lot": "LOT-2026-A",
    "unique_no": "UNQ-99812",
    "qty": 1
}'
```

### B. Format Raw JSON untuk Postman
- **Method**: `POST`
- **URL**: `http://{{KAMERA_IP}}:8000/api/start`
- **Auth Tab**: Type: `Bearer Token`, masukkan Token dari Web Admin.
- **Body Tab**: Type `raw` &rarr; `JSON`:
```json
{
  "id_trans": "TRX-20260829-001",
  "p_no": "FR-LH-74232-0K561",
  "p_name": "DOOR SUB-ASSY, FRONT",
  "lot": "LOT-2026-A",
  "unique_no": "UNQ-99812",
  "qty": 1
}
```

---

## 7. Tabel Kode Respon & Troubleshooting

| HTTP Status | Penyebab | Solusi Tim SISON / Integrator |
| :---: | :--- | :--- |
| `200 OK` | Transaksi diterima dan mesin kamera aktif `RUNNING`. | Transaksi sukses dimulai. Pantau callback hasil. |
| `400 Bad Request` | `id_trans` atau `p_no` kosong/tidak dikirim. | Pastikan JSON body menyertakan field `id_trans` dan `p_no`. |
| `401 Unauthorized` | Header Authorization hilang, salah, atau token kedaluwarsa (>30 hari). | Generate ulang Service Token di menu Web Admin `/sison-config` dan pasang di backend SISON. |
| `422 Unprocessable Entity` | Format tipe data tidak valid (misal: `qty` diisi string huruf). | Sesuaikan tipe data sesuai tabel spesifikasi di atas. |
| `500 Internal Server Error` | Database lokal kamera tidak dapat diakses atau error internal. | Periksa log backend sistem kamera atau hubungi Admin stasiun kamera. |

---

*Dokumentasi ini dibuat untuk mempermudah integrasi lintas tim. Untuk pertanyaan teknis lebih lanjut, silakan hubungi Administrator Sistem Kamera Inspeksi.*
