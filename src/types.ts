export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  downloadUrl: string;
  isActive: boolean;
  licenseRequired: boolean;
  productLink?: string;
  checkoutLink?: string;
  views?: number;
  clicks?: number;
  salesCount?: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  joinedAt: string;
  purchasedProducts: string[]; // List of Product IDs
  affiliateCode?: string;
  licenseKeys: { [productId: string]: string };
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  payload: any;
  headers: { [key: string]: string };
  status: 'SUCCESS' | 'SIGNATURE_INVALID' | 'PRODUCT_NOT_FOUND' | 'ERROR';
  signatureVerified: boolean;
  message: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  isActive: boolean;
  usedCount: number;
  maxUses?: number;
}

export interface Affiliate {
  id: string;
  code: string;
  name: string;
  commissionRate: number; // percentage
  clicks: number;
  conversions: number;
  totalEarnings: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'MEMBERSHIP' | 'PRODUCT' | 'WEBHOOK' | 'AUTHENTICATION' | 'AUTOMATION' | 'BUSINESS';
  details: string;
  user: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  type: 'EMAIL' | 'WHATSAPP';
  recipient: string;
  subjectOrTemplate: string;
  status: 'SENT' | 'FAILED' | 'RETRYING';
  retryCount: number;
  payload: string;
}

export interface License {
  id: string;
  key: string;
  productId: string;
  memberEmail: string;
  issuedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface SystemConfig {
  webhookSecret: string;
  storeName: string;
  emailSender: string;
  whatsappGatewayUrl: string;
  whatsappToken: string;
}
