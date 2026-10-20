export type Category = 'All' | 'Coffee & Drinks' | 'Bakery & Food' | 'Merchandise' | 'Services' | 'Custom';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  sku: string;
  image: string;
  stock: number;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customNote?: string;
}

export type PaymentMethod = 'stripe_card' | 'manual_punch' | 'cash' | 'gift_card';
export type TransactionStatus = 'succeeded' | 'pending_offline' | 'failed' | 'refunded' | 'partially_refunded';

export interface Transaction {
  id: string;
  receiptNumber: string;
  stripePaymentIntentId?: string;
  amount: number;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerEmail?: string;
  cardLast4?: string;
  cardBrand?: string;
  items: CartItem[];
  timestamp: string;
  offlineSynced: boolean;
  notes?: string;
  refundAmount?: number;
}

export interface StoreSettings {
  storeName: string;
  storeLocation: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  taxRate: number; // percentage e.g. 8.25
  stripePublishableKey: string;
  stripeSecretKey: string;
  receiptFooter: string;
  enableStoreAndForward: boolean;
  mode: 'test' | 'live';
  stripeConnectAccountId?: string;
  radarRiskLevel: 'normal' | 'elevated' | 'strict';
  radarBlockThreshold: number;
}
