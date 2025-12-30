import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) return NextResponse.json({ error: "Texto inválido" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um dicionário e professor de literatura conciso.
      Analise o seguinte trecho selecionado de um livro: "${text}".

      1. Se for uma única palavra, dê a definição direta e um exemplo de uso.
      2. Se for uma frase ou expressão, explique o significado no contexto.
      3. Seja breve (máximo 3 linhas para definição).

      Responda APENAS neste formato JSON:
      {
        "definition": "A definição ou explicação aqui.",
        "example": "Uma frase de exemplo prática."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();
    
    // Limpeza do JSON
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(textResponse));

  } catch (error) {
    console.error("Erro AI Dictionary:", error);
    return NextResponse.json({ 
      definition: "Não foi possível carregar a definição.", 
      example: "" 
    });
  }
}