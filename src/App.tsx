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
        fetch('/api/products'),
        fetch('/api/members'),
        fetch('/api/webhook-logs'),
        fetch('/api/coupons'),
        fetch('/api/affiliates'),
        fetch('/api/audit-logs'),
        fetch('/api/automation-logs'),
        fetch('/api/webhook-secret'),
        fetch('/api/revenue-data')
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

  // Poll server state every 4 seconds so real external webhooks refresh the UI instantly
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 4000);
    return () => clearInterval(interval);
  }, []);

  // --- CRUD DISPATCHERS (PRODUCTS) ---
  const handleAddProduct = async (newProd: Product) => {
    try {
      await fetch('/api/products', {
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
      await fetch(`/api/products/${updatedProd.id}`, {
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
      await fetch(`/api/products/${id}`, {
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
      await fetch('/api/members', {
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
      await fetch(`/api/members/${updatedMem.id}`, {
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
      await fetch(`/api/members/${id}`, {
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
      await fetch('/api/coupons', {
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
      await fetch(`/api/coupons/${id}`, {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAffiliate = async (newAff: Affiliate) => {
    try {
      await fetch('/api/affiliates', {
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
      await fetch(`/api/affiliates/${id}/click`, {
        method: 'POST'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearWebhookLogs = async () => {
    try {
      await fetch('/api/webhook-logs', {
        method: 'DELETE'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAutomationLogs = async () => {
    try {
      await fetch('/api/automation-logs', {
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
      await fetch('/api/audit-logs', {
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
      await fetch('/api/automation-logs/retry', {
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
      await fetch('/api/automation-logs/retry-all', {
        method: 'POST'
      });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

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
                <span>Sandbox Webhook</span>
              </div>
              <span className="bg-blue-500/10 text-blue-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                TEST
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

        {/* Console connection info footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20 font-mono text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="font-bold text-[10px]">LOCAL ENGINE ONLINE</span>
          </div>
          <p className="mt-1">SYS_TIME: 2026-07-11</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">DB_PORT: 5432 (Supabase)</p>
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
                await fetch('/api/webhook-secret', {
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
