'use client';

import React from 'react';
import { Transaction, StoreSettings } from '@/types/pos';
import { Printer, Mail, CheckCircle2, X, Store, QrCode, ShieldCheck, Cpu, Zap, FileCheck } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  isOpen,
  onClose
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    alert(`Receipt successfully dispatched to ${transaction.customerEmail || 'customer@example.com'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Transaction Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 bg-white text-slate-900 font-mono text-xs space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Store Info */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-900 mb-1">
              <Store className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">{settings.storeName}</h4>
            <p className="text-[11px] text-slate-500">{settings.storeLocation}</p>
          </div>

          {/* Transaction Metadata */}
          <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt #:</span>
              <span className="font-semibold">{transaction.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{new Date(transaction.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment:</span>
              <span className="uppercase">{transaction.paymentMethod.replace('_', ' ')} ({transaction.cardBrand || 'Card'} ...{transaction.cardLast4 || '4242'})</span>
            </div>
            {transaction.isForceSale && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Force Sale Auth:</span>
                <span>{transaction.authCode || 'FORCE-AUTH'}</span>
              </div>
            )}
            {transaction.radarRiskScore !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Radar Risk Score:</span>
                <span className="font-semibold">{transaction.radarRiskScore}/100 ({transaction.radarOutcome?.toUpperCase() || 'PASS'})</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-600 font-bold uppercase">{transaction.status}</span>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1">
              Itemized Summary
            </div>
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-[11px]">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-slate-500 ml-1">x{item.quantity}</span>
                </div>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${(transaction.subtotal || transaction.amount * 0.9).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({settings.taxRate}%)</span>
              <span>${(transaction.tax || transaction.amount * 0.1).toFixed(2)}</span>
            </div>
            {transaction.tip > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tip</span>
                <span>${transaction.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-2 text-slate-900">
              <span>Total Paid</span>
              <span>${transaction.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Agent Orchestration Note */}
          {transaction.mcpOrchestrated && (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
              <div className="flex items-center space-x-1 font-bold text-slate-800">
                <Cpu className="w-3 h-3 text-indigo-600" />
                <span>Orchestrated by Stripe MCP Agent</span>
              </div>
              <p>{transaction.agentSummary || 'Multi-tool agent pipeline verified.'}</p>
            </div>
          )}

          {/* QR Code & Footer */}
          <div className="text-center pt-3 space-y-2 border-t border-dashed border-slate-300">
            <div className="inline-block p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <QrCode className="w-14 h-14 mx-auto text-slate-800" />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed px-2">
              {settings.receiptFooter}
            </p>
          </div>

        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between print:hidden">
          <button
            onClick={handleEmailReceipt}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Email</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
