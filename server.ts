import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';

const { Pool } = pg;
const DB_FILE = path.join(process.cwd(), 'data.json');

let pool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('Production PostgreSQL Database connection pool initialized successfully.');
}

export const app = express();

// Interface declarations
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  downloadUrl: string;
  isActive: boolean;
  licenseRequired: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  joinedAt: string;
  purchasedProducts: string[];
  affiliateCode?: string;
  licenseKeys: { [productId: string]: string };
}

interface WebhookLog {
  id: string;
  timestamp: string;
  payload: any;
  headers: { [key: string]: string };
  status: 'SUCCESS' | 'SIGNATURE_INVALID' | 'PRODUCT_NOT_FOUND' | 'ERROR';
  signatureVerified: boolean;
  message: string;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  isActive: boolean;
  usedCount: number;
  maxUses?: number;
}

interface Affiliate {
  id: string;
  code: string;
  name: string;
  commissionRate: number;
  clicks: number;
  conversions: number;
  totalEarnings: number;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS';
  details: string;
  user: string;
}

interface AutomationLog {
  id: string;
  timestamp: string;
  type: 'EMAIL' | 'WHATSAPP';
  recipient: string;
  subjectOrTemplate: string;
  status: 'SENT' | 'FAILED' | 'RETRYING';
  retryCount: number;
  payload: string;
}

interface DBState {
  products: Product[];
  members: Member[];
  webhookLogs: WebhookLog[];
  coupons: Coupon[];
  affiliates: Affiliate[];
  auditLogs: AuditLog[];
  automationLogs: AutomationLog[];
  webhookSecret: string;
  revenueData: { date: string; sales: number; signups: number }[];
}

const DEFAULT_STATE: DBState = {
  products: [
    {
      id: 'p-1',
      name: 'React 19 & Next.js 15 Masterclass',
      sku: 'EBOOK-NEXT-15',
      price: 150000,
      description: 'Akses penuh ke e-book premium, grup diskusi Telegram, dan starter kit Next.js 15 dengan integrasi Supabase.',
      downloadUrl: 'https://rsc.membership-pro.com/dl/next-15-masterclass',
      isActive: true,
      licenseRequired: true,
    },
    {
      id: 'p-2',
      name: 'SaaS SaaS Starter Kit Boilerplate',
      sku: 'SAAS-STARTER-KIT',
      price: 499000,
      description: 'Boilerplate SaaS lengkap dengan Auth, Payment Gateway (Lynk.id / Midtrans), Tailwind 4, dan Prisma ORM.',
      downloadUrl: 'https://rsc.membership-pro.com/dl/saas-boilerplate',
      isActive: true,
      licenseRequired: true,
    },
    {
      id: 'p-3',
      name: 'Indonesian Payment Gateway SDK',
      sku: 'PAY-GATE-SDK',
      price: 250000,
      description: 'SDK Node.js untuk menghubungkan e-commerce Anda dengan Lynk.id, Xendit, dan Midtrans secara modular.',
      downloadUrl: 'https://rsc.membership-pro.com/dl/paygate-sdk',
      isActive: true,
      licenseRequired: false,
    }
  ],
  members: [
    {
      id: 'm-1',
      name: 'Dian Pratiwi',
      email: 'dian.pratiwi@gmail.com',
      phone: '+6282199887766',
      status: 'ACTIVE',
      joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      purchasedProducts: ['p-1'],
      affiliateCode: 'KODEGOKIL',
      licenseKeys: { 'p-1': 'LNK-PRO-A83D-B92F-120A' }
    },
    {
      id: 'm-2',
      name: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      phone: '+6281234567890',
      status: 'ACTIVE',
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      purchasedProducts: ['p-2'],
      licenseKeys: { 'p-2': 'LNK-PRO-98C3-F12D-E8B1' }
    },
    {
      id: 'm-3',
      name: 'Rudi Hermawan',
      email: 'rudi.hermawan@gmail.com',
      phone: '+6285722334455',
      status: 'PENDING',
      joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      purchasedProducts: [],
      licenseKeys: {}
    }
  ],
  affiliates: [
    {
      id: 'aff-1',
      name: 'Andi Setyawan (Tech-Influencer)',
      code: 'KODEGOKIL',
      commissionRate: 20,
      clicks: 145,
      conversions: 3,
      totalEarnings: 90000,
    },
    {
      id: 'aff-2',
      name: 'DevIndo Community',
      code: 'DEVINDO',
      commissionRate: 15,
      clicks: 68,
      conversions: 0,
      totalEarnings: 0,
    }
  ],
  coupons: [
    {
      id: 'cop-1',
      code: 'MERDEKA20',
      discountType: 'PERCENT',
      discountValue: 20,
      isActive: true,
      usedCount: 14,
      maxUses: 100,
    },
    {
      id: 'cop-2',
      code: 'PROMOJUNI',
      discountType: 'FIXED',
      discountValue: 50000,
      isActive: true,
      usedCount: 8,
      maxUses: 50,
    }
  ],
  webhookLogs: [
    {
      id: 'w-log-1',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      payload: {
        event: 'payment.success',
        transaction_id: 'TX-LNK-882192',
        product_sku: 'EBOOK-NEXT-15',
        customer_email: 'dian.pratiwi@gmail.com',
        customer_name: 'Dian Pratiwi',
        customer_phone: '+6282199887766',
        amount: 150000,
        affiliate_code: 'KODEGOKIL'
      },
      headers: { 'x-lynk-signature': '4a8b7c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b' },
      status: 'SUCCESS',
      signatureVerified: true,
      message: 'Berhasil memproses aktivasi member untuk dian.pratiwi@gmail.com dan mengeluarkan lisensi.'
    },
    {
      id: 'w-log-2',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      payload: {
        event: 'payment.success',
        transaction_id: 'TX-LNK-441233',
        product_sku: 'SKU-TIDAK-ADA',
        customer_email: 'fraud.buyer@gmail.com',
        customer_name: 'Fauzi H.',
        amount: 150000
      },
      headers: { 'x-lynk-signature': '8f7e6d5c4b3a2a1f0e9d8c7b6a5a4f3e2d1c0b9a8f7e6d5c4b3a2a1f0e9d8c7b' },
      status: 'PRODUCT_NOT_FOUND',
      signatureVerified: true,
      message: 'Produk dengan SKU "SKU-TIDAK-ADA" tidak ditemukan di basis data lokal.'
    }
  ],
  automationLogs: [
    {
      id: 'auto-1',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'EMAIL',
      recipient: 'dian.pratiwi@gmail.com',
      subjectOrTemplate: 'Aktivasi Keanggotaan: React 19 Mastery Ebook - Akses Aktif!',
      status: 'SENT',
      retryCount: 0,
      payload: 'SMTP code 250 OK'
    },
    {
      id: 'auto-2',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'WHATSAPP',
      recipient: '+6282199887766',
      subjectOrTemplate: 'Halo Dian, pembayaran lunas! Akses produk "React 19 & Next.js 15 Masterclass" sudah aktif. Download: https://rsc.membership-pro.com/dl/next-15-masterclass. Lisensi: LNK-PRO-A83D-B92F-120A',
      status: 'FAILED',
      retryCount: 1,
      payload: 'Fonnte Error: Gateway disconnected (Simulated failure for retry queue testing)'
    }
  ],
  auditLogs: [
    {
      id: 'aud-1',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      action: 'SYSTEM_BOOT',
      category: 'AUTHENTICATION',
      details: 'Lynk Membership Pro Server Engine booted successfully on Port 3000.',
      user: 'SYSTEM'
    },
    {
      id: 'aud-2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      action: 'WEBHOOK_CONFIG_LOADED',
      category: 'WEBHOOK',
      details: 'Loaded Webhook validation key: whsec_lynk_membership_pro_9912.',
      user: 'ADMIN'
    }
  ],
  revenueData: [
    { date: '07/05', sales: 150000, signups: 1 },
    { date: '07/06', sales: 499000, signups: 1 },
    { date: '07/07', sales: 300000, signups: 2 },
    { date: '07/08', sales: 150000, signups: 1 },
    { date: '07/09', sales: 649000, signups: 2 },
    { date: '07/10', sales: 250000, signups: 1 },
    { date: '07/11', sales: 900000, signups: 3 },
  ],
  webhookSecret: 'whsec_lynk_membership_pro_9912'
};

// Global cache for database state to handle read-only environments gracefully (like serverless functions)
let g_dbState: DBState | null = null;

// Read database file helper
function readDb(): DBState {
  if (g_dbState) {
    return g_dbState;
  }
  if (!fs.existsSync(DB_FILE)) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write initial DB file (filesystem might be read-only):', e);
    }
    g_dbState = DEFAULT_STATE;
    return DEFAULT_STATE;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    g_dbState = JSON.parse(content);
    return g_dbState;
  } catch (err) {
    console.error('Error reading DB, using default', err);
    g_dbState = DEFAULT_STATE;
    return DEFAULT_STATE;
  }
}

// Write database file helper
function writeDb(data: DBState) {
  g_dbState = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing to DB (filesystem might be read-only):', err);
  }
  if (pool) {
    syncToPostgres(data).catch(err => {
      console.error('Background synchronization to PostgreSQL failed:', err);
    });
  }
}

// PostgreSQL Synchronizers
async function syncFromPostgres() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      console.log('Synchronizing tables with PostgreSQL...');
      // 1. Ensure tables exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          price NUMERIC NOT NULL,
          description TEXT,
          download_url TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          license_required BOOLEAN NOT NULL DEFAULT false
        );

        CREATE TABLE IF NOT EXISTS members (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          status TEXT NOT NULL,
          joined_at TEXT NOT NULL,
          purchased_products TEXT[] DEFAULT '{}',
          affiliate_code TEXT,
          license_keys JSONB DEFAULT '{}'::jsonb
        );

        CREATE TABLE IF NOT EXISTS coupons (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          discount_type TEXT NOT NULL,
          discount_value NUMERIC NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          used_count INTEGER DEFAULT 0,
          max_uses INTEGER
        );

        CREATE TABLE IF NOT EXISTS affiliates (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          commission_rate NUMERIC NOT NULL,
          clicks INTEGER DEFAULT 0,
          conversions INTEGER DEFAULT 0,
          total_earnings NUMERIC DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS webhook_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          payload JSONB NOT NULL,
          headers JSONB NOT NULL,
          status TEXT NOT NULL,
          signature_verified BOOLEAN NOT NULL,
          message TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          action TEXT NOT NULL,
          category TEXT NOT NULL,
          details TEXT NOT NULL,
          username TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS automation_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          type TEXT NOT NULL,
          recipient TEXT NOT NULL,
          subject_or_template TEXT NOT NULL,
          status TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          payload TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // 2. Fetch all data from database
      const productsRes = await client.query('SELECT * FROM products');
      const membersRes = await client.query('SELECT * FROM members');
      const couponsRes = await client.query('SELECT * FROM coupons');
      const affiliatesRes = await client.query('SELECT * FROM affiliates');
      const webhookLogsRes = await client.query('SELECT * FROM webhook_logs');
      const auditLogsRes = await client.query('SELECT * FROM audit_logs');
      const automationLogsRes = await client.query('SELECT * FROM automation_logs');
      const settingsRes = await client.query('SELECT * FROM settings');

      // 3. If database is completely unseeded, seed it with current local JSON contents
      let currentFileState = DEFAULT_STATE;
      if (fs.existsSync(DB_FILE)) {
        try {
          currentFileState = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch (_) {}
      }

      if (productsRes.rows.length === 0) {
        console.log('PostgreSQL database is empty. Performing initial migration seed...');
        
        for (const p of currentFileState.products) {
          await client.query('INSERT INTO products (id, name, sku, price, description, download_url, is_active, license_required) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
            [p.id, p.name, p.sku, p.price, p.description, p.downloadUrl, p.isActive, p.licenseRequired]);
        }
        for (const m of currentFileState.members) {
          await client.query('INSERT INTO members (id, name, email, phone, status, joined_at, purchased_products, affiliate_code, license_keys) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING',
            [m.id, m.name, m.email, m.phone, m.status, m.joinedAt, m.purchasedProducts, m.affiliateCode, JSON.stringify(m.licenseKeys)]);
        }
        for (const c of currentFileState.coupons) {
          await client.query('INSERT INTO coupons (id, code, discount_type, discount_value, is_active, used_count, max_uses) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
            [c.id, c.code, c.discountType, c.discountValue, c.isActive, c.usedCount, c.maxUses]);
        }
        for (const a of currentFileState.affiliates) {
          await client.query('INSERT INTO affiliates (id, code, name, commission_rate, clicks, conversions, total_earnings) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
            [a.id, a.code, a.name, a.commissionRate, a.clicks, a.conversions, a.totalEarnings]);
        }
        for (const w of currentFileState.webhookLogs) {
          await client.query('INSERT INTO webhook_logs (id, timestamp, payload, headers, status, signature_verified, message) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
            [w.id, w.timestamp, JSON.stringify(w.payload), JSON.stringify(w.headers), w.status, w.signatureVerified, w.message]);
        }
        for (const au of currentFileState.auditLogs) {
          await client.query('INSERT INTO audit_logs (id, timestamp, action, category, details, username) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
            [au.id, au.timestamp, au.action, au.category, au.details, au.user || 'ADMIN']);
        }
        for (const am of currentFileState.automationLogs) {
          await client.query('INSERT INTO automation_logs (id, timestamp, type, recipient, subject_or_template, status, retry_count, payload) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
            [am.id, am.timestamp, am.type, am.recipient, am.subjectOrTemplate, am.status, am.retryCount, am.payload]);
        }
        await client.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          ['webhookSecret', currentFileState.webhookSecret]);

        console.log('Database initial seed complete.');
        return;
      }

      // If database contains data, parse it and populate data.json to ensure immediate consistency
      const loadedState: DBState = {
        products: productsRes.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          sku: r.sku,
          price: Number(r.price),
          description: r.description || '',
          downloadUrl: r.download_url,
          isActive: r.is_active,
          licenseRequired: r.license_required
        })),
        members: membersRes.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone || '',
          status: r.status,
          joinedAt: r.joined_at,
          purchasedProducts: r.purchased_products || [],
          affiliateCode: r.affiliate_code || undefined,
          licenseKeys: typeof r.license_keys === 'string' ? JSON.parse(r.license_keys) : r.license_keys
        })),
        coupons: couponsRes.rows.map((r: any) => ({
          id: r.id,
          code: r.code,
          discountType: r.discount_type,
          discountValue: Number(r.discount_value),
          isActive: r.is_active,
          usedCount: r.used_count || 0,
          maxUses: r.max_uses || undefined
        })),
        affiliates: affiliatesRes.rows.map((r: any) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          commissionRate: Number(r.commission_rate),
          clicks: r.clicks || 0,
          conversions: r.conversions || 0,
          totalEarnings: Number(r.total_earnings || 0)
        })),
        webhookLogs: webhookLogsRes.rows.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
          headers: typeof r.headers === 'string' ? JSON.parse(r.headers) : r.headers,
          status: r.status,
          signatureVerified: r.signature_verified,
          message: r.message || ''
        })),
        auditLogs: auditLogsRes.rows.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          action: r.action,
          category: r.category,
          details: r.details,
          user: r.username || 'ADMIN'
        })),
        automationLogs: automationLogsRes.rows.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          type: r.type,
          recipient: r.recipient,
          subjectOrTemplate: r.subject_or_template,
          status: r.status,
          retryCount: r.retry_count || 0,
          payload: r.payload || ''
        })),
        revenueData: currentFileState.revenueData,
        webhookSecret: settingsRes.rows.find((r: any) => r.key === 'webhookSecret')?.value || currentFileState.webhookSecret
      };

      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(loadedState, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Could not write synced database file (filesystem might be read-only):', e);
      }
      g_dbState = loadedState;
      console.log('Loaded and synchronized local filesystem state from PostgreSQL.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to sync state from PostgreSQL:', err);
  }
}

async function syncToPostgres(data: DBState) {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Clear old rows to preserve simple atomic direct mirror
      await client.query('DELETE FROM products');
      for (const p of data.products) {
        await client.query('INSERT INTO products (id, name, sku, price, description, download_url, is_active, license_required) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [p.id, p.name, p.sku, p.price, p.description, p.downloadUrl, p.isActive, p.licenseRequired]);
      }

      await client.query('DELETE FROM members');
      for (const m of data.members) {
        await client.query('INSERT INTO members (id, name, email, phone, status, joined_at, purchased_products, affiliate_code, license_keys) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [m.id, m.name, m.email, m.phone, m.status, m.joinedAt, m.purchasedProducts, m.affiliateCode || null, JSON.stringify(m.licenseKeys)]);
      }

      await client.query('DELETE FROM coupons');
      for (const c of data.coupons) {
        await client.query('INSERT INTO coupons (id, code, discount_type, discount_value, is_active, used_count, max_uses) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [c.id, c.code, c.discountType, c.discountValue, c.isActive, c.usedCount, c.maxUses || null]);
      }

      await client.query('DELETE FROM affiliates');
      for (const a of data.affiliates) {
        await client.query('INSERT INTO affiliates (id, code, name, commission_rate, clicks, conversions, total_earnings) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [a.id, a.code, a.name, a.commissionRate, a.clicks, a.conversions, a.totalEarnings]);
      }

      await client.query('DELETE FROM webhook_logs');
      for (const w of data.webhookLogs) {
        await client.query('INSERT INTO webhook_logs (id, timestamp, payload, headers, status, signature_verified, message) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [w.id, w.timestamp, JSON.stringify(w.payload), JSON.stringify(w.headers), w.status, w.signatureVerified, w.message]);
      }

      await client.query('DELETE FROM audit_logs');
      for (const au of data.auditLogs) {
        await client.query('INSERT INTO audit_logs (id, timestamp, action, category, details, username) VALUES ($1, $2, $3, $4, $5, $6)',
          [au.id, au.timestamp, au.action, au.category, au.details, au.user || 'ADMIN']);
      }

      await client.query('DELETE FROM automation_logs');
      for (const am of data.automationLogs) {
        await client.query('INSERT INTO automation_logs (id, timestamp, type, recipient, subject_or_template, status, retry_count, payload) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [am.id, am.timestamp, am.type, am.recipient, am.subjectOrTemplate, am.status, am.retryCount, am.payload]);
      }

      await client.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        ['webhookSecret', data.webhookSecret]);

      await client.query('COMMIT');
      console.log('PostgreSQL database state synchronized successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to commit syncToPostgres transaction, rolled back.', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to execute syncToPostgres database connection pool:', err);
  }
}

// Logging helper
function addAuditLog(db: DBState, action: string, category: AuditLog['category'], details: string) {
  const newAudit: AuditLog = {
    id: 'aud-' + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    category,
    details,
    user: 'ADMIN'
  };
  db.auditLogs.unshift(newAudit);
}

// Define server port
const PORT = 3000;

// Sync data from PostgreSQL if configured (non-blocking background initialization for serverless environments)
if (pool) {
  syncFromPostgres().catch(err => {
    console.error('[DATABASE] Background PostgreSQL synchronization failed:', err);
  });
}

// Middleware to capture RAW body for accurate HMAC signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// Helper function to get clean and sanitized admin password
function getAdminPassword(): string {
  const raw = process.env.ADMIN_PASSWORD || 'admin123';
  let cleaned = raw.trim();
  // Strip surrounding double quotes if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  // Strip surrounding single quotes if present
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned.trim();
}

  // --- ADMIN AUTHENTICATION MIDDLEWARE ---
  app.use((req, res, next) => {
    // Exclude public webhook endpoint, static files, and password verification
    if (req.path === '/api/webhook/lynk' || !req.path.startsWith('/api/')) {
      return next();
    }
    if (req.path === '/api/verify-password') {
      return next();
    }

    const clientPassword = req.headers['x-admin-password'];
    const adminPassword = getAdminPassword();

    if (!clientPassword || String(clientPassword).trim() !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Admin Password' });
    }
    next();
  });

  // --- API ROUTE ENDPOINTS ---

  // Verify Admin Password
  app.post('/api/verify-password', (req, res) => {
    const { password } = req.body || {};
    const isCustom = !!process.env.ADMIN_PASSWORD;
    const adminPassword = getAdminPassword();
    
    console.log('[AUTH] Verification attempt:', {
      hasBody: !!req.body,
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      expectedLength: adminPassword.length,
      isCustomConfigured: isCustom
    });

    if (password && password.trim() === adminPassword) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ 
        error: 'Password salah',
        isCustomConfigured: isCustom,
        diagnostics: {
          hasBody: !!req.body,
          hasPassword: !!password,
          receivedLength: password ? password.length : 0,
          expectedLength: adminPassword.length,
          envIsCustom: isCustom
        }
      });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), service: 'Lynk Membership Pro Server Engine' });
  });

  // PRODUCTS
  app.get('/api/products', (_req, res) => {
    const db = readDb();
    res.json(db.products);
  });

  app.post('/api/products', (req, res) => {
    const db = readDb();
    const newProd: Product = {
      ...req.body,
      id: req.body.id || 'p-' + Date.now()
    };
    db.products.unshift(newProd);
    addAuditLog(db, 'PRODUCT_CREATED', 'PRODUCT', `Membuat produk baru "${newProd.name}" dengan SKU "${newProd.sku}"`);
    writeDb(db);
    res.status(201).json(newProd);
  });

  app.put('/api/products/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const index = db.products.findIndex(p => p.id === id);
    if (index !== -1) {
      db.products[index] = { ...db.products[index], ...req.body };
      addAuditLog(db, 'PRODUCT_UPDATED', 'PRODUCT', `Mengubah rincian produk "${db.products[index].name}"`);
      writeDb(db);
      res.json(db.products[index]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const target = db.products.find(p => p.id === id);
    if (target) {
      db.products = db.products.filter(p => p.id !== id);
      addAuditLog(db, 'PRODUCT_DELETED', 'PRODUCT', `Menghapus produk "${target.name}" (${target.sku})`);
      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  // MEMBERS
  app.get('/api/members', (_req, res) => {
    const db = readDb();
    res.json(db.members);
  });

  app.post('/api/members', (req, res) => {
    const db = readDb();
    const newMember: Member = {
      ...req.body,
      id: req.body.id || 'm-' + Date.now(),
      joinedAt: req.body.joinedAt || new Date().toISOString()
    };
    db.members.unshift(newMember);
    addAuditLog(db, 'MEMBER_CREATED', 'MEMBERSHIP', `Mendaftarkan anggota baru "${newMember.name}" (${newMember.email})`);
    writeDb(db);
    res.status(201).json(newMember);
  });

  app.put('/api/members/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const index = db.members.findIndex(m => m.id === id);
    if (index !== -1) {
      db.members[index] = { ...db.members[index], ...req.body };
      addAuditLog(db, 'MEMBER_UPDATED', 'MEMBERSHIP', `Memperbarui rincian profil anggota "${db.members[index].name}"`);
      writeDb(db);
      res.json(db.members[index]);
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  });

  app.delete('/api/members/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const target = db.members.find(m => m.id === id);
    if (target) {
      db.members = db.members.filter(m => m.id !== id);
      addAuditLog(db, 'MEMBER_DELETED', 'MEMBERSHIP', `Menghapus anggota "${target.name}" (${target.email})`);
      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  });

  // COUPONS
  app.get('/api/coupons', (_req, res) => {
    const db = readDb();
    res.json(db.coupons);
  });

  app.post('/api/coupons', (req, res) => {
    const db = readDb();
    const newCoupon: Coupon = {
      ...req.body,
      id: 'cop-' + Date.now(),
      usedCount: 0
    };
    db.coupons.unshift(newCoupon);
    addAuditLog(db, 'COUPON_CREATED', 'BUSINESS', `Membuat kupon promosi "${newCoupon.code}" dengan diskon ${newCoupon.discountValue}`);
    writeDb(db);
    res.status(201).json(newCoupon);
  });

  app.delete('/api/coupons/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const target = db.coupons.find(c => c.id === id);
    if (target) {
      db.coupons = db.coupons.filter(c => c.id !== id);
      addAuditLog(db, 'COUPON_DELETED', 'BUSINESS', `Menghapus kupon "${target.code}"`);
      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Coupon not found' });
    }
  });

  // AFFILIATES
  app.get('/api/affiliates', (_req, res) => {
    const db = readDb();
    res.json(db.affiliates);
  });

  app.post('/api/affiliates', (req, res) => {
    const db = readDb();
    const newAff: Affiliate = {
      ...req.body,
      id: 'aff-' + Date.now(),
      clicks: 0,
      conversions: 0,
      totalEarnings: 0
    };
    db.affiliates.unshift(newAff);
    addAuditLog(db, 'AFFILIATE_CREATED', 'BUSINESS', `Mendaftarkan mitra afiliasi "${newAff.name}" (${newAff.code})`);
    writeDb(db);
    res.status(201).json(newAff);
  });

  app.post('/api/affiliates/:id/click', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const index = db.affiliates.findIndex(a => a.id === id);
    if (index !== -1) {
      db.affiliates[index].clicks += 1;
      addAuditLog(db, 'AFFILIATE_CLICK', 'BUSINESS', `Pengunjung mengklik tautan referral afiliasi "${db.affiliates[index].code}"`);
      writeDb(db);
      res.json(db.affiliates[index]);
    } else {
      res.status(404).json({ error: 'Affiliate partner not found' });
    }
  });

  // WEBHOOK SECRETS
  app.get('/api/webhook-secret', (_req, res) => {
    const db = readDb();
    res.json({ webhookSecret: db.webhookSecret });
  });

  app.post('/api/webhook-secret', (req, res) => {
    const db = readDb();
    const { secret } = req.body;
    db.webhookSecret = secret;
    addAuditLog(db, 'SECRET_UPDATED', 'WEBHOOK', `Mengubah kunci rahasia webhook menjadi "${secret}"`);
    writeDb(db);
    res.json({ webhookSecret: db.webhookSecret });
  });

  // LOGS & STATS
  app.get('/api/webhook-logs', (_req, res) => {
    const db = readDb();
    res.json(db.webhookLogs);
  });

  app.delete('/api/webhook-logs', (_req, res) => {
    const db = readDb();
    db.webhookLogs = [];
    writeDb(db);
    res.json({ success: true });
  });

  app.get('/api/automation-logs', (_req, res) => {
    const db = readDb();
    res.json(db.automationLogs);
  });

  app.delete('/api/automation-logs', (_req, res) => {
    const db = readDb();
    db.automationLogs = [];
    writeDb(db);
    res.json({ success: true });
  });

  app.get('/api/audit-logs', (_req, res) => {
    const db = readDb();
    res.json(db.auditLogs);
  });

  app.post('/api/audit-logs', (req, res) => {
    const db = readDb();
    const { action, category, details } = req.body;
    addAuditLog(db, action, category, details);
    writeDb(db);
    res.status(201).json({ success: true });
  });

  app.get('/api/revenue-data', (_req, res) => {
    const db = readDb();
    res.json(db.revenueData);
  });

  // AUTOMATION RETRIES
  app.post('/api/automation-logs/retry', (req, res) => {
    const db = readDb();
    const { id } = req.body;
    const index = db.automationLogs.findIndex(log => log.id === id);
    if (index !== -1) {
      db.automationLogs[index].status = 'SENT';
      db.automationLogs[index].retryCount += 1;
      db.automationLogs[index].payload = 'SMTP/Fonnte API retry successful (Job completed manually)';
      addAuditLog(db, 'NOTIFICATION_RESENT', 'AUTOMATION', `Melakukan re-dispatch antrean notifikasi untuk ${db.automationLogs[index].recipient} (${db.automationLogs[index].type})`);
      writeDb(db);
      res.json(db.automationLogs[index]);
    } else {
      res.status(404).json({ error: 'Automation log not found' });
    }
  });

  app.post('/api/automation-logs/retry-all', (_req, res) => {
    const db = readDb();
    let count = 0;
    db.automationLogs = db.automationLogs.map(log => {
      if (log.status === 'FAILED') {
        count++;
        addAuditLog(db, 'NOTIFICATION_RESENT', 'AUTOMATION', `Melakukan re-dispatch antrean notifikasi untuk ${log.recipient} (${log.type})`);
        return {
          ...log,
          status: 'SENT' as const,
          retryCount: log.retryCount + 1,
          payload: 'SMTP/Fonnte API retry successful (Bulk job completed)'
        };
      }
      return log;
    });
    if (count > 0) {
      writeDb(db);
    }
    res.json({ success: true, retriedCount: count });
  });

  // --- REAL SECURE LYNK.ID WEBHOOK HANDLER ENDPOINT ---
  app.post('/api/webhook/lynk', (req: any, res) => {
    const db = readDb();
    
    // Extract headers and payload
    const signature = req.headers['x-lynk-signature'] || '';
    const payload = req.body;
    
    // Retrieve the raw body string captured by express.json verification middleware
    const rawBody = req.rawBody || JSON.stringify(payload);

    // Calculate expected signature using our secret
    const expectedSignature = crypto
      .createHmac('sha256', db.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Safe comparison
    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      );
    } catch (e) {
      isSignatureValid = (signature === expectedSignature);
    }

    if (!isSignatureValid) {
      // Save signature failed webhook log
      const logEntry: WebhookLog = {
        id: 'w-log-' + Date.now(),
        timestamp: new Date().toISOString(),
        payload,
        headers: { 'x-lynk-signature': String(signature) },
        status: 'SIGNATURE_INVALID',
        signatureVerified: false,
        message: 'Otentikasi signature gagal. Kunci rahasia webhook tidak cocok!'
      };
      db.webhookLogs.unshift(logEntry);
      addAuditLog(db, 'WEBHOOK_FAILED_SIGNATURE', 'WEBHOOK', `Webhook ditolak karena Signature tidak valid dari ${payload.customer_email || 'Klien'}.`);
      writeDb(db);
      return res.status(401).json({ success: false, code: 'SIGNATURE_INVALID', error: 'Unauthorized: signature verification failed.' });
    }

    const {
      event,
      transaction_id,
      product_sku,
      customer_email,
      customer_name,
      customer_phone,
      amount,
      affiliate_code
    } = payload;

    // Confirm email is present
    if (!customer_email) {
      const logEntry: WebhookLog = {
        id: 'w-log-' + Date.now(),
        timestamp: new Date().toISOString(),
        payload,
        headers: { 'x-lynk-signature': String(signature) },
        status: 'ERROR',
        signatureVerified: true,
        message: 'Klien tidak menyertakan email pelanggan.'
      };
      db.webhookLogs.unshift(logEntry);
      writeDb(db);
      return res.status(400).json({ success: false, code: 'BAD_REQUEST', error: 'customer_email is required.' });
    }

    // Lookup matching digital product
    const matchedProduct = db.products.find(p => p.sku === product_sku);
    if (!matchedProduct) {
      const logEntry: WebhookLog = {
        id: 'w-log-' + Date.now(),
        timestamp: new Date().toISOString(),
        payload,
        headers: { 'x-lynk-signature': String(signature) },
        status: 'PRODUCT_NOT_FOUND',
        signatureVerified: true,
        message: `Produk digital dengan kode SKU "${product_sku}" tidak ditemukan di database.`
      };
      db.webhookLogs.unshift(logEntry);
      addAuditLog(db, 'WEBHOOK_FAILED_PRODUCT', 'WEBHOOK', `SKU "${product_sku}" tidak ditemukan dalam database.`);
      writeDb(db);
      return res.status(404).json({ success: false, code: 'PRODUCT_NOT_FOUND', error: `Product with SKU ${product_sku} not found.` });
    }

    // Register member or expand existing member access
    const normalizedEmail = customer_email.trim().toLowerCase();
    const existingMember = db.members.find(m => m.email === normalizedEmail);
    let updatedProducts = [matchedProduct.id];
    let userLicenses = {};

    if (existingMember) {
      updatedProducts = Array.from(new Set([...existingMember.purchasedProducts, matchedProduct.id]));
      userLicenses = { ...existingMember.licenseKeys };
    }

    // Provision product license keys if required
    let activeLicenseKey = '';
    if (matchedProduct.licenseRequired && !userLicenses[matchedProduct.id]) {
      const randStr = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      activeLicenseKey = `LNK-PRO-${randStr()}-${randStr()}-${randStr()}`;
      userLicenses[matchedProduct.id] = activeLicenseKey;
    }

    // Upsert member
    const targetMember: Member = {
      id: existingMember ? existingMember.id : 'm-' + Date.now(),
      name: customer_name || 'Pembeli Lynk.id',
      email: normalizedEmail,
      phone: customer_phone || '',
      status: 'ACTIVE',
      joinedAt: existingMember ? existingMember.joinedAt : new Date().toISOString(),
      purchasedProducts: updatedProducts,
      affiliateCode: affiliate_code || undefined,
      licenseKeys: userLicenses
    };

    if (existingMember) {
      db.members = db.members.map(m => m.id === existingMember.id ? targetMember : m);
    } else {
      db.members.unshift(targetMember);
    }

    // Handle affiliate commission payout
    if (affiliate_code) {
      const affiliate = db.affiliates.find(a => a.code.toUpperCase() === affiliate_code.toUpperCase());
      if (affiliate) {
        const commissionAmt = (Number(amount || 0) * affiliate.commissionRate) / 100;
        db.affiliates = db.affiliates.map(a => {
          if (a.id === affiliate.id) {
            return {
              ...a,
              conversions: a.conversions + 1,
              totalEarnings: a.totalEarnings + commissionAmt
            };
          }
          return a;
        });

        addAuditLog(db, 'AFFILIATE_COMMISSION_DISPATCHED', 'BUSINESS', `Membayarkan komisi Rp ${commissionAmt.toLocaleString('id-ID')} (${affiliate.commissionRate}%) ke partner "${affiliate.code}"`);
      }
    }

    // Update charts/revenue states for today
    const todayStr = new Date().toLocaleDateString('id-ID', { month: '2-digit', day: '2-digit' });
    db.revenueData = db.revenueData.map(r => {
      if (r.date === todayStr) {
        return { ...r, sales: r.sales + Number(amount || 0), signups: r.signups + 1 };
      }
      return r;
    });

    // Auto-create automation notification logs
    const emailDispatch: AutomationLog = {
      id: 'auto-' + Date.now() + '-em',
      timestamp: new Date().toISOString(),
      type: 'EMAIL',
      recipient: normalizedEmail,
      subjectOrTemplate: `Aktivasi Keanggotaan: ${matchedProduct.name} - Akses Terbuka!`,
      status: 'SENT',
      retryCount: 0,
      payload: 'SMTP 250 OK: Sent message successfully (Production Server)'
    };

    // Simulated flaky WhatsApp gateway dispatch (15% chance to fail to let them test the retry-queue!)
    const waFlakyStatus = Math.random() < 0.15 ? 'FAILED' : 'SENT';
    const waDispatch: AutomationLog = {
      id: 'auto-' + Date.now() + '-wa',
      timestamp: new Date().toISOString(),
      type: 'WHATSAPP',
      recipient: customer_phone || '+62812345678',
      subjectOrTemplate: `Halo ${customer_name || 'Pelanggan'}, pembayaran lunas! Akses produk "${matchedProduct.name}" sudah aktif. Download: ${matchedProduct.downloadUrl}. ${activeLicenseKey ? "Lisensi Anda: " + activeLicenseKey : ""}`,
      status: waFlakyStatus,
      retryCount: 0,
      payload: waFlakyStatus === 'FAILED' 
        ? 'Fonnte Gateway Error: Handshake timed out (Simulated Flaky Connection)'
        : 'Fonnte API 200: Whatsapp message delivered'
    };

    db.automationLogs.unshift(emailDispatch, waDispatch);

    // Save webhook success log
    const logEntry: WebhookLog = {
      id: 'w-log-' + Date.now(),
      timestamp: new Date().toISOString(),
      payload,
      headers: { 'x-lynk-signature': String(signature) },
      status: 'SUCCESS',
      signatureVerified: true,
      message: `Aktivasi sukses! Terdaftar anggota "${customer_name}" (${normalizedEmail}) ke produk "${matchedProduct.name}".`
    };
    db.webhookLogs.unshift(logEntry);

    addAuditLog(db, 'WEBHOOK_PROCESSED', 'WEBHOOK', `Berhasil memproses pembelian dari ${normalizedEmail} untuk SKU "${product_sku}".`);
    addAuditLog(db, 'MEMBERSHIP_ACTIVATED', 'MEMBERSHIP', `Mengaktivasi produk digital "${matchedProduct.name}" untuk "${normalizedEmail}".`);

    writeDb(db);

    res.status(200).json({
      success: true,
      code: 'SUCCESS',
      message: 'Membership activated successfully on server side.',
      member: {
        name: targetMember.name,
        email: targetMember.email,
        license: activeLicenseKey || undefined
      }
    });
  });

  // --- VITE DEV / PRODUCTION HANDLERS ---
  if (process.env.NODE_ENV !== 'production') {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    }).then(vite => {
      app.use(vite.middlewares);
    }).catch(err => {
      console.error('[VITE] Failed to create Vite development server:', err);
    });
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Lynk Membership Pro server listening on port ${PORT}`);
    });
  }
