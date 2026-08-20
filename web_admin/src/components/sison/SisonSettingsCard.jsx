import React, { useState } from 'react';
import { 
  Settings, Radio, RefreshCw, CheckCircle, AlertCircle, 
  EyeOff, Eye, Check, Copy, Save, KeyRound, ShieldCheck, Clock, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function SisonSettingsCard({
  callbackUrl,
  setCallbackUrl,
  loading,
  saving,
  testingPing,
  pingResult,
  onTestPing,
  onSubmit,
  generatedToken,
  setGeneratedToken,
  tokenMetadata,
  setTokenMetadata
}) {
  // Local state for token generator form
  const [genUsername, setGenUsername] = useState('admin');
  const [genPassword, setGenPassword] = useState('');
  const [showGenPassword, setShowGenPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!genUsername.trim() || !genPassword.trim()) {
      toast.error('Masukkan Username dan Password terlebih dahulu!');
      return;
    }

    setIsGenerating(true);
    try {
      // Call authentication endpoint POST /api/login
      const res = await api.post('/api/login', {
        username: genUsername.trim(),
        password: genPassword.trim(),
        shift: 'SISON System'
      });

      if (res.data && res.data.token) {
        setGeneratedToken(res.data.token);
        setTokenMetadata({
          username: res.data.username || genUsername,
          role: res.data.role || 'admin',
          expiresIn: res.data.role === 'operator' ? '8 Jam' : '24 Jam',
          createdAt: new Date().toLocaleTimeString('id-ID')
        });
        toast.success('Bearer Token berhasil diterbitkan!');
      } else {
        toast.error('Gagal mendapatkan token: Format respon tidak sesuai');
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Login kredensial gagal';
      toast.error(`Gagal Generate Token: ${errMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    toast.success('Bearer Token berhasil disalin!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* 1. Card Konfigurasi Webhook Callback */}
      <div className="glass-card p-6 sm:p-8 border border-white/10 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Konfigurasi Webhook Callback SISON
            </h2>
            <p className="text-xs text-slate-400">
              Pengaturan alamat server SISON untuk pengiriman otomatis hasil inspeksi (OK / NG)
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Callback Webhook URL (Tujuan Kirim Status ke SISON)
              </label>
              <button
                type="button"
                onClick={onTestPing}
                disabled={testingPing || !callbackUrl}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                title="Kirim paket ping tes ke server SISON untuk menguji konektivitas"
              >
                {testingPing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" />
                    <span>🧪 Uji Koneksi Callback</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="http://192.168.1.50:3000/api/kamera/callback"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-all"
            />

            {/* Ping Result Feedback Box */}
            {pingResult && (
              <div className={`mt-2.5 p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                pingResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}>
                {pingResult.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div className="space-y-0.5">
                  <span className="font-bold">
                    {pingResult.success 
                      ? `✅ Server SISON Terhubung (HTTP ${pingResult.status_code} | Latensi: ${pingResult.latency_ms} ms)`
                      : `❌ Gagal Terhubung ke SISON (${pingResult.error}) | Latensi: ${pingResult.latency_ms} ms`
                    }
                  </span>
                  <p className="text-[11px] text-slate-300 font-sans">
                    {pingResult.success 
                      ? 'Endpoint Webhook SISON aktif dan siap menerima data hasil inspeksi.'
                      : 'Pastikan server SISON sedang menyala dan alamat IP/Port sudah sesuai.'}
                  </p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-1.5">
              URL endpoint di server SISON yang akan menerima kiriman status (1=OK / 2=NG) saat inspeksi selesai. Dilengkapi <strong>Auto-Retry 3x</strong> otomatis jika terjadi gangguan jaringan.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Callback URL'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Card Generator & Tester Dynamic Bearer Token */}
      <div className="glass-card p-6 sm:p-8 border border-white/10 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Generator & Penguji Bearer Token SISON
              </h2>
              <p className="text-xs text-slate-400">
                Uji kredensial akun SISON dan generate Dynamic Bearer Token untuk otentikasi API
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Dynamic OAuth2 / HMAC
          </span>
        </div>

        <form onSubmit={handleGenerateToken} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Username Akun SISON
              </label>
              <input
                type="text"
                required
                value={genUsername}
                onChange={(e) => setGenUsername(e.target.value)}
                placeholder="sison_service / admin"
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password Akun
              </label>
              <div className="relative flex items-center">
                <input
                  type={showGenPassword ? "text" : "password"}
                  required
                  value={genPassword}
                  onChange={(e) => setGenPassword(e.target.value)}
                  placeholder="Masukkan password akun"
                  className="w-full px-4 py-2.5 pr-10 bg-black/30 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowGenPassword(!showGenPassword)}
                  className="absolute right-2.5 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showGenPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showGenPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              Kredensial diverifikasi langsung terhadap database akun pengawas/admin/sison.
            </p>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition-all text-xs disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menerbitkan Token...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Dapatkan Bearer Token</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Display Area for Generated Token */}
        {generatedToken ? (
          <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-500/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Token Aktif
                </span>
                {tokenMetadata?.role && (
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono text-[11px] flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-purple-300" />
                    {tokenMetadata.role.toUpperCase()}
                  </span>
                )}
              </div>

              {tokenMetadata?.expiresIn && (
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Masa Berlaku: <strong className="text-amber-300">{tokenMetadata.expiresIn}</strong>
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Bearer Token (Siap Digunakan di Header API):</span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white transition-colors cursor-pointer bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Tersalin!' : 'Salin Token'}</span>
                </button>
              </div>

              <div className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 break-all select-all leading-relaxed">
                {generatedToken}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              💡 Token ini otomatis disinkronkan ke perintah <strong>cURL & contoh request</strong> pada dokumentasi di bawah.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-black/20 border border-dashed border-white/10 rounded-2xl text-center text-xs text-slate-400">
            Masukkan kredensial akun di atas lalu klik <strong>"Dapatkan Bearer Token"</strong> untuk melihat dan menguji token otentikasi.
          </div>
        )}
      </div>
    </div>
  );
}
