import React, { useState } from 'react';
import { 
  Mail, Phone, Send, RotateCcw, AlertTriangle, CheckCircle, Clock, Search, 
  Trash2, ShieldAlert, FileText, Bell, Sliders, RefreshCw, Eye 
} from 'lucide-react';
import { AutomationLog, AuditLog } from '../types';

interface AutomationQueueProps {
  automationLogs: AutomationLog[];
  auditLogs: AuditLog[];
  onTriggerRetry: (logId: string) => void;
  onClearLogs: () => void;
  onTriggerRetryAll: () => void;
  addAuditLog: (action: string, category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS', details: string) => void;
}

export default function AutomationQueue({
  automationLogs,
  auditLogs,
  onTriggerRetry,
  onClearLogs,
  onTriggerRetryAll,
  addAuditLog,
}: AutomationQueueProps) {
  const [activeTab, setActiveTab] = useState<'DISPATCHES' | 'AUDIT_LOGS'>('DISPATCHES');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState('ALL');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Template states
  const [emailTemplate, setEmailTemplate] = useState(
    'Halo {name},\n\nPembayaran sebesar {price} untuk produk "{product}" telah terverifikasi!\nBerikut adalah akses download rahasia Anda:\n{download_url}\n\n{license_info}\nTerima kasih atas pembelian Anda!\n\nSalam,\nLynk Membership Pro Support'
  );
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    'Halo {name}, pembayaran lunas! Akses produk "{product}" sudah aktif. Download: {download_url}. {license_info}'
  );

  // Filtered audit logs
  const filteredAudits = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesCategory = auditCategory === 'ALL' || log.category === auditCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate parsed templates for previews with mock data
  const getParsedTemplates = () => {
    const mockData = {
      name: 'Rudi Hermawan',
      product: 'Ebook Premium React v19',
      price: 'Rp 149.000',
      download_url: 'https://rsc.membership-pro.com/r/react19',
      license_info: 'License Key Anda: LNK-PRO-A89D-C210',
    };

    const parse = (template: string) => {
      return template
        .replace(/{name}/g, mockData.name)
        .replace(/{product}/g, mockData.product)
        .replace(/{price}/g, mockData.price)
        .replace(/{download_url}/g, mockData.download_url)
        .replace(/{license_info}/g, mockData.license_info);
    };

    return {
      email: parse(emailTemplate),
      whatsapp: parse(whatsappTemplate),
    };
  };

  const parsed = getParsedTemplates();

  const handleSaveTemplates = () => {
    addAuditLog(
      'TEMPLATES_UPDATED',
      'AUTOMATION',
      'Memperbarui template pesan otomatisasi Email dan WhatsApp'
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-850 rounded-lg">
          <button
            onClick={() => setActiveTab('DISPATCHES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-sans tracking-wide transition ${
              activeTab === 'DISPATCHES' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5 inline mr-1.5" /> Antrean & Log Notifikasi
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-sans tracking-wide transition ${
              activeTab === 'AUDIT_LOGS' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" /> Database Audit Log
          </button>
        </div>

        {activeTab === 'DISPATCHES' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerRetryAll}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition"
            >
              <RefreshCw className="w-3 h-3" /> Retry Failed Jobs
            </button>
            <button
              onClick={onClearLogs}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono bg-zinc-950 border border-zinc-850 px-2.5 py-1.5 rounded-lg transition"
            >
              Clear Logs
            </button>
          </div>
        )}
      </div>

      {activeTab === 'DISPATCHES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notification Templates Editor left */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-white font-sans">Template Notifikasi Otomatis</span>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>Template disimpan & disinkronkan!</span>
                </div>
              )}

              {/* Email template */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Template Email Pembelian Lunas
                </label>
                <textarea
                  value={emailTemplate}
                  onChange={e => setEmailTemplate(e.target.value)}
                  className="w-full h-36 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-700 leading-relaxed"
                />
              </div>

              {/* WA template */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Template WhatsApp Pembelian Lunas
                </label>
                <textarea
                  value={whatsappTemplate}
                  onChange={e => setWhatsappTemplate(e.target.value)}
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-700 leading-relaxed"
                />
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block mb-1">Daftar Placeholders Dinamis</span>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  <code className="text-amber-400 font-semibold">{`{name}`}</code>: Nama member | <code className="text-amber-400 font-semibold">{`{product}`}</code>: Judul Produk | <code className="text-amber-400 font-semibold">{`{price}`}</code>: Harga IDR | <code className="text-amber-400 font-semibold">{`{download_url}`}</code>: Tautan File | <code className="text-amber-400 font-semibold">{`{license_info}`}</code>: Lisensi (jika aktif)
                </p>
              </div>

              <button
                onClick={handleSaveTemplates}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-sans font-semibold transition"
              >
                Simpan & Sinkronisasi Template
              </button>
            </div>

            {/* Template Parser Render Previews */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 space-y-4">
              <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block pb-2 border-b border-zinc-900">
                👁️ Live Rendering Preview (Data Simulasi)
              </span>

              {/* Rendered Email */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono">Render Email Keanggotaan:</span>
                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 text-[11px] text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {parsed.email}
                </div>
              </div>

              {/* Rendered WA */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono">Render SMS/WA Keanggotaan:</span>
                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 text-[11px] text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {parsed.whatsapp}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time background dispatch Queue logs right */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
                <h3 className="text-sm font-bold text-white font-sans">Queue Dispatcher Logs</h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Aliran antrean pengiriman notifikasi (Fonnte/Resend). Gagal bayar/koneksi akan masuk retry-pipeline.</p>
              </div>

              {automationLogs.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {automationLogs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-zinc-950/20 transition flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg border mt-1 ${
                          log.type === 'EMAIL' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {log.type === 'EMAIL' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-zinc-200 text-xs font-mono">{log.recipient}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            {log.retryCount > 0 && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded text-[9px] font-mono">
                                Retry x{log.retryCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-1 whitespace-pre-wrap">
                            {log.subjectOrTemplate}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {log.status === 'SENT' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                            SENT (200)
                          </span>
                        )}
                        {log.status === 'FAILED' && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> FAILED
                            </span>
                            <button
                              onClick={() => onTriggerRetry(log.id)}
                              className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 font-mono"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Re-dispatch
                            </button>
                          </div>
                        )}
                        {log.status === 'RETRYING' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-spin" /> RETRYING
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 font-sans">
                  <Bell className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-400">Belum ada antrean notifikasi terkirim.</p>
                  <p className="text-xs text-zinc-600 mt-1">Lakukan transaksi sukses di Webhook Sandbox untuk menembakkan notifikasi otomatis.</p>
                </div>
              )}
            </div>

            {automationLogs.length > 0 && (
              <div className="p-3 bg-zinc-950 text-center border-t border-zinc-800">
                <span className="text-[10px] font-mono text-zinc-500">
                  Worker status: <strong className="text-emerald-400 font-semibold animate-pulse">● IDLE (listening)</strong> — BullMQ Node.js simulator running
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Database Audit Logs Tab */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              {/* Search audits */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Cari kata kunci audit..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-zinc-300 text-sm focus:outline-none focus:border-zinc-700 font-sans"
                />
              </div>

              {/* Category Filter */}
              <select
                value={auditCategory}
                onChange={e => setAuditCategory(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-700"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="MEMBERSHIP">MEMBERSHIP</option>
                <option value="PRODUCT">PRODUCT</option>
                <option value="WEBHOOK">WEBHOOK</option>
                <option value="AUTOMATION">AUTOMATION</option>
                <option value="BUSINESS">BUSINESS</option>
              </select>
            </div>

            <span className="text-xs text-zinc-500 font-mono">
              Total logs: <span className="text-zinc-300 font-semibold">{filteredAudits.length}</span> / {auditLogs.length} baris
            </span>
          </div>

          {filteredAudits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-zinc-400 text-sm">
                <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5">Waktu</th>
                    <th className="px-6 py-3.5">Kategori</th>
                    <th className="px-6 py-3.5">Aksi Audit</th>
                    <th className="px-6 py-3.5">Deskripsi / Detail</th>
                    <th className="px-6 py-3.5">Aktor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono text-xs">
                  {filteredAudits.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-950/40 transition">
                      <td className="px-6 py-3.5 text-zinc-500">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.category === 'MEMBERSHIP' ? 'bg-blue-500/10 text-blue-400' :
                          log.category === 'PRODUCT' ? 'bg-purple-500/10 text-purple-400' :
                          log.category === 'WEBHOOK' ? 'bg-yellow-500/10 text-yellow-500' :
                          log.category === 'AUTOMATION' ? 'bg-pink-500/10 text-pink-500' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-zinc-200">
                        {log.action}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-400 font-sans max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-zinc-500 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded">
                          {log.user}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 font-sans">
              <ShieldAlert className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-400">Audit logs kosong atau filter terlalu ketat.</p>
              <p className="text-xs text-zinc-600 mt-1">Ubah atau hapus produk/member untuk melacak histori modifikasi basis data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
