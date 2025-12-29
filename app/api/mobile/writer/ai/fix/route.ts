import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Certifique-se de ter GOOGLE_API_KEY no seu .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um assistente de escrita e editor gramatical profissional.
      Tarefa: Analisar o texto em português fornecido abaixo.

      Se o texto contiver erros ortográficos, gramaticais ou de pontuação:
      - Retorne a versão corrigida em "corrected".
      - Explique brevemente o erro em "explanation".
      
      Se o texto for uma única palavra (para dicionário):
      - Retorne a palavra correta em "corrected".
      - Forneça 3 sinônimos ou grafias corretas alternativas em "suggestions".

      Se o texto estiver perfeito:
      - Retorne o mesmo texto em "corrected".
      - Deixe "explanation" como null.

      Entrada: "${text}"

      Responda APENAS com este JSON válido (sem blocos de código):
      {
        "corrected": "string",
        "explanation": "string ou null",
        "suggestions": ["string"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();

    // Limpeza para garantir JSON puro
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const json = JSON.parse(textResponse);
      return NextResponse.json(json);
    } catch (e) {
      console.error("Erro parse JSON Gemini:", textResponse);
      // Fallback gracioso
      return NextResponse.json({ 
        corrected: text, 
        explanation: "Não foi possível processar a resposta da IA." 
      });
    }

  } catch (error) {
    console.error("Erro API IA:", error);
    return NextResponse.json({ error: "Falha no serviço de IA" }, { status: 500 });
  }
}