import React, { useState } from 'react';
import {
  Settings, Radio, RefreshCw, CheckCircle, AlertCircle,
  Eye, EyeOff, Check, Copy, Save, KeyRound, ShieldCheck,
  Clock, AlertTriangle, Zap
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
  serviceTokenInfo,
  setServiceTokenInfo,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/api/admin/sison-generate-token');
      if (res.data?.token) {
        setServiceTokenInfo({
          token: res.data.token,
          expires_at: res.data.expires_at,
          days_left: res.data.days_valid,
          is_expired: false,
          is_expiring_soon: false,
        });
        setShowToken(true);
        toast.success(`Service Token SISON berhasil diterbitkan — berlaku ${res.data.days_valid} hari!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Gagal menerbitkan token';
      toast.error(`Gagal Generate Service Token: ${errMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (!serviceTokenInfo?.token) return;
    navigator.clipboard.writeText(serviceTokenInfo.token);
    setCopiedToken(true);
    toast.success('Service Token berhasil disalin!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyHeader = () => {
    if (!serviceTokenInfo?.token) return;
    navigator.clipboard.writeText(`Bearer ${serviceTokenInfo.token}`);
    toast.success('Header Authorization disalin!');
  };

  const expiresAtLocal = serviceTokenInfo?.expires_at
    ? new Date(serviceTokenInfo.expires_at).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
      })
    : null;

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
              URL tujuan pengiriman otomatis status hasil inspeksi (OK / NG) ke server SISON
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Callback Webhook URL
              </label>
              <button
                type="button"
                onClick={onTestPing}
                disabled={testingPing || !callbackUrl}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                {testingPing ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Menguji...</span></>
                ) : (
                  <><Radio className="w-3.5 h-3.5" /><span>🧪 Uji Koneksi</span></>
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

            {pingResult && (
              <div className={`mt-2.5 p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                pingResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}>
                {pingResult.success
                  ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div className="space-y-0.5">
                  <span className="font-bold">
                    {pingResult.success
                      ? `✅ SISON Terhubung (HTTP ${pingResult.status_code} | ${pingResult.latency_ms}ms)`
                      : `❌ Gagal (${pingResult.error})`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || saving}
            className="flex items-center gap-2 py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Callback URL'}
          </button>
        </form>
      </div>

      {/* 2. Card Service Token SISON */}
      <div className="glass-card p-6 sm:p-8 border border-purple-500/20 rounded-3xl shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Service Token Integrasi SISON
              </h2>
              <p className="text-xs text-slate-400">
                Token permanen untuk sistem SISON — berlaku <strong className="text-purple-300">30 hari</strong>, tidak perlu login ulang
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Machine-to-Machine
          </span>
        </div>

        {/* Info cara kerja */}
        <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl text-xs text-slate-300 space-y-1 leading-relaxed">
          <p className="font-semibold text-blue-300">📋 Cara Penggunaan:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
            <li>Generate Service Token di bawah ini (cukup sekali).</li>
            <li>Salin token — berikan ke tim developer SISON.</li>
            <li>Tim SISON pasang token di konfigurasi server mereka.</li>
            <li>Operator bekerja normal di SISON — sistem kamera terhubung otomatis.</li>
          </ol>
        </div>

        {/* Existing Token Display */}
        {serviceTokenInfo ? (
          <div className="space-y-3">
            {/* Status Badge */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {serviceTokenInfo.is_expired ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> Token Kedaluwarsa
                </span>
              ) : serviceTokenInfo.is_expiring_soon ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Segera Kedaluwarsa
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Token Aktif
                </span>
              )}
              {expiresAtLocal && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Berlaku hingga: <strong className="text-amber-300 ml-1">{expiresAtLocal}</strong>
                  <span className="text-slate-500 ml-1">({serviceTokenInfo.days_left} hari tersisa)</span>
                </span>
              )}
            </div>

            {/* Token Value */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Service Token:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showToken ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 text-purple-300 hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="font-semibold">{copiedToken ? 'Tersalin!' : 'Salin Token'}</span>
                  </button>
                </div>
              </div>
              <div
                className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed cursor-pointer overflow-x-auto whitespace-nowrap scrollbar-thin"
                onClick={handleCopyToken}
                title="Klik untuk menyalin token"
              >
                {showToken
                  ? serviceTokenInfo.token
                  : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </div>
            </div>

            {/* Copy Header */}
            <button
              type="button"
              onClick={handleCopyHeader}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Salin sebagai header HTTP: <code className="text-amber-300 ml-1">Authorization: Bearer ...</code>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-black/20 border border-dashed border-white/10 rounded-2xl text-center text-xs text-slate-400 space-y-1">
            <p>Belum ada Service Token aktif.</p>
            <p>Klik tombol di bawah untuk menerbitkan Service Token baru.</p>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-1 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            {serviceTokenInfo && !serviceTokenInfo.is_expired
              ? '⚠️ Generate token baru akan menggantikan & menonaktifkan token lama.'
              : 'Token baru berlaku 30 hari sejak diterbitkan.'}
          </p>
          <button
            type="button"
            onClick={handleGenerateToken}
            disabled={isGenerating}
            className="flex items-center gap-2 py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition-all text-xs disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /><span>Menerbitkan...</span></>
            ) : (
              <><Zap className="w-4 h-4" /><span>{serviceTokenInfo ? 'Generate Token Baru' : 'Generate Service Token'}</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
