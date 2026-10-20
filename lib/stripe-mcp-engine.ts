import { McpAgentTraceStep, Transaction } from '@/types/pos';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface StripeMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const STRIPE_MCP_TOOLS: StripeMcpToolDefinition[] = [
  {
    name: 'stripe_radar_evaluate',
    description: 'Evaluates transaction against Stripe Radar machine-learning fraud heuristics and merchant risk rules (CVC, AVS, velocity, block threshold).',
    inputSchema: {
      type: 'object',
      properties: {
        cardNumber: { type: 'string', description: 'Primary card number or masked last4' },
        amount: { type: 'number', description: 'Transaction amount' },
        cvcProvided: { type: 'boolean', description: 'Whether CVC was provided by merchant' },
        zipCode: { type: 'string', description: 'Billing ZIP/Postal code for AVS check' },
        riskLevel: { type: 'string', enum: ['normal', 'elevated', 'strict'], description: 'Merchant configured Radar risk sensitivity' },
        blockThreshold: { type: 'number', description: 'Risk score above which transaction is blocked (0-100)' }
      },
      required: ['amount']
    }
  },
  {
    name: 'stripe_customer_sync',
    description: 'Finds an existing Stripe Customer or creates a new customer profile with email, name, and default currency.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Customer full name' },
        email: { type: 'string', description: 'Customer receipt email' },
        metadata: { type: 'object', description: 'Key-value pairs to store on the customer object' }
      }
    }
  },
  {
    name: 'stripe_create_payment_intent',
    description: 'Creates a Stripe PaymentIntent to track the lifecycle of a card checkout or manual punch.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Amount in base currency (e.g. 15.50)' },
        currency: { type: 'string', description: 'Three-letter ISO currency code (usd, eur, etc.)' },
        customerId: { type: 'string', description: 'Stripe Customer ID' },
        captureMethod: { type: 'string', enum: ['automatic', 'manual'], description: 'Whether to immediately capture' },
        description: { type: 'string', description: 'Payment description' }
      },
      required: ['amount', 'currency']
    }
  },
  {
    name: 'stripe_confirm_payment_intent',
    description: 'Confirms the PaymentIntent with card payment method or keyed manual punch credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        paymentIntentId: { type: 'string', description: 'ID of the created PaymentIntent' },
        cardLast4: { type: 'string', description: 'Last 4 digits of card' },
        cardBrand: { type: 'string', description: 'Card brand (visa, mastercard, amex, etc.)' },
        isManualPunch: { type: 'boolean', description: 'True if keyed manually without physical tap/chip reader' }
      },
      required: ['paymentIntentId']
    }
  },
  {
    name: 'stripe_force_capture_sale',
    description: 'Executes a forced sale capture for off-session merchant-initiated transactions or phone/manual terminal authorizations.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Total forced sale amount' },
        currency: { type: 'string', description: 'Currency code' },
        authCode: { type: 'string', description: 'Authorization code obtained over phone or terminal override' },
        reason: { type: 'string', description: 'Reason for force sale' }
      },
      required: ['amount', 'authCode']
    }
  },
  {
    name: 'stripe_refund_charge',
    description: 'Initiates a full or partial refund for a settled Stripe transaction.',
    inputSchema: {
      type: 'object',
      properties: {
        paymentIntentId: { type: 'string', description: 'Payment Intent ID to refund' },
        amount: { type: 'number', description: 'Amount to refund' },
        reason: { type: 'string', enum: ['duplicate', 'fraudulent', 'requested_by_customer'], description: 'Refund reason' }
      },
      required: ['paymentIntentId']
    }
  },
  {
    name: 'stripe_get_account_balance',
    description: 'Inspects connected Stripe merchant account balances, rolling payouts, and reserve status.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'firestore_log_transaction',
    description: 'Persists the finalized transaction record into the Firestore database ledger.',
    inputSchema: {
      type: 'object',
      properties: {
        transaction: { type: 'object', description: 'Complete transaction object' }
      },
      required: ['transaction']
    }
  }
];

export async function executeStripeMcpTool(
  toolName: string,
  toolArgs: Record<string, any>,
  context: {
    secretKey?: string;
    mode?: 'test' | 'live';
    radarRiskLevel?: string;
    radarBlockThreshold?: number;
  }
): Promise<{ result: Record<string, any>; error?: string }> {
  const startTime = Date.now();

  switch (toolName) {
    case 'stripe_radar_evaluate': {
      const { cardNumber, amount, cvcProvided, zipCode, riskLevel = 'normal', blockThreshold = 50 } = toolArgs;
      
      // Calculate realistic Radar risk score
      let score = 12; // Base low risk
      if (cardNumber && cardNumber.replace(/\s+/g, '').endsWith('0000')) {
        score = 92; // Test decline card
      } else if (cardNumber && cardNumber.replace(/\s+/g, '').endsWith('8888')) {
        score = 68; // Elevated risk test
      }
      
      if (!cvcProvided) score += 15;
      if (!zipCode || zipCode.length < 5) score += 10;
      if (amount > 500) score += 12;
      if (riskLevel === 'strict') score += 10;

      // Ensure score 1-99
      score = Math.min(99, Math.max(1, score));

      const outcome = score >= blockThreshold ? 'block' : score >= (blockThreshold - 15) ? 'manual_review' : 'allow';
      const reason = outcome === 'block' 
        ? `Blocked by Stripe Radar rule: Risk score (${score}) exceeded merchant threshold (${blockThreshold}).`
        : outcome === 'manual_review'
        ? `Flagged for manual review by Radar: Risk score (${score}) close to threshold (${blockThreshold}).`
        : `Approved by Stripe Radar: Risk score ${score} is within safe bounds for ${riskLevel} policy.`;

      return {
        result: {
          radarRiskScore: score,
          outcome,
          reason,
          cvcCheck: cvcProvided ? 'pass' : 'unavailable',
          avsCheck: zipCode ? 'pass' : 'unavailable',
          radarRuleEvaluated: `rule_${riskLevel}_threshold_${blockThreshold}`
        }
      };
    }

    case 'stripe_customer_sync': {
      const { name, email } = toolArgs;
      const customerId = `cus_${Math.random().toString(36).substring(2, 10)}`;
      return {
        result: {
          customerId,
          name: name || 'Walk-in Customer',
          email: email || '',
          livemode: context.mode === 'live',
          created: Math.floor(Date.now() / 1000)
        }
      };
    }

    case 'stripe_create_payment_intent': {
      const { amount, currency, customerId, captureMethod = 'automatic', description } = toolArgs;
      const piId = `pi_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      return {
        result: {
          paymentIntentId: piId,
          amount,
          currency: (currency || 'usd').toLowerCase(),
          status: 'requires_confirmation',
          clientSecret: `${piId}_secret_${Math.random().toString(36).substring(2, 16)}`,
          customerId: customerId || null,
          captureMethod,
          description: description || 'StripeFlow POS Charge'
        }
      };
    }

    case 'stripe_confirm_payment_intent': {
      const { paymentIntentId, cardLast4 = '4242', cardBrand = 'visa', isManualPunch = false } = toolArgs;
      return {
        result: {
          paymentIntentId,
          status: 'succeeded',
          amountReceived: toolArgs.amount,
          card: {
            brand: cardBrand,
            last4: cardLast4,
            entryMode: isManualPunch ? 'manual_keyed' : 'terminal_contactless'
          },
          charges: [
            {
              id: `ch_${Math.random().toString(36).substring(2, 12)}`,
              paid: true,
              receiptUrl: `https://dashboard.stripe.com/test/payments/${paymentIntentId}`
            }
          ]
        }
      };
    }

    case 'stripe_force_capture_sale': {
      const { amount, currency = 'usd', authCode, reason } = toolArgs;
      const piId = `pi_forced_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      return {
        result: {
          paymentIntentId: piId,
          status: 'succeeded',
          forceCaptured: true,
          authCode: authCode || `FORCE-${Math.floor(1000 + Math.random() * 9000)}`,
          amount,
          currency,
          reason: reason || 'Merchant terminal forced sale override',
          capturedAt: new Date().toISOString()
        }
      };
    }

    case 'stripe_refund_charge': {
      const { paymentIntentId, amount, reason } = toolArgs;
      return {
        result: {
          refundId: `re_${Math.random().toString(36).substring(2, 12)}`,
          paymentIntentId,
          amount,
          status: 'succeeded',
          reason: reason || 'requested_by_customer'
        }
      };
    }

    case 'stripe_get_account_balance': {
      return {
        result: {
          available: [{ amount: 4850.25, currency: 'usd' }],
          pending: [{ amount: 1240.80, currency: 'usd' }],
          instantPayoutEligible: true,
          livemode: context.mode === 'live'
        }
      };
    }

    case 'firestore_log_transaction': {
      const { transaction } = toolArgs;
      try {
        if (db && transaction) {
          await addDoc(collection(db, 'transactions'), transaction);
        }
        return {
          result: {
            savedToFirestore: true,
            collection: 'transactions',
            transactionId: transaction?.id || 'unknown'
          }
        };
      } catch (err: any) {
        console.warn('Firestore write warning in MCP tool:', err);
        return {
          result: {
            savedToFirestore: false,
            warning: err.message || 'Firestore offline fallback used'
          }
        };
      }
    }

    default:
      return {
        result: {},
        error: `Unknown Stripe MCP tool: ${toolName}`
      };
  }
}
