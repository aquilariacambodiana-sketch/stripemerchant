'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

export const StripeConnectButton = () => {
  const handleConnect = async () => {
    // In a real app, this would initiate the OAuth flow
    alert('Initiating Stripe Connect OAuth flow...');
  };

  return (
    <button
      onClick={handleConnect}
      className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
    >
      <CreditCard className="w-4 h-4 text-indigo-400" />
      <span>Connect Stripe Account</span>
    </button>
  );
};
