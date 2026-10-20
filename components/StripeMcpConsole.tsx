'use client';

import React, { useState } from 'react';
import { StoreSettings, Transaction, McpAgentTraceStep } from '@/types/pos';
import { STRIPE_MCP_TOOLS } from '@/lib/stripe-mcp-engine';
import { 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Code, 
  Server, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Zap, 
  CreditCard,
  RefreshCw,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StripeMcpConsoleProps {
  settings: StoreSettings;
  onTransactionLogged: (txn: Transaction) => void;
}

export const StripeMcpConsole: React.FC<StripeMcpConsoleProps> = ({
  settings,
  onTransactionLogged
}) => {
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTrace, setActiveTrace] = useState<McpAgentTraceStep[]>([]);
  const [agentSummary, setAgentSummary] = useState<string | null>(null);
  const [lastTxn, setLastTxn] = useState<Transaction | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const presets = [
    {
      title: 'Orchestrate Normal Card Checkout',
      desc: '$38.50 charge on Visa 4242 with 15% tip for Alex Carter',
      payload: {
        amount: 44.28,
        subtotal: 38.50,
        tax: 3.37,
        tip: 2.41,
        customerName: 'Alex Carter',
        customerEmail: 'alex.carter@example.com',
        cardDetails: { number: '4242 4242 4242 4242', expMonth: '12', expYear: '28', cvc: '123', zip: '94107' },
        paymentMethod: 'manual_punch'
      }
    },
    {
      title: 'Force Sale Capture Override',
      desc: 'Capture $75.00 with manual phone authorization code FORCE-7788',
      payload: {
        amount: 75.00,
        subtotal: 68.96,
        tax: 6.04,
        tip: 0,
        customerName: 'Elena Rostova',
        customerEmail: 'elena@merchant.org',
        isForceSale: true,
        authCode: 'FORCE-7788',
        cardDetails: { number: '5555 4444 3333 2221', expMonth: '10', expYear: '29', cvc: '456', zip: '10001' },
        paymentMethod: 'manual_punch'
      }
    },
    {
      title: 'Simulate Radar Fraud Block',
      desc: 'High-risk card 0000 to test automated Radar rule blocking',
      payload: {
        amount: 850.00,
        subtotal: 780.00,
        tax: 70.00,
        tip: 0,
        customerName: 'Suspicious Entity',
        customerEmail: 'flagged@suspicious-domain.xyz',
        cardDetails: { number: '4242 4242 4242 0000', expMonth: '05', expYear: '26', cvc: '', zip: '' },
        paymentMethod: 'manual_punch'
      }
    }
  ];

  const handleRunAgent = async (customPayload?: any) => {
    setIsRunning(true);
    setActiveTrace([]);
    setAgentSummary(null);
    setLastTxn(null);

    const payload = customPayload || {
      amount: 29.99,
      subtotal: 27.58,
      tax: 2.41,
      tip: 0,
      customerName: 'Terminal Customer',
      customerEmail: 'customer@stripeflow.dev',
      cardDetails: { number: '4242 4242 4242 4242', cvc: '888', zip: '94107' },
      paymentMethod: 'manual_punch',
      notes: prompt || 'MCP interactive console execution'
    };

    try {
      const res = await fetch('/api/stripe/mcp-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          settings
        })
      });

      const data = await res.json();
      if (data.mcpTrace) {
        setActiveTrace(data.mcpTrace);
      }
      if (data.agentSummary) {
        setAgentSummary(data.agentSummary);
      }

      if (data.success && data.transaction) {
        setLastTxn(data.transaction);
        onTransactionLogged(data.transaction);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else {
        setAgentSummary(data.error || 'Transaction was rejected by Stripe MCP Agent.');
      }
    } catch (err: any) {
      setAgentSummary(`Execution error: ${err.message || 'Network failure'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / MCP Agent Header */}
      <div className="bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 text-white">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Stripe MCP Agent</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Protocol: MCP 2024-11-05
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous orchestration of Stripe payments, Radar heuristics, customer synchronization, and ledger commits
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300 flex items-center space-x-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">Engine: gemini-3.8-flash</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span>Radar: {settings.radarRiskLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Preset Action Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presets.map((preset, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-semibold text-sm text-slate-100 group-hover:text-violet-300 transition-colors">
                  {preset.title}
                </h4>
                <Zap className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{preset.desc}</p>
            </div>
            <button
              onClick={() => handleRunAgent(preset.payload)}
              disabled={isRunning}
              className="mt-4 w-full bg-slate-950 hover:bg-violet-600 text-slate-300 hover:text-white border border-slate-800 hover:border-violet-500 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3 h-3 text-violet-400 group-hover:text-white" />
              )}
              <span>Orchestrate Scenario</span>
            </button>
          </div>
        ))}
      </div>

      {/* Live Agent Execution Output */}
      {(activeTrace.length > 0 || isRunning || agentSummary) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-slate-100 text-sm">MCP Orchestration Trace & Tool Call Stack</h3>
            </div>
            {isRunning && (
              <div className="flex items-center space-x-2 text-xs text-violet-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Agent executing MCP tools...</span>
              </div>
            )}
          </div>

          {/* Agent Summary Banner */}
          {agentSummary && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 ${
              lastTxn 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}>
              {lastTxn ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">
                  {lastTxn ? 'Agent Execution Complete' : 'Agent Action Aborted'}
                </span>
                <p>{agentSummary}</p>
              </div>
            </div>
          )}

          {/* Step-by-Step Tool Trace */}
          <div className="space-y-3">
            {activeTrace.map((step) => {
              const isExpanded = expandedSteps[step.step];
              return (
                <div
                  key={step.step}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleStep(step.step)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-400 font-mono text-xs font-bold flex items-center justify-center border border-violet-500/30">
                        {step.step}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-semibold text-slate-100">
                            {step.toolName}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                            step.status === 'success' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : step.status === 'warning'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      {step.latencyMs !== undefined && (
                        <span className="font-mono text-[11px]">{step.latencyMs}ms</span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">
                          Tool Input Parameters
                        </span>
                        <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">
                          Tool Output Payload
                        </span>
                        <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto text-[11px]">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stripe MCP Server Tool Registry Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Registered Stripe MCP Tools ({STRIPE_MCP_TOOLS.length})</h3>
          </div>
          <span className="text-xs text-slate-400">Standard Model Context Protocol Tool Declarations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {STRIPE_MCP_TOOLS.map((tool) => {
            const isSelected = selectedTool === tool.name;
            return (
              <div
                key={tool.name}
                onClick={() => setSelectedTool(isSelected ? null : tool.name)}
                className={`bg-slate-950 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected ? 'border-violet-500 bg-slate-950/90 shadow-lg shadow-violet-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-violet-300">{tool.name}</span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    {Object.keys(tool.inputSchema.properties || {}).length} params
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">JSON Schema:</span>
                    <pre className="bg-slate-900 p-2.5 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(tool.inputSchema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
