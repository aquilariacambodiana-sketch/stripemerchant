import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { transcript, products } = await req.json();

    if (!transcript) {
      return NextResponse.json({ success: false, error: 'No transcript provided' }, { status: 400 });
    }

    const prompt = `You are a POS Natural Language Order Parser.
Available Catalog Products:
${JSON.stringify(products.map((p: any) => ({ id: p.id, name: p.name, price: p.price, category: p.category })))}

User Order Statement: "${transcript}"

Task: Match the items requested in the user statement to the available catalog products. Return a valid JSON array of objects with format:
[
  { "productId": "...", "quantity": number }
]
Only return raw JSON array without markdown backticks or extra text. If no products match, return [].`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.text || '[]';
    // Clean markdown if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let items = [];
    try {
      items = JSON.parse(cleaned);
    } catch {
      items = [];
    }

    return NextResponse.json({ success: true, items });

  } catch (error: any) {
    console.error('Parse order error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to parse order' }, { status: 500 });
  }
}
