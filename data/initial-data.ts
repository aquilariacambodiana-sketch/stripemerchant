import { Product, StoreSettings, Transaction } from '@/types/pos';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Artisan Espresso Double',
    price: 4.50,
    category: 'Coffee & Drinks',
    sku: 'COF-ESP-01',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    stock: 250,
    description: 'Rich, full-bodied double shot of single-origin espresso.'
  },
  {
    id: 'prod_2',
    name: 'Vanilla Oat Milk Latte',
    price: 6.25,
    category: 'Coffee & Drinks',
    sku: 'COF-LAT-02',
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
    stock: 120,
    description: 'Smooth espresso with creamy oat milk and organic vanilla syrup.'
  },
  {
    id: 'prod_3',
    name: 'Matcha Green Tea Latte',
    price: 6.75,
    category: 'Coffee & Drinks',
    sku: 'COF-MAT-03',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    stock: 85,
    description: 'Ceremonial grade Uji matcha with steamed milk of choice.'
  },
  {
    id: 'prod_4',
    name: 'Fresh Butter Croissant',
    price: 4.00,
    category: 'Bakery & Food',
    sku: 'BAK-CRO-01',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    stock: 40,
    description: 'Flaky, buttery French pastry baked fresh every morning.'
  },
  {
    id: 'prod_5',
    name: 'Avocado Sourdough Toast',
    price: 9.50,
    category: 'Bakery & Food',
    sku: 'BAK-AVO-02',
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80',
    stock: 30,
    description: 'Mashed avocado, chili flakes, microgreens, and lemon on artisan sourdough.'
  },
  {
    id: 'prod_6',
    name: 'Blueberry Lemon Muffin',
    price: 4.25,
    category: 'Bakery & Food',
    sku: 'BAK-MUF-03',
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefcc?auto=format&fit=crop&w=600&q=80',
    stock: 55,
    description: 'Packed with wild blueberries and topped with crunchy sugar crust.'
  },
  {
    id: 'prod_7',
    name: 'StripeFlow Branded Tumbler',
    price: 24.99,
    category: 'Merchandise',
    sku: 'MER-TUM-01',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80',
    stock: 75,
    description: 'Double-wall vacuum insulated stainless steel travel mug (16oz).'
  },
  {
    id: 'prod_8',
    name: 'Single-Origin Coffee Beans (12oz)',
    price: 18.00,
    category: 'Merchandise',
    sku: 'MER-BEA-02',
    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80',
    stock: 90,
    description: 'Ethiopian Yirgacheffe light roast with floral and citrus tasting notes.'
  },
  {
    id: 'prod_9',
    name: 'VIP Barista Masterclass',
    price: 120.00,
    category: 'Services',
    sku: 'SRV-BAR-01',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    stock: 15,
    description: '2-hour hands-on espresso brewing and latte art workshop.'
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'StripeFlow Flagship Cafe',
  storeLocation: 'San Francisco, CA (Terminal #4)',
  currency: 'USD',
  taxRate: 8.75,
  stripePublishableKey: 'pk_test_stripeflow_demo_key_9981',
  stripeSecretKey: 'sk_test_stripeflow_demo_secret_4412',
  receiptFooter: 'Thank you for your business! Powered by StripeFlow POS.',
  enableStoreAndForward: true,
  mode: 'test',
  radarRiskLevel: 'normal',
  radarBlockThreshold: 50
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_101',
    receiptNumber: 'REC-9921',
    stripePaymentIntentId: 'pi_3Mxxxx01',
    amount: 15.28,
    subtotal: 14.00,
    tax: 1.28,
    tip: 2.00,
    discount: 0,
    currency: 'USD',
    status: 'succeeded',
    paymentMethod: 'stripe_card',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    cardLast4: '4242',
    cardBrand: 'visa',
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 2 },
      { product: INITIAL_PRODUCTS[3], quantity: 1 }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    offlineSynced: true
  },
  {
    id: 'txn_102',
    receiptNumber: 'REC-9922',
    stripePaymentIntentId: 'pi_3Mxxxx02',
    amount: 28.50,
    subtotal: 26.21,
    tax: 2.29,
    tip: 4.50,
    discount: 2.00,
    currency: 'USD',
    status: 'succeeded',
    paymentMethod: 'manual_punch',
    customerName: 'Marcus Vance',
    customerEmail: 'mvance@startup.io',
    cardLast4: '8812',
    cardBrand: 'mastercard',
    items: [
      { product: INITIAL_PRODUCTS[4], quantity: 2 },
      { product: INITIAL_PRODUCTS[2], quantity: 1 }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    offlineSynced: true
  },
  {
    id: 'txn_103',
    receiptNumber: 'REC-9923',
    stripePaymentIntentId: 'pi_offline_993',
    amount: 6.75,
    subtotal: 6.21,
    tax: 0.54,
    tip: 0,
    discount: 0,
    currency: 'USD',
    status: 'pending_offline',
    paymentMethod: 'stripe_card',
    customerName: 'Alex Rivera',
    customerEmail: 'alex@designer.co',
    cardLast4: '1009',
    cardBrand: 'amex',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1 }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    offlineSynced: false
  }
];
