'use client';

import React, { useState } from 'react';
import { Transaction, Product, StoreSettings } from '@/types/pos';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Package, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ShoppingBag,
  Clock
} from 'lucide-react';
import { getCurrentTime } from '@/lib/utils';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  products: Product[];
  settings: StoreSettings;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  transactions,
  products,
  settings
}) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Filter transactions based on date range
  const filteredTransactions = React.useMemo(() => {
    const now = getCurrentTime();
    return transactions.filter(txn => {
      const txnTime = new Date(txn.timestamp).getTime();
      if (dateRange === 'today') {
        return now - txnTime <= 24 * 60 * 60 * 1000;
      }
      if (dateRange === 'week') {
        return now - txnTime <= 7 * 24 * 60 * 60 * 1000;
      }
      if (dateRange === 'month') {
        return now - txnTime <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [transactions, dateRange]);

  const successfulTxns = filteredTransactions.filter(t => t.status === 'succeeded' || t.status === 'pending_offline');
  const totalRevenue = successfulTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalTxnCount = successfulTxns.length;
  const avgTicket = totalTxnCount > 0 ? totalRevenue / totalTxnCount : 0;
  const totalTaxCollected = successfulTxns.reduce((sum, t) => sum + (t.tax || 0), 0);
  const totalTips = successfulTxns.reduce((sum, t) => sum + (t.tip || 0), 0);

  // Product sales breakdown
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};

  successfulTxns.forEach(txn => {
    txn.items.forEach(item => {
      const prodId = item.product.id;
      if (!productSalesMap[prodId]) {
        productSalesMap[prodId] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          category: item.product.category
        };
      }
      productSalesMap[prodId].quantity += item.quantity;
      productSalesMap[prodId].revenue += item.product.price * item.quantity;
    });
  });

  const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Date Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Analytics & Reporting Dashboard</h2>
            <p className="text-xs text-slate-400">Comprehensive sales summaries, product breakdowns, and transaction volumes</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {(['today', 'week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                dateRange === range
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
          <button
            onClick={async () => {
              const testTxns = [
                { amount: 15.0, paymentMethod: 'stripe_card', customerName: 'Test A' },
                { amount: 25.0, paymentMethod: 'manual_punch', customerName: 'Test B' },
                { amount: 10.0, paymentMethod: 'cash', customerName: 'Test C' }
              ];
              for (const txn of testTxns) {
                await fetch('/api/stripe/charge', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(txn)
                });
              }
              alert('Test transactions run successfully! Refresh to see them in Ledger.');
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition-all"
          >
            Run Test Transactions
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-400 flex items-center mt-1 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" /> {dateRange.toUpperCase()} Summary
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{totalTxnCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Successful charges & sales</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Ticket Size</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">${avgTicket.toFixed(2)}</div>
          <span className="text-[11px] text-purple-400 mt-1 block">Average per order</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tips & Tax Collected</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white">${totalTips.toFixed(2)} <span className="text-xs font-normal text-slate-400">tips</span></div>
          <span className="text-[11px] text-slate-400 mt-1 block">${totalTaxCollected.toFixed(2)} tax</span>
        </div>

      </div>

      {/* Product Sales Breakdown & Volume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Sales Breakdown by Product</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{sortedProducts.length} items sold</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No product sales recorded for this date filter.
              </div>
            ) : (
              sortedProducts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-medium text-sm text-slate-200">{item.name}</h4>
                      <span className="text-xs text-slate-500">{item.category} • {item.quantity} units sold</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">${item.revenue.toFixed(2)}</div>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}% of total
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaction Volume & Payment Method Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Transaction Volume Insights</h3>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Stripe Card Reader / Terminal</span>
                <span className="font-bold text-white">
                  {successfulTxns.filter(t => t.paymentMethod === 'stripe_card').length} txns
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full" 
                  style={{ width: `${totalTxnCount > 0 ? (successfulTxns.filter(t => t.paymentMethod === 'stripe_card').length / totalTxnCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Manual Keyed Punch Entry</span>
                <span className="font-bold text-white">
                  {successfulTxns.filter(t => t.paymentMethod === 'manual_punch').length} txns
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full rounded-full" 
                  style={{ width: `${totalTxnCount > 0 ? (successfulTxns.filter(t => t.paymentMethod === 'manual_punch').length / totalTxnCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Cash & Gift Card</span>
                <span className="font-bold text-white">
                  {successfulTxns.filter(t => t.paymentMethod === 'cash' || t.paymentMethod === 'gift_card').length} txns
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${totalTxnCount > 0 ? (successfulTxns.filter(t => t.paymentMethod === 'cash' || t.paymentMethod === 'gift_card').length / totalTxnCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 p-4 rounded-2xl border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
            <div className="font-semibold flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-Time Stripe Settlement Status</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              All successful transactions are automatically queued for payout according to your Stripe account payout schedule (daily rolling).
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
