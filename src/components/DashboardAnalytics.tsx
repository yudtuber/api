import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, ArrowUpRight, ShoppingBag, 
  Percent, Award, Activity, ShieldCheck 
} from 'lucide-react';
import { Product, Member, Affiliate, Coupon } from '../types';

interface AnalyticsProps {
  products: Product[];
  members: Member[];
  affiliates: Affiliate[];
  coupons: Coupon[];
  revenueData: { date: string; sales: number; signups: number }[];
}

export default function DashboardAnalytics({
  products,
  members,
  affiliates,
  coupons,
  revenueData,
}: AnalyticsProps) {
  // Compute Stats
  const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
  const pendingMembers = members.filter(m => m.status === 'PENDING').length;
  
  // Simulated revenue computation based on products purchased by active members
  const totalRevenue = members.reduce((acc, member) => {
    return acc + member.purchasedProducts.reduce((pAcc, productId) => {
      const prod = products.find(p => p.id === productId);
      return pAcc + (prod ? prod.price : 0);
    }, 0);
  }, 0);

  const totalCommissions = affiliates.reduce((acc, aff) => acc + aff.totalEarnings, 0);
  const netProfit = totalRevenue - totalCommissions;

  // Product sales counts
  const productSalesMap: { [name: string]: number } = {};
  products.forEach(p => {
    productSalesMap[p.name] = 0;
  });
  members.forEach(m => {
    m.purchasedProducts.forEach(pId => {
      const prod = products.find(p => p.id === pId);
      if (prod) {
        productSalesMap[prod.name] = (productSalesMap[prod.name] || 0) + 1;
      }
    });
  });

  const productChartData = Object.entries(productSalesMap).map(([name, sales]) => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    sales,
  }));

  // Colors for Recharts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Alert Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-4 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div>
            <span className="bg-blue-500/10 text-blue-400 text-xs font-mono font-medium px-2.5 py-1 rounded-full border border-blue-500/20">
              ⚡ LIVE - SIMULATOR CONNECTED
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2 font-sans">
              Lynk Membership Pro
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Platform otomatisasi membership & proteksi produk digital yang siap dihubungkan dengan Webhook Lynk.id. Gunakan Sandbox untuk menguji integrasi.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg font-mono text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-zinc-500 text-[10px] uppercase">Webhook Gateway</p>
              <p className="font-semibold text-white">active (200 OK)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm font-medium">Total Pendapatan Kotor</span>
            <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              {formatIDR(totalRevenue)}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400 inline" />
              <span className="text-emerald-400 font-semibold">+14.2%</span> dibanding bulan lalu
            </p>
          </div>
        </div>

        {/* Total Active Members */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm font-medium">Anggota Aktif</span>
            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              {activeMembers} <span className="text-zinc-500 text-sm font-normal">member</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              <span className="text-zinc-300 font-semibold">{pendingMembers}</span> pembayaran tertunda
            </p>
          </div>
        </div>

        {/* Affiliate Payouts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm font-medium">Pengeluaran Afiliasi</span>
            <div className="bg-amber-500/10 text-amber-400 p-2 rounded-lg border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              {formatIDR(totalCommissions)}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Dari <span className="text-zinc-300 font-semibold">{affiliates.reduce((acc, a) => acc + a.conversions, 0)}</span> transaksi referral
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm font-medium">Pendapatan Bersih</span>
            <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {formatIDR(netProfit)}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Keuntungan bersih setelah dikurangi komisi
            </p>
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Trend Graph */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-semibold font-sans">Grafik Pendapatan & Registrasi</h4>
              <p className="text-xs text-zinc-500">Histori harian (Simulasi webhook real-time)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-zinc-400">Revenue (IDR)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-400">Registrations</span>
              </div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" name="Revenue (IDR)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Sales Share Graph */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-white font-semibold font-sans mb-1">Penjualan per Produk</h4>
            <p className="text-xs text-zinc-500 mb-4">Distribusi volume pembelian produk</p>
          </div>
          
          <div className="h-56 w-full flex items-center justify-center">
            {productChartData.length > 0 && productChartData.some(d => d.sales > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={90} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sales" name="Penjualan" radius={[0, 4, 4, 0]}>
                    {productChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500 font-sans">Belum ada data penjualan.</p>
                <p className="text-xs text-zinc-600 mt-1">Simulasikan transaksi sukses di Sandbox Webhook!</p>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-3 mt-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">Produk Populer</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {products.slice(0, 2).map((p, idx) => (
                <div key={p.id} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <p className="text-[11px] text-zinc-400 truncate">{p.name}</p>
                  <p className="text-xs font-mono font-bold text-white mt-0.5">{p.sku}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-zinc-400 flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <p className="font-bold text-zinc-300">Lynk.id Signature Webhook</p>
            <p className="text-[11px]">Validasi HMAC-SHA256 Aktif & Siap pakai.</p>
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-zinc-400 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <div>
            <p className="font-bold text-zinc-300">Otomatisasi Fonnte / Resend</p>
            <p className="text-[11px]">WA & Email terintegrasi dengan Antrean Retry.</p>
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-zinc-400 flex items-center gap-3">
          <Percent className="w-5 h-5 text-amber-400" />
          <div>
            <p className="font-bold text-zinc-300">Sistem Lisensi & Kupon</p>
            <p className="text-[11px]">Generator Kunci Enkripsi & Pelacak Komisi Afiliasi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
