import React, { useState } from 'react';
import { 
  Users, UserPlus, Edit2, Trash2, Key, Calendar, CheckCircle, AlertCircle, 
  XCircle, Search, Mail, Phone, ShoppingBag, Download, Plus, Save, X 
} from 'lucide-react';
import { Member, Product } from '../types';

interface MemberManagerProps {
  members: Member[];
  products: Product[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  addAuditLog: (action: string, category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS', details: string) => void;
}

export default function MemberManager({
  members,
  products,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  addAuditLog,
}: MemberManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState<string | null>(null); // member.id or 'NEW'
  const [formError, setFormError] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'EXPIRED' | 'PENDING'>('ACTIVE');
  const [purchasedProducts, setPurchasedProducts] = useState<string[]>([]);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [licenseKeys, setLicenseKeys] = useState<{ [pId: string]: string }>({});

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search));
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setIsEditing(null);
    setFormError(null);
    setName('');
    setEmail('');
    setPhone('');
    setStatus('ACTIVE');
    setPurchasedProducts([]);
    setAffiliateCode('');
    setLicenseKeys({});
  };

  const handleStartCreate = () => {
    setIsEditing('NEW');
    setFormError(null);
    setName('');
    setEmail('');
    setPhone('+62812' + Math.floor(10000000 + Math.random() * 90000000));
    setStatus('ACTIVE');
    setPurchasedProducts([]);
    setAffiliateCode('');
    setLicenseKeys({});
  };

  const handleStartEdit = (m: Member) => {
    setIsEditing(m.id);
    setFormError(null);
    setName(m.name);
    setEmail(m.email);
    setPhone(m.phone);
    setStatus(m.status);
    setPurchasedProducts(m.purchasedProducts || []);
    setAffiliateCode(m.affiliateCode || '');
    setLicenseKeys(m.licenseKeys || {});
  };

  const handleToggleProductSelection = (pId: string) => {
    setPurchasedProducts(prev => {
      if (prev.includes(pId)) {
        const updated = prev.filter(id => id !== pId);
        const updatedKeys = { ...licenseKeys };
        delete updatedKeys[pId];
        setLicenseKeys(updatedKeys);
        return updated;
      } else {
        const updated = [...prev, pId];
        const targetProd = products.find(p => p.id === pId);
        if (targetProd?.licenseRequired && !licenseKeys[pId]) {
          const generatedKey = `LNK-PRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          setLicenseKeys(prevKeys => ({ ...prevKeys, [pId]: generatedKey }));
        }
        return updated;
      }
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setFormError('Nama dan Email wajib diisi!');
      return;
    }

    if (isEditing === 'NEW') {
      const newMember: Member = {
        id: 'm-' + Date.now(),
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status,
        joinedAt: new Date().toISOString(),
        purchasedProducts,
        affiliateCode: affiliateCode.trim() || undefined,
        licenseKeys,
      };
      onAddMember(newMember);
      addAuditLog(
        'MEMBER_CREATED',
        'MEMBERSHIP',
        `Menambahkan member baru "${name}" (${email})`
      );
    } else if (isEditing) {
      const existing = members.find(m => m.id === isEditing);
      const newMember: Member = {
        id: isEditing,
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status,
        joinedAt: existing ? existing.joinedAt : new Date().toISOString(),
        purchasedProducts,
        affiliateCode: affiliateCode.trim() || undefined,
        licenseKeys,
      };
      onUpdateMember(newMember);
      addAuditLog(
        'MEMBER_UPDATED',
        'MEMBERSHIP',
        `Memperbarui profil member "${name}" (${email})`
      );
    }
    resetForm();
  };

  const handleDelete = (m: Member) => {
    setMemberToDelete(m);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            Database Keanggotaan (Members)
          </h2>
          <p className="text-sm text-zinc-400">
            Kelola profil pembeli, status akses produk digital, lisensi enkripsi, dan catatan referral afiliasi.
          </p>
        </div>
        {!isEditing && (
          <button
            id="btn-add-member"
            onClick={handleStartCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-sans font-medium text-sm transition duration-200"
          >
            <UserPlus className="w-4 h-4" /> Tambah Member Manual
          </button>
        )}
      </div>

      {/* Editor Form Modal or Block */}
      {isEditing && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {isEditing === 'NEW' ? 'Tambah Member Baru (Manual)' : 'Edit Profil Keanggotaan'}
          </h3>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Member Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Member
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Member Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Pembeli
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="budi@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+628123456789"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status and Affiliate */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Status Keanggotaan
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">AKTIF - Akses Terbuka</option>
                    <option value="PENDING">PENDING - Menunggu Webhook</option>
                    <option value="EXPIRED">EXPIRED - Akses Ditutup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Affiliate Attribution Code (Opsional)
                  </label>
                  <input
                    type="text"
                    value={affiliateCode}
                    onChange={e => setAffiliateCode(e.target.value)}
                    placeholder="E.g., MERDEKA2026"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              {/* Product Access Checklist */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Akses Produk Digital ({purchasedProducts.length} Terpilih)
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {products.map(p => {
                    const isSelected = purchasedProducts.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleToggleProductSelection(p.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                          isSelected ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-zinc-900/40 border border-transparent hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded bg-zinc-900 border-zinc-850 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span className="text-xs text-zinc-300 font-sans font-medium">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-zinc-500">{p.sku}</span>
                          {p.licenseRequired && isSelected && (
                            <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5" /> Key Generated
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generated Keys Display */}
            {Object.keys(licenseKeys).length > 0 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-2">
                  🔐 Lisensi Unik Terbuat Untuk Member Ini
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(licenseKeys).map(([pId, key]) => {
                    const prod = products.find(p => p.id === pId);
                    return (
                      <div key={pId} className="bg-zinc-900 p-2 rounded border border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500">{prod ? prod.name : 'Unknown Product'}</p>
                          <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">{key}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg font-sans text-sm transition"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-sans font-medium text-sm transition"
              >
                <Save className="w-4 h-4" /> Simpan Profil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Layout */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, email atau HP..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-zinc-300 text-sm focus:outline-none focus:border-zinc-700 font-sans"
              />
            </div>

            {/* Status Filter buttons */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-850 rounded-lg">
              {['ALL', 'ACTIVE', 'PENDING', 'EXPIRED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide transition ${
                    statusFilter === st 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {st === 'ALL' ? 'SEMUA' : st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            Ditemukan: <span className="text-zinc-300 font-semibold">{filteredMembers.length}</span> member
          </span>
        </div>

        {/* Member Table list */}
        {filteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-zinc-400 text-sm">
              <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Data Member</th>
                  <th className="px-6 py-4">Akses Kontak</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Produk yang Dibeli</th>
                  <th className="px-6 py-4">Lisensi & Key</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredMembers.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-950/40 transition">
                    {/* Primary profile column */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-white font-semibold block">{m.name}</span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="w-3 h-3 text-zinc-600" /> {m.email}
                        </span>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> Terdaftar: {new Date(m.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    {/* Contact column */}
                    <td className="px-6 py-4">
                      {m.phone ? (
                        <span className="text-zinc-300 text-xs font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" /> {m.phone}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">Tidak ada HP</span>
                      )}
                      {m.affiliateCode && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono mt-1.5 inline-block">
                          Affiliate: {m.affiliateCode}
                        </span>
                      )}
                    </td>

                    {/* Status column */}
                    <td className="px-6 py-4">
                      {m.status === 'ACTIVE' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3.5 h-3.5" /> AKTIF
                        </span>
                      )}
                      {m.status === 'PENDING' && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" /> PENDING
                        </span>
                      )}
                      {m.status === 'EXPIRED' && (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <XCircle className="w-3.5 h-3.5" /> EXPIRED
                        </span>
                      )}
                    </td>

                    {/* Purchased products list */}
                    <td className="px-6 py-4">
                      {m.purchasedProducts && m.purchasedProducts.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {m.purchasedProducts.map(pId => {
                            const prod = products.find(p => p.id === pId);
                            return (
                              <span 
                                key={pId} 
                                className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[11px] font-sans flex items-center gap-1"
                                title={prod ? prod.name : 'Unknown Product'}
                              >
                                <ShoppingBag className="w-2.5 h-2.5 text-zinc-500" />
                                {prod ? (prod.name.length > 15 ? prod.name.substring(0, 15) + '...' : prod.name) : 'Produk Terhapus'}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">Belum beli produk</span>
                      )}
                    </td>

                    {/* Keys generated */}
                    <td className="px-6 py-4">
                      {m.licenseKeys && Object.keys(m.licenseKeys).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(m.licenseKeys).map(([pId, key]) => {
                            const prod = products.find(p => p.id === pId);
                            return (
                              <div key={pId} className="flex items-center gap-1 text-[10px] font-mono">
                                <span className="text-zinc-500" title={prod?.name}>{prod ? prod.sku : 'PROD'}:</span>
                                <span className="text-amber-400 font-bold bg-zinc-950 px-1 rounded border border-zinc-850">{key}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded transition"
                          title="Edit Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded transition"
                          title="Hapus Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-sans">Belum ada data member yang sesuai.</p>
            <p className="text-xs text-zinc-600 mt-1">Gunakan tombol "Tambah Member" atau terima transaksi masuk dari Webhook Lynk.id!</p>
          </div>
        )}
      </div>

      {memberToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Konfirmasi Hapus Keanggotaan</h3>
            </div>
            
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Apakah Anda yakin ingin menghapus keanggotaan <strong className="text-zinc-200">{memberToDelete.name}</strong> (<code className="text-zinc-300 font-mono text-[10px]">{memberToDelete.email}</code>)? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-sans text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMember(memberToDelete.id);
                  addAuditLog(
                    'MEMBER_DELETED',
                    'MEMBERSHIP',
                    `Menghapus keanggotaan member "${memberToDelete.name}" (${memberToDelete.email})`
                  );
                  setMemberToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-sans text-xs font-bold transition"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
