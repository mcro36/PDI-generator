import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRefinementPrompt } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { text, diagnosis } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = getRefinementPrompt(text, diagnosis);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return NextResponse.json({ refinedText: response.text().trim() });

    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao refinar texto" }, { status: 500 });
    }
}
