'use client';

import React, { useState } from 'react';
import { Transaction, Product } from '@/types/pos';
import { Bot, Sparkles, Send, User, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';
import Markdown from 'react-markdown';

interface AISalesCopilotProps {
  transactions: Transaction[];
  products: Product[];
}

export const AISalesCopilot: React.FC<AISalesCopilotProps> = ({
  transactions,
  products
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I am your StripeFlow AI Sales Copilot. I can analyze your transaction ledger, forecast peak hours, suggest product bundles, and help optimize your POS operations. What would you like to know today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedPrompts = [
    'Analyze today peak sales hours and recommend staffing levels.',
    'Which top 3 products should we feature in our morning combo bundle?',
    'Give me a summary of offline store-and-forward reconciliation status.',
    'What pricing strategy should we use for low-stock inventory items?'
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          transactions,
          products
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.analysis }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error generating insights.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to StripeFlow AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950/80 via-indigo-950/80 to-slate-900 border border-violet-500/30 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>StripeFlow AI Sales Copilot</span>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                Gemini 2.5 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-400">Intelligent analytics, revenue forecasting, and merchant assistance</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 p-4 rounded-2xl transition-all group flex items-center justify-between shadow-md"
          >
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="text-xs font-medium text-slate-200 group-hover:text-violet-300 transition-colors">{prompt}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors shrink-0 ml-2" />
          </button>
        ))}
      </div>

      {/* Chat Transcript Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 min-h-[420px] max-h-[550px] overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-950 border border-slate-800 text-slate-200'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body space-y-2">
                  <Markdown>{msg.content}</Markdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center space-x-2">
              <div className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              <span>Analyzing Stripe transactions & inventory data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask StripeFlow AI about sales trends, customer behavior, or inventory..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 shadow-xl"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-2xl font-semibold shadow-xl shadow-violet-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>Ask Copilot</span>
        </button>
      </form>

    </div>
  );
};
