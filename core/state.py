import threading
import time

class SystemState:
    """Thread-safe singleton state untuk sinkronisasi data antar thread, modul, & stasiun kerja."""
    def __init__(self):
        self.lock = threading.Lock()
        self.status: str = "STANDBY"
        self.id_trans: str = ""
        self.p_no: str = ""
        self.qty: int = 0
        self.target_qty: int = 0
        self.aturan_sisi: list = []
        self.daftar_sisi: list = []
        self.progress_sisi: int = 0
        self.cooldown_until: float = 0.0
        self.inspection_mode: str = "AI"  # "AI" or "MANUAL"
        self.part_ok_popup: bool = False
        self.current_side: str = "F"      # "F" = Front, "R" = Rear
        self.flip_part_popup: bool = False
        self.last_inspection_details: dict = {}
        self.live_metrics: dict = {}
        self.completed_time: float = 0.0
        self.operator_name: str = ""       # Nama operator utama
        self.operator_username: str = ""   # Username operator utama
        self.operator_role: str = ""       # Role operator utama
        self.operator_shift: str = "Shift 1"
        self.operator_login_time: float = 0.0
        
        # Multi-Station & Multi-Operator Session Registry
        self.active_operator_sessions: dict = {}

    def update_operator_heartbeat(self, username: str, fullname: str, role: str, client_ip: str = "127.0.0.1", station_id: str = "STATION-01"):
        """Perbarui sesi aktif operator per pengguna/komputer."""
        with self.lock:
            now = time.time()
            if username not in self.active_operator_sessions:
                login_ts = now
            else:
                login_ts = self.active_operator_sessions[username].get('login_time', now)

            self.active_operator_sessions[username] = {
                "username": username,
                "fullname": fullname or username,
                "role": role or "operator",
                "login_time": login_ts,
                "last_seen": now,
                "client_ip": client_ip,
                "station_id": station_id
            }

            # Set sebagai operator utama jika belum ada
            if not self.operator_name:
                self.operator_name = fullname or username
                self.operator_username = username
                self.operator_role = role
                self.operator_login_time = login_ts

    def remove_operator_session(self, username: str):
        """Hapus operator dari sesi aktif saat logout."""
        with self.lock:
            if username in self.active_operator_sessions:
                del self.active_operator_sessions[username]
            if self.operator_username == username:
                if self.active_operator_sessions:
                    next_user = next(iter(self.active_operator_sessions.values()))
                    self.operator_name = next_user["fullname"]
                    self.operator_username = next_user["username"]
                    self.operator_role = next_user["role"]
                    self.operator_login_time = next_user["login_time"]
                else:
                    self.operator_name = ""
                    self.operator_username = ""
                    self.operator_role = ""
                    self.operator_login_time = 0.0

    def get_all_active_operators(self, timeout_seconds: float = 60.0) -> list:
        """Mengembalikan daftar seluruh operator yang sedang aktif/online."""
        with self.lock:
            now = time.time()
            active_list = []
            for u, data in list(self.active_operator_sessions.items()):
                if now - data.get("last_seen", 0) <= timeout_seconds:
                    active_list.append(data)
            return active_list

    def reset_to_standby(self):
        """Mereset status mesin ke STANDBY untuk menyambut transaksi SISON berikutnya."""
        with self.lock:
            self.status = "STANDBY"
            self.id_trans = ""
            self.p_no = ""
            self.qty = 0
            self.target_qty = 0
            self.aturan_sisi = []
            self.daftar_sisi = []
            self.progress_sisi = 0
            self.current_side = "F"
            self.completed_time = 0.0
            self.inspection_mode = "AI"

state = SystemState()
