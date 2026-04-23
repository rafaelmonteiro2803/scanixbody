export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const extractSchema = z.object({
  extractionType: z.enum(['workout', 'diet', 'medications', 'exams', 'bioimpedance', 'analysis']),
  content: z.string().min(10, 'Conteúdo muito curto para extração'),
})

const EXTRACTION_PROMPTS: Record<string, string> = {
  workout: `Analise este texto/arquivo de treino e extraia a estrutura em JSON com o seguinte formato:
{
  "days": [
    {
      "name": "Dia A - Peito/Tríceps",
      "muscleGroups": ["Peito", "Tríceps"],
      "exercises": [
        {
          "name": "Supino Reto",
          "sets": 4,
          "targetReps": "8-12",
          "load": 80,
          "restSeconds": 90,
          "notes": ""
        }
      ]
    }
  ]
}
Retorne APENAS o JSON, sem explicações, sem markdown.`,

  diet: `Analise este plano alimentar/dieta e extraia as refeições em JSON:
{
  "meals": [
    {
      "mealName": "Café da manhã",
      "time": "07:00",
      "items": "Ovos mexidos, pão integral, suco de laranja",
      "calories": 450,
      "proteinG": 25,
      "carbsG": 50,
      "fatG": 12
    }
  ],
  "totalCalories": 2800,
  "totalProteinG": 180,
  "totalCarbsG": 320,
  "totalFatG": 80
}
Retorne APENAS o JSON, sem explicações, sem markdown.`,

  medications: `Extraia a lista de medicamentos/suplementos deste texto em JSON:
{
  "medications": [
    {
      "name": "Testosterona Cipionato",
      "category": "hormonio",
      "dose": "200mg",
      "frequency": "1x por semana",
      "route": "IM",
      "notes": ""
    }
  ]
}
Categorias válidas: hormonio, peptideo, suplemento, medicamento, sarm, outro.
Retorne APENAS o JSON, sem explicações, sem markdown.`,

  exams: `Extraia todos os marcadores laboratoriais deste laudo/exame em JSON:
{
  "reportDate": "2024-01-15",
  "labName": "Nome do Laboratório",
  "markers": [
    {
      "markerName": "Testosterona Total",
      "value": "650",
      "unit": "ng/dL",
      "referenceRange": "264-916",
      "status": "normal"
    }
  ]
}
Status válidos: normal, alto, baixo, critico.
Retorne APENAS o JSON, sem explicações, sem markdown.`,

  bioimpedance: `Extraia todos os dados de composição corporal deste laudo de bioimpedância (InBody ou similar) em JSON:
{
  "weight": 85.5,
  "height": 178,
  "bmi": 27.0,
  "bodyFatPercentage": 18.5,
  "fatMass": 15.8,
  "skeletalMuscleMass": 42.3,
  "leanMass": 69.7,
  "bodyWater": 54.2,
  "proteinMass": 12.1,
  "mineralsMass": 3.4,
  "visceralFat": 8,
  "inbodyScore": 74,
  "basalMetabolicRate": 1920,
  "segments": {
    "rightArm": { "leanMass": 3.8, "fatMass": 0.9 },
    "leftArm": { "leanMass": 3.7, "fatMass": 0.9 },
    "trunk": { "leanMass": 30.2, "fatMass": 9.1 },
    "rightLeg": { "leanMass": 9.8, "fatMass": 2.3 },
    "leftLeg": { "leanMass": 9.7, "fatMass": 2.3 }
  }
}
Inclua apenas campos que encontrar no documento. Retorne APENAS o JSON, sem explicações, sem markdown.`,

  analysis: `Você é um coach fitness e nutricionista especializado. Analise os dados do atleta abaixo e gere um relatório motivador e prático em português.

Retorne APENAS este JSON (sem markdown, sem explicações):
{
  "summary": "3-4 frases descrevendo o estado atual do atleta de forma honesta e motivadora",
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "improvements": ["área para melhorar 1", "área para melhorar 2"],
  "recommendations": ["recomendação prática 1", "recomendação prática 2", "recomendação prática 3", "recomendação prática 4"],
  "weeklyFocus": "a prioridade número 1 para os próximos 7 dias",
  "estimatedProgressTimeline": "estimativa de prazo para atingir o objetivo atual, ou null se não houver dados suficientes"
}`,
}

// Mock data for development (when no API key is configured)
const MOCK_RESPONSES: Record<string, unknown> = {
  workout: {
    days: [
      {
        name: 'Dia A - Peito/Tríceps',
        muscleGroups: ['Peito', 'Tríceps'],
        exercises: [
          { name: 'Supino Reto', sets: 4, targetReps: '8-12', load: 80, restSeconds: 90 },
          { name: 'Crucifixo Inclinado', sets: 3, targetReps: '12', load: 20, restSeconds: 60 },
          { name: 'Tríceps Corda', sets: 3, targetReps: '15', load: 25, restSeconds: 60 },
        ],
      },
    ],
  },
  diet: {
    meals: [
      { mealName: 'Café da manhã', time: '07:00', items: 'Ovos mexidos, pão integral, banana', calories: 450, proteinG: 28, carbsG: 52, fatG: 14 },
      { mealName: 'Almoço', time: '12:00', items: 'Frango grelhado, arroz, feijão, salada', calories: 680, proteinG: 55, carbsG: 75, fatG: 12 },
    ],
    totalCalories: 2800,
    totalProteinG: 200,
    totalCarbsG: 280,
    totalFatG: 70,
  },
  medications: {
    medications: [
      { name: 'Creatina Monohidratada', category: 'suplemento', dose: '5g', frequency: 'Diária', route: 'oral', notes: 'Pós-treino' },
    ],
  },
  exams: {
    reportDate: new Date().toISOString().slice(0, 10),
    labName: 'Laboratório Exemplo',
    markers: [
      { markerName: 'Testosterona Total', value: '650', unit: 'ng/dL', referenceRange: '264-916', status: 'normal' },
      { markerName: 'Hemoglobina', value: '15.2', unit: 'g/dL', referenceRange: '13.5-17.5', status: 'normal' },
      { markerName: 'TSH', value: '2.1', unit: 'mUI/L', referenceRange: '0.4-4.0', status: 'normal' },
    ],
  },
  bioimpedance: {
    weight: 85.5, height: 178, bmi: 27.0, bodyFatPercentage: 18.5,
    fatMass: 15.8, skeletalMuscleMass: 42.3, leanMass: 69.7, bodyWater: 54.2,
    proteinMass: 12.1, mineralsMass: 3.4, visceralFat: 8, inbodyScore: 74,
    basalMetabolicRate: 1920,
    segments: {
      rightArm: { leanMass: 3.8, fatMass: 0.9 }, leftArm: { leanMass: 3.7, fatMass: 0.9 },
      trunk: { leanMass: 30.2, fatMass: 9.1 }, rightLeg: { leanMass: 9.8, fatMass: 2.3 },
      leftLeg: { leanMass: 9.7, fatMass: 2.3 },
    },
  },
  analysis: {
    summary: 'Atleta com bom engajamento no treino e disciplina alimentar consistente. Os scores gerais indicam uma base sólida para progressão. Há oportunidades claras de melhora em hidratação e sono para otimizar a recuperação.',
    strengths: ['Frequência de treino consistente', 'Boa aderência ao plano alimentar', 'Cardio regularmente praticado'],
    improvements: ['Aumentar ingestão de água diária', 'Melhorar qualidade e duração do sono'],
    recommendations: ['Beba pelo menos 35ml de água por kg corporal por dia', 'Estabeleça um horário fixo para dormir antes das 23h', 'Adicione 1 sessão de mobilidade por semana', 'Revise os volumes de treino a cada 4 semanas'],
    weeklyFocus: 'Aumentar hidratação para 3L/dia e manter consistência no sono de 7-8h',
    estimatedProgressTimeline: '8-12 semanas para resultados visíveis com a estratégia atual',
  },
}

// Strips markdown code blocks from Claude's response
function parseClaudeJson(text: string): unknown {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = codeBlock ? codeBlock[1].trim() : text.trim()
  return JSON.parse(jsonStr)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = extractSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { extractionType, content } = parsed.data
  const prompt = EXTRACTION_PROMPTS[extractionType]

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({
      success: true,
      extracted: MOCK_RESPONSES[extractionType],
      rawText: content.slice(0, 200),
      confidence: 0.7,
      mock: true,
    })
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    // Use Sonnet for analysis (better reasoning), Haiku for structured extraction (faster + cheaper)
    const model = extractionType === 'analysis' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

    // Detect file type by prefix set by import.service.ts
    const pdfMatch = content.match(/^\[PDF_BASE64\]:(.+)/)
    const docxMatch = content.match(/^\[DOCX_BASE64\]:(.+)/)
    const xlsxMatch = content.match(/^\[XLSX_BASE64\]:(.+)/)

    let messageContent: Anthropic.MessageParam['content']

    if (pdfMatch) {
      // Use Claude's native PDF document API
      messageContent = [
        {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: pdfMatch[1],
          },
        },
        { type: 'text' as const, text: prompt },
      ]
    } else if (docxMatch) {
      // Extract text from DOCX using mammoth, then send as plain text
      const buffer = Buffer.from(docxMatch[1], 'base64')
      const result = await mammoth.extractRawText({ buffer })
      const docxText = result.value.trim()
      if (!docxText) {
        return NextResponse.json({ success: false, error: 'Não foi possível extrair texto do arquivo Word.' }, { status: 400 })
      }
      messageContent = `${prompt}\n\nDOCUMENTO:\n${docxText.slice(0, 12000)}`
    } else if (xlsxMatch) {
      return NextResponse.json({
        success: false,
        error: 'Arquivos XLSX não são suportados. Use PDF, Word (.docx) ou cole o texto diretamente.',
      }, { status: 400 })
    } else {
      // Plain text content
      messageContent = `${prompt}\n\nDOCUMENTO:\n${content.slice(0, 12000)}`
    }

    const message = await anthropic.messages.create({
      model,
      max_tokens: extractionType === 'analysis' ? 2048 : 4096,
      system: 'Você é um assistente especializado em extrair dados estruturados de documentos de saúde e fitness. Sempre retorne JSON válido, sem markdown, sem explicações adicionais.',
      messages: [{ role: 'user', content: messageContent }],
    })

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
    let extracted: unknown

    try {
      extracted = parseClaudeJson(rawText)
    } catch {
      return NextResponse.json({ success: false, error: 'IA retornou formato inválido' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      extracted,
      rawText: content.slice(0, 200),
      confidence: 0.95,
    })
  } catch (err) {
    console.error('AI extraction error:', err)
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar com IA. Verifique sua chave de API.',
    }, { status: 500 })
  }
}
