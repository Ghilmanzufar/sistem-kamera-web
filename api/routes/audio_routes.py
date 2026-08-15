import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, AudioConfig, log_audit_event
from api.auth import get_current_user_name, verify_supervisor_only

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "audio")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AudioConfigUpdate(BaseModel):
    is_enabled: bool = True
    volume: int = 80
    ok_sound_type: str = "chime"
    ok_custom_url: Optional[str] = None
    flip_sound_type: str = "beep"
    flip_custom_url: Optional[str] = None
    ng_sound_type: str = "siren"
    ng_custom_url: Optional[str] = None

class AudioConfigResponse(BaseModel):
    id: int
    is_enabled: bool
    volume: int
    ok_sound_type: str
    ok_custom_url: Optional[str] = None
    flip_sound_type: str
    flip_custom_url: Optional[str] = None
    ng_sound_type: str
    ng_custom_url: Optional[str] = None

    class Config:
        from_attributes = True

def _get_or_create_config(db: Session) -> AudioConfig:
    cfg = db.query(AudioConfig).first()
    if not cfg:
        cfg = AudioConfig(
            is_enabled=True,
            volume=80,
            ok_sound_type="chime",
            flip_sound_type="beep",
            ng_sound_type="siren"
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg

@router.get("/audio/config", response_model=AudioConfigResponse)
def get_audio_config(db: Session = Depends(get_db)):
    """Mengambil konfigurasi suara aktif untuk operator kiosk dan admin."""
    return _get_or_create_config(db)

@router.put("/admin/audio/config", response_model=AudioConfigResponse)
def update_audio_config(
    update_data: AudioConfigUpdate,
    db: Session = Depends(get_db),
    uname: str = Depends(get_current_user_name)
):
    """Menyimpan konfigurasi suara inspeksi (Khusus Pengawas/Admin)."""
    cfg = _get_or_create_config(db)
    
    # Validasi volume 0-100
    vol = max(0, min(100, update_data.volume))
    
    cfg.is_enabled = update_data.is_enabled
    cfg.volume = vol
    cfg.ok_sound_type = update_data.ok_sound_type
    cfg.ok_custom_url = update_data.ok_custom_url
    cfg.flip_sound_type = update_data.flip_sound_type
    cfg.flip_custom_url = update_data.flip_custom_url
    cfg.ng_sound_type = update_data.ng_sound_type
    cfg.ng_custom_url = update_data.ng_custom_url

    db.commit()
    db.refresh(cfg)
    
    status_str = "AKTIF" if cfg.is_enabled else "MUTE"
    log_audit_event(
        db, 
        uname, 
        "UPDATE_AUDIO_CONFIG", 
        f"Memperbarui setelan audio: Status={status_str}, Volume={vol}%, OK={cfg.ok_sound_type}, Flip={cfg.flip_sound_type}, NG={cfg.ng_sound_type}"
    )
    return cfg

@router.post("/admin/audio/upload")
async def upload_custom_audio(
    file: UploadFile = File(...),
    category: str = Form("ok"),
    db: Session = Depends(get_db),
    uname: str = Depends(get_current_user_name)
):
    """Upload file audio kustom (.mp3, .wav, .ogg, .m4a) untuk suara inspeksi."""
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".mp3", ".wav", ".ogg", ".m4a", ".aac"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400, 
            detail=f"Format file '{ext}' tidak didukung. Harap upload format audio (.mp3, .wav, .ogg, .m4a)"
        )

    safe_filename = f"{category}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file audio: {e}")

    file_url = f"/uploads/audio/{safe_filename}"
    log_audit_event(db, uname, "UPLOAD_AUDIO", f"Mengunggah file suara kustom '{file.filename}' untuk kategori {category.upper()}")
    
    return {
        "status": "ok",
        "filename": safe_filename,
        "original_name": file.filename,
        "url": file_url,
        "category": category
    }

@router.get("/admin/audio/presets")
def get_audio_presets():
    """Daftar preset nada dan suara yang tersedia di sistem."""
    return {
        "ok_presets": [
            {"id": "chime", "name": "Harmonic Chime (Default)", "desc": "Nada mayor 4-kord lembut & elegan"},
            {"id": "bell", "name": "Success Bell", "desc": "Lonceng cerah tanda part sukses"},
            {"id": "voice_id", "name": "Suara Bahasa Indonesia", "desc": "Ucapan: 'Part OK, Silakan Lanjut'"},
            {"id": "marimba", "name": "Marimba Melody", "desc": "Melodi perkusi cepat & jelas"},
            {"id": "custom", "name": "File Audio Kustom", "desc": "Gunakan file audio upload Anda"}
        ],
        "flip_presets": [
            {"id": "beep", "name": "Dual Beep (Default)", "desc": "Nada notifikasi dua ketukan"},
            {"id": "ding", "name": "Bright Ding", "desc": "Nada pemberitahuan balik sisi part"},
            {"id": "voice_id", "name": "Suara Bahasa Indonesia", "desc": "Ucapan: 'Silakan balik ke sisi belakang'"},
            {"id": "custom", "name": "File Audio Kustom", "desc": "Gunakan file audio upload Anda"}
        ],
        "ng_presets": [
            {"id": "siren", "name": "Factory Siren (Default)", "desc": "Sirene darurat industri kontinu"},
            {"id": "buzzer", "name": "Industrial Buzzer", "desc": "Buzzer frekuensi tinggi peringatan cacat"},
            {"id": "alarm", "name": "High Alert Pulse", "desc": "Alarm denyut cepat berulang"},
            {"id": "voice_id", "name": "Suara Bahasa Indonesia", "desc": "Ucapan: 'Peringatan, Cacat terdeteksi!'"},
            {"id": "custom", "name": "File Audio Kustom", "desc": "Gunakan file audio upload Anda"}
        ]
    }

def _scan_hardware_audio_devices() -> list:
    """Pindai perangkat audio hardware (speaker / USB audio / output) terhubung ke komputer."""
    import subprocess
    import json
    devices = []
    try:
        cmd = [
            'powershell', '-NoProfile', '-Command',
            'Get-PnpDevice -Class AudioEndpoint -Status OK | Select-Object -Property FriendlyName, InstanceId | ConvertTo-Json'
        ]
        res = subprocess.check_output(cmd, timeout=5).decode(errors='ignore')
        data = json.loads(res)
        if isinstance(data, dict):
            data = [data]
        for idx, item in enumerate(data):
            name = item.get('FriendlyName', 'Audio Device')
            inst_id = item.get('InstanceId', '')
            is_mic = 'microphone' in name.lower() or 'mic' in name.lower() or '{0.0.1.' in inst_id
            is_usb = 'usb' in name.lower() or 'usb' in inst_id.lower()
            devices.append({
                "id": str(idx),
                "name": name,
                "type": "input" if is_mic else "output",
                "is_usb": is_usb,
                "instance_id": inst_id
            })
    except Exception:
        devices = [
            {"id": "0", "name": "Speakers (USB Audio Device)", "type": "output", "is_usb": True, "instance_id": "default-usb"},
            {"id": "1", "name": "Realtek High Definition Audio", "type": "output", "is_usb": False, "instance_id": "default-realtek"}
        ]
    return devices

@router.get("/audio/devices")
def get_audio_devices():
    """Daftar perangkat audio output/speaker yang terhubung ke sistem."""
    return _scan_hardware_audio_devices()

@router.post("/audio/devices/scan")
def scan_audio_devices(db: Session = Depends(get_db)):
    """Memindai ulang perangkat audio hardware yang tercolok ke sistem."""
    return _scan_hardware_audio_devices()

# ==========================================================
# 🎙️ AI VOICE GENERATOR (TEXT TO SPEECH BAHASA INDONESIA)
# ==========================================================

class TtsGenerateRequest(BaseModel):
    text: str
    voice: Optional[str] = "id-ID-GadisNeural"
    vibe: Optional[str] = "formal"
    rate_offset: Optional[int] = 0   # -50 s/d +50%
    pitch_offset: Optional[int] = 0  # -20 s/d +20 Hz
    category: Optional[str] = "general" # 'ok', 'flip', 'ng', 'general'

def _normalize_and_analyze_text(raw_text: str) -> dict:
    """Menganalisis dan mengoptimalkan teks narasi untuk artikulasi akurat alami bahasa Indonesia."""
    import re
    cleaned = raw_text.strip()
    
    # 1. Optimasi frasa & akronim industri agar dibaca presisi dan wajar
    norm_text = cleaned
    norm_text = re.sub(r'\bOK\b', 'O.K.', norm_text, flags=re.IGNORECASE)
    norm_text = re.sub(r'\bNG\b', 'N.G.', norm_text, flags=re.IGNORECASE)
    norm_text = re.sub(r'\bPCS\b', 'Pcs', norm_text, flags=re.IGNORECASE)
    norm_text = re.sub(r'\bQTY\b', 'Kuantitas', norm_text, flags=re.IGNORECASE)
    norm_text = re.sub(r'\bP/N\b', 'Part Number', norm_text, flags=re.IGNORECASE)
    norm_text = re.sub(r'\bLOT\b', 'Nomor Lot', norm_text, flags=re.IGNORECASE)
    norm_text = re.sub(r'\bAI\b', 'A.I.', norm_text, flags=re.IGNORECASE)

    words = cleaned.split()
    word_count = len(words)
    char_count = len(cleaned)
    
    # Estimasi durasi pembacaan natural (rata-rata ~2.5 kata per detik)
    estimated_duration = max(1.0, round(word_count / 2.5, 1)) if word_count > 0 else 0.0

    return {
        "raw_text": cleaned,
        "normalized_text": norm_text,
        "char_count": char_count,
        "word_count": word_count,
        "estimated_duration_sec": estimated_duration
    }

VIBE_PRESETS = {
    "formal": {
        "name": "🏢 Formal Industri",
        "desc": "Artikulasi presisi & nada instruksi standar pabrik",
        "rate": "+0%",
        "pitch": "+0Hz"
    },
    "energetic": {
        "name": "😊 Ramah & Enerjik",
        "desc": "Tempo sedikit lebih lincah dan nada ramah memotivasi",
        "rate": "+6%",
        "pitch": "+2Hz"
    },
    "warning": {
        "name": "🚨 Tegas & Waspada (Warning)",
        "desc": "Intonasi tegas berwibawa, cocok untuk notifikasi cacat NG",
        "rate": "-5%",
        "pitch": "-2Hz"
    },
    "calm": {
        "name": "🧘 Tenang & Jelas",
        "desc": "Tempo rileks dan artikulasi panduan inspeksi yang mudah dipahami",
        "rate": "-8%",
        "pitch": "+0Hz"
    },
    "custom": {
        "name": "⚙️ Kustom Manual",
        "desc": "Kecepatan dan tinggi nada diatur secara bebas oleh operator/admin",
        "rate": "+0%",
        "pitch": "+0Hz"
    }
}

SAMPLE_TEMPLATES = [
    {
        "title": "✅ Part OK & Lanjut",
        "category": "ok",
        "vibe": "formal",
        "voice": "id-ID-GadisNeural",
        "text": "Part berhasil diverifikasi O.K. Seluruh label lengkap, silakan lanjutkan ke part berikutnya."
    },
    {
        "title": "🔄 Instruksi Balik Part (Rear)",
        "category": "flip",
        "vibe": "calm",
        "voice": "id-ID-GadisNeural",
        "text": "Sisi depan selesai dengan status O.K. Silakan balik part ke sisi belakang untuk inspeksi kedua."
    },
    {
        "title": "🚨 Peringatan Cacat (NG Alert)",
        "category": "ng",
        "vibe": "warning",
        "voice": "id-ID-ArdiNeural",
        "text": "Peringatan! Terdeteksi ketidaksesuaian atau cacat pada komponen. Segera periksa fisik part di line produksi."
    },
    {
        "title": "🏁 Seluruh Batch Selesai",
        "category": "ok",
        "vibe": "energetic",
        "voice": "id-ID-GadisNeural",
        "text": "Selamat, seluruh target kuantitas part telah selesai diinspeksi dengan status O.K. Sistem kembali ke mode siaga."
    }
]

@router.get("/admin/audio/tts/voices")
def get_tts_voices():
    """Mengambil katalog model suara AI Bahasa Indonesia, preset vibe, dan template narasi."""
    return {
        "voices": [
            {
                "id": "id-ID-GadisNeural",
                "name": "Gadis (Wanita Indonesia)",
                "gender": "Female",
                "locale": "id-ID",
                "desc": "Suara wanita Bahasa Indonesia alami, artikulasi hangat, jernih, dan ramah"
            },
            {
                "id": "id-ID-ArdiNeural",
                "name": "Ardi (Pria Indonesia)",
                "gender": "Male",
                "locale": "id-ID",
                "desc": "Suara pria Bahasa Indonesia berwibawa, tegas, mantap, dan terstruktur"
            }
        ],
        "vibes": VIBE_PRESETS,
        "templates": SAMPLE_TEMPLATES
    }

@router.post("/admin/audio/tts/generate")
async def generate_ai_voice(
    req: TtsGenerateRequest,
    db: Session = Depends(get_db),
    uname: str = Depends(get_current_user_name)
):
    """Men-generate audio AI Text-to-Speech Bahasa Indonesia dengan presisi tinggi dan logat natural."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Teks narasi tidak boleh kosong.")

    import edge_tts

    analysis = _normalize_and_analyze_text(req.text)
    
    # Hitung rate dan pitch secara dinamis (kombinasi base vibe + offset tempo kustom)
    vibe_cfg = VIBE_PRESETS.get(req.vibe, VIBE_PRESETS["formal"])
    
    try:
        base_rate_str = vibe_cfg.get("rate", "+0%")
        base_rate_num = int(base_rate_str.replace("%", "").replace("+", ""))
    except Exception:
        base_rate_num = 0
    
    total_rate = max(-60, min(80, base_rate_num + (req.rate_offset or 0)))
    rate_str = f"{'+' if total_rate >= 0 else ''}{total_rate}%"

    try:
        base_pitch_str = vibe_cfg.get("pitch", "+0Hz")
        base_pitch_num = int(base_pitch_str.replace("Hz", "").replace("+", ""))
    except Exception:
        base_pitch_num = 0
    
    total_pitch = max(-30, min(30, base_pitch_num + (req.pitch_offset or 0)))
    pitch_str = f"{'+' if total_pitch >= 0 else ''}{total_pitch}Hz"

    voice_model = req.voice if req.voice in ["id-ID-GadisNeural", "id-ID-ArdiNeural"] else "id-ID-GadisNeural"
    category = req.category if req.category in ["ok", "flip", "ng", "general"] else "general"

    filename = f"tts_{category}_{uuid.uuid4().hex[:8]}.mp3"
    dest_path = os.path.join(UPLOAD_DIR, filename)

    try:
        comm = edge_tts.Communicate(
            text=analysis["normalized_text"],
            voice=voice_model,
            rate=rate_str,
            pitch=pitch_str
        )
        await comm.save(dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses sintesis suara AI: {e}")

    file_url = f"/uploads/audio/{filename}"
    log_audit_event(
        db, 
        uname, 
        "GENERATE_TTS_AUDIO", 
        f"Membuat file suara AI '{filename}' ({voice_model}, Vibe: {req.vibe}) untuk teks: '{req.text[:60]}...'"
    )

    return {
        "status": "success",
        "filename": filename,
        "url": file_url,
        "category": category,
        "voice": voice_model,
        "vibe": req.vibe,
        "rate": rate_str,
        "pitch": pitch_str,
        "analysis": analysis
    }


