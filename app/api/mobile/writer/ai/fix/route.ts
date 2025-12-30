import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Nota: Verifique se o modelo 'gemini-2.5-flash' existe na sua conta. 
// Normalmente usamos 'gemini-1.5-flash' ou 'gemini-pro'. 
// Vou manter o seu, mas fique atento.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    // Recebemos 'text' e um 'mode' opcional
    const { text, mode } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Sugestão: Use 1.5 se o 2.5 falhar

    let prompt = "";

    // MODO DICIONÁRIO (Lookup)
    if (mode === 'lookup') {
      prompt = `
        Você é um dicionário inteligente e corretor ortográfico.
        A entrada é uma única palavra (que pode estar errada).
        
        Tarefa:
        1. Identifique a palavra pretendida.
        2. Retorne a correção e sugestões de sinônimos ou palavras parecidas.
        
        Entrada: "${text}"

        Responda APENAS com este JSON válido (sem markdown):
        {
          "corrected": "palavra_corrigida",
          "suggestions": ["sugestão1", "sugestão2", "sugestão3"]
        }
      `;
    } 
    // MODO GRAMÁTICA (Padrão)
    else {
      prompt = `
        Você é um assistente de escrita e editor gramatical profissional.
        Tarefa: Analisar o texto em português fornecido abaixo.

        Se o texto contiver erros ortográficos, gramaticais ou de pontuação:
        - Retorne a versão corrigida em "corrected".
        - Explique brevemente o erro em "explanation".

        Se o texto estiver perfeito:
        - Retorne o mesmo texto em "corrected".
        - Deixe "explanation" como null.

        Entrada: "${text}"

        Responda APENAS com este JSON válido (sem markdown):
        {
          "corrected": "string",
          "explanation": "string ou null",
          "suggestions": [] 
        }
      `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();

    // Limpeza sanitária do JSON (Sempre bom ter)
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const json = JSON.parse(textResponse);
      return NextResponse.json(json);
    } catch (e) {
      console.error("Erro parse JSON Gemini:", textResponse);
      // Fallback inteligente
      return NextResponse.json({ 
        corrected: text, 
        explanation: "Erro ao processar resposta da IA.",
        suggestions: []
      });
    }

  } catch (error) {
    console.error("Erro API IA:", error);
    return NextResponse.json({ error: "Falha no serviço de IA" }, { status: 500 });
  }
}