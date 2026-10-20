'AppHeader';
import React from 'react';
import { StoreSettings } from '@/types/pos';
import { 
  CreditCard, 
  Receipt, 
  Package, 
  BarChart3,
  Bot, 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Store,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'pos' | 'ledger' | 'inventory' | 'analytics' | 'copilot' | 'settings';
  setActiveTab: (tab: 'pos' | 'ledger' | 'inventory' | 'analytics' | 'copilot' | 'settings') => void;
  settings: StoreSettings;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  offlineCount: number;
  onSyncOffline: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  isOnline,
  setIsOnline,
  offlineCount,
  onSyncOffline,
  isSyncing
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Store Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  StripeFlow
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full ml-2 border border-indigo-500/30">
                  {settings.mode === 'test' ? 'Test Mode' : 'Live'}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 border-l border-slate-800 pl-4">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-300">{settings.storeName}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pos'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>POS</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'copilot'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Bot className="w-4 h-4 text-violet-400" />
              <span>Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Network & Store-and-Forward Status */}
          <div className="flex items-center space-x-3">
            {/* Offline Store & Forward Badge */}
            {offlineCount > 0 && (
              <button
                onClick={onSyncOffline}
                disabled={!isOnline || isSyncing}
                className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all cursor-pointer"
                title="Pending offline store-and-forward transactions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{offlineCount} queued (Forward)</span>
              </button>
            )}

            {/* Online / Offline Simulator Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isOnline 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
              title="Click to toggle network status for store-and-forward testing"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Offline Mode</span>
                </>
              )}
            </button>

            {/* Stripe Secure badge */}
            <div className="hidden lg:flex items-center space-x-1 text-slate-500 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>PCI-DSS</span>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'pos' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <CreditCard className="w-4 h-4 mb-1" />
            <span>POS</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'ledger' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <Receipt className="w-4 h-4 mb-1" />
            <span>Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'inventory' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <Package className="w-4 h-4 mb-1" />
            <span>Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <BarChart3 className="w-4 h-4 mb-1" />
            <span>Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'copilot' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <Bot className="w-4 h-4 mb-1" />
            <span>AI</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            <Settings className="w-4 h-4 mb-1" />
            <span>Setup</span>
          </button>
        </div>

      </div>
    </header>
  );
};
