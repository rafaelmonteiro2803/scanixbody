import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const extractSchema = z.object({
  extractionType: z.enum(['workout', 'diet', 'medications', 'exams', 'bioimpedance']),
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
Retorne APENAS o JSON, sem explicações.`,

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
Retorne APENAS o JSON.`,

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
Retorne APENAS o JSON.`,

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
Retorne APENAS o JSON.`,

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
Inclua apenas campos que encontrar no documento. Retorne APENAS o JSON.`,
}

// Mock data for development (when no AI key is configured)
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
    weight: 85.5,
    height: 178,
    bmi: 27.0,
    bodyFatPercentage: 18.5,
    fatMass: 15.8,
    skeletalMuscleMass: 42.3,
    leanMass: 69.7,
    bodyWater: 54.2,
    proteinMass: 12.1,
    mineralsMass: 3.4,
    visceralFat: 8,
    inbodyScore: 74,
    basalMetabolicRate: 1920,
    segments: {
      rightArm: { leanMass: 3.8, fatMass: 0.9 },
      leftArm: { leanMass: 3.7, fatMass: 0.9 },
      trunk: { leanMass: 30.2, fatMass: 9.1 },
      rightLeg: { leanMass: 9.8, fatMass: 2.3 },
      leftLeg: { leanMass: 9.7, fatMass: 2.3 },
    },
  },
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

  // If no OpenAI key, return mock data for development
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return NextResponse.json({
      success: true,
      extracted: MOCK_RESPONSES[extractionType],
      rawText: content.slice(0, 200),
      confidence: 0.7,
      mock: true,
    })
  }

  // Call OpenAI API
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em extrair dados estruturados de documentos de saúde e fitness. Sempre retorne JSON válido.' },
          { role: 'user', content: `${prompt}\n\nDOCUMENTO:\n${content.slice(0, 8000)}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiRes.ok) {
      throw new Error(`OpenAI error: ${openaiRes.status}`)
    }

    const openaiData = await openaiRes.json() as { choices: Array<{ message: { content: string } }> }
    const rawText = openaiData.choices[0]?.message?.content ?? '{}'
    let extracted: unknown

    try {
      extracted = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ success: false, error: 'IA retornou formato inválido' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      extracted,
      rawText: content.slice(0, 200),
      confidence: 0.9,
    })
  } catch (err) {
    console.error('AI extraction error:', err)
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar com IA. Verifique sua chave de API.',
    }, { status: 500 })
  }
}
