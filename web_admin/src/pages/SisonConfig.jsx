import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import SisonSettingsCard from '../components/sison/SisonSettingsCard';
import SisonServerStatusCard from '../components/sison/SisonServerStatusCard';
import SisonApiDocs from '../components/sison/SisonApiDocs';

export default function SisonConfig() {
  const [callbackUrl, setCallbackUrl] = useState('');
  const [serverIp, setServerIp] = useState('127.0.0.1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  // Service Token State (dari DB)
  const [serviceTokenInfo, setServiceTokenInfo] = useState(null);

  // Copy states
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);

  const fetchSisonConfig = async () => {
    try {
      const res = await api.get('/api/admin/sison-config');
      if (res.data) {
        setCallbackUrl(res.data.callback_url || '');
        if (res.data.server_ip) setServerIp(res.data.server_ip);
        if (res.data.service_token_info) {
          setServiceTokenInfo(res.data.service_token_info);
        }
      }
    } catch {
      toast.error('Gagal memuat konfigurasi Sison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSisonConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/admin/sison-config', { callback_url: callbackUrl });
      toast.success('Callback URL SISON berhasil disimpan!');
    } catch {
      toast.error('Gagal menyimpan konfigurasi SISON');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPing = async () => {
    if (!callbackUrl || !callbackUrl.trim()) {
      toast.error('Masukkan Callback Webhook URL terlebih dahulu!');
      return;
    }
    setTestingPing(true);
    setPingResult(null);
    try {
      const res = await api.post('/api/admin/sison-test-ping', { callback_url: callbackUrl });
      setPingResult(res.data);
      if (res.data?.success) {
        toast.success(`Server SISON Terhubung! (Status: ${res.data.status_code}, Latency: ${res.data.latency_ms}ms)`);
      } else {
        toast.error(`Koneksi SISON Gagal: ${res.data?.error || 'Tidak ada respon'}`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Gagal menghubungi server SISON';
      setPingResult({ success: false, error: errMsg });
      toast.error(`Uji Webhook Gagal: ${errMsg}`);
    } finally {
      setTestingPing(false);
    }
  };

  // Sample JSON payload untuk dokumentasi
  const samplePayload = {
    id_trans: "DEMO-1786211114",
    lot: "LOT-8821",
    p_no: "74231-0K550-00",
    unique_no: "UNQ-9901",
    p_name: "Demo Part Komponen A",
    qty: 1
  };
  const jsonPayloadString = JSON.stringify(samplePayload, null, 2);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'payload') {
      setCopiedPayload(true);
      toast.success('Template JSON berhasil disalin!');
      setTimeout(() => setCopiedPayload(false), 2000);
    } else if (type === 'key') {
      toast.success('Header Authorization disalin!');
    }
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    toast.success('IP PC Kamera disalin!');
    setTimeout(() => setCopiedIp(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Integrasi"
        highlightTitle="SISON & API Reference"
        subtitle="Konfigurasi Webhook Callback, Service Token Integrasi, dan Panduan API Endpoint SISON"
        actionButton={
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Swagger Docs
          </a>
        }
      />

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Webhook Config + Service Token */}
        <SisonSettingsCard
          callbackUrl={callbackUrl}
          setCallbackUrl={setCallbackUrl}
          loading={loading}
          saving={saving}
          testingPing={testingPing}
          pingResult={pingResult}
          onTestPing={handleTestPing}
          onSubmit={handleSubmit}
          serviceTokenInfo={serviceTokenInfo}
          setServiceTokenInfo={setServiceTokenInfo}
        />

        {/* Right 1 Col: Status Server */}
        <SisonServerStatusCard
          serverIp={serverIp}
          copiedIp={copiedIp}
          onCopyIp={handleCopyIp}
        />
      </div>

      {/* API Documentation */}
      <SisonApiDocs
        generatedToken={serviceTokenInfo?.token || ''}
        jsonPayloadString={jsonPayloadString}
        samplePayload={samplePayload}
        copiedPayload={copiedPayload}
        onCopy={copyToClipboard}
      />
    </div>
  );
}
