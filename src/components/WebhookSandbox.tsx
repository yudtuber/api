import React, { useState, useEffect } from 'react';
import { 
  Play, Shield, Key, AlertTriangle, CheckCircle, Clock, Server, Terminal, 
  HelpCircle, Copy, Check, ArrowRight, RefreshCw, Eye, AlertCircle 
} from 'lucide-react';
import { Product, Affiliate, WebhookLog } from '../types';

interface WebhookSandboxProps {
  products: Product[];
  affiliates: Affiliate[];
  webhookLogs: WebhookLog[];
  onTriggerWebhook: (payload: any, signature: string, isCorrupted: boolean) => Promise<{ status: 'SUCCESS' | 'SIGNATURE_INVALID' | 'PRODUCT_NOT_FOUND' | 'ERROR'; message: string }>;
  webhookSecret: string;
  onChangeWebhookSecret: (secret: string) => void;
  onClearLogs: () => void;
}

export default function WebhookSandbox({
  products,
  affiliates,
  webhookLogs,
  onTriggerWebhook,
  webhookSecret,
  onChangeWebhookSecret,
  onClearLogs,
}: WebhookSandboxProps) {
  // Mock form values
  const [event, setEvent] = useState('payment.success');
  const [customerName, setCustomerName] = useState('Dian Pratiwi');
  const [customerEmail, setCustomerEmail] = useState('dian.pratiwi@gmail.com');
  const [customerPhone, setCustomerPhone] = useState('+6282199887766');
  const [selectedSku, setSelectedSku] = useState('');
  const [amount, setAmount] = useState(150000);
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [corruptSignature, setCorruptSignature] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // UI state
  const [calculatedSignature, setCalculatedSignature] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [simulatedResponse, setSimulatedResponse] = useState<any | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Set initial selected SKU
  useEffect(() => {
    if (products.length > 0 && !selectedSku) {
      setSelectedSku(products[0].sku);
      setAmount(products[0].price);
    }
  }, [products]);

  // Generate random transaction ID
  const regenerateTxId = () => {
    setTransactionId('TX-LNK-' + Math.floor(100000 + Math.random() * 900000));
  };

  useEffect(() => {
    regenerateTxId();
  }, []);

  // Sync amount with product selection
  const handleSkuChange = (sku: string) => {
    setSelectedSku(sku);
    const prod = products.find(p => p.sku === sku);
    if (prod) {
      setAmount(prod.price);
    }
  };

  // Build current JSON payload
  const currentPayloadObj = {
    event,
    transaction_id: transactionId,
    product_sku: selectedSku,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    amount: Number(amount),
    affiliate_code: selectedAffiliate || null,
    payment_method: 'QRIS_GOPAY',
    payment_status: event === 'payment.success' ? 'PAID' : 'PENDING',
    created_at: new Date().toISOString()
  };

  const currentPayloadString = JSON.stringify(currentPayloadObj, null, 2);

  // Simple client-side cryptographic-like signature generator (HMAC SHA-256 equivalent logic)
  const calculateSignature = async (payload: string, key: string) => {
    if (!key) {
      setCalculatedSignature('WEBHOOK_SECRET_NOT_SET');
      return;
    }
    try {
      const encoder = new TextEncoder();
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(payload)
      );
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setCalculatedSignature(hashHex);
    } catch (err) {
      // Fallback pseudo-HMAC if crypto.subtle is blocked inside iframe environments
      let hash = 0;
      const combined = payload + key;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      const pseudoHex = Math.abs(hash).toString(16).padStart(16, 'f') + '4e8c1a93b5d2f6';
      setCalculatedSignature(pseudoHex.substring(0, 64));
    }
  };

  useEffect(() => {
    calculateSignature(JSON.stringify(currentPayloadObj), webhookSecret);
  }, [event, transactionId, selectedSku, customerName, customerEmail, customerPhone, amount, selectedAffiliate, webhookSecret]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 1500);
  };

  const handleSendWebhook = async () => {
    setIsGenerating(true);
    
    try {
      const result = await onTriggerWebhook(currentPayloadObj, calculatedSignature, corruptSignature);
      
      const responseStatus = result.status === 'SUCCESS' ? 200 : (result.status === 'SIGNATURE_INVALID' ? 401 : 404);
      setSimulatedResponse({
        status: responseStatus,
        statusText: result.status === 'SUCCESS' ? 'OK' : (result.status === 'SIGNATURE_INVALID' ? 'Unauthorized' : 'Not Found'),
        timestamp: new Date().toLocaleTimeString(),
        headers: {
          'content-type': 'application/json',
          'x-powered-by': 'Express + Node.js Full-Stack'
        },
        body: {
          success: result.status === 'SUCCESS',
          code: result.status,
          message: result.message
        }
      });
    } catch (err) {
      console.error(err);
      setSimulatedResponse({
        status: 500,
        statusText: 'Internal Server Error',
        timestamp: new Date().toLocaleTimeString(),
        headers: {
          'content-type': 'application/json'
        },
        body: {
          success: false,
          code: 'ERROR',
          message: 'Gagal menghubungi server backend.'
        }
      });
    } finally {
      setIsGenerating(false);
      regenerateTxId(); // Load next transaction
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            Webhook Sandbox & Simulator
          </h2>
          <p className="text-sm text-zinc-400">
            Uji respons sistem membership terhadap payload transaksi Lynk.id secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500">SECRET KEY:</label>
          <input
            type="text"
            value={webhookSecret}
            onChange={e => onChangeWebhookSecret(e.target.value)}
            placeholder="whsec_secret_key"
            className="bg-zinc-950 border border-zinc-800 text-amber-400 font-mono text-xs px-3 py-1.5 rounded focus:outline-none focus:border-zinc-700 w-44"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Webhook Parameters Form */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <Server className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-white font-sans">Konfigurasi Pengiriman</span>
          </div>

          <div className="space-y-3.5">
            {/* Event Name */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Tipe Event Lynk.id
              </label>
              <select
                value={event}
                onChange={e => setEvent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-sans"
              >
                <option value="payment.success">payment.success (Pembayaran Lunas)</option>
                <option value="payment.pending">payment.pending (Menunggu Pembayaran)</option>
              </select>
            </div>

            {/* Product SKU Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Produk Digital (SKU)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Cocokkan SKU</span>
              </div>
              <select
                value={selectedSku}
                onChange={e => handleSkuChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-mono"
              >
                {products.length > 0 ? (
                  products.map(p => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} — {p.name}
                    </option>
                  ))
                ) : (
                  <option value="">Belum ada produk dibuat</option>
                )}
                <option value="SKU-TIDAK-VALID">SKU-TIDAK-VALID (Uji 404)</option>
              </select>
            </div>

            {/* Custom Price */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Jumlah Pembayaran (IDR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Purchaser email */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Nama Pembeli
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Dian Pratiwi"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-sans"
              />
            </div>

            {/* Purchaser email */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Email Pembeli
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="dian.pratiwi@gmail.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Purchaser Phone */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                No. WhatsApp Pembeli
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+6282199887766"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Affiliate Code dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Kode Afiliasi (Opsional)
              </label>
              <select
                value={selectedAffiliate}
                onChange={e => setSelectedAffiliate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-mono"
              >
                <option value="">Tanpa Afiliasi (Direct)</option>
                {affiliates.map(aff => (
                  <option key={aff.id} value={aff.code}>
                    {aff.code} ({aff.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Signature corruption simulation */}
            <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-850">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={corruptSignature}
                  onChange={e => setCorruptSignature(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-red-500 focus:ring-0 mt-0.5 w-3.5 h-3.5"
                />
                <div>
                  <span className="text-xs font-bold text-red-400 block">Simulasikan Corrupt Signature</span>
                  <span className="text-[10px] text-zinc-500 block leading-normal mt-0.5">Mengubah signature agar tidak valid untuk menguji proteksi keamanan (401 Unauthorized)</span>
                </div>
              </label>
            </div>

            {/* Dispatch button */}
            <button
              id="btn-simulate-webhook"
              onClick={handleSendWebhook}
              disabled={isGenerating || products.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-sans font-medium transition ${
                isGenerating 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : (products.length === 0 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white')
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> 
              {isGenerating ? 'Memproses Webhook...' : 'Kirim Webhook Simulasi'}
            </button>
            {products.length === 0 && (
              <p className="text-[10px] text-amber-500/80 text-center font-sans mt-1">
                ⚠️ Harap buat minimal satu produk terlebih dahulu.
              </p>
            )}
          </div>
        </div>

        {/* Live Payload and Real-time Signature Math */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JSON Editor/Viewer panel */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-400 font-sans uppercase tracking-wider">
                    Raw JSON Payload
                  </span>
                  <button
                    onClick={() => handleCopy(currentPayloadString, 'payload')}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Copy Payload"
                  >
                    {isCopied === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-zinc-300 max-h-56 overflow-y-auto bg-zinc-900 p-3 rounded border border-zinc-800 leading-relaxed select-all">
                  <pre>{currentPayloadString}</pre>
                </div>
              </div>
              
              <div className="border-t border-zinc-850 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
                    Signature (Header: x-lynk-signature)
                  </span>
                  <button
                    onClick={() => handleCopy(calculatedSignature, 'sig')}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    {isCopied === 'sig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800 text-[10px] font-mono text-amber-400 break-all select-all mt-1">
                  {corruptSignature ? calculatedSignature.replace(/.$/, 'X') : calculatedSignature}
                </div>
              </div>
            </div>

            {/* Console output from Server */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-400 font-sans uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" /> Output Log Server (Simulasi)
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">POST /api/webhook/lynk</span>
                </div>
                
                {simulatedResponse ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between bg-zinc-900 p-2 rounded border border-zinc-800">
                      <div>
                        <span className="text-zinc-500 uppercase text-[10px]">HTTP Status:</span>
                        <span className={`font-bold ml-1.5 ${
                          simulatedResponse.status === 200 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {simulatedResponse.status} {simulatedResponse.statusText}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{simulatedResponse.timestamp}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block mb-1">Response Headers:</span>
                      <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850 text-[10px] text-zinc-400 space-y-0.5">
                        {Object.entries(simulatedResponse.headers).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-zinc-500">{k}:</span> {v as string}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block mb-1">Response Body:</span>
                      <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300">
                        <pre className="overflow-x-auto">{JSON.stringify(simulatedResponse.body, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600 font-sans">
                    <Server className="w-10 h-10 text-zinc-800 mb-2" />
                    <p className="text-xs">Menunggu pengiriman webhook...</p>
                    <p className="text-[10px] text-zinc-700 max-w-xs mt-1">Tekan tombol "Kirim Webhook" untuk melihat simulasi penanganan server, otentikasi signature, dan hasil response.</p>
                  </div>
                )}
              </div>

              {simulatedResponse && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono border-t border-zinc-850 pt-2.5 mt-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Proses aktivasi sukses disimulasikan.</span>
                </div>
              )}
            </div>
          </div>

          {/* Webhook Signatures Explanation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 font-sans text-xs">
            <h4 className="text-white font-semibold flex items-center gap-1.5 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Bagaimana Lynk.id Memvalidasi Webhook?
            </h4>
            <div className="text-zinc-400 space-y-1.5 leading-relaxed">
              <p>
                Lynk.id menyertakan header <code className="text-amber-400 font-mono px-1 bg-zinc-950 rounded">x-lynk-signature</code> di setiap pengiriman. Signature ini dihitung dengan cara membuat <strong className="text-zinc-300 font-medium">HMAC-SHA256</strong> dari raw body JSON payload menggunakan <strong className="text-zinc-300 font-medium">Webhook Secret Key</strong> Anda.
              </p>
              <div className="flex items-center gap-3 bg-zinc-950 p-2.5 rounded border border-zinc-850 font-mono text-[11px] mt-1 text-zinc-300">
                <span className="text-zinc-500">Signature =</span>
                <span>HMAC_SHA256( raw_json_payload, webhook_secret )</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Di backend server Anda (Next.js/Express), hitung ulang HMAC tersebut dengan kunci secret yang sama, lalu verifikasi menggunakan pencocokan waktu aman (<code className="text-zinc-400 font-mono bg-zinc-950 px-1 py-0.5 rounded">crypto.timingSafeEqual</code>) untuk mencegah timing-attack.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Logs History list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white font-sans">
              Log Webhook Historis (Simulated Audit)
            </h3>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Pantau history webhook masuk, audit signature, dan kegagalan provisioning.</p>
          </div>
          <button
            onClick={onClearLogs}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-mono bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-850 transition"
          >
            Clear History
          </button>
        </div>

        {webhookLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-zinc-400 text-sm">
              <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-6 py-3.5">Tipe Event</th>
                  <th className="px-6 py-3.5">Customer & Product SKU</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Otentikasi Signature</th>
                  <th className="px-6 py-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs font-mono">
                {webhookLogs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-zinc-950/40 cursor-pointer transition ${
                        selectedLog?.id === log.id ? 'bg-zinc-950/70 border-l-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <td className="px-6 py-4 text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-600" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-400 font-bold">{log.payload.event}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        <div className="font-sans">
                          <span className="font-semibold text-white block">{log.payload.customer_name}</span>
                          <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">{log.payload.customer_email} — SKU: {log.payload.product_sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'SUCCESS' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            SUCCESS (200)
                          </span>
                        )}
                        {log.status === 'SIGNATURE_INVALID' && (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            BAD_SIG (401)
                          </span>
                        )}
                        {log.status === 'PRODUCT_NOT_FOUND' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            SKU_404 (404)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {log.signatureVerified ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-sans">
                              <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1 text-[10px] font-sans">
                              <AlertCircle className="w-3.5 h-3.5" /> Tidak Valid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-sans text-xs text-blue-400 hover:text-blue-300">
                        {selectedLog?.id === log.id ? 'Tutup' : 'Lihat Payload'}
                      </td>
                    </tr>

                    {/* Expandable detailed JSON */}
                    {selectedLog?.id === log.id && (
                      <tr className="bg-zinc-950/90 border-b border-zinc-800">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-zinc-500 font-sans mb-1.5">Headers & Metadata</p>
                              <div className="bg-zinc-900/80 p-3 rounded border border-zinc-850 font-mono text-[10px] text-zinc-400 space-y-1">
                                <div><span className="text-zinc-600">Event Time:</span> {log.timestamp}</div>
                                <div><span className="text-zinc-600">ID Webhook Log:</span> {log.id}</div>
                                <div><span className="text-zinc-600">Signature Header:</span> <code className="text-amber-500 break-all">{log.headers['x-lynk-signature']}</code></div>
                                <div><span className="text-zinc-600">Keterangan:</span> {log.message}</div>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-zinc-500 font-sans mb-1.5">JSON Payload Dikirim</p>
                              <pre className="bg-zinc-900/80 p-3 rounded border border-zinc-850 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-44">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 font-sans">
            <HelpCircle className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-400">Belum ada histori webhook masuk yang disimulasikan.</p>
            <p className="text-xs text-zinc-600 mt-1">Konfigurasikan form di atas lalu klik "Kirim Webhook Simulasi" untuk memulai trace log.</p>
          </div>
        )}
      </div>
    </div>
  );
}
