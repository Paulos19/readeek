import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicialize com sua chave (garanta que está no .env)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { text, language = "português" } = await req.json();

    if (!text) return NextResponse.json({ error: "Texto vazio" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt otimizado para correção mantendo o estilo
    const prompt = `
  Analise: "${text}".
  Se for um texto longo, corrija a gramática.
  Se for UMA ÚNICA PALAVRA, verifique a ortografia e retorne 3 sugestões de correção ou sinônimos em um array "suggestions".
  Saída JSON: { corrected: string, suggestions?: string[], explanation: string }
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Limpeza para garantir que venha apenas JSON válido
    let jsonString = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Erro ao processar IA" }, { status: 500 });
  }
}