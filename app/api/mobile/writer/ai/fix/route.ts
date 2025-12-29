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
      Você é um editor de livros experiente e revisor gramatical.
      Analise o seguinte texto em ${language}.
      Identifique erros gramaticais, ortográficos ou de pontuação.
      
      Retorne APENAS um objeto JSON (sem markdown, sem crase) no seguinte formato:
      {
        "corrected": "O texto corrigido aqui",
        "hasErrors": true/false,
        "explanation": "Uma explicação breve e educada do que foi corrigido (máximo 1 frase)."
      }

      Texto para analisar: "${text}"
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