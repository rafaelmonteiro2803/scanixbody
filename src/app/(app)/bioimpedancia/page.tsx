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

// ── Types ─────────────────────────────────────────────────────

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
}

interface PastImport {
  id: string;
  date: string;
  status: BioimpedanceStatus;
  source_file: string;
}

// ── Mock extraction ───────────────────────────────────────────

async function mockExtractBioimpedance(_file: File): Promise<ExtractedBodyData> {
  await new Promise((r) => setTimeout(r, 2500));
  return {
    weight: 82.5,
    height: 178,
    age: 32,
    sex: 'M',
    body_fat_percentage: 18.2,
    fat_mass: 15.0,
    skeletal_muscle_mass: 37.8,
    lean_mass: 67.5,
    body_water: 49.4,
    protein_mass: 13.1,
    minerals_mass: 3.8,
    visceral_fat: 8,
    inbody_score: 77,
    bmi: 26.0,
  };
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
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#2a2a2a] last:border-0">
      <span className="text-sm text-[#a0a0a0] min-w-0 flex-1">{label}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 h-8 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-[#00ff88] text-sm font-semibold text-right px-2 focus:border-[#00ff88] focus:outline-none transition-colors"
          step="0.1"
        />
        {unit && <span className="text-xs text-[#666] w-8">{unit}</span>}
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

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtracted(null);
    setEditedData(null);
    setConfirmed(false);
    setProcessing(true);
    try {
      const result = await mockExtractBioimpedance(selectedFile);
      setExtracted(result);
      setEditedData({ ...result });
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (field: keyof ExtractedBodyData, rawValue: string) => {
    if (!editedData) return;
    const num = rawValue === '' ? null : parseFloat(rawValue);
    setEditedData({ ...editedData, [field]: isNaN(num as number) ? null : num });
  };

  const handleConfirm = () => {
    if (!editedData || !file) return;
    // In production: call corpoService.saveAthleteProfile with editedData
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] bg-[#161616] px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest font-display">
              BIOIMPEDÂNCIA
            </h1>
            <p className="text-xs text-[#666] mt-0.5">
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
            <p className="text-sm font-semibold text-white">Importação de PDF InBody</p>
            <p className="text-xs text-[#a0a0a0] mt-0.5 leading-relaxed">
              Faça upload do PDF gerado pelo aparelho InBody ou qualquer relatório de bioimpedância.
              Nossa IA extrai automaticamente todos os dados de composição corporal para revisão antes
              de aplicar ao seu perfil.
            </p>
          </div>
        </div>

        {/* Upload section */}
        {!confirmed && (
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
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

            {/* Processing state */}
            {processing && (
              <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-7 h-7 text-[#00ff88] animate-spin" />
                </div>
                <p className="text-base font-bold text-white">Processando com IA...</p>
                <p className="text-sm text-[#666] mt-1">
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
          <div className="rounded-xl bg-[#161616] border border-[#00ff88]/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00ff88]" />
                Revisão dos Dados Extraídos
              </h2>
              <Badge variant="success" dot>Extração concluída</Badge>
            </div>

            <p className="text-xs text-[#a0a0a0]">
              Verifique os dados abaixo e edite qualquer campo antes de confirmar.
            </p>

            <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4">
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

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={handleDiscard}
              >
                Descartar
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleConfirm}
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
            <p className="text-lg font-black text-white">Dados aplicados com sucesso!</p>
            <p className="text-sm text-[#a0a0a0] mt-1">
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
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#00ff88]" />
            Importações Anteriores
          </h2>

          {pastImports.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-[#3a3a3a] mx-auto mb-3" />
              <p className="text-sm text-[#666]">Nenhuma importação anterior</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider pb-2 pr-4">
                      Data
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider pb-2 pr-4">
                      Arquivo
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider pb-2">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pastImports.map((imp) => (
                    <tr key={imp.id} className="border-b border-[#2a2a2a]/50 last:border-0">
                      <td className="py-3 pr-4 text-[#a0a0a0] text-xs whitespace-nowrap">
                        {format(new Date(imp.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#666] flex-shrink-0" />
                          <span className="text-[#a0a0a0] text-xs truncate max-w-[200px]">{imp.source_file}</span>
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
