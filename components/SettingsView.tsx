'use client';

import React, { useState } from 'react';
import { StoreSettings } from '@/types/pos';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Store, 
  Lock, 
  Sliders, 
  CreditCard, 
  Mail, 
  Cpu, 
  Zap,
  Percent,
  Check
} from 'lucide-react';
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
  
  // Radar & MCP Agent
  const [radarRiskLevel, setRadarRiskLevel] = useState<'normal' | 'elevated' | 'strict'>(settings.radarRiskLevel);
  const [radarBlockThreshold, setRadarBlockThreshold] = useState(settings.radarBlockThreshold.toString());
  const [useMcpAgentForCards, setUseMcpAgentForCards] = useState(settings.useMcpAgentForCards ?? true);
  
  // Transaction Rules
  const [requireCvc, setRequireCvc] = useState(settings.requireCvc ?? true);
  const [requireZip, setRequireZip] = useState(settings.requireZip ?? true);
  const [maxManualPunchAmount, setMaxManualPunchAmount] = useState((settings.maxManualPunchAmount || 1500).toString());
  const [supervisorPin, setSupervisorPin] = useState(settings.supervisorPin || '8812');
  const [requireSupervisorPinForForceSale, setRequireSupervisorPinForForceSale] = useState(settings.requireSupervisorPinForForceSale ?? true);
  const [captureMethod, setCaptureMethod] = useState<'automatic' | 'manual'>(settings.captureMethod || 'automatic');
  const [autoEmailReceipt, setAutoEmailReceipt] = useState(settings.autoEmailReceipt ?? true);
  const [defaultTipPercent, setDefaultTipPercent] = useState((settings.defaultTipPercent || 15).toString());

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
      mode,
      radarRiskLevel,
      radarBlockThreshold: parseInt(radarBlockThreshold) || 50,
      useMcpAgentForCards,
      requireCvc,
      requireZip,
      maxManualPunchAmount: parseFloat(maxManualPunchAmount) || 1500,
      supervisorPin,
      requireSupervisorPinForForceSale,
      captureMethod,
      autoEmailReceipt,
      defaultTipPercent: parseInt(defaultTipPercent) || 15
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">POS Configuration & Transaction Rules</h2>
            <p className="text-xs text-slate-400">Configure Stripe credentials, Radar risk rules, MCP agent orchestration, and seamless checkout</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 px-4 py-2 rounded-xl text-xs font-medium transition-all"
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Server className="w-4 h-4 text-indigo-400" />
              )}
              <span>Test Connection to Stripe</span>
            </button>

            {testStatus === 'success' && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{testMessage}</span>
              </span>
            )}
            {testStatus === 'error' && (
              <span className="text-xs text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{testMessage}</span>
              </span>
            )}
          </div>
        </div>

        {/* Stripe MCP Agent Orchestration Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-slate-100">Stripe MCP Agent Orchestration</h3>
            </div>
            <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
              Model Context Protocol v2024-11-05
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Orchestrate Card Sales via MCP Agent</span>
                <span className="text-[11px] text-slate-500">Autonomous step-by-step tool execution with full audit trace</span>
              </div>
              <button
                type="button"
                onClick={() => setUseMcpAgentForCards(!useMcpAgentForCards)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  useMcpAgentForCards ? 'bg-violet-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  useMcpAgentForCards ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-medium text-slate-200 block mb-1">Agent Reasoning Engine</span>
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>gemini-3.8-flash</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">High Throughput</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Rules & Fraud Security */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Transaction Rules & Risk Policy</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Radar Risk Sensitivity</label>
              <select
                value={radarRiskLevel}
                onChange={(e) => setRadarRiskLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="normal">Normal (Balanced conversion & fraud)</option>
                <option value="elevated">Elevated (Heightened scrutiny on keyed entry)</option>
                <option value="strict">Strict (Maximum chargeback defense)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Radar Block Threshold (0-100)</label>
              <input
                type="number"
                value={radarBlockThreshold}
                onChange={(e) => setRadarBlockThreshold(e.target.value)}
                min={1}
                max={99}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Max Manual Punch ($)</label>
              <input
                type="number"
                value={maxManualPunchAmount}
                onChange={(e) => setMaxManualPunchAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Enforce CVC on Manual Punch</span>
                <span className="text-[11px] text-slate-500">Requires 3 or 4-digit card security code</span>
              </div>
              <button
                type="button"
                onClick={() => setRequireCvc(!requireCvc)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  requireCvc ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  requireCvc ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Enforce AVS Billing Postal Code</span>
                <span className="text-[11px] text-slate-500">Address Verification System match check</span>
              </div>
              <button
                type="button"
                onClick={() => setRequireZip(!requireZip)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  requireZip ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  requireZip ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Supervisor PIN for Force Sales</span>
                <span className="text-[11px] text-slate-500">Requires 4-digit manager PIN to capture force sale</span>
              </div>
              <button
                type="button"
                onClick={() => setRequireSupervisorPinForForceSale(!requireSupervisorPinForForceSale)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  requireSupervisorPinForForceSale ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  requireSupervisorPinForForceSale ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Supervisor Security PIN</span>
                <span className="text-[11px] text-slate-500">Used for transaction overrides & refunds</span>
              </div>
              <input
                type="password"
                maxLength={6}
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center font-mono text-sm text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Seamless Checkout & Store Defaults */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100">Seamless Checkout Experience</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default Tip Preset</label>
              <select
                value={defaultTipPercent}
                onChange={(e) => setDefaultTipPercent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="0">No default tip (0%)</option>
                <option value="10">10%</option>
                <option value="15">15% (Recommended)</option>
                <option value="18">18%</option>
                <option value="20">20%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Card Capture Timing</label>
              <select
                value={captureMethod}
                onChange={(e) => setCaptureMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="automatic">Automatic Immediate Capture</option>
                <option value="manual">Authorize Only (Capture Later)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Store Location</label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Footer Message</label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Save All Rules & Settings
          </button>
        </div>

      </form>

    </div>
  );
};
