'use client';

import React, { useState } from 'react';
import { Product, CartItem, Category, StoreSettings, Transaction } from '@/types/pos';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  Mic, 
  Barcode, 
  Tag, 
  DollarSign, 
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface POSTerminalProps {
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpenManualPunch: () => void;
  onCompleteTransaction: (paymentMethod: 'stripe_card' | 'manual_punch' | 'cash' | 'gift_card', amount: number, tip: number, customerName?: string, customerEmail?: string) => Promise<void>;
  isProcessing: boolean;
}

export const POSTerminal: React.FC<POSTerminalProps> = ({
  products,
  settings,
  cart,
  setCart,
  onOpenManualPunch,
  onCompleteTransaction,
  isProcessing
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [customTip, setCustomTip] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  
  // Natural language order state
  const [nlInput, setNlInput] = useState('');
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [parseError, setParseError] = useState('');

  // Cash modal state
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashTendered, setCashTendered] = useState('');

  // Custom amount modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customItemName, setCustomItemName] = useState('Custom POS Item');

  const categories: Category[] = ['All', 'Coffee & Drinks', 'Bakery & Food', 'Merchandise', 'Services'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * settings.taxRate) / 100;
  const calculatedTip = customTip !== '' ? parseFloat(customTip) || 0 : (taxableAmount * tipPercentage) / 100;
  const grandTotal = taxableAmount + taxAmount + calculatedTip;

  // Handle Natural Language order parse via Gemini API
  const handleParseNlOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim()) return;

    setIsParsingNl(true);
    setParseError('');

    try {
      const res = await fetch('/api/gemini/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: nlInput, products })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        if (data.items.length === 0) {
          setParseError('Could not match items from natural language. Try naming products directly.');
        } else {
          data.items.forEach((parsed: { productId: string; quantity: number }) => {
            const product = products.find(p => p.id === parsed.productId);
            if (product) {
              setCart(prev => {
                const existing = prev.find(item => item.product.id === product.id);
                if (existing) {
                  return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + (parsed.quantity || 1) } : item);
                }
                return [...prev, { product, quantity: parsed.quantity || 1 }];
              });
            }
          });
          setNlInput('');
        }
      } else {
        setParseError(data.error || 'Failed to parse order');
      }
    } catch (err: any) {
      setParseError(err.message || 'Error communicating with AI order parser');
    } finally {
      setIsParsingNl(false);
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0) return;

    const customProd: Product = {
      id: `custom_${Date.now()}`,
      name: customItemName || 'Custom POS Item',
      price: amount,
      category: 'Custom',
      sku: 'CUST-01',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      stock: 999
    };

    addToCart(customProd);
    setCustomAmount('');
    setCustomItemName('Custom POS Item');
    setShowCustomModal(false);
  };

  const handleCashPaymentConfirm = async () => {
    setShowCashModal(false);
    await onCompleteTransaction('cash', grandTotal, calculatedTip, customerName, customerEmail);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Catalog & Order Assistant (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* AI Natural Language Order Bar */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">AI Voice & Natural Language Checkout</span>
            </div>
            <form onSubmit={handleParseNlOrder} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={nlInput}
                  onChange={(e) => setNlInput(e.target.value)}
                  placeholder="e.g. '2 oat lattes, 1 croissant, and a coffee bean bag'..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Mic className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={isParsingNl || !nlInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 disabled:opacity-50 shrink-0"
              >
                {isParsingNl ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><span>Add to Cart</span></>
                )}
              </button>
            </form>
            {parseError && <p className="text-xs text-rose-400 mt-1.5">{parseError}</p>}
          </div>

          {/* Search, Categories & Custom Punch Trigger */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>

            {/* Custom Amount Manual Punch */}
            <button
              onClick={() => setShowCustomModal(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <DollarSign className="w-4 h-4 text-indigo-400" />
              <span>Custom Amount Punch</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between hover:border-indigo-500/50 transition-all cursor-pointer group shadow-lg hover:shadow-indigo-500/5"
              >
                <div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-slate-950 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-slate-300 font-mono">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{product.description}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">{product.sku}</span>
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Section: Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl">
          
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100">Current Order</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="my-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto text-slate-600">
                    <Tag className="w-6 h-6" />
                  </div>
                  <p className="text-sm">Cart is empty. Tap items or use AI voice assistant.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="flex-1 pr-3">
                      <h5 className="font-medium text-sm text-slate-200 line-clamp-1">{item.product.name}</h5>
                      <span className="text-xs text-indigo-400 font-mono">${item.product.price.toFixed(2)} each</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="w-7 h-7 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center justify-center ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-2 mb-4 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name (Opt)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Receipt Email (Opt)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tip & Discount Selector */}
            {cart.length > 0 && (
              <div className="space-y-3 mb-4 bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
                {/* Tip Buttons */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-medium">Tip Selector</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[10, 15, 18, 20].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => { setTipPercentage(pct); setCustomTip(''); }}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                          tipPercentage === pct && customTip === ''
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Selector */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-medium">Discount Offer</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 5, 10, 20].map((disc) => (
                      <button
                        key={disc}
                        onClick={() => setDiscountPercent(disc)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                          discountPercent === disc
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {disc === 0 ? 'None' : `${disc}% Off`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-2 border-t border-slate-800 pt-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-purple-400">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Tax ({settings.taxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tip</span>
                <span>${calculatedTip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Due</span>
                <span className="text-indigo-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Action Buttons */}
          <div className="space-y-2.5 pt-4">
            <button
              onClick={() => onCompleteTransaction('stripe_card', grandTotal, calculatedTip, customerName, customerEmail)}
              disabled={cart.length === 0 || isProcessing}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl font-semibold shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              <span>Charge ${grandTotal.toFixed(2)} (Stripe Reader)</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onOpenManualPunch}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all disabled:opacity-50 text-xs font-medium"
              >
                <Barcode className="w-4 h-4 text-indigo-400 mb-1" />
                <span>Manual Punch</span>
              </button>

              <button
                onClick={() => setShowCashModal(true)}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all disabled:opacity-50 text-xs font-medium"
              >
                <Banknote className="w-4 h-4 text-emerald-400 mb-1" />
                <span>Cash Tender</span>
              </button>

              <button
                onClick={() => onCompleteTransaction('gift_card', grandTotal, calculatedTip, customerName, customerEmail)}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all disabled:opacity-50 text-xs font-medium"
              >
                <Sparkles className="w-4 h-4 text-purple-400 mb-1" />
                <span>Gift Card</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Custom Amount Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-semibold text-slate-100">Add Custom Amount Item</h3>
            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Item Description</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-lg font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Tender Modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-semibold text-slate-100">Cash Payment</h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Due:</span>
                <span className="font-bold text-white text-sm">${grandTotal.toFixed(2)}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cash Tendered ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={grandTotal.toFixed(2)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-lg font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              {parseFloat(cashTendered) >= grandTotal && (
                <div className="flex justify-between items-center text-xs text-emerald-400 pt-2 border-t border-slate-800">
                  <span>Change Due:</span>
                  <span className="font-bold text-base">${(parseFloat(cashTendered) - grandTotal).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCashModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCashPaymentConfirm}
                disabled={parseFloat(cashTendered) < grandTotal}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                Complete Cash Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
