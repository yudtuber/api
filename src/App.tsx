import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Tag, Terminal, Bell, Award, Code2, ShieldAlert, 
  Activity, Settings, Lock, HelpCircle, LayoutDashboard, Database, ChevronRight 
} from 'lucide-react';
import { Product, Member, WebhookLog, Coupon, Affiliate, AuditLog, AutomationLog } from './types';

// Import Modular Components
import DashboardAnalytics from './components/DashboardAnalytics';
import ProductManager from './components/ProductManager';
import MemberManager from './components/MemberManager';
import WebhookSandbox from './components/WebhookSandbox';
import AutomationQueue from './components/AutomationQueue';
import BusinessTools from './components/BusinessTools';
import DeveloperStarterKit from './components/DeveloperStarterKit';

export default function App() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'MEMBERS' | 'SANDBOX' | 'AUTOMATIONS' | 'BUSINESS' | 'STARTER_KIT'>('DASHBOARD');

  // --- ADMIN SECURITY GATE STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>(() => localStorage.getItem('admin_password') || '');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Authenticated custom fetch wrapper
  const authedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      'x-admin-password': adminPassword
    };
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401 && url !== '/api/verify-password') {
      setIsAuthenticated(false);
      localStorage.removeItem('admin_password');
    }
    return res;
  };

  // --- FULL-STACK SERVER INTEGRATION ENGINE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [webhookSecret, setWebhookSecret] = useState<string>('whsec_lynk_membership_pro_9912');
  const [revenueData, setRevenueData] = useState<{ date: string; sales: number; signups: number }[]>([]);

  // Function to pull all current states from the server
  const fetchAllData = async () => {
    try {
      const [
        prodsRes, membersRes, webhooksRes, couponsRes, affiliatesRes, 
        auditsRes, automationsRes, secretRes, revenueRes
      ] = await Promise.all([
        authedFetch('/api/products'),
        authedFetch('/api/members'),
        authedFetch('/api/webhook-logs'),
        authedFetch('/api/coupons'),
        authedFetch('/api/affiliates'),
        authedFetch('/api/audit-logs'),
        authedFetch('/api/automation-logs'),
        authedFetch('/api/webhook-secret'),
        authedFetch('/api/revenue-data')
      ]);

      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (webhooksRes.ok) setWebhookLogs(await webhooksRes.json());
      if (couponsRes.ok) setCoupons(await couponsRes.json());
      if (affiliatesRes.ok) setAffiliates(await affiliatesRes.json());
      if (auditsRes.ok) setAuditLogs(await auditsRes.json());
      if (automationsRes.ok) setAutomationLogs(await automationsRes.json());
      if (secretRes.ok) {
        const s = await secretRes.json();
        setWebhookSecret(s.webhookSecret);
      }
      if (revenueRes.ok) setRevenueData(await revenueRes.json());
    } catch (err) {
      console.error('Error fetching full-stack state from server:', err);
    }
  };

  // Validate on initial load or if password changes
  useEffect(() => {
    if (adminPassword) {
      fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })
      .then(async (res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('admin_password');
          setAdminPassword('');
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
    } else {
      setIsAuthenticated(false);
    }
  }, [adminPassword]);

  // Poll server state every 4 seconds so real external webhooks refresh the UI instantly
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAllData();
    const interval = setInterval(fetchAllData, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminPassword]);

  // --- CRUD DISPATCHERS (PRODUCTS) ---
  const handleAddProduct = async (newProd: Product) => {
    try {
      await authedFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    try {
      await authedFetch(`/api/products/${updatedProd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd)
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await authedFetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- CRUD DISPATCHERS (MEMBERS) ---
  const handleAddMember = async (newMem: Member) => {
    try {
      await authedFetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMem)
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMember = async (updatedMem: Member) => {
    try {
      await authedFetch(`/api/members/${updatedMem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMem)
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await authedFetch(`/api/members/${id}`, {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- BUSINESS DISPATCHERS (COUPONS / AFFILIATES) ---
  const handleAddCoupon = async (newCop: Coupon) => {
    try {
      await authedFetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCop)
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await authedFetch(`/api/coupons/${id}`, {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAffiliate = async (newAff: Affiliate) => {
    try {
      await authedFetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAff)
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerAffiliateClick = async (id: string) => {
    try {
      await authedFetch(`/api/affiliates/${id}/click`, {
        method: 'POST'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearWebhookLogs = async () => {
    try {
      await authedFetch('/api/webhook-logs', {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAutomationLogs = async () => {
    try {
      await authedFetch('/api/automation-logs', {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- AUDIT LOG DISPATCHER ---
  const addAuditLog = async (
    action: string, 
    category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS', 
    details: string
  ) => {
    try {
      await authedFetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, category, details })
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- WEBHOOK ENGINE REAL SIMULATOR ---
  const handleTriggerWebhook = async (
    payload: any, 
    signature: string, 
    isCorrupted: boolean
  ): Promise<{ status: 'SUCCESS' | 'SIGNATURE_INVALID' | 'PRODUCT_NOT_FOUND' | 'ERROR'; message: string }> => {
    try {
      const signatureToSend = isCorrupted ? signature.replace(/.$/, 'X') : signature;
      
      const res = await fetch('/api/webhook/lynk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lynk-signature': signatureToSend
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      await fetchAllData();
      
      if (res.ok) {
        return {
          status: 'SUCCESS',
          message: data.message || 'Membership activated successfully.'
        };
      } else {
        return {
          status: data.code || 'ERROR',
          message: data.error || 'Server processed webhook with an error.'
        };
      }
    } catch (err) {
      console.error(err);
      return {
        status: 'ERROR',
        message: 'Gagal menghubungi server untuk mengirimkan webhook.'
      };
    }
  };

  // --- AUTOMATION RETRY ENGINE ---
  const handleTriggerRetry = async (logId: string) => {
    try {
      await authedFetch('/api/automation-logs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: logId })
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerRetryAll = async () => {
    try {
      await authedFetch('/api/automation-logs/retry-all', {
        method: 'POST'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsVerifying(true);
    setLoginError('');

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (res.ok) {
        localStorage.setItem('admin_password', passwordInput);
        setAdminPassword(passwordInput);
        setIsAuthenticated(true);
      } else {
        const errData = await res.json().catch(() => ({ error: 'Password salah' }));
        setLoginError(errData.error || 'Password yang Anda masukkan salah.');
      }
    } catch (err) {
      setLoginError('Koneksi gagal. Silakan coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans antialiased text-zinc-300">
        <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6 overflow-hidden">
          {/* Top visual accent decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"></div>
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Akses Terproteksi
            </h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Dashboard Keanggotaan Lynk.id Anda dilindungi untuk mencegah akses pihak tidak bertanggung jawab.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Kata Sandi Administrator
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password admin"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono pr-10 shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition text-xs"
                >
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              {loginError && (
                <p className="text-xs text-red-400 mt-1.5 font-semibold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs py-3 rounded-xl transition shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Buka Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="border-t border-zinc-800/80 pt-4 text-center">
            <p className="text-[10px] text-zinc-500 leading-normal">
              Ubah atau atur <code className="text-indigo-400 font-mono">ADMIN_PASSWORD</code> pada environment <code className="text-zinc-400">.env</code> untuk kustomisasi kata sandi. (Bawaan: <code className="text-zinc-400">admin123</code>)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col md:flex-row antialiased">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white p-2 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-sans font-bold text-sm tracking-tight text-white block">
                LYNK MEMBERSHIP
              </span>
              <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-wider uppercase block">
                Pro Dashboard v1.2
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {/* Tab Link: Dashboard */}
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                <span>Dashboard & Analisis</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {/* Tab Link: Catalog Products */}
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'PRODUCTS' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-zinc-400" />
                <span>Katalog Produk</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {/* Tab Link: Members Database */}
            <button
              onClick={() => setActiveTab('MEMBERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'MEMBERS' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>Database Anggota</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {/* Tab Link: Webhook Sandbox */}
            <button
              id="tab-sandbox"
              onClick={() => setActiveTab('SANDBOX')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'SANDBOX' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span>Integrasi Webhook</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                AKTIF
              </span>
            </button>

            {/* Tab Link: Automations */}
            <button
              onClick={() => setActiveTab('AUTOMATIONS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'AUTOMATIONS' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-zinc-400" />
                <span>Antrean & Otomatisasi</span>
              </div>
              {automationLogs.filter(l => l.status === 'FAILED').length > 0 && (
                <span className="bg-red-500/15 text-red-400 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                  {automationLogs.filter(l => l.status === 'FAILED').length} FAILED
                </span>
              )}
            </button>

            {/* Tab Link: Business Affiliate / Kupon */}
            <button
              onClick={() => setActiveTab('BUSINESS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'BUSINESS' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-zinc-400" />
                <span>Kupon & Afiliasi</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            {/* Tab Link: Export Codes */}
            <button
              onClick={() => setActiveTab('STARTER_KIT')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-200 ${
                activeTab === 'STARTER_KIT' 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Next.js Starter Kit</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>
          </nav>
        </div>

        {/* Production connection status footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20 font-mono text-[11px] text-zinc-500 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span className="font-bold text-[10px]">SISTEM PRODUKSI ONLINE</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('admin_password');
                setAdminPassword('');
                setIsAuthenticated(false);
              }}
              className="text-[10px] text-red-400 hover:text-red-300 transition underline cursor-pointer font-sans font-semibold"
            >
              Keluar
            </button>
          </div>
          <div>
            <p>SERVER: Vercel Cloud</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">DATABASE: Supabase Cloud Active</p>
          </div>
        </div>
      </aside>

      {/* Main content pane */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Render Active Dashboard Tab */}
        {activeTab === 'DASHBOARD' && (
          <DashboardAnalytics 
            products={products}
            members={members}
            affiliates={affiliates}
            coupons={coupons}
            revenueData={revenueData}
          />
        )}

        {/* Render Active Catalog Products Tab */}
        {activeTab === 'PRODUCTS' && (
          <ProductManager 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            addAuditLog={addAuditLog}
          />
        )}

        {/* Render Active Members Database Tab */}
        {activeTab === 'MEMBERS' && (
          <MemberManager 
            members={members}
            products={products}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            addAuditLog={addAuditLog}
          />
        )}

        {/* Render Active Webhook Sandbox Tab */}
        {activeTab === 'SANDBOX' && (
          <WebhookSandbox 
            products={products}
            affiliates={affiliates}
            webhookLogs={webhookLogs}
            onTriggerWebhook={handleTriggerWebhook}
            webhookSecret={webhookSecret}
            onChangeWebhookSecret={async (secret) => {
              try {
                await authedFetch('/api/webhook-secret', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ secret })
                });
                await fetchAllData();
              } catch (err) {
                console.error(err);
              }
            }}
            onClearLogs={handleClearWebhookLogs}
          />
        )}

        {/* Render Active Automations Queue Tab */}
        {activeTab === 'AUTOMATIONS' && (
          <AutomationQueue 
            automationLogs={automationLogs}
            auditLogs={auditLogs}
            onTriggerRetry={handleTriggerRetry}
            onTriggerRetryAll={handleTriggerRetryAll}
            onClearLogs={handleClearAutomationLogs}
            addAuditLog={addAuditLog}
          />
        )}

        {/* Render Active Business Utilities Tab */}
        {activeTab === 'BUSINESS' && (
          <BusinessTools 
            coupons={coupons}
            affiliates={affiliates}
            products={products}
            onAddCoupon={handleAddCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onAddAffiliate={handleAddAffiliate}
            onTriggerAffiliateClick={handleTriggerAffiliateClick}
            addAuditLog={addAuditLog}
          />
        )}

        {/* Render Active Next.js Starter Kit Tab */}
        {activeTab === 'STARTER_KIT' && (
          <DeveloperStarterKit />
        )}
      </main>
    </div>
  );
}
