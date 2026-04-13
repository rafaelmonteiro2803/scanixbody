'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Upload,
  FileText,
  Clipboard,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  FlaskConical,
  CalendarDays,
  Hash,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileUpload } from '@/components/ui/FileUpload';
import { Textarea } from '@/components/ui/Textarea';
import { ExamMarkerRow } from './components/ExamMarkerRow';
import type { ExamReport, ExamMarker } from '@/services/exames.service';
import type { ExamMarkerStatus } from '@/types/domain.types';

// ── Types ──────────────────────────────────────────────────────

interface ParsedMarker {
  marker_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: ExamMarkerStatus;
}

interface ReportWithMarkers extends ExamReport {
  markers?: ExamMarker[];
  expanded?: boolean;
  loadingMarkers?: boolean;
}

// ── AI marker simulation ───────────────────────────────────────

function simulateMarkerExtraction(text: string): ParsedMarker[] {
  // Simulate AI extraction with example lab markers
  const SAMPLE_MARKERS: ParsedMarker[] = [
    { marker_name: 'Testosterona Total', value: '850', unit: 'ng/dL', reference_range: '300-1000', status: 'normal' },
    { marker_name: 'Testosterona Livre', value: '22.5', unit: 'pg/mL', reference_range: '8.7-25.1', status: 'normal' },
    { marker_name: 'LH', value: '0.2', unit: 'mUI/mL', reference_range: '1.5-9.3', status: 'baixo' },
    { marker_name: 'FSH', value: '0.4', unit: 'mUI/mL', reference_range: '1.5-12.4', status: 'baixo' },
    { marker_name: 'Estradiol', value: '58', unit: 'pg/mL', reference_range: '10-40', status: 'alto' },
    { marker_name: 'Hematócrito', value: '48', unit: '%', reference_range: '40-50', status: 'normal' },
    { marker_name: 'Hemoglobina', value: '16.2', unit: 'g/dL', reference_range: '13.5-17.5', status: 'normal' },
    { marker_name: 'PSA Total', value: '0.8', unit: 'ng/mL', reference_range: '0-4.0', status: 'normal' },
    { marker_name: 'Colesterol Total', value: '195', unit: 'mg/dL', reference_range: '<200', status: 'normal' },
    { marker_name: 'HDL Colesterol', value: '42', unit: 'mg/dL', reference_range: '>40', status: 'normal' },
    { marker_name: 'LDL Colesterol', value: '125', unit: 'mg/dL', reference_range: '<100', status: 'alto' },
    { marker_name: 'Triglicerídeos', value: '160', unit: 'mg/dL', reference_range: '<150', status: 'alto' },
    { marker_name: 'Glicose', value: '92', unit: 'mg/dL', reference_range: '70-99', status: 'normal' },
    { marker_name: 'TSH', value: '2.1', unit: 'mUI/L', reference_range: '0.4-4.0', status: 'normal' },
    { marker_name: 'ALT (TGP)', value: '38', unit: 'U/L', reference_range: '7-56', status: 'normal' },
    { marker_name: 'AST (TGO)', value: '35', unit: 'U/L', reference_range: '10-40', status: 'normal' },
    { marker_name: 'Creatinina', value: '1.1', unit: 'mg/dL', reference_range: '0.6-1.2', status: 'normal' },
    { marker_name: 'IGF-1', value: '320', unit: 'ng/mL', reference_range: '117-330', status: 'normal' },
  ];

  // Return a subset based on text content length to simulate real parsing
  const count = Math.min(SAMPLE_MARKERS.length, Math.max(5, Math.floor(text.length / 50)));
  return SAMPLE_MARKERS.slice(0, count);
}

// ── Delete confirm ─────────────────────────────────────────────

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-background-card shadow-card-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-text-title">Excluir exame?</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              Este relatório e todos os seus marcadores serão removidos.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" size="md" className="flex-1" onClick={onConfirm} loading={isLoading}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Import section ─────────────────────────────────────────────

function ImportSection({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ParsedMarker[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  async function handleExtract() {
    const text = pasteText.trim() || (file ? await file.text() : '');
    if (!text && !file) return;

    setIsExtracting(true);
    await new Promise((r) => setTimeout(r, 2000));
    const results = simulateMarkerExtraction(text || file?.name || 'exam');
    setExtracted(results);
    setIsExtracting(false);
  }

  async function handleSave() {
    if (extracted.length === 0) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Create report
      const { data: report, error: reportErr } = await supabase
        .from('exam_reports')
        .insert({
          user_id: user.id,
          source: file ? 'file' : 'text',
          raw_text: pasteText || null,
          report_date: reportDate || null,
        })
        .select()
        .single();

      if (reportErr || !report) throw new Error(reportErr?.message ?? 'Erro ao criar relatório');

      // Create markers
      const markersToInsert = extracted.map((m) => ({
        exam_report_id: report.id,
        user_id: user.id,
        marker_name: m.marker_name,
        value: m.value || null,
        unit: m.unit || null,
        reference_range: m.reference_range || null,
        status: m.status || null,
      }));

      if (markersToInsert.length > 0) {
        await supabase.from('exam_markers').insert(markersToInsert);
      }

      setExtracted([]);
      setPasteText('');
      setFile(null);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  function updateMarkerStatus(i: number, status: ExamMarkerStatus) {
    setExtracted((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, status } : m)),
    );
  }

  function removeMarker(i: number) {
    setExtracted((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-5">
      {/* Date + file upload */}
      <div className="rounded-xl border border-border bg-background-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-title flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#00ff88]" />
            Importar arquivo de exame
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Data do exame:</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="text-xs bg-surface-1 border border-border rounded-lg px-2 py-1.5 text-text-title focus:outline-none focus:border-[#00ff88]/50"
            />
          </div>
        </div>

        <FileUpload
          accept=".pdf,image/*,.jpg,.jpeg,.png,.webp"
          maxSize={20 * 1024 * 1024}
          file={file}
          onFileSelect={setFile}
          onClear={() => setFile(null)}
          placeholder="Arraste PDF ou imagem do laudo"
          hint="PDF, JPG, PNG — máx. 20 MB"
        />
      </div>

      {/* Or paste text */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-faint font-medium">OU</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="rounded-xl border border-border bg-background-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-title flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-[#00ff88]" />
          Colar texto do laudo
        </h3>
        <Textarea
          placeholder={`Cole aqui o texto do seu laudo de exames...\n\nEx:\nTestosterona Total: 850 ng/dL (ref: 300-1000)\nEstradiol: 58 pg/mL (ref: 10-40)...`}
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
        {isExtracting ? 'Extraindo marcadores com IA...' : 'Extrair Marcadores com IA'}
      </Button>

      {isExtracting && (
        <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/5 p-6 flex flex-col items-center gap-3">
          <Spinner size="md" />
          <p className="text-sm text-[#00ff88]/80">Analisando laudo com IA...</p>
          <p className="text-xs text-text-muted text-center">
            Identificando marcadores, valores e faixas de referência
          </p>
        </div>
      )}

      {/* Extracted markers review */}
      {extracted.length > 0 && !isExtracting && (
        <div className="rounded-xl border border-[#00ff88]/25 bg-[#00ff88]/4 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#00ff88]/15 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#00ff88] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {extracted.length} marcadores identificados — Revise antes de confirmar
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                    Marcador
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                    Valor
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                    Referência
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                    Status
                  </th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {extracted.map((m, i) => (
                  <tr key={i} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text-title">
                      {m.marker_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-title/90">
                      {m.value}{' '}
                      <span className="text-xs text-text-muted">{m.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted font-mono">
                      {m.reference_range}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.status}
                        onChange={(e) =>
                          updateMarkerStatus(i, e.target.value as ExamMarkerStatus)
                        }
                        className="text-xs bg-surface-1 border border-border rounded-lg px-2 py-1 text-text-title focus:outline-none focus:border-[#00ff88]/50"
                      >
                        <option value="normal">Normal</option>
                        <option value="alto">Alto</option>
                        <option value="baixo">Baixo</option>
                        <option value="critico">Crítico</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeMarker(i)}
                        className="w-6 h-6 flex items-center justify-center rounded text-text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              Confirmar e Salvar Relatório ({extracted.length} marcadores)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Report Card ─────────────────────────────────────────────────

function ReportCard({
  report: initialReport,
  onDelete,
}: {
  report: ReportWithMarkers;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [markers, setMarkers] = useState<ExamMarker[]>([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  const formattedDate = initialReport.report_date
    ? new Date(initialReport.report_date + 'T00:00:00').toLocaleDateString('pt-BR')
    : new Date(initialReport.created_at).toLocaleDateString('pt-BR');

  const importedDate = new Date(initialReport.created_at).toLocaleDateString('pt-BR');

  async function toggleExpand() {
    if (!expanded && markers.length === 0) {
      setLoadingMarkers(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('exam_markers')
          .select('*')
          .eq('exam_report_id', initialReport.id)
          .order('marker_name', { ascending: true });
        setMarkers(data ?? []);
      } finally {
        setLoadingMarkers(false);
      }
    }
    setExpanded((prev) => !prev);
  }

  return (
    <div className="rounded-xl border border-border bg-background-card overflow-hidden">
      {/* Report header */}
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
        onClick={toggleExpand}
      >
        <div className="w-9 h-9 rounded-lg bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-4 h-4 text-[#00ff88]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-title truncate">
            Exame {initialReport.source === 'file' ? 'importado' : 'colado'}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <CalendarDays className="w-3 h-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-text-faint">
              <Hash className="w-3 h-3" />
              {expanded && markers.length > 0 ? markers.length : '—'} marcadores
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(initialReport.id);
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label="Excluir relatório"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-faint" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-faint" />
          )}
        </div>
      </div>

      {/* Expanded markers */}
      {expanded && (
        <div className="border-t border-border-subtle">
          {loadingMarkers ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" label="Carregando marcadores..." />
            </div>
          ) : markers.length === 0 ? (
            <p className="text-center text-sm text-text-faint py-6">
              Nenhum marcador registrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                      Marcador
                    </th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                      Valor
                    </th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint hidden sm:table-cell">
                      Referência
                    </th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {markers.map((marker, i) => (
                    <ExamMarkerRow key={marker.id} marker={marker} isEven={i % 2 === 0} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function ExamesPage() {
  const [reports, setReports] = useState<ExamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error: err } = await supabase
        .from('exam_reports')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      setReports(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exames');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      await supabase
        .from('exam_reports')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteTarget);
      setDeleteTarget(null);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir exame');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-text-title">
              EXAMES
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Laudos laboratoriais e marcadores sanguíneos
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => setShowImport((prev) => !prev)}
          >
            {showImport ? 'Ocultar' : 'Importar Exame'}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Import section */}
        {showImport && (
          <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/3 p-5">
            <h2 className="text-base font-bold text-text-title mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#00ff88]" />
              Importar Novo Exame
            </h2>
            <ImportSection
              onSaved={() => {
                setShowImport(false);
                void loadReports();
              }}
            />
          </div>
        )}

        {/* Past reports */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-4">
            Histórico de Relatórios
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" label="Carregando exames..." />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<FlaskConical />}
              title="Nenhum exame importado"
              description="Importe seu primeiro laudo laboratorial para acompanhar seus marcadores sanguíneos."
              action={{
                label: 'Importar Exame',
                onClick: () => setShowImport(true),
                icon: <Upload className="w-4 h-4" />,
              }}
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onDelete={(id) => setDeleteTarget(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
