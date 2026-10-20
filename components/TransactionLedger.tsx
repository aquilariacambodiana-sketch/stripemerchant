'use client';

import React, { useState } from 'react';
import { Transaction, StoreSettings } from '@/types/pos';
import { 
  Search, 
  Receipt, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  Eye,
  RefreshCw
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  settings: StoreSettings;
  onViewReceipt: (txn: Transaction) => void;
  onRefundTransaction: (txnId: string) => void;
  onSyncOffline: () => void;
  isSyncing: boolean;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  settings,
  onViewReceipt,
  onRefundTransaction,
  onSyncOffline,
  isSyncing
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransactions = transactions.filter(txn => {
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter || (statusFilter === 'pending_offline' && !txn.offlineSynced);
    const matchesSearch = 
      txn.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.customerName && txn.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (txn.stripePaymentIntentId && txn.stripePaymentIntentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Metrics calculations
  const totalRevenue = transactions
    .filter(t => t.status === 'succeeded' || t.status === 'pending_offline')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCount = transactions.length;
  const pendingCount = transactions.filter(t => !t.offlineSynced).length;
  const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-400 flex items-center mt-1 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" /> Real-time Ledger Total
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Successfully processed & logged</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Ticket</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">${avgTicket.toFixed(2)}</div>
          <span className="text-[11px] text-purple-400 mt-1 block">Per completed order</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Store & Forward Queue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
            {pendingCount > 0 && (
              <button
                onClick={onSyncOffline}
                disabled={isSyncing}
                className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pending offline queue sync</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, customer name, PI..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'succeeded', 'pending_offline', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Receipt #</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Payment Method</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-indigo-400">
                      {txn.receiptNumber}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">{txn.customerName || 'Walk-in'}</div>
                      <div className="text-xs text-slate-500">{txn.customerEmail || 'No email'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="uppercase text-xs font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {txn.paymentMethod.replace('_', ' ')}
                          </span>
                          {txn.cardLast4 && (
                            <span className="text-xs text-slate-400">
                              {txn.cardBrand} •••• {txn.cardLast4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          {txn.mcpOrchestrated && (
                            <span className="bg-violet-500/10 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded font-mono">
                              MCP Agent
                            </span>
                          )}
                          {txn.isForceSale && (
                            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                              Force Sale ({txn.authCode || 'Auth'})
                            </span>
                          )}
                          {txn.radarRiskScore !== undefined && (
                            <span className="text-slate-400 font-mono">
                              Radar: {txn.radarRiskScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      ${txn.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      {txn.status === 'succeeded' && (
                        <span className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Succeeded</span>
                        </span>
                      )}
                      {txn.status === 'pending_offline' && (
                        <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending (Forward)</span>
                        </span>
                      )}
                      {txn.status === 'refunded' && (
                        <span className="inline-flex items-center space-x-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-medium">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Refunded</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => onViewReceipt(txn)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Receipt</span>
                      </button>

                      {txn.status !== 'refunded' && (
                        <button
                          onClick={() => onRefundTransaction(txn.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
                          title="Refund Transaction"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Refund</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
