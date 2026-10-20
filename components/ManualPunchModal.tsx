'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface ManualPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  onProcessPayment: (cardDetails: {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    zip: string;
    name: string;
    email: string;
  }, paymentMethod: 'manual_punch' | 'stripe_card') => Promise<void>;
  isProcessing: boolean;
}

export const ManualPunchModal: React.FC<ManualPunchModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  onProcessPayment,
  isProcessing
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('28');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('94107');
  const [cardName, setCardName] = useState('Valued Customer');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFormatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += val[i];
    }
    setCardNumber(formatted.substring(0, 19));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 13) {
      setError('Please enter a valid card number');
      return;
    }
    if (!cvc || cvc.length < 3) {
      setError('Please enter a valid CVC security code');
      return;
    }

    try {
      await onProcessPayment({
        number: cleanNum,
        expMonth,
        expYear,
        cvc,
        zip,
        name: cardName,
        email: customerEmail
      }, 'manual_punch');
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    }
  };

  const loadTestCard = (type: 'visa' | 'mastercard' | 'decline') => {
    if (type === 'visa') {
      setCardNumber('4242 4242 4242 4242');
      setCvc('888');
      setCardName('Test Visa Customer');
    } else if (type === 'mastercard') {
      setCardNumber('5555 4444 3333 2221');
      setCvc('123');
      setCardName('Test MasterCard Customer');
    } else {
      setCardNumber('4242 4242 4242 0000');
      setCvc('999');
      setCardName('Test Declined Card');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Manual Keyed Punch Entry</h3>
              <p className="text-xs text-slate-400">Secure Stripe Virtual Terminal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Charge Amount</span>
            <div className="text-2xl font-bold text-white">
              ${amount.toFixed(2)} <span className="text-sm font-normal text-slate-400">{currency}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Keyed Entry</span>
          </div>
        </div>

        {/* Quick Test Cards Selector */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Quick Test Cards:</span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => loadTestCard('visa')}
              className="text-indigo-400 hover:underline bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/50"
            >
              Valid Visa
            </button>
            <button
              type="button"
              onClick={() => loadTestCard('mastercard')}
              className="text-indigo-400 hover:underline bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/50"
            >
              MasterCard
            </button>
            <button
              type="button"
              onClick={() => loadTestCard('decline')}
              className="text-rose-400 hover:underline bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/50"
            >
              Test Decline
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cardholder Name</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Full name on card"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Card Number</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={handleFormatCardNumber}
                required
                maxLength={19}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 tracking-wider"
                placeholder="4242 4242 4242 4242"
              />
              <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Month</label>
              <input
                type="text"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                maxLength={2}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="MM"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Year</label>
              <input
                type="text"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                maxLength={2}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="YY"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">CVC / CVV</label>
              <div className="relative">
                <input
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-sm text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="CVC"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Postal / ZIP</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="ZIP code"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer Email (Optional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="receipt@example.com"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Charge ${amount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
