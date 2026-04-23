'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bot,
  Upload,
  Utensils,
  CheckCircle2,
  XCircle,
  Sparkles,
  ThumbsUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { MealCard } from './components/MealCard';
import { MealForm } from './components/MealForm';
import { MacroSummary } from './components/MacroSummary';
import type { MealsRow } from '@/types/database.types';
import type { CreateMealDTO } from '@/types/domain.types';
import { cn } from '@/lib/utils';
import { importDiet } from '@/services/import.service';

// ── Types ──────────────────────────────────────────────────────

type DietTab = 'manual' | 'ia' | 'importar';

interface AIAnalysisResult {
  meals: Array<{ name: string; items: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }>;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  positive_points: string[];
  improvement_points: string[];
}

interface ImportedMeal {
  meal_name: string;
  time?: string;
  items?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

// ── Mock data ──────────────────────────────────────────────────

let MOCK_ID_COUNTER = 10;

const INITIAL_MEALS: MealsRow[] = [
  {
    id: '1',
    user_id: 'mock',
    meal_date: format(new Date(), 'yyyy-MM-dd'),
    meal_name: 'café da manhã',
    time: '07:30',
    items: '3 ovos mexidos, 2 fatias de pão integral, 1 xícara de café preto, 1 banana',
    calories: 520,
    protein_g: 28,
    carbs_g: 55,
    fat_g: 18,
    source: 'manual',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: '2',
    user_id: 'mock',
    meal_date: format(new Date(), 'yyyy-MM-dd'),
    meal_name: 'almoço',
    time: '12:30',
    items: '180g peito de frango grelhado, 150g arroz integral, 100g feijão, salada de folhas verdes com azeite',
    calories: 680,
    protein_g: 48,
    carbs_g: 72,
    fat_g: 12,
    source: 'manual',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: '3',
    user_id: 'mock',
    meal_date: format(new Date(), 'yyyy-MM-dd'),
    meal_name: 'pré-treino',
    time: '16:00',
    items: '1 scoop whey protein, 1 banana, 30g aveia',
    calories: 310,
    protein_g: 30,
    carbs_g: 42,
    fat_g: 4,
    source: 'manual',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

const DAILY_TARGETS = {
  calories: 2600,
  protein_g: 160,
  carbs_g: 280,
  fat_g: 70,
};

// ── AI Mock ────────────────────────────────────────────────────

async function mockAIAnalysis(text: string): Promise<AIAnalysisResult> {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    meals: [
      { name: 'Café da Manhã', items: text.slice(0, 60) + '…', calories: 480, protein_g: 25, carbs_g: 50, fat_g: 16 },
      { name: 'Almoço', items: 'Refeição identificada pela IA', calories: 650, protein_g: 44, carbs_g: 68, fat_g: 11 },
    ],
    total_calories: 1130,
    total_protein_g: 69,
    total_carbs_g: 118,
    total_fat_g: 27,
    positive_points: [
      'Boa fonte de proteína magra identificada',
      'Presença de vegetais e fibras na alimentação',
      'Carboidratos complexos como fonte energética',
    ],
    improvement_points: [
      'Aumentar ingestão hídrica ao longo do dia',
      'Considerar adicionar gorduras saudáveis (abacate, castanhas)',
      'Incluir mais refeições distribuídas para melhor síntese proteica',
    ],
  };
}

// ── Page Component ─────────────────────────────────────────────

export default function DietaPage() {
  const [activeTab, setActiveTab] = useState<DietTab>('manual');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [meals, setMeals] = useState<MealsRow[]>(INITIAL_MEALS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealsRow | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);

  // AI tab state
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Import tab state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importedMeals, setImportedMeals] = useState<ImportedMeal[] | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // ── Date navigation ────────────────────────────────────────

  const navigateDate = (delta: number) => {
    const parsed = parseISO(selectedDate);
    const newDate = delta > 0 ? addDays(parsed, 1) : subDays(parsed, 1);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const formattedDate = format(parseISO(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  // ── Meals for selected date ────────────────────────────────

  const dayMeals = meals.filter((m) => m.meal_date === selectedDate);

  const totals = dayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein_g: acc.protein_g + (m.protein_g ?? 0),
      carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
      fat_g: acc.fat_g + (m.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  // ── Meal CRUD ──────────────────────────────────────────────

  const handleAddMeal = useCallback(async (dto: CreateMealDTO) => {
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const newMeal: MealsRow = {
      id: String(++MOCK_ID_COUNTER),
      user_id: 'mock',
      meal_date: dto.meal_date,
      meal_name: dto.meal_name,
      time: dto.time ?? null,
      items: dto.items ?? null,
      calories: dto.calories ?? null,
      protein_g: dto.protein_g ?? null,
      carbs_g: dto.carbs_g ?? null,
      fat_g: dto.fat_g ?? null,
      source: dto.source ?? 'manual',
      notes: dto.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (editingMeal) {
      setMeals((prev) => prev.map((m) => (m.id === editingMeal.id ? { ...newMeal, id: editingMeal.id } : m)));
    } else {
      setMeals((prev) => [...prev, newMeal]);
    }
    setFormLoading(false);
    setFormOpen(false);
    setEditingMeal(undefined);
  }, [editingMeal]);

  const handleEdit = useCallback((meal: MealsRow) => {
    setEditingMeal(meal);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((meal: MealsRow) => {
    setMeals((prev) => prev.filter((m) => m.id !== meal.id));
  }, []);

  // ── AI Analysis ────────────────────────────────────────────

  const handleAIAnalyze = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await mockAIAnalysis(aiText);
      setAiResult(result);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────

  const handleImportFile = async (file: File) => {
    setImportFile(file);
    setImportLoading(true);
    setImportedMeals(null);
    setImportConfirmed(false);
    setImportError(null);
    try {
      const result = await importDiet(file);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Não foi possível extrair refeições do arquivo.');
      }
      setImportedMeals(result.data.meals.map((m) => ({
        meal_name: m.mealName,
        time: m.time ?? undefined,
        items: m.items ?? undefined,
        calories: m.calories ?? undefined,
        protein_g: m.proteinG ?? undefined,
        carbs_g: m.carbsG ?? undefined,
        fat_g: m.fatG ?? undefined,
      })));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao processar arquivo.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importedMeals) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const saved: MealsRow[] = [];
      for (const m of importedMeals) {
        const res = await fetch('/api/v1/dieta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealDate: selectedDate,
            mealName: m.meal_name,
            time: m.time ?? null,
            items: m.items ?? null,
            calories: m.calories ?? null,
            proteinG: m.protein_g ?? null,
            carbsG: m.carbs_g ?? null,
            fatG: m.fat_g ?? null,
            source: 'import',
          }),
        });
        const json = await res.json() as { data?: MealsRow };
        if (json.data) saved.push(json.data);
      }
      if (saved.length > 0) setMeals((prev) => [...prev, ...saved]);
      setImportConfirmed(true);
      setImportedMeals(null);
      setImportFile(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao salvar refeições.');
    } finally {
      setImportLoading(false);
    }
  };

  // ── Tabs config ────────────────────────────────────────────

  const TABS = [
    { value: 'manual' as DietTab, label: 'Manual', icon: <Utensils className="w-4 h-4" /> },
    { value: 'ia' as DietTab, label: 'Análise IA', icon: <Bot className="w-4 h-4" /> },
    { value: 'importar' as DietTab, label: 'Importar Arquivo', icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-background-card px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-text-primary uppercase tracking-widest font-display">
              DIETA
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Registro e análise nutricional</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" dot>
              {dayMeals.length} refeições
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs */}
        <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} variant="pill" />

        {/* ── MANUAL TAB ── */}
        <TabPanel value="manual" activeValue={activeTab}>
          <div className="space-y-6">
            {/* Date selector */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background-card px-4 py-3">
              <button
                type="button"
                onClick={() => navigateDate(-1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
                aria-label="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-text-primary capitalize truncate">
                  {formattedDate}
                </span>
                {isToday && (
                  <Badge variant="primary" size="sm">Hoje</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="sr-only"
                  id="date-picker"
                />
                <button
                  type="button"
                  onClick={() => navigateDate(1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
                  aria-label="Próximo dia"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meals list + summary layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Meals list */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                    Refeições
                  </h2>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setEditingMeal(undefined);
                      setFormOpen(true);
                    }}
                  >
                    Adicionar
                  </Button>
                </div>

                {dayMeals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background-card p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
                      <Utensils className="w-6 h-6 text-text-muted" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary">Nenhuma refeição registrada</p>
                    <p className="text-xs text-text-muted mt-1">Clique em "Adicionar" para registrar sua primeira refeição do dia</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        setEditingMeal(undefined);
                        setFormOpen(true);
                      }}
                    >
                      Adicionar Refeição
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayMeals
                      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                      .map((meal) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Daily summary */}
              <div className="lg:col-span-1">
                <MacroSummary
                  calories={totals.calories}
                  protein_g={totals.protein_g}
                  carbs_g={totals.carbs_g}
                  fat_g={totals.fat_g}
                  target_calories={DAILY_TARGETS.calories}
                  target_protein_g={DAILY_TARGETS.protein_g}
                  target_carbs_g={DAILY_TARGETS.carbs_g}
                  target_fat_g={DAILY_TARGETS.fat_g}
                />
              </div>
            </div>
          </div>
        </TabPanel>

        {/* ── AI ANALYSIS TAB ── */}
        <TabPanel value="ia" activeValue={activeTab}>
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Análise com Inteligência Artificial</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Cole a descrição das suas refeições do dia e a IA irá extrair os dados nutricionais automaticamente.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background-card p-5 space-y-4">
              <Textarea
                label="Descrição das refeições"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={6}
                placeholder="Ex: Café da manhã às 7h: 3 ovos mexidos, 2 fatias de pão integral com manteiga, café com leite. Almoço às 12h: 200g frango, arroz, feijão e salada..."
                helperText="Descreva suas refeições em linguagem natural. Quanto mais detalhes, melhor a estimativa."
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleAIAnalyze}
                loading={aiLoading}
                disabled={!aiText.trim() || aiLoading}
                leftIcon={<Bot className="w-4 h-4" />}
                fullWidth
              >
                {aiLoading ? 'Analisando com IA...' : 'Analisar com IA'}
              </Button>
            </div>

            {/* AI Loading state */}
            {aiLoading && (
              <div className="rounded-xl border border-border bg-background-card p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse-green">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Processando com IA...</p>
                <p className="text-xs text-text-muted mt-1">Identificando refeições e estimando macronutrientes</p>
              </div>
            )}

            {/* AI Result */}
            {aiResult && !aiLoading && (
              <div className="space-y-4 animate-slide-up">
                {/* Extracted meals */}
                <div className="rounded-xl border border-border bg-background-card p-4">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    Refeições Identificadas
                  </h3>
                  <div className="space-y-2">
                    {aiResult.meals.map((meal, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary">{meal.name}</p>
                          <p className="text-xs text-text-muted">{meal.items}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className="text-2xs px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 font-semibold">{meal.calories} kcal</span>
                            <span className="text-2xs px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 font-semibold">{meal.protein_g}g prot</span>
                            <span className="text-2xs px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-semibold">{meal.carbs_g}g carb</span>
                            <span className="text-2xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 font-semibold">{meal.fat_g}g gord</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Macro summary */}
                <MacroSummary
                  calories={aiResult.total_calories}
                  protein_g={aiResult.total_protein_g}
                  carbs_g={aiResult.total_carbs_g}
                  fat_g={aiResult.total_fat_g}
                  target_calories={DAILY_TARGETS.calories}
                  target_protein_g={DAILY_TARGETS.protein_g}
                  target_carbs_g={DAILY_TARGETS.carbs_g}
                  target_fat_g={DAILY_TARGETS.fat_g}
                />

                {/* Feedback panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Positive points */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Pontos Positivos
                    </h4>
                    <ul className="space-y-2">
                      {aiResult.positive_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvement points */}
                  <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                    <h4 className="text-xs font-bold text-warning uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Pontos de Melhoria
                    </h4>
                    <ul className="space-y-2">
                      {aiResult.improvement_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabPanel>

        {/* ── IMPORT TAB ── */}
        <TabPanel value="importar" activeValue={activeTab}>
          <div className="space-y-5">
            <div className="rounded-xl border border-border/50 bg-surface-1 px-4 py-3 flex items-start gap-3">
              <Upload className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Importar plano alimentar</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Faça upload de um arquivo de dieta (PDF, TXT, DOCX). A IA irá extrair as refeições automaticamente para revisão.
                </p>
              </div>
            </div>

            {!importConfirmed ? (
              <div className="rounded-xl border border-border bg-background-card p-5 space-y-4">
                <FileUpload
                  accept=".pdf,.txt,.docx"
                  maxSize={10 * 1024 * 1024}
                  file={importFile}
                  onFileSelect={handleImportFile}
                  onClear={() => {
                    setImportFile(null);
                    setImportedMeals(null);
                  }}
                  placeholder="Arraste seu plano alimentar ou clique para selecionar"
                  hint="PDF, TXT ou DOCX · Máx. 10 MB"
                  disabled={importLoading}
                />

                {/* Import loading */}
                {importLoading && (
                  <div className="rounded-lg border border-border bg-surface-2 p-6 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-text-primary">Extraindo dados com IA...</p>
                    <p className="text-xs text-text-muted mt-1">Analisando o arquivo e identificando as refeições</p>
                  </div>
                )}

                {/* Extracted meals review */}
                {importedMeals && !importLoading && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                        Refeições Extraídas — Revisão
                      </h3>
                      <Badge variant="info">{importedMeals.length} refeições</Badge>
                    </div>

                    <div className="space-y-2">
                      {importedMeals.map((m, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-background-elevated p-3 flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-text-primary">{m.meal_name}</span>
                              {m.time && (
                                <span className="text-xs text-text-muted border border-border rounded-full px-2 py-0.5">{m.time}</span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted line-clamp-1">{m.items}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {m.calories && <span className="text-2xs px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 font-semibold">{m.calories} kcal</span>}
                              {m.protein_g && <span className="text-2xs px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 font-semibold">{m.protein_g}g prot</span>}
                              {m.carbs_g && <span className="text-2xs px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-semibold">{m.carbs_g}g carb</span>}
                              {m.fat_g && <span className="text-2xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 font-semibold">{m.fat_g}g gord</span>}
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        </div>
                      ))}
                    </div>

                    {importError && (
                      <p className="text-xs text-danger mb-2">{importError}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="md"
                        leftIcon={<XCircle className="w-4 h-4" />}
                        onClick={() => {
                          setImportedMeals(null);
                          setImportFile(null);
                          setImportError(null);
                        }}
                        disabled={importLoading}
                      >
                        Descartar
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={handleConfirmImport}
                        loading={importLoading}
                        className="flex-1"
                      >
                        Confirmar e Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center animate-slide-up">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-base font-bold text-text-primary">Refeições importadas com sucesso!</p>
                <p className="text-sm text-text-muted mt-1">As refeições foram adicionadas ao dia {selectedDate}.</p>
                <Button
                  variant="outline"
                  size="md"
                  className="mt-4"
                  onClick={() => {
                    setImportConfirmed(false);
                    setActiveTab('manual');
                  }}
                >
                  Ver refeições
                </Button>
              </div>
            )}
          </div>
        </TabPanel>
      </div>

      {/* Meal form modal */}
      <MealForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMeal(undefined);
        }}
        onSubmit={handleAddMeal}
        defaultValues={editingMeal}
        mealDate={selectedDate}
        loading={formLoading}
      />
    </div>
  );
}
