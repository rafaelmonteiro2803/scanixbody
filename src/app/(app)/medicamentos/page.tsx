'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Pill,
  AlertTriangle,
  X,
  Upload,
  FileText,
  Clipboard,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertCircle,
  FlaskConical,
  Dna,
  Leaf,
  Atom,
  MoreHorizontal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { FileUpload } from '@/components/ui/FileUpload';
import { Textarea } from '@/components/ui/Textarea';
import { MedicationCard } from './components/MedicationCard';
import { MedicationForm } from './components/MedicationForm';
import type { MedicationEntry } from '@/services/medicamentos.service';
import type {
  CreateMedicationEntryDTO,
  UpdateMedicationEntryDTO,
  MedicationCategory,
} from '@/types/domain.types';

// ── Types ──────────────────────────────────────────────────────

type TabValue = 'meus' | 'importar';

interface ParsedMedication {
  name: string;
  category: MedicationCategory;
  dose?: string;
  frequency?: string;
  route?: string;
  notes?: string;
}

// ── Category groups ────────────────────────────────────────────

const CATEGORY_ORDER: MedicationCategory[] = [
  'hormonio',
  'sarm',
  'peptideo',
  'medicamento',
  'suplemento',
  'outro',
];

const CATEGORY_LABELS: Record<MedicationCategory, string> = {
  hormonio: 'Hormônios',
  peptideo: 'Peptídeos',
  suplemento: 'Suplementos',
  medicamento: 'Medicamentos',
  sarm: 'SARMs',
  outro: 'Outros',
};

const CATEGORY_ICON: Record<MedicationCategory, React.ReactNode> = {
  hormonio: <FlaskConical className="w-4 h-4" />,
  peptideo: <Dna className="w-4 h-4" />,
  suplemento: <Leaf className="w-4 h-4" />,
  medicamento: <Pill className="w-4 h-4" />,
  sarm: <Atom className="w-4 h-4" />,
  outro: <MoreHorizontal className="w-4 h-4" />,
};

const CATEGORY_COLOR: Record<MedicationCategory, string> = {
  hormonio: 'text-purple-400',
  peptideo: 'text-blue-400',
  suplemento: 'text-green-400',
  medicamento: 'text-red-400',
  sarm: 'text-orange-400',
  outro: 'text-gray-400',
};

// ── AI extract simulation ───────────────────────────────────────

function simulateAIExtract(text: string): ParsedMedication[] {
  // Simulate extracting medications from text
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const results: ParsedMedication[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    let category: MedicationCategory = 'outro';

    if (
      lower.includes('testosterona') ||
      lower.includes('gh ') ||
      lower.includes('hormônio') ||
      lower.includes('estradiol') ||
      lower.includes('insulina')
    ) {
      category = 'hormonio';
    } else if (
      lower.includes('bpc') ||
      lower.includes('tb-500') ||
      lower.includes('ipamorelin') ||
      lower.includes('peptideo') ||
      lower.includes('peptídeo')
    ) {
      category = 'peptideo';
    } else if (
      lower.includes('creatina') ||
      lower.includes('whey') ||
      lower.includes('vitamina') ||
      lower.includes('omega') ||
      lower.includes('proteína') ||
      lower.includes('bcaa') ||
      lower.includes('cafeina') ||
      lower.includes('cafeína')
    ) {
      category = 'suplemento';
    } else if (lower.includes('sarm') || lower.includes('rad') || lower.includes('lgd')) {
      category = 'sarm';
    }

    // Extract dose with regex
    const doseMatch = line.match(/\d+\s*(?:mg|g|mcg|ui|iu|ml|caps?|tab)/i);
    const dose = doseMatch ? doseMatch[0] : undefined;

    // Extract frequency
    const freqMatch = line.match(
      /\d+\s*x\/(?:dia|semana|week)|eod|e3d|pwo|diário|diária|semanal/i,
    );
    const frequency = freqMatch ? freqMatch[0] : undefined;

    const name = line
      .replace(/\d+\s*(?:mg|g|mcg|ui|iu|ml|caps?|tab)/gi, '')
      .replace(/\d+\s*x\/(?:dia|semana|week)|eod|e3d|pwo/gi, '')
      .replace(/[-–]/g, '')
      .trim();

    if (name.length > 1) {
      results.push({ name, category, dose, frequency });
    }
  }

  return results;
}

// ── Delete confirm modal ───────────────────────────────────────

function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
  isLoading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-[#161616] shadow-card-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Excluir medicamento?</h3>
            <p className="text-sm text-white/50 mt-0.5">
              &ldquo;{name}&rdquo; será removido.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={onConfirm}
            loading={isLoading}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Import Tab ─────────────────────────────────────────────────

function ImportTab({
  onImported,
}: {
  onImported: (meds: ParsedMedication[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ParsedMedication[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleExtract() {
    const text = pasteText.trim() || (file ? await file.text() : '');
    if (!text) return;

    setIsExtracting(true);
    // Simulate AI extraction delay
    await new Promise((r) => setTimeout(r, 1500));
    const results = simulateAIExtract(text);
    setExtracted(results);
    setIsExtracting(false);
  }

  function handleSave() {
    setIsSaving(true);
    setTimeout(() => {
      onImported(extracted);
      setSaved(true);
      setIsSaving(false);
      setExtracted([]);
      setPasteText('');
      setFile(null);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  }

  function removeExtracted(i: number) {
    setExtracted((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/10 px-4 py-3 text-sm text-[#00ff88]">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Medicamentos importados com sucesso!
        </div>
      )}

      <div className="rounded-xl border border-border bg-[#161616] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#00ff88]" />
          Importar via arquivo
        </h3>
        <FileUpload
          accept=".pdf,.txt,.csv,text/*,application/pdf"
          maxSize={10 * 1024 * 1024}
          file={file}
          onFileSelect={setFile}
          onClear={() => setFile(null)}
          placeholder="Arraste ou clique para selecionar"
          hint="PDF, TXT ou CSV — máx. 10 MB"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-white/30 font-medium">OU</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="rounded-xl border border-border bg-[#161616] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-[#00ff88]" />
          Colar texto / protocolo
        </h3>
        <Textarea
          placeholder={`Cole aqui o seu protocolo de uso, lista de medicamentos ou prescrição.\n\nEx:\nTestosterona Enantato 200mg E3D\nCreatina 5g diário\nVitamina D 2000UI diário`}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={8}
          resize="vertical"
        />
      </div>

      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={handleExtract}
        loading={isExtracting}
        disabled={!file && !pasteText.trim()}
        leftIcon={<Loader2 className="w-4 h-4" />}
      >
        {isExtracting ? 'Extraindo com IA...' : 'Extrair Medicamentos com IA'}
      </Button>

      {/* Review table */}
      {extracted.length > 0 && (
        <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#00ff88]/15 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#00ff88] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {extracted.length} medicamentos identificados — Revise antes de salvar
            </h3>
          </div>

          <div className="divide-y divide-white/5">
            {extracted.map((med, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{med.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      {CATEGORY_LABELS[med.category]}
                    </span>
                    {med.dose && (
                      <span className="text-[10px] text-white/35">• {med.dose}</span>
                    )}
                    {med.frequency && (
                      <span className="text-[10px] text-white/35">• {med.frequency}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeExtracted(i)}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Remover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-[#00ff88]/15">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleSave}
              loading={isSaving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirmar e Salvar {extracted.length} Medicamento
              {extracted.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {isExtracting && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="md" />
          <p className="text-sm text-white/50">Analisando com IA...</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function MedicamentosPage() {
  const [tab, setTab] = useState<TabValue>('meus');
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicationEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────

  const loadMedications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: err } = await supabase
        .from('medication_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      setMedications(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar medicamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedications();
  }, [loadMedications]);

  // ── Handlers ───────────────────────────────────────────────────

  async function handleSave(dto: CreateMedicationEntryDTO | UpdateMedicationEntryDTO) {
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (editingMed) {
        const { error: err } = await supabase
          .from('medication_entries')
          .update({ ...dto, updated_at: new Date().toISOString() })
          .eq('id', editingMed.id);
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await supabase.from('medication_entries').insert({
          user_id: user.id,
          name: (dto as CreateMedicationEntryDTO).name,
          category: dto.category ?? 'outro',
          dose: dto.dose ?? null,
          frequency: dto.frequency ?? null,
          route: dto.route ?? null,
          start_date: dto.start_date ?? null,
          notes: dto.notes ?? null,
          source: 'manual',
        });
        if (err) throw new Error(err.message);
      }

      setIsFormOpen(false);
      setEditingMed(null);
      await loadMedications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar medicamento');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('medication_entries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteTarget.id);
      if (err) throw new Error(err.message);
      setDeleteTarget(null);
      await loadMedications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir medicamento');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleImported(parsed: Array<{
    name: string;
    category: MedicationCategory;
    dose?: string;
    frequency?: string;
    route?: string;
    notes?: string;
  }>) {
    if (parsed.length === 0) return;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const rows = parsed.map((m) => ({
        user_id: user.id,
        name: m.name,
        category: m.category,
        dose: m.dose ?? null,
        frequency: m.frequency ?? null,
        route: m.route ?? null,
        start_date: null,
        notes: m.notes ?? null,
        source: 'import' as const,
      }));

      await supabase.from('medication_entries').insert(rows);
      await loadMedications();
      setTab('meus');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar importação');
    }
  }

  // ── Group by category ──────────────────────────────────────────

  const grouped = CATEGORY_ORDER.reduce<Record<MedicationCategory, MedicationEntry[]>>(
    (acc, cat) => {
      acc[cat] = medications.filter((m) => m.category === cat);
      return acc;
    },
    {} as Record<MedicationCategory, MedicationEntry[]>,
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-white">
              MEDICAMENTOS
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Suplementos, hormônios e medicamentos em uso
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingMed(null);
              setIsFormOpen(true);
            }}
          >
            Adicionar
          </Button>
        </div>

        {/* Medical disclaimer banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs text-amber-300/80 leading-relaxed">
            <span className="font-semibold text-amber-400">Aviso médico importante: </span>
            Este módulo é apenas para registro pessoal. Não substitui acompanhamento
            médico profissional. Qualquer uso de substâncias deve ser orientado por um
            médico ou especialista qualificado. Não nos responsabilizamos pelo uso indevido
            das informações aqui registradas.
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              value: 'meus' as TabValue,
              label: `Meus Medicamentos${medications.length > 0 ? ` (${medications.length})` : ''}`,
              icon: <Pill className="w-4 h-4" />,
            },
            {
              value: 'importar' as TabValue,
              label: 'Importar',
              icon: <Upload className="w-4 h-4" />,
            },
          ]}
          value={tab}
          onChange={setTab}
          variant="underline"
        />

        {/* ── Tab: Meus Medicamentos ── */}
        <TabPanel value="meus" activeValue={tab}>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" label="Carregando medicamentos..." />
            </div>
          ) : medications.length === 0 ? (
            <EmptyState
              icon={<Pill />}
              title="Nenhum medicamento cadastrado"
              description="Adicione seus medicamentos, suplementos e hormônios para manter um registro completo."
              action={{
                label: 'Adicionar Medicamento',
                onClick: () => {
                  setEditingMed(null);
                  setIsFormOpen(true);
                },
                icon: <Plus className="w-4 h-4" />,
              }}
            />
          ) : (
            <div className="space-y-6">
              {CATEGORY_ORDER.map((cat) => {
                const items = grouped[cat];
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    {/* Category header */}
                    <div
                      className={`flex items-center gap-2 mb-3 ${CATEGORY_COLOR[cat]}`}
                    >
                      {CATEGORY_ICON[cat]}
                      <h2 className="text-sm font-semibold tracking-wide uppercase">
                        {CATEGORY_LABELS[cat]}
                      </h2>
                      <span className="text-xs font-bold opacity-50 tabular-nums">
                        ({items.length})
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((med) => (
                        <MedicationCard
                          key={med.id}
                          medication={med}
                          onEdit={(m) => {
                            setEditingMed(m);
                            setIsFormOpen(true);
                          }}
                          onDelete={(id) => {
                            const found = medications.find((m) => m.id === id);
                            if (found) setDeleteTarget({ id, name: found.name });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabPanel>

        {/* ── Tab: Importar ── */}
        <TabPanel value="importar" activeValue={tab}>
          <ImportTab onImported={handleImported} />
        </TabPanel>
      </div>

      {/* Medication form modal */}
      <MedicationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMed(null);
        }}
        onSave={handleSave}
        editingMedication={editingMed}
        isSaving={isSaving}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
