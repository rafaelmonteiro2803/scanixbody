'use client';

import React, { useState } from 'react';
import {
  Upload,
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, FileUpload, Badge, Input } from '@/components/ui';
import type { BioimpedanceStatus } from '@/types/database.types';
import { importBioimpedance } from '@/services/import.service';

// ── Types ─────────────────────────────────────────────────────

interface SegmentData {
  leanMass: number | null;
  fatMass: number | null;
}

interface ExtractedBodyData {
  weight: number | null;
  height: number | null;
  age: number | null;
  sex: 'M' | 'F' | null;
  body_fat_percentage: number | null;
  fat_mass: number | null;
  skeletal_muscle_mass: number | null;
  lean_mass: number | null;
  body_water: number | null;
  protein_mass: number | null;
  minerals_mass: number | null;
  visceral_fat: number | null;
  inbody_score: number | null;
  bmi: number | null;
  segments?: {
    rightArm?: SegmentData;
    leftArm?: SegmentData;
    trunk?: SegmentData;
    rightLeg?: SegmentData;
    leftLeg?: SegmentData;
  };
}

interface PastImport {
  id: string;
  date: string;
  status: BioimpedanceStatus;
  source_file: string;
}


// ── Past Imports Mock Data ────────────────────────────────────

const INITIAL_PAST_IMPORTS: PastImport[] = [
  {
    id: '1',
    date: '2026-03-15T10:30:00Z',
    status: 'confirmed',
    source_file: 'inbody_marco_2026.pdf',
  },
  {
    id: '2',
    date: '2025-12-10T14:00:00Z',
    status: 'confirmed',
    source_file: 'bioimpedancia_dezembro.pdf',
  },
  {
    id: '3',
    date: '2025-09-05T09:15:00Z',
    status: 'error',
    source_file: 'scan_setembro.pdf',
  },
];

// ── Status Badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: BioimpedanceStatus }) {
  const map: Record<BioimpedanceStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
    confirmed: { variant: 'success', label: 'Confirmado' },
    pending: { variant: 'warning', label: 'Pendente' },
    reviewed: { variant: 'warning', label: 'Revisado' },
    error: { variant: 'danger', label: 'Erro' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Review Row ────────────────────────────────────────────────

function ReviewField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary min-w-0 flex-1">{label}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 h-8 rounded-lg bg-background border border-border text-[#00ff88] text-sm font-semibold text-right px-2 focus:border-[#00ff88] focus:outline-none transition-colors"
          step="0.1"
        />
        {unit && <span className="text-xs text-text-muted w-8">{unit}</span>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function BioimpedanciaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedBodyData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedBodyData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pastImports, setPastImports] = useState<PastImport[]>(INITIAL_PAST_IMPORTS);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtracted(null);
    setEditedData(null);
    setConfirmed(false);
    setExtractError(null);
    setProcessing(true);
    try {
      const result = await importBioimpedance(selectedFile);
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Não foi possível extrair os dados do arquivo.');
      }
      const d = result.data;
      const mapSeg = (s?: { leanMass?: number; fatMass?: number }): SegmentData | undefined =>
        s ? { leanMass: s.leanMass ?? null, fatMass: s.fatMass ?? null } : undefined;

      const mapped: ExtractedBodyData = {
        weight: d.weight ?? null,
        height: d.height ?? null,
        age: null,
        sex: null,
        bmi: d.bmi ?? null,
        body_fat_percentage: d.bodyFatPercentage ?? null,
        fat_mass: d.fatMass ?? null,
        skeletal_muscle_mass: d.skeletalMuscleMass ?? null,
        lean_mass: d.leanMass ?? null,
        body_water: d.bodyWater ?? null,
        protein_mass: d.proteinMass ?? null,
        minerals_mass: d.mineralsMass ?? null,
        visceral_fat: d.visceralFat ?? null,
        inbody_score: d.inbodyScore ?? null,
        segments: d.segments ? {
          rightArm: mapSeg(d.segments.rightArm),
          leftArm: mapSeg(d.segments.leftArm),
          trunk: mapSeg(d.segments.trunk),
          rightLeg: mapSeg(d.segments.rightLeg),
          leftLeg: mapSeg(d.segments.leftLeg),
        } : undefined,
      };
      setExtracted(mapped);
      setEditedData({ ...mapped });
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Erro ao processar arquivo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (field: keyof ExtractedBodyData, rawValue: string) => {
    if (!editedData) return;
    const num = rawValue === '' ? null : parseFloat(rawValue);
    setEditedData({ ...editedData, [field]: isNaN(num as number) ? null : num });
  };

  const handleConfirm = async () => {
    if (!editedData || !file) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/corpo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: editedData.weight,
          height: editedData.height,
          bmi: editedData.bmi,
          bodyFatPercentage: editedData.body_fat_percentage,
          fatMass: editedData.fat_mass,
          skeletalMuscleMass: editedData.skeletal_muscle_mass,
          leanMass: editedData.lean_mass,
          bodyWater: editedData.body_water,
          proteinMass: editedData.protein_mass,
          mineralsMass: editedData.minerals_mass,
          visceralFat: editedData.visceral_fat,
          inbodyScore: editedData.inbody_score,
          ...(editedData.segments && {
            bodySegments: [
              editedData.segments.rightArm && { segment: 'right_arm', leanMass: editedData.segments.rightArm.leanMass, fatMass: editedData.segments.rightArm.fatMass },
              editedData.segments.leftArm && { segment: 'left_arm', leanMass: editedData.segments.leftArm.leanMass, fatMass: editedData.segments.leftArm.fatMass },
              editedData.segments.trunk && { segment: 'trunk', leanMass: editedData.segments.trunk.leanMass, fatMass: editedData.segments.trunk.fatMass },
              editedData.segments.rightLeg && { segment: 'right_leg', leanMass: editedData.segments.rightLeg.leanMass, fatMass: editedData.segments.rightLeg.fatMass },
              editedData.segments.leftLeg && { segment: 'left_leg', leanMass: editedData.segments.leftLeg.leanMass, fatMass: editedData.segments.leftLeg.fatMass },
            ].filter(Boolean),
          }),
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar composição corporal.');
      const newImport: PastImport = {
        id: String(Date.now()),
        date: new Date().toISOString(),
        status: 'confirmed',
        source_file: file.name,
      };
      setPastImports((prev) => [newImport, ...prev]);
      setConfirmed(true);
      setExtracted(null);
      setEditedData(null);
      setFile(null);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFile(null);
    setExtracted(null);
    setEditedData(null);
    setConfirmed(false);
  };

  const reviewFields: Array<{ key: keyof ExtractedBodyData; label: string; unit?: string }> = [
    { key: 'weight', label: 'Peso', unit: 'kg' },
    { key: 'height', label: 'Altura', unit: 'cm' },
    { key: 'age', label: 'Idade', unit: 'anos' },
    { key: 'bmi', label: 'IMC', unit: '' },
    { key: 'body_fat_percentage', label: 'Gordura corporal', unit: '%' },
    { key: 'fat_mass', label: 'Massa gorda', unit: 'kg' },
    { key: 'skeletal_muscle_mass', label: 'Massa muscular esquelética', unit: 'kg' },
    { key: 'lean_mass', label: 'Massa magra', unit: 'kg' },
    { key: 'body_water', label: 'Água corporal', unit: 'L' },
    { key: 'protein_mass', label: 'Massa proteica', unit: 'kg' },
    { key: 'minerals_mass', label: 'Massa mineral', unit: 'kg' },
    { key: 'visceral_fat', label: 'Gordura visceral', unit: '' },
    { key: 'inbody_score', label: 'Score InBody', unit: '/100' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background-card px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-text-title uppercase tracking-widest font-display">
              BIOIMPEDÂNCIA
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Importar e aplicar resultados InBody / bioimpedância
            </p>
          </div>
          <Badge variant="info" dot>IA</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Info box */}
        <div className="rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/5 px-4 py-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-text-title">Importação de PDF InBody</p>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Faça upload do PDF gerado pelo aparelho InBody ou qualquer relatório de bioimpedância.
              Nossa IA extrai automaticamente todos os dados de composição corporal para revisão antes
              de aplicar ao seu perfil.
            </p>
          </div>
        </div>

        {/* Upload section */}
        {!confirmed && (
          <div className="rounded-xl bg-background-card border border-border p-5 space-y-4">
            <h2 className="text-sm font-bold text-text-title uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#00ff88]" />
              Upload do Arquivo
            </h2>

            <FileUpload
              accept=".pdf"
              maxSize={10 * 1024 * 1024}
              file={file}
              onFileSelect={handleFileSelect}
              onClear={() => {
                setFile(null);
                setExtracted(null);
                setEditedData(null);
              }}
              placeholder="Arraste o PDF InBody ou clique para selecionar"
              hint="Apenas PDF · Máx. 10 MB"
              disabled={processing}
            />

            {extractError && !processing && !editedData && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {extractError}
              </div>
            )}

            {/* Processing state */}
            {processing && (
              <div className="rounded-xl border border-border bg-background p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-7 h-7 text-[#00ff88] animate-spin" />
                </div>
                <p className="text-base font-bold text-text-title">Processando com IA...</p>
                <p className="text-sm text-text-muted mt-1">
                  Extraindo dados de composição corporal do PDF
                </p>
                <div className="mt-4 flex justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#00ff88]"
                      style={{ animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review table */}
        {editedData && !confirmed && !processing && (
          <div className="rounded-xl bg-background-card border border-[#00ff88]/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-title uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00ff88]" />
                Revisão dos Dados Extraídos
              </h2>
              <Badge variant="success" dot>Extração concluída</Badge>
            </div>

            <p className="text-xs text-text-secondary">
              Verifique os dados abaixo e edite qualquer campo antes de confirmar.
            </p>

            <div className="rounded-lg bg-background border border-border p-4">
              {reviewFields.map((f) => (
                <ReviewField
                  key={f.key}
                  label={f.label}
                  value={editedData[f.key] as number | null}
                  unit={f.unit}
                  onChange={(v) => handleFieldChange(f.key, v)}
                />
              ))}
            </div>

            {extractError && (
              <p className="text-xs text-danger">{extractError}</p>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={handleDiscard}
                disabled={saving}
              >
                Descartar
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleConfirm}
                loading={saving}
                className="flex-1"
              >
                Confirmar e Aplicar ao Perfil Corporal
              </Button>
            </div>
          </div>
        )}

        {/* Success state */}
        {confirmed && (
          <div className="rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/5 p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-[#00ff88] mx-auto mb-4" />
            <p className="text-lg font-black text-text-title">Dados aplicados com sucesso!</p>
            <p className="text-sm text-text-secondary mt-1">
              Os dados da bioimpedância foram salvos no seu perfil corporal.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Button
                variant="outline"
                size="md"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={() => setConfirmed(false)}
              >
                Nova importação
              </Button>
            </div>
          </div>
        )}

        {/* Past imports */}
        <div className="rounded-xl bg-background-card border border-border p-5">
          <h2 className="text-sm font-bold text-text-title uppercase tracking-wider flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#00ff88]" />
            Importações Anteriores
          </h2>

          {pastImports.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-text-faint mx-auto mb-3" />
              <p className="text-sm text-text-muted">Nenhuma importação anterior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">
                      Data
                    </th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2 pr-4">
                      Arquivo
                    </th>
                    <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider pb-2">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pastImports.map((imp) => (
                    <tr key={imp.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 text-text-secondary text-xs whitespace-nowrap">
                        {format(new Date(imp.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          <span className="text-text-secondary text-xs truncate max-w-[200px]">{imp.source_file}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={imp.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
