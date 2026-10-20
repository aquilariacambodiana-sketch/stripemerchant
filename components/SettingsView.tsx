'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types/pos';
import { Settings, Key, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Server, Store, Globe } from 'lucide-react';
import { StripeConnectButton } from './StripeConnectButton';

interface SettingsViewProps {
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings
}) => {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storeLocation, setStoreLocation] = useState(settings.storeLocation);
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [stripeSecretKey, setStripeSecretKey] = useState(settings.stripeSecretKey);
  const [stripePublishableKey, setStripePublishableKey] = useState(settings.stripePublishableKey);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [mode, setMode] = useState<'test' | 'live'>(settings.mode);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const res = await fetch('/api/stripe/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: stripeSecretKey, publishableKey: stripePublishableKey })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestMessage(data.message);
      } else {
        setTestStatus('error');
        setTestMessage(data.error);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection test failed');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(prev => ({
      ...prev,
      storeName,
      storeLocation,
      taxRate: parseFloat(taxRate) || 0,
      stripeSecretKey,
      stripePublishableKey,
      receiptFooter,
      mode
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Stripe & Store Configuration</h2>
            <p className="text-xs text-slate-400">Manage Stripe API credentials, terminal settings, and tax rates</p>
          </div>
        </div>
        {saveSuccess && (
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Stripe Credentials Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Stripe Account & Security</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMode('test')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  mode === 'test' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Test Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  mode === 'live' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Live Mode
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <StripeConnectButton />
            <div className="text-xs text-slate-400">
              {settings.stripeConnectAccountId ? `Connected: ${settings.stripeConnectAccountId}` : 'No account connected'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Stripe Publishable Key</label>
              <input
                type="text"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_test_..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Stripe Secret Key</label>
              <input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="sk_test_..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Radar Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Stripe Radar & Risk Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Risk Level</label>
              <select
                value={settings.radarRiskLevel}
                onChange={(e) => setSettings(prev => ({...prev, radarRiskLevel: e.target.value as any}))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="elevated">Elevated</option>
                <option value="strict">Strict</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Block Threshold (Risk Score)</label>
              <input
                type="number"
                value={settings.radarBlockThreshold}
                onChange={(e) => setSettings(prev => ({...prev, radarBlockThreshold: parseInt(e.target.value)}))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Store & Tax Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
            <Store className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Store & Receipt Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Location</label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/30 transition-all"
          >
            Save All Settings
          </button>
        </div>

      </form>

    </div>
  );
};
