import React, { useState } from 'react';
import { 
  Percent, Award, Key, Plus, Trash2, Tag, Copy, Check, MousePointer, 
  Sparkles, CheckCircle, XCircle, Search, ShieldCheck, RefreshCw, Calendar 
} from 'lucide-react';
import { Coupon, Affiliate, Product, License } from '../types';

interface BusinessToolsProps {
  coupons: Coupon[];
  affiliates: Affiliate[];
  products: Product[];
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (id: string) => void;
  onAddAffiliate: (affiliate: Affiliate) => void;
  onTriggerAffiliateClick: (id: string) => void;
  addAuditLog: (action: string, category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS', details: string) => void;
}

export default function BusinessTools({
  coupons,
  affiliates,
  products,
  onAddCoupon,
  onDeleteCoupon,
  onAddAffiliate,
  onTriggerAffiliateClick,
  addAuditLog,
}: BusinessToolsProps) {
  const [activeTab, setActiveTab] = useState<'AFFILIATES' | 'COUPONS' | 'LICENSE_GEN'>('AFFILIATES');
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Business Tools Error & Success States
  const [affiliateError, setAffiliateError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [licenseSuccess, setLicenseSuccess] = useState<string | null>(null);

  // Affiliate Form states
  const [affName, setAffName] = useState('');
  const [affCode, setAffCode] = useState('');
  const [affRate, setAffRate] = useState(15); // Default 15% commission

  // Coupon Form states
  const [copCode, setCopCode] = useState('');
  const [copType, setCopType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [copValue, setCopValue] = useState(10);
  const [copMaxUses, setCopMaxUses] = useState(100);

  // License Generator tool states
  const [licenseEmail, setLicenseEmail] = useState('developer.client@gmail.com');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [verificationKey, setVerificationKey] = useState('');
  const [verifiedLicense, setVerifiedLicense] = useState<any | null>(null);

  // Local state for active licenses inside generator
  const [activeLicenses, setActiveLicenses] = useState<License[]>([
    {
      id: 'l-1',
      key: 'LNK-PRO-A3D9-92F2-81D2',
      productId: 'p-1',
      memberEmail: 'budi.santoso@gmail.com',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE'
    }
  ]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 1200);
  };

  const handleCreateAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    setAffiliateError(null);
    if (!affName.trim() || !affCode.trim()) {
      setAffiliateError('Nama dan Kode afiliasi wajib diisi!');
      return;
    }

    const formattedCode = affCode.toUpperCase().replace(/\s+/g, '');
    const exists = affiliates.some(a => a.code === formattedCode);
    if (exists) {
      setAffiliateError('Kode afiliasi sudah digunakan!');
      return;
    }

    const newAff: Affiliate = {
      id: 'aff-' + Date.now(),
      name: affName,
      code: formattedCode,
      commissionRate: affRate,
      clicks: 0,
      conversions: 0,
      totalEarnings: 0,
    };

    onAddAffiliate(newAff);
    addAuditLog(
      'AFFILIATE_CREATED',
      'BUSINESS',
      `Membuat program afiliasi "${affName}" dengan kode "${formattedCode}"`
    );
    setAffName('');
    setAffCode('');
    setAffRate(15);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!copCode.trim()) {
      setCouponError('Kode kupon wajib diisi!');
      return;
    }

    const formattedCode = copCode.toUpperCase().replace(/\s+/g, '');
    const exists = coupons.some(c => c.code === formattedCode);
    if (exists) {
      setCouponError('Kode kupon sudah terpakai!');
      return;
    }

    const newCop: Coupon = {
      id: 'cop-' + Date.now(),
      code: formattedCode,
      discountType: copType,
      discountValue: Number(copValue),
      isActive: true,
      usedCount: 0,
      maxUses: copMaxUses || undefined,
    };

    onAddCoupon(newCop);
    addAuditLog(
      'COUPON_CREATED',
      'BUSINESS',
      `Membuat diskon kupon "${formattedCode}" (${copType === 'PERCENT' ? copValue + '%' : copValue + ' IDR'})`
    );
    setCopCode('');
    setCopValue(10);
  };

  const handleDeleteCoupon = (id: string, code: string) => {
    onDeleteCoupon(id);
    addAuditLog(
      'COUPON_DELETED',
      'BUSINESS',
      `Menghapus kode kupon "${code}"`
    );
  };

  const handleGenerateLicenseKey = () => {
    setLicenseError(null);
    setLicenseSuccess(null);
    if (!licenseEmail.trim()) {
      setLicenseError('Email wajib diisi!');
      return;
    }

    const prodId = selectedProductId || (products[0] ? products[0].id : 'p-1');
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `LNK-PRO-${randomHex()}-${randomHex()}-${randomHex()}`;

    const newLicense: License = {
      id: 'lic-' + Date.now(),
      key: newKey,
      productId: prodId,
      memberEmail: licenseEmail.trim().toLowerCase(),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      status: 'ACTIVE'
    };

    setActiveLicenses(prev => [newLicense, ...prev]);
    setGeneratedLicense(newKey);
    setVerificationKey(newKey);
    setLicenseSuccess(`Kunci lisensi berhasil dibuat untuk ${licenseEmail}`);
    addAuditLog(
      'LICENSE_GENERATED',
      'BUSINESS',
      `Menghasilkan kunci lisensi baru untuk "${licenseEmail}"`
    );
  };

  const handleVerifyLicense = () => {
    const keyToVerify = verificationKey.trim();
    if (!keyToVerify) {
      setVerifiedLicense({ found: false });
      return;
    }

    const foundLic = activeLicenses.find(l => l.key === keyToVerify);
    if (foundLic) {
      const prod = products.find(p => p.id === foundLic.productId);
      setVerifiedLicense({
        found: true,
        key: foundLic.key,
        productName: prod ? prod.name : 'Unknown SKU',
        email: foundLic.memberEmail,
        issued: foundLic.issuedAt,
        expires: foundLic.expiresAt,
        status: foundLic.status,
      });
    } else {
      setVerifiedLicense({ found: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-850 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('AFFILIATES')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sans tracking-wide transition ${
            activeTab === 'AFFILIATES' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Award className="w-3.5 h-3.5 inline mr-1.5" /> Pelacakan Afiliasi
        </button>
        <button
          onClick={() => setActiveTab('COUPONS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sans tracking-wide transition ${
            activeTab === 'COUPONS' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Percent className="w-3.5 h-3.5 inline mr-1.5" /> Diskon Kupon
        </button>
        <button
          onClick={() => setActiveTab('LICENSE_GEN')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sans tracking-wide transition ${
            activeTab === 'LICENSE_GEN' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Key className="w-3.5 h-3.5 inline mr-1.5" /> License Key Engine
        </button>
      </div>

      {activeTab === 'AFFILIATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Affiliate Code left */}
          <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2.5 font-sans flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-500" /> Daftarkan Afiliasi Baru
            </h3>

            {affiliateError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg font-sans">
                {affiliateError}
              </div>
            )}

            <form onSubmit={handleCreateAffiliate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nama Influencer / Partner
                </label>
                <input
                  type="text"
                  value={affName}
                  onChange={e => setAffName(e.target.value)}
                  placeholder="Misal: Andi Setyawan"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Kode Kupon / Referral
                </label>
                <input
                  type="text"
                  value={affCode}
                  onChange={e => setAffCode(e.target.value)}
                  placeholder="ANDIPRO2026"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Komisi (%) per Transaksi
                </label>
                <input
                  type="number"
                  value={affRate}
                  onChange={e => setAffRate(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-sans font-semibold transition"
              >
                Aktifkan Referral Partner
              </button>
            </form>
          </div>

          {/* Affiliate list tracker right */}
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
              <h3 className="text-sm font-bold text-white font-sans">Pelacak Klik & Komisi Partner</h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Pantau kinerja komisi per klik dan konversi pembeli dari kode diskon khusus.</p>
            </div>

            {affiliates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-400 text-sm">
                  <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3">Nama Influencer</th>
                      <th className="px-6 py-3">Kode Unik</th>
                      <th className="px-6 py-3">Rate</th>
                      <th className="px-6 py-3 text-center">Simulasi Klik</th>
                      <th className="px-6 py-3 text-right">Konversi / Penghasilan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {affiliates.map(aff => {
                      const shareUrl = `${window.location.origin}/?ref=${aff.code}`;
                      return (
                        <tr key={aff.id} className="hover:bg-zinc-950/40 transition">
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold block">{aff.name}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            <span className="bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-amber-400 font-bold">
                              {aff.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-300">
                            {aff.commissionRate}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono text-xs text-zinc-500 mr-1.5">{aff.clicks} clicks</span>
                              <button
                                onClick={() => onTriggerAffiliateClick(aff.id)}
                                className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 p-1 rounded-md transition"
                                title="Simulasikan Klik Referral"
                              >
                                <MousePointer className="w-3.5 h-3.5 text-blue-400" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-mono">
                              <span className="text-emerald-400 font-bold text-xs block">{aff.conversions} Sales</span>
                              <span className="text-[10px] text-zinc-500 block">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(aff.totalEarnings)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 font-sans">
                <Award className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-400">Belum ada partner afiliasi terdaftar.</p>
                <p className="text-xs text-zinc-600 mt-1">Daftarkan influencer baru di panel kiri untuk mulai melacak konversi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'COUPONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Coupon form left */}
          <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2.5 font-sans flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-500" /> Buat Kupon Diskon Baru
            </h3>

            {couponError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg font-sans">
                {couponError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Kode Diskon Kupon
                </label>
                <input
                  type="text"
                  value={copCode}
                  onChange={e => setCopCode(e.target.value)}
                  placeholder="DISKON20"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Tipe Pemotongan
                </label>
                <select
                  value={copType}
                  onChange={e => setCopType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                >
                  <option value="PERCENT">PERCENT (%) - Persentase Harga</option>
                  <option value="FIXED">FIXED (IDR) - Potongan Harga Tetap</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nilai Diskon ({copType === 'PERCENT' ? '%' : 'IDR'})
                </label>
                <input
                  type="number"
                  value={copValue}
                  onChange={e => setCopValue(Number(e.target.value))}
                  min="1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Maksimal Penggunaan (Uses)
                </label>
                <input
                  type="number"
                  value={copMaxUses}
                  onChange={e => setCopMaxUses(Number(e.target.value))}
                  min="1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-sans font-semibold transition"
              >
                Aktifkan Diskon Kupon
              </button>
            </form>
          </div>

          {/* Coupon Database right */}
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
              <h3 className="text-sm font-bold text-white font-sans">Database Kupon Toko</h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Kelola kupon belanja untuk memotong harga digital saat checkout.</p>
            </div>

            {coupons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-400 text-sm">
                  <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3">Kode Kupon</th>
                      <th className="px-6 py-3">Potongan</th>
                      <th className="px-6 py-3">Pemakaian (Usage)</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {coupons.map(cop => (
                      <tr key={cop.id} className="hover:bg-zinc-950/40 transition">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-200">
                          {cop.code}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {cop.discountType === 'PERCENT' ? (
                            <span className="text-blue-400 font-semibold">{cop.discountValue}% OFF</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cop.discountValue)} Potongan
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                          {cop.usedCount} / {cop.maxUses || 'Unlimited'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {cop.isActive ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                AKTIF
                              </span>
                            ) : (
                              <span className="bg-zinc-850 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                                NONAKTIF
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(cop.id, cop.code)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Hapus Kupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 font-sans">
                <Tag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400">Belum ada kupon belanja dibuat.</p>
                <p className="text-xs text-zinc-600 mt-1">Gunakan panel di kiri untuk membuat potongan harga perdana Anda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'LICENSE_GEN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* License generator block */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2.5 font-sans flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Generator Kunci Enkripsi Manual
            </h3>

            {licenseError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg font-sans">
                {licenseError}
              </div>
            )}

            {licenseSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg font-sans flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{licenseSuccess}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Email Anggota / Member
                </label>
                <input
                  type="email"
                  value={licenseEmail}
                  onChange={e => setLicenseEmail(e.target.value)}
                  placeholder="pelanggan@domain.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Produk Terkait (Akses Terbatas)
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] — {p.name}
                    </option>
                  ))}
                  {products.length === 0 && (
                    <option value="p-1">Ebook Premium Master</option>
                  )}
                </select>
              </div>

              <button
                onClick={handleGenerateLicenseKey}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2 rounded-lg text-xs font-sans font-bold transition flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" /> Generate Encrypted Key
              </button>

              {generatedLicense && (
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">License Key Terbuat:</span>
                    <button
                      onClick={() => handleCopy(generatedLicense, 'manual-sig')}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      {isCopied === 'manual-sig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="bg-zinc-900 text-amber-400 font-mono font-bold text-sm text-center py-1.5 rounded border border-zinc-800">
                    {generatedLicense}
                  </div>
                </div>
              )}
            </div>

            {/* License Key Validation Tester */}
            <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-sans block">
                🛡️ API Client Validator Tester (Klien Software)
              </span>

              <div>
                <input
                  type="text"
                  value={verificationKey}
                  onChange={e => setVerificationKey(e.target.value)}
                  placeholder="Masukkan Kunci Lisensi..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>

              <button
                onClick={handleVerifyLicense}
                className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-200 py-1.5 rounded-lg text-xs font-semibold transition font-sans"
              >
                Check API License (Simulasi)
              </button>

              {verifiedLicense && (
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 text-[10px] font-mono leading-relaxed space-y-1">
                  {verifiedLicense.found ? (
                    <>
                      <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1 font-sans">
                        <CheckCircle className="w-3.5 h-3.5" /> VALID LICENSE (200 OK)
                      </div>
                      <div><span className="text-zinc-600">Product:</span> {verifiedLicense.productName}</div>
                      <div><span className="text-zinc-600">Email:</span> {verifiedLicense.email}</div>
                      <div><span className="text-zinc-600">Issued At:</span> {new Date(verifiedLicense.issued).toLocaleDateString()}</div>
                      <div><span className="text-zinc-600">Expires At:</span> {new Date(verifiedLicense.expires).toLocaleDateString()}</div>
                      <div><span className="text-zinc-600">Status:</span> <span className="text-emerald-400">{verifiedLicense.status}</span></div>
                    </>
                  ) : (
                    <div className="text-red-400 font-bold flex items-center gap-1 font-sans">
                      <XCircle className="w-3.5 h-3.5" /> INVALID LICENSE (403 Forbidden)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Manual Licenses List right */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
                <h3 className="text-sm font-bold text-white font-sans">Database Kunci Lisensi Aktif</h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Daftar kunci lisensi terdistribusi yang aktif di klien pembeli.</p>
              </div>

              {activeLicenses.length > 0 ? (
                <div className="divide-y divide-zinc-800 font-mono text-xs">
                  {activeLicenses.map(lic => {
                    const prod = products.find(p => p.id === lic.productId);
                    return (
                      <div key={lic.id} className="p-4 hover:bg-zinc-950/20 transition flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-amber-400 font-bold text-xs bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded">
                              {lic.key}
                            </span>
                            <span className="text-[10px] text-zinc-500">[{prod ? prod.sku : 'PROD'}]</span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-sans block">{lic.memberEmail}</span>
                          <span className="text-[10px] text-zinc-500 block">Expires: {new Date(lic.expiresAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {lic.status === 'ACTIVE' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              REVOKED
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setActiveLicenses(prev => prev.map(p => p.id === lic.id ? { ...p, status: p.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE' } : p));
                              addAuditLog('LICENSE_STATUS_MUTATED', 'BUSINESS', `Mengubah status lisensi ${lic.key} menjadi ${lic.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE'}`);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-sans hover:underline"
                          >
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 font-sans">
                  <Key className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-sans">Belum ada kunci lisensi diterbitkan.</p>
                  <p className="text-xs text-zinc-600 mt-1">Gunakan Generator Lisensi di kiri atau buat di Webhook Sandbox.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
