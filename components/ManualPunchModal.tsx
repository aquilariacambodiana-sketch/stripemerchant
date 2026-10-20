'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types/pos';
import { 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Zap, 
  KeyRound, 
  Cpu, 
  FileCheck 
} from 'lucide-react';

interface ManualPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  settings: StoreSettings;
  onProcessPayment: (cardDetails: {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    zip: string;
    name: string;
    email: string;
    isForceSale?: boolean;
    authCode?: string;
  }, paymentMethod: 'manual_punch' | 'stripe_card') => Promise<void>;
  isProcessing: boolean;
}

export const ManualPunchModal: React.FC<ManualPunchModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  settings,
  onProcessPayment,
  isProcessing
}) => {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('28');
  const [cvc, setCvc] = useState('888');
  const [zip, setZip] = useState('94107');
  const [cardName, setCardName] = useState('Valued Customer');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Force Sale & Supervisor Controls
  const [isForceSale, setIsForceSale] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [enteredSupervisorPin, setEnteredSupervisorPin] = useState('');
  
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
      setError('Please enter a valid card number (13-19 digits).');
      return;
    }

    // Check Single Manual Punch Limit rule
    if (amount > (settings.maxManualPunchAmount || 1500)) {
      setError(`Amount $${amount.toFixed(2)} exceeds the single manual punch limit of $${settings.maxManualPunchAmount}.`);
      return;
    }

    // Check CVC enforcement rule
    if (settings.requireCvc && (!cvc || cvc.length < 3)) {
      setError('CVC security code is strictly required by merchant transaction rules.');
      return;
    }

    // Check ZIP code enforcement rule
    if (settings.requireZip && (!zip || zip.length < 5)) {
      setError('Billing ZIP / Postal code is required for AVS verification.');
      return;
    }

    // Check Force Sale Supervisor PIN rule
    if (isForceSale) {
      if (!authCode.trim()) {
        setError('Authorization code is required to execute a force sale capture.');
        return;
      }
      if (settings.requireSupervisorPinForForceSale && enteredSupervisorPin !== settings.supervisorPin) {
        setError('Invalid supervisor security PIN for force sale capture override.');
        return;
      }
    }

    try {
      await onProcessPayment({
        number: cleanNum,
        expMonth,
        expYear,
        cvc,
        zip,
        name: cardName,
        email: customerEmail,
        isForceSale,
        authCode: isForceSale ? authCode : undefined
      }, 'manual_punch');
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    }
  };

  const loadTestCard = (type: 'visa' | 'mastercard' | 'decline' | 'high_risk') => {
    if (type === 'visa') {
      setCardNumber('4242 4242 4242 4242');
      setCvc('888');
      setCardName('Test Visa Customer');
      setZip('94107');
    } else if (type === 'mastercard') {
      setCardNumber('5555 4444 3333 2221');
      setCvc('123');
      setCardName('Test MasterCard Customer');
      setZip('10001');
    } else if (type === 'decline') {
      setCardNumber('4242 4242 4242 0000');
      setCvc('999');
      setCardName('Test Declined Card');
      setZip('94107');
    } else if (type === 'high_risk') {
      setCardNumber('4242 4242 4242 8888');
      setCvc('000');
      setCardName('Radar Flagged Test Card');
      setZip('00000');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Keyed Manual Punch Virtual Terminal</h3>
              <p className="text-[11px] text-slate-400">
                {settings.useMcpAgentForCards ? 'Orchestrated via Stripe MCP Agent' : 'Standard Stripe API'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount & Radar Banner */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">Total Due</span>
            <div className="text-2xl font-bold text-white">
              ${amount.toFixed(2)} <span className="text-xs font-normal text-slate-400 font-mono">{currency}</span>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Radar: {settings.radarRiskLevel.toUpperCase()}</span>
            </div>
            {settings.useMcpAgentForCards && (
              <div className="flex items-center space-x-1 text-[10px] text-violet-300 font-mono">
                <Cpu className="w-3 h-3 text-violet-400" />
                <span>MCP Agent Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Test Cards Selector */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto">
          <span className="text-slate-400 text-[11px] whitespace-nowrap mr-2">Quick Presets:</span>
          <div className="flex items-center space-x-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => loadTestCard('visa')}
              className="text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/50 text-[11px]"
            >
              Visa 4242
            </button>
            <button
              type="button"
              onClick={() => loadTestCard('mastercard')}
              className="text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/50 text-[11px]"
            >
              MasterCard
            </button>
            <button
              type="button"
              onClick={() => loadTestCard('decline')}
              className="text-rose-400 hover:text-rose-300 bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-800/50 text-[11px]"
            >
              Decline (0000)
            </button>
            <button
              type="button"
              onClick={() => loadTestCard('high_risk')}
              className="text-amber-400 hover:text-amber-300 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-800/50 text-[11px]"
            >
              Radar Alert
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Name on card"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 tracking-wider"
                placeholder="4242 4242 4242 4242"
              />
              <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="YY"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                CVC {settings.requireCvc && <span className="text-indigo-400">*</span>}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                  required={settings.requireCvc}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-2 py-2 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="CVC"
                />
                <Lock className="w-3 h-3 text-slate-500 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Billing ZIP (AVS) {settings.requireZip && <span className="text-indigo-400">*</span>}
              </label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required={settings.requireZip}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="94107"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="customer@email.com"
              />
            </div>
          </div>

          {/* Force Sale Capture Option */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-200">Force Sale Capture Override</span>
              </div>
              <input
                type="checkbox"
                checked={isForceSale}
                onChange={(e) => setIsForceSale(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>

            {isForceSale && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800 animate-in fade-in">
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Force Sale records an offline voice authorization or terminal approval without customer presence.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-medium">Auth Code (from voice/terminal)</label>
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="e.g. FORCE-8812"
                      required={isForceSale}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {settings.requireSupervisorPinForForceSale && (
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-medium">Supervisor PIN</label>
                      <input
                        type="password"
                        value={enteredSupervisorPin}
                        onChange={(e) => setEnteredSupervisorPin(e.target.value)}
                        placeholder="4-digit PIN"
                        required={isForceSale}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{settings.useMcpAgentForCards ? 'Orchestrating...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isForceSale ? `Force Capture $${amount.toFixed(2)}` : `Charge $${amount.toFixed(2)}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
