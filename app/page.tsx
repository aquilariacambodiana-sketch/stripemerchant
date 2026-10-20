'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, StoreSettings, Transaction, CartItem } from '@/types/pos';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_TRANSACTIONS } from '@/data/initial-data';
import { Header } from '@/components/Header';
import { POSTerminal } from '@/components/POSTerminal';
import { TransactionLedger } from '@/components/TransactionLedger';
import { InventoryCatalog } from '@/components/InventoryCatalog';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { StripeMcpConsole } from '@/components/StripeMcpConsole';
import { AISalesCopilot } from '@/components/AISalesCopilot';
import { SettingsView } from '@/components/SettingsView';
import { ManualPunchModal } from '@/components/ManualPunchModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import confetti from 'canvas-confetti';

export default function Page() {
  const [activeTab, setActiveTab] = useState<'pos' | 'ledger' | 'inventory' | 'analytics' | 'mcp' | 'copilot' | 'settings'>('pos');
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Modals
  const [showManualPunchModal, setShowManualPunchModal] = useState<boolean>(false);
  const [receiptModalTxn, setReceiptModalTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!db) return;
        // Fetch Products
        const productsSnapshot = await getDocs(query(collection(db, 'products')));
        if (!productsSnapshot.empty) {
          setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        }
        
        // Fetch Transactions
        const transactionsSnapshot = await getDocs(query(collection(db, 'transactions')));
        if (!transactionsSnapshot.empty) {
          setTransactions(transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
        }
      } catch (err) {
        console.warn('Firestore initial fetch fallback to cache:', err);
      }
    };
    fetchData();
  }, []);

  const offlineCount = transactions.filter(t => !t.offlineSynced || t.status === 'pending_offline').length;

  // Process transaction (either via Stripe MCP Agent, standard API, or offline store-and-forward queue)
  const handleCompleteTransaction = async (
    paymentMethod: 'stripe_card' | 'manual_punch' | 'cash' | 'gift_card',
    amount: number,
    tip: number,
    customerName?: string,
    customerEmail?: string,
    cardDetails?: any,
    isForceSale?: boolean,
    authCode?: string
  ) => {
    setIsProcessingPayment(true);

    try {
      if (!isOnline && settings.enableStoreAndForward) {
        // Store and forward offline mode
        await new Promise(r => setTimeout(r, 500));
        const newTxn: Transaction = {
          id: `txn_offline_${Date.now()}`,
          receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
          stripePaymentIntentId: `pi_offline_${Math.random().toString(36).substring(2, 9)}`,
          amount,
          subtotal: amount - (amount * (settings.taxRate / 100)) - tip,
          tax: (amount * (settings.taxRate / 100)),
          tip,
          discount: 0,
          currency: settings.currency,
          status: 'pending_offline',
          paymentMethod,
          customerName: customerName || 'Walk-in Customer',
          customerEmail: customerEmail || '',
          cardLast4: cardDetails?.number ? cardDetails.number.slice(-4) : '4242',
          cardBrand: 'visa',
          items: [...cart],
          timestamp: new Date().toISOString(),
          offlineSynced: false,
          isForceSale: !!isForceSale,
          authCode: authCode || undefined
        };

        setTransactions(prev => [newTxn, ...prev]);
        setCart([]);
        setShowManualPunchModal(false);
        setReceiptModalTxn(newTxn);
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        return;
      }

      // Check whether to use Stripe MCP Agent for card/punch transactions
      const useMcp = settings.useMcpAgentForCards && (paymentMethod === 'stripe_card' || paymentMethod === 'manual_punch' || isForceSale);
      const endpoint = useMcp ? '/api/stripe/mcp-agent' : '/api/stripe/charge';

      const payload = {
        amount,
        currency: settings.currency,
        paymentMethod,
        cardDetails: cardDetails || { number: '4242 4242 4242 4242', expMonth: '12', expYear: '28', cvc: '888', zip: '94107' },
        customerName,
        customerEmail,
        isForceSale: !!isForceSale,
        authCode,
        secretKey: settings.stripeSecretKey,
        items: [...cart],
        subtotal: amount - (amount * (settings.taxRate / 100)) - tip,
        tax: (amount * (settings.taxRate / 100)),
        tip,
        settings
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Payment processing failed');
      }

      const completedTxn: Transaction = {
        ...data.transaction,
        subtotal: amount - (amount * (settings.taxRate / 100)) - tip,
        tax: (amount * (settings.taxRate / 100)),
        tip,
        discount: 0,
        currency: settings.currency,
        items: [...cart],
        offlineSynced: true,
        mcpOrchestrated: useMcp,
        mcpTrace: data.mcpTrace || undefined,
        radarRiskScore: data.radarEvaluation?.radarRiskScore,
        radarOutcome: data.radarEvaluation?.outcome,
        agentSummary: data.agentSummary || undefined
      };

      setTransactions(prev => [completedTxn, ...prev]);
      setCart([]);
      setShowManualPunchModal(false);
      setReceiptModalTxn(completedTxn);
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });

    } catch (err: any) {
      alert(err.message || 'Transaction processing error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Sync offline store-and-forward transactions when reconnected
  const handleSyncOfflineQueue = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline.');
      return;
    }

    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1200));

    setTransactions(prev => prev.map(txn => {
      if (!txn.offlineSynced || txn.status === 'pending_offline') {
        return {
          ...txn,
          status: 'succeeded',
          offlineSynced: true,
          stripePaymentIntentId: `pi_synced_${Math.random().toString(36).substring(2, 9)}`
        };
      }
      return txn;
    }));

    setIsSyncing(false);
    confetti({ particleCount: 50, spread: 40 });
  };

  const handleRefundTransaction = (txnId: string) => {
    if (confirm('Are you sure you want to refund this transaction via Stripe?')) {
      setTransactions(prev => prev.map(txn => {
        if (txn.id === txnId) {
          return { ...txn, status: 'refunded', refundAmount: txn.amount };
        }
        return txn;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        offlineCount={offlineCount}
        onSyncOffline={handleSyncOfflineQueue}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'pos' && (
          <POSTerminal
            products={products}
            settings={settings}
            cart={cart}
            setCart={setCart}
            onOpenManualPunch={() => setShowManualPunchModal(true)}
            onCompleteTransaction={async (method, amt, tip, name, email, details, isForce, auth) => {
              await handleCompleteTransaction(method, amt, tip, name, email, details, isForce, auth);
            }}
            isProcessing={isProcessingPayment}
          />
        )}

        {activeTab === 'mcp' && (
          <StripeMcpConsole
            settings={settings}
            onTransactionLogged={(txn) => setTransactions(prev => [txn, ...prev])}
          />
        )}

        {activeTab === 'ledger' && (
          <TransactionLedger
            transactions={transactions}
            settings={settings}
            onViewReceipt={(txn) => setReceiptModalTxn(txn)}
            onRefundTransaction={handleRefundTransaction}
            onSyncOffline={handleSyncOfflineQueue}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryCatalog
            products={products}
            setProducts={setProducts}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            transactions={transactions}
            products={products}
            settings={settings}
          />
        )}

        {activeTab === 'copilot' && (
          <AISalesCopilot
            transactions={transactions}
            products={products}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
          />
        )}
      </main>

      {/* Manual Keyed Punch Modal with Force Sale and Rule Checks */}
      <ManualPunchModal
        isOpen={showManualPunchModal}
        onClose={() => setShowManualPunchModal(false)}
        amount={cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * (1 + settings.taxRate / 100)}
        currency={settings.currency}
        settings={settings}
        onProcessPayment={async (cardDetails, method) => {
          const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const tax = subtotal * (settings.taxRate / 100);
          const grandTotal = subtotal + tax;
          await handleCompleteTransaction(
            method,
            grandTotal,
            0,
            cardDetails.name,
            cardDetails.email,
            cardDetails,
            cardDetails.isForceSale,
            cardDetails.authCode
          );
        }}
        isProcessing={isProcessingPayment}
      />

      {/* Receipt Modal with MCP Trace & Radar score */}
      <ReceiptModal
        transaction={receiptModalTxn}
        settings={settings}
        isOpen={!!receiptModalTxn}
        onClose={() => setReceiptModalTxn(null)}
      />

    </div>
  );
}
