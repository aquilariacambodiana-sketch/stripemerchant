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

export interface McpAgentTraceStep {
  step: number;
  toolName: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'failed';
  input: Record<string, any>;
  output: Record<string, any>;
  timestamp: string;
  latencyMs?: number;
}

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
  // Stripe MCP Agent fields
  mcpOrchestrated?: boolean;
  mcpTrace?: McpAgentTraceStep[];
  radarRiskScore?: number;
  radarOutcome?: 'allow' | 'manual_review' | 'block';
  isForceSale?: boolean;
  authCode?: string;
  agentSummary?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  favoriteItem?: string;
  ordersCount: number;
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
  // Radar & Risk Rules
  radarRiskLevel: 'normal' | 'elevated' | 'strict';
  radarBlockThreshold: number;
  useMcpAgentForCards: boolean;
  mcpModel: string;
  // Advanced Transaction & Security Rules
  requireCvc: boolean;
  requireZip: boolean;
  maxManualPunchAmount: number;
  supervisorPin: string;
  requireSupervisorPinForForceSale: boolean;
  captureMethod: 'automatic' | 'manual';
  autoEmailReceipt: boolean;
  defaultTipPercent: number;
  quickChargeAmounts: number[];
}
