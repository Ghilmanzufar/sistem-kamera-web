import React from 'react';
import { 
  Settings, Radio, RefreshCw, CheckCircle, AlertCircle, 
  EyeOff, Eye, Check, Copy, Save 
} from 'lucide-react';

export default function SisonSettingsCard({
  callbackUrl,
  setCallbackUrl,
  apiKey,
  setApiKey,
  showApiKey,
  setShowApiKey,
  loading,
  saving,
  testingPing,
  pingResult,
  copiedKey,
  onTestPing,
  onCopyKey,
  onSubmit
}) {
  return (
    <div className="lg:col-span-2 glass-card p-6 sm:p-8 border border-white/10 rounded-3xl shadow-2xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Konfigurasi Webhook & API Key
          </h2>
          <p className="text-xs text-slate-400">
            Pengaturan integrasi pertukaran data dua arah antara SISON dan Sistem Kamera
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Callback Webhook URL (Tujuan Kirim Hasil Inspeksi ke SISON)
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
            placeholder="http://192.168.1.50:8000/api/inspection/result"
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
            URL endpoint di server SISON yang akan menerima kiriman status (OK/NG) saat inspeksi selesai. Dilengkapi <strong>Auto-Retry 3x</strong> otomatis jika terjadi gangguan jaringan sesaat.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            API Security Key / Authorization Bearer Token
          </label>
          <div className="relative flex items-center">
            <input
              type={showApiKey ? "text" : "password"}
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sugity_sison_secret_key"
              className="w-full px-4 py-3 pr-24 bg-black/30 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showApiKey ? "Sembunyikan API Key" : "Lihat API Key"}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onCopyKey}
                className="p-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Salin API Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Token rahasia yang wajib disertakan pada header <code className="text-amber-300 font-mono">Authorization: Bearer &lt;key&gt;</code> oleh sistem SISON.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi Sison'}
          </button>
        </div>
      </form>
    </div>
  );
}
