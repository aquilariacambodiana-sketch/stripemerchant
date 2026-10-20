import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, transactions, products } = await req.json();

    const systemInstruction = `You are StripeFlow AI Sales Copilot, an expert retail and merchant analytics assistant. 
You help store managers analyze their transaction ledger, inventory turnover, peak sales times, and customer purchasing habits.
Provide actionable insights, clear bullet points, and professional merchant advice in JSON or clean markdown.`;

    const dataContext = `
Current Transactions Summary: ${JSON.stringify(transactions?.slice(0, 15) || [])}
Inventory Catalog: ${JSON.stringify(products || [])}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nContext Data:\n${dataContext}\n\nMerchant Query / Request:\n${prompt}` }] }
      ]
    });

    return NextResponse.json({
      success: true,
      analysis: response.text || 'No insights generated.'
    });

  } catch (error: any) {
    console.error('Gemini copilot error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate AI insights' }, { status: 500 });
  }
}
