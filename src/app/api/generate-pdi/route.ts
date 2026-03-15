import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_INSTRUCTION, getGenerationPrompt } from '@/lib/prompts';

// Inicializa o SDK do Gemini
// A chave deve ser definida no arquivo .env como GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { year, content, diagnosis } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "API Key do Gemini não configurada no servidor." },
                { status: 500 }
            );
        }

        if (!content || !diagnosis || !year) {
            return NextResponse.json(
                { error: "Dados insuficientes para gerar o PDI." },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        const prompt = getGenerationPrompt(year, content, diagnosis);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Tenta limpar possíveis marcações de markdown do JSON
        const cleanJson = text.replace(/```json|```/g, "").trim();

        try {
            const pdiData = JSON.parse(cleanJson);
            return NextResponse.json(pdiData);
        } catch (parseError) {
            console.error("Erro ao fazer parse do JSON da IA:", text);
            return NextResponse.json(
                { error: "A IA retornou um formato inválido. Tente novamente." },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error("Erro na rota de geração de PDI:", error);
        return NextResponse.json(
            { error: "Erro interno ao processar com a IA." },
            { status: 500 }
        );
    }
}
