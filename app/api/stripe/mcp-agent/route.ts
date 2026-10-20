import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { STRIPE_MCP_TOOLS, executeStripeMcpTool } from '@/lib/stripe-mcp-engine';
import { McpAgentTraceStep, Transaction } from '@/types/pos';
import { logApiCall } from '@/lib/dispatcher';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Map our Stripe MCP tool definitions to Gemini functionDeclarations
const functionDeclarations: FunctionDeclaration[] = STRIPE_MCP_TOOLS.map(tool => ({
  name: tool.name,
  description: tool.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      cardNumber: { type: Type.STRING, description: 'Card number or last 4' },
      amount: { type: Type.NUMBER, description: 'Transaction amount' },
      cvcProvided: { type: Type.BOOLEAN, description: 'CVC code provided' },
      zipCode: { type: Type.STRING, description: 'Billing ZIP/Postal code' },
      riskLevel: { type: Type.STRING, description: 'normal, elevated, or strict' },
      blockThreshold: { type: Type.NUMBER, description: 'Radar block threshold (0-100)' },
      name: { type: Type.STRING, description: 'Customer full name' },
      email: { type: Type.STRING, description: 'Customer receipt email' },
      currency: { type: Type.STRING, description: 'Currency code (e.g. usd)' },
      customerId: { type: Type.STRING, description: 'Stripe Customer ID' },
      captureMethod: { type: Type.STRING, description: 'automatic or manual' },
      paymentIntentId: { type: Type.STRING, description: 'Stripe PaymentIntent ID' },
      cardLast4: { type: Type.STRING, description: 'Last 4 digits of card' },
      cardBrand: { type: Type.STRING, description: 'Brand e.g. visa, mastercard' },
      isManualPunch: { type: Type.BOOLEAN, description: 'Whether manual keyed entry' },
      authCode: { type: Type.STRING, description: 'Force sale authorization code' },
      reason: { type: Type.STRING, description: 'Reason for action' },
      transaction: { type: Type.OBJECT, description: 'Complete transaction record to persist' }
    }
  }
}));

export async function POST(req: NextRequest) {
  let body: any = null;
  const trace: McpAgentTraceStep[] = [];

  try {
    body = await req.json();
    const {
      action = 'process_transaction',
      amount,
      currency = 'USD',
      paymentMethod = 'manual_punch',
      cardDetails,
      customerName,
      customerEmail,
      isForceSale = false,
      authCode,
      notes,
      items = [],
      subtotal,
      tax,
      tip = 0,
      discount = 0,
      settings = {}
    } = body;

    const receiptNumber = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanNum = cardDetails?.number ? cardDetails.number.replace(/\s+/g, '') : '4242';
    const last4 = cleanNum.slice(-4);
    let brand = 'visa';
    if (cleanNum.startsWith('5')) brand = 'mastercard';
    else if (cleanNum.startsWith('3')) brand = 'amex';
    else if (cleanNum.startsWith('6')) brand = 'discover';

    // Step 1: Customer Sync MCP Tool
    let stepNum = 1;
    const t1Start = Date.now();
    const customerSyncRes = await executeStripeMcpTool('stripe_customer_sync', {
      name: customerName,
      email: customerEmail
    }, settings);
    trace.push({
      step: stepNum++,
      toolName: 'stripe_customer_sync',
      description: 'Synchronized Stripe Customer profile for billing & receipt routing',
      status: 'success',
      input: { name: customerName, email: customerEmail },
      output: customerSyncRes.result,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - t1Start
    });

    // Step 2: Radar Evaluation MCP Tool
    const t2Start = Date.now();
    const radarRes = await executeStripeMcpTool('stripe_radar_evaluate', {
      cardNumber: cleanNum,
      amount,
      cvcProvided: !!cardDetails?.cvc,
      zipCode: cardDetails?.zip,
      riskLevel: settings.radarRiskLevel || 'normal',
      blockThreshold: settings.radarBlockThreshold || 50
    }, settings);

    const radarEvaluation = radarRes.result;
    const isBlocked = radarEvaluation.outcome === 'block';

    trace.push({
      step: stepNum++,
      toolName: 'stripe_radar_evaluate',
      description: `Stripe Radar Fraud Heuristics: Risk Score ${radarEvaluation.radarRiskScore}/100 (${radarEvaluation.outcome.toUpperCase()})`,
      status: isBlocked ? 'failed' : radarEvaluation.outcome === 'manual_review' ? 'warning' : 'success',
      input: {
        last4,
        amount,
        riskLevel: settings.radarRiskLevel || 'normal',
        blockThreshold: settings.radarBlockThreshold || 50
      },
      output: radarEvaluation,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - t2Start
    });

    if (isBlocked) {
      const errorMsg = radarEvaluation.reason || 'Transaction blocked by Stripe Radar fraud rule.';
      const result = {
        success: false,
        error: errorMsg,
        radarEvaluation,
        mcpTrace: trace,
        agentSummary: `Stripe MCP Agent aborted transaction orchestration: ${errorMsg}`
      };
      await logApiCall('/api/stripe/mcp-agent', 'POST', body, result);
      return NextResponse.json(result, { status: 400 });
    }

    // Step 3: Payment Intent or Force Sale
    let paymentIntentId = '';
    const t3Start = Date.now();

    if (isForceSale) {
      const forceSaleRes = await executeStripeMcpTool('stripe_force_capture_sale', {
        amount,
        currency,
        authCode: authCode || `FORCE-${Math.floor(1000 + Math.random() * 9000)}`,
        reason: 'Merchant terminal manual force sale'
      }, settings);
      paymentIntentId = forceSaleRes.result.paymentIntentId;

      trace.push({
        step: stepNum++,
        toolName: 'stripe_force_capture_sale',
        description: `Executed Force Sale capture override with auth code ${forceSaleRes.result.authCode}`,
        status: 'success',
        input: { amount, currency, authCode },
        output: forceSaleRes.result,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - t3Start
      });
    } else {
      const piCreateRes = await executeStripeMcpTool('stripe_create_payment_intent', {
        amount,
        currency,
        customerId: customerSyncRes.result.customerId,
        captureMethod: 'automatic',
        description: `POS Checkout (${items.length} items)`
      }, settings);
      paymentIntentId = piCreateRes.result.paymentIntentId;

      trace.push({
        step: stepNum++,
        toolName: 'stripe_create_payment_intent',
        description: `Created Stripe PaymentIntent ${paymentIntentId} (${currency.toUpperCase()} ${amount.toFixed(2)})`,
        status: 'success',
        input: { amount, currency, customerId: customerSyncRes.result.customerId },
        output: piCreateRes.result,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - t3Start
      });

      // Step 4: Confirm Payment Intent
      const t4Start = Date.now();
      const piConfirmRes = await executeStripeMcpTool('stripe_confirm_payment_intent', {
        paymentIntentId,
        cardLast4: last4,
        cardBrand: brand,
        isManualPunch: paymentMethod === 'manual_punch',
        amount
      }, settings);

      trace.push({
        step: stepNum++,
        toolName: 'stripe_confirm_payment_intent',
        description: `Confirmed card authorization and settled funds via Stripe network`,
        status: 'success',
        input: { paymentIntentId, cardLast4: last4, isManualPunch: paymentMethod === 'manual_punch' },
        output: piConfirmRes.result,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - t4Start
      });
    }

    // Prepare complete transaction record
    const finalTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      receiptNumber,
      stripePaymentIntentId: paymentIntentId,
      amount,
      subtotal: subtotal ?? (amount * 0.9),
      tax: tax ?? (amount * 0.1),
      tip: tip || 0,
      discount: discount || 0,
      currency,
      status: 'succeeded',
      paymentMethod,
      customerName: customerName || 'Walk-in Customer',
      customerEmail: customerEmail || '',
      cardLast4: last4,
      cardBrand: brand,
      items: items || [],
      timestamp: new Date().toISOString(),
      offlineSynced: true,
      notes: notes || '',
      mcpOrchestrated: true,
      mcpTrace: trace,
      radarRiskScore: radarEvaluation.radarRiskScore,
      radarOutcome: radarEvaluation.outcome,
      isForceSale,
      authCode: authCode || undefined,
      agentSummary: `Orchestrated via Stripe Model Context Protocol (MCP) Agent across 4 automated tools.`
    };

    // Step 5: Log to Firestore
    const t5Start = Date.now();
    const firestoreLogRes = await executeStripeMcpTool('firestore_log_transaction', {
      transaction: finalTransaction
    }, settings);

    trace.push({
      step: stepNum++,
      toolName: 'firestore_log_transaction',
      description: 'Committed verified transaction record to cloud Firestore ledger',
      status: firestoreLogRes.result.savedToFirestore ? 'success' : 'warning',
      input: { transactionId: finalTransaction.id, amount: finalTransaction.amount },
      output: firestoreLogRes.result,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - t5Start
    });

    finalTransaction.mcpTrace = trace;

    // Optional: Ask Gemini 3.8 Flash to synthesize a brief agent summary
    let agentSummaryText = `Stripe MCP Agent successfully orchestrated transaction ${receiptNumber}. Payment Intent ${paymentIntentId} captured with Radar Risk Score ${radarEvaluation.radarRiskScore}/100.`;
    try {
      const summaryPrompt = `You are the Stripe MCP Payment Orchestration Agent. Summarize this completed payment in 1-2 professional sentences for the merchant:
- Amount: $${amount.toFixed(2)} ${currency}
- Method: ${paymentMethod} (${brand} *${last4})
- Radar Risk: Score ${radarEvaluation.radarRiskScore} (${radarEvaluation.outcome})
- Force Sale: ${isForceSale ? 'Yes (Auth Code: ' + authCode + ')' : 'No'}
- Tools Executed: ${trace.map(t => t.toolName).join(', ')}`;

      const agentRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: summaryPrompt
      });
      if (agentRes.text) {
        agentSummaryText = agentRes.text.trim();
      }
    } catch (aiErr) {
      console.warn('AI summary generation skipped:', aiErr);
    }

    finalTransaction.agentSummary = agentSummaryText;

    const result = {
      success: true,
      transaction: finalTransaction,
      mcpTrace: trace,
      radarEvaluation,
      agentSummary: agentSummaryText
    };

    await logApiCall('/api/stripe/mcp-agent', 'POST', body, result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Stripe MCP Agent error:', error);
    const errorResponse = {
      success: false,
      error: error.message || 'Stripe MCP Agent encountered an unexpected processing error',
      mcpTrace: trace
    };
    await logApiCall('/api/stripe/mcp-agent', 'POST', body, errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
