'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus,
  Bot,
  Upload,
  Utensils,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
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


const DAILY_TARGETS = {
  calories: 2600,
  protein_g: 160,
  carbs_g: 280,
  fat_g: 70,
};


// ── Page Component ─────────────────────────────────────────────

export default function DietaPage() {
  const [activeTab, setActiveTab] = useState<DietTab>('manual');
  const [meals, setMeals] = useState<MealsRow[]>([]);
  const [mealsLoading, setMealsLoading] = useState(true);

  const loadMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const res = await fetch('/api/v1/dieta');
      const json = await res.json() as { data?: { meals?: MealsRow[] } };
      setMeals(json.data?.meals ?? []);
    } catch { /* non-fatal */ } finally {
      setMealsLoading(false);
    }
  }, []);

  useEffect(() => { void loadMeals(); }, [loadMeals]);
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

  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const totals = meals.reduce(
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
    try {
      // Auto-estimate macros when items text is present but all macro values are empty
      let finalDto = dto;
      const hasMacros = dto.calories || dto.protein_g || dto.carbs_g || dto.fat_g;
      if (dto.items?.trim() && !hasMacros) {
        try {
          const result = await importDiet(`${dto.meal_name}: ${dto.items}`);
          if (result.success && result.data?.meals?.length) {
            const m = result.data.meals[0];
            finalDto = {
              ...dto,
              calories: m.calories ?? undefined,
              protein_g: m.proteinG ?? undefined,
              carbs_g: m.carbsG ?? undefined,
              fat_g: m.fatG ?? undefined,
            };
          }
        } catch {
          // non-fatal: save without macros if AI estimation fails
        }
      }

      const method = editingMeal ? 'PUT' : 'POST';
      const url = editingMeal ? `/api/v1/dieta/${editingMeal.id}` : '/api/v1/dieta';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealDate: finalDto.meal_date, mealName: finalDto.meal_name,
          time: finalDto.time, items: finalDto.items,
          calories: finalDto.calories, proteinG: finalDto.protein_g,
          carbsG: finalDto.carbs_g, fatG: finalDto.fat_g,
          source: finalDto.source ?? 'manual', notes: finalDto.notes,
        }),
      });
      await loadMeals();
    } finally {
      setFormLoading(false);
      setFormOpen(false);
      setEditingMeal(undefined);
    }
  }, [editingMeal, loadMeals]);

  const handleEdit = useCallback((meal: MealsRow) => {
    setEditingMeal(meal);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (meal: MealsRow) => {
    await fetch(`/api/v1/dieta/${meal.id}`, { method: 'DELETE' });
    await loadMeals();
  }, [loadMeals]);

  // ── AI Analysis ────────────────────────────────────────────

  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  const handleAIAnalyze = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const result = await importDiet(aiText);
      if (!result.success || !result.data) {
        setAiError(result.error ?? 'Não foi possível analisar a refeição.');
        return;
      }
      const meals = result.data.meals;
      setAiResult({
        meals: meals.map((m) => ({
          name: m.mealName,
          items: m.items ?? '',
          calories: m.calories ?? 0,
          protein_g: m.proteinG ?? 0,
          carbs_g: m.carbsG ?? 0,
          fat_g: m.fatG ?? 0,
        })),
        total_calories: result.data.totalCalories ?? meals.reduce((s, m) => s + (m.calories ?? 0), 0),
        total_protein_g: result.data.totalProteinG ?? meals.reduce((s, m) => s + (m.proteinG ?? 0), 0),
        total_carbs_g: result.data.totalCarbsG ?? meals.reduce((s, m) => s + (m.carbsG ?? 0), 0),
        total_fat_g: result.data.totalFatG ?? meals.reduce((s, m) => s + (m.fatG ?? 0), 0),
        positive_points: [],
        improvement_points: [],
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao analisar com IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAIResult = async () => {
    if (!aiResult) return;
    setAiSaving(true);
    setAiError(null);
    try {
      for (const m of aiResult.meals) {
        const res = await fetch('/api/v1/dieta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealDate: todayDate,
            mealName: m.name,
            time: null,
            items: m.items || null,
            calories: m.calories || null,
            proteinG: m.protein_g || null,
            carbsG: m.carbs_g || null,
            fatG: m.fat_g || null,
            source: 'ai_analysis',
          }),
        });
        if (!res.ok) {
          const errJson = await res.json() as { error?: { message?: string } };
          throw new Error(errJson.error?.message ?? `Erro ao salvar "${m.name}"`);
        }
      }
      setAiSaved(true);
      setAiResult(null);
      setAiText('');
      await loadMeals();
      setTimeout(() => {
        setAiSaved(false);
        setActiveTab('manual');
      }, 1500);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao salvar refeições.');
    } finally {
      setAiSaving(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────

  /** Normaliza horário para HH:MM (24h) ou retorna null se inválido. */
  function sanitizeTime(t?: string | null): string | null {
    if (!t) return null;
    const match = t.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    const h = match[1].padStart(2, '0');
    const min = match[2];
    if (parseInt(h) > 23 || parseInt(min) > 59) return null;
    return `${h}:${min}`;
  }

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
      for (const m of importedMeals) {
        const res = await fetch('/api/v1/dieta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealDate: todayDate,
            mealName: m.meal_name,
            time: sanitizeTime(m.time),
            items: m.items ?? null,
            calories: m.calories ?? null,
            proteinG: m.protein_g ?? null,
            carbsG: m.carbs_g ?? null,
            fatG: m.fat_g ?? null,
            source: 'file_import',
          }),
        });
        if (!res.ok) {
          const errJson = await res.json() as { error?: { message?: string } };
          throw new Error(errJson.error?.message ?? `Erro ao salvar "${m.meal_name}"`);
        }
      }
      setImportConfirmed(true);
      setImportedMeals(null);
      setImportFile(null);
      await loadMeals();
      setActiveTab('manual');
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
              {meals.length} refeições
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

                {meals.length === 0 ? (
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
                    {meals
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
              {aiError && (
                <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{aiError}</p>
              )}
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
                {aiSaved && (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Refeições salvas! Redirecionando...
                  </div>
                )}

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
                            {meal.calories > 0 && <span className="text-2xs px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 font-semibold">{meal.calories} kcal</span>}
                            {meal.protein_g > 0 && <span className="text-2xs px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400 font-semibold">{meal.protein_g}g prot</span>}
                            {meal.carbs_g > 0 && <span className="text-2xs px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-semibold">{meal.carbs_g}g carb</span>}
                            {meal.fat_g > 0 && <span className="text-2xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 font-semibold">{meal.fat_g}g gord</span>}
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

                {/* Save button */}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => { setAiResult(null); setAiText(''); }}
                    disabled={aiSaving}
                  >
                    Descartar
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={handleSaveAIResult}
                    loading={aiSaving}
                    className="flex-1"
                  >
                    Salvar {aiResult.meals.length} refeição{aiResult.meals.length !== 1 ? 'ões' : ''} no diário
                  </Button>
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
                <p className="text-sm text-text-muted mt-1">As refeições foram adicionadas ao seu plano alimentar.</p>
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
        mealDate={todayDate}
        loading={formLoading}
      />
    </div>
  );
}
