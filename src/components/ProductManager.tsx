import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Tag, Key, Globe, Eye, EyeOff, Save, X, Search 
} from 'lucide-react';
import { Product } from '../types';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  addAuditLog: (action: string, category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS', details: string) => void;
}

export default function ProductManager({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  addAuditLog,
}: ProductManagerProps) {
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null); // product.id or 'NEW'
  const [formError, setFormError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [licenseRequired, setLicenseRequired] = useState(false);

  // Filter products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setIsEditing(null);
    setFormError(null);
    setName('');
    setSku('');
    setPrice(0);
    setDescription('');
    setDownloadUrl('');
    setIsActive(true);
    setLicenseRequired(false);
  };

  const handleStartCreate = () => {
    setIsEditing('NEW');
    setFormError(null);
    setName('');
    setSku('PROD-' + Math.floor(1000 + Math.random() * 9000));
    setPrice(150000);
    setDescription('');
    setDownloadUrl('https://rsc.membership-pro.com/download/files');
    setIsActive(true);
    setLicenseRequired(true);
  };

  const handleStartEdit = (p: Product) => {
    setIsEditing(p.id);
    setFormError(null);
    setName(p.name);
    setSku(p.sku);
    setPrice(p.price);
    setDescription(p.description);
    setDownloadUrl(p.downloadUrl);
    setIsActive(p.isActive);
    setLicenseRequired(p.licenseRequired);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !sku.trim() || !downloadUrl.trim()) {
      setFormError('Nama, SKU, dan URL Download wajib diisi!');
      return;
    }

    if (isEditing === 'NEW') {
      const newProduct: Product = {
        id: 'p-' + Date.now(),
        name,
        sku: sku.toUpperCase().replace(/\s+/g, '-'),
        price,
        description,
        downloadUrl,
        isActive,
        licenseRequired,
      };
      onAddProduct(newProduct);
      addAuditLog(
        'PRODUCT_CREATED',
        'PRODUCT',
        `Membuat produk "${name}" dengan SKU "${sku.toUpperCase()}"`
      );
    } else if (isEditing) {
      const updatedProduct: Product = {
        id: isEditing,
        name,
        sku: sku.toUpperCase().replace(/\s+/g, '-'),
        price,
        description,
        downloadUrl,
        isActive,
        licenseRequired,
      };
      onUpdateProduct(updatedProduct);
      addAuditLog(
        'PRODUCT_UPDATED',
        'PRODUCT',
        `Memperbarui produk "${name}" (ID: ${isEditing})`
      );
    }
    resetForm();
  };

  const handleDelete = (p: Product) => {
    setProductToDelete(p);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            Katalog Produk Digital
          </h2>
          <p className="text-sm text-zinc-400">
            Kelola produk yang Anda jual di Lynk.id. SKU harus sama persis agar webhook berjalan otomatis.
          </p>
        </div>
        {!isEditing && (
          <button
            id="btn-add-product"
            onClick={handleStartCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-sans font-medium text-sm transition duration-200"
          >
            <Plus className="w-4 h-4" /> Tambah Produk Baru
          </button>
        )}
      </div>

      {/* Editor Form Modal or Block */}
      {isEditing && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-500" />
            {isEditing === 'NEW' ? 'Tambah Produk Baru' : 'Edit Detail Produk'}
          </h3>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Misal: Ebook Mastery React 19"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* SKU code */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  SKU Code (Sama dengan SKU di Lynk.id)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="Misal: EBOOK-REACT-19"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 uppercase"
                  required
                />
              </div>

              {/* Price in IDR */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Harga Jual (IDR)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  placeholder="150000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  required
                  min="0"
                />
              </div>

              {/* Secure Download URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  URL Download Produk (Akses File Rahasia)
                </label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={e => setDownloadUrl(e.target.value)}
                  placeholder="https://gdrive.com/access-keys-..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Deskripsi Singkat
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Deskripsi produk digital, lisensi, atau bonus yang didapatkan member..."
                className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Toggle options */}
            <div className="flex flex-wrap items-center gap-6 bg-zinc-950 p-4 rounded-lg border border-zinc-850">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={licenseRequired}
                  onChange={e => setLicenseRequired(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-white block">Butuh License Key</span>
                  <span className="text-[11px] text-zinc-500 block">Generator enkripsi akan mengeluarkan lisensi unik otomatis setelah bayar</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-sm font-semibold text-white block">Produk Aktif</span>
                  <span className="text-[11px] text-zinc-500 block">Bisa dibeli dan dapat diproses oleh Webhook Lynk.id</span>
                </div>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800">
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
                <Save className="w-4 h-4" /> Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product List Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Search and counters */}
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950/40">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari SKU atau nama produk..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-zinc-300 text-sm focus:outline-none focus:border-zinc-700 font-sans"
            />
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Total: <span className="text-zinc-300 font-semibold">{filteredProducts.length}</span> / {products.length} produk
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-zinc-400 text-sm">
              <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Nama & Deskripsi</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4 text-center">Proteksi Lisensi</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-950/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-white font-semibold block">{p.name}</span>
                        <span className="text-xs text-zinc-500 block truncate max-w-sm mt-0.5">
                          {p.description || 'Tidak ada deskripsi.'}
                        </span>
                        <span className="text-[11px] text-blue-400 font-mono flex items-center gap-1 mt-1">
                          <Globe className="w-3 h-3" /> {p.downloadUrl}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded font-mono text-xs font-semibold">
                        {p.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {formatIDR(p.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {p.licenseRequired ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <Key className="w-3 h-3" /> Ya
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">Tanpa Lisensi</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {p.isActive ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Aktif
                          </span>
                        ) : (
                          <span className="bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Nonaktif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded transition"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded transition"
                          title="Hapus Produk"
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
            <Tag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-sans">Produk tidak ditemukan atau katalog masih kosong.</p>
            <p className="text-xs text-zinc-600 mt-1">Buat produk digital pertama Anda menggunakan tombol di atas.</p>
          </div>
        )}
      </div>

      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Konfirmasi Hapus Produk</h3>
            </div>
            
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Apakah Anda yakin ingin menghapus produk <strong className="text-zinc-200">{productToDelete.name}</strong> dengan SKU <code className="text-zinc-300 font-mono text-[10px]">{productToDelete.sku}</code>?
              <span className="block mt-1.5 text-zinc-500">Semua member yang membeli produk ini tetap tercatat, namun tautan download akan terpengaruh.</span>
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-sans text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  addAuditLog(
                    'PRODUCT_DELETED',
                    'PRODUCT',
                    `Menghapus produk "${productToDelete.name}" dengan SKU "${productToDelete.sku}"`
                  );
                  setProductToDelete(null);
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
