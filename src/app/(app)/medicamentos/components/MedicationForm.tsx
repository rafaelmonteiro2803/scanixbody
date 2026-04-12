'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { MedicationEntry } from '@/services/medicamentos.service';
import type {
  CreateMedicationEntryDTO,
  UpdateMedicationEntryDTO,
  MedicationCategory,
} from '@/types/domain.types';

// ── Options ────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'hormonio',    label: 'Hormônio' },
  { value: 'peptideo',    label: 'Peptídeo' },
  { value: 'suplemento',  label: 'Suplemento' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'sarm',        label: 'SARM' },
  { value: 'outro',       label: 'Outro' },
] as const;

const ROUTE_OPTIONS = [
  { value: 'oral',         label: 'Oral' },
  { value: 'im',           label: 'Intramuscular (IM)' },
  { value: 'sc',           label: 'Subcutânea (SC)' },
  { value: 'sublingual',   label: 'Sublingual' },
  { value: 'transdérmica', label: 'Transdérmica' },
  { value: 'outro',        label: 'Outro' },
] as const;

// ── Types ──────────────────────────────────────────────────────

interface FormState {
  name: string;
  category: MedicationCategory;
  dose: string;
  frequency: string;
  route: string;
  start_date: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'suplemento',
  dose: '',
  frequency: '',
  route: 'oral',
  start_date: '',
  notes: '',
};

export interface MedicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateMedicationEntryDTO | UpdateMedicationEntryDTO) => Promise<void>;
  editingMedication?: MedicationEntry | null;
  isSaving?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export function MedicationForm({
  isOpen,
  onClose,
  onSave,
  editingMedication,
  isSaving = false,
}: MedicationFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isEditing = Boolean(editingMedication);

  // Populate form when editing
  useEffect(() => {
    if (editingMedication) {
      setForm({
        name: editingMedication.name ?? '',
        category: (editingMedication.category as MedicationCategory) ?? 'outro',
        dose: editingMedication.dose ?? '',
        frequency: editingMedication.frequency ?? '',
        route: editingMedication.route ?? 'oral',
        start_date: editingMedication.start_date ?? '',
        notes: editingMedication.notes ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingMedication, isOpen]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Nome é obrigatório';
    if (!form.category) next.category = 'Categoria é obrigatória';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateMedicationEntryDTO = {
      name: form.name.trim(),
      category: form.category,
      dose: form.dose.trim() || undefined,
      frequency: form.frequency.trim() || undefined,
      route: form.route || undefined,
      start_date: form.start_date || undefined,
      notes: form.notes.trim() || undefined,
    };

    await onSave(payload);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}
      subtitle={
        isEditing
          ? 'Atualize as informações abaixo'
          : 'Preencha os dados do medicamento ou suplemento'
      }
      size="md"
      footer={
        <div className="flex items-center gap-3 w-full justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSaving}
            type="submit"
          >
            {isEditing ? 'Salvar alterações' : 'Adicionar'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          label="Nome *"
          placeholder="Ex: Testosterona Enantato, Creatina, Ashwagandha..."
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          required
        />

        {/* Category */}
        <Select
          label="Categoria *"
          options={CATEGORY_OPTIONS as unknown as Array<{ value: string; label: string }>}
          value={form.category}
          onChange={(v) => set('category', v as MedicationCategory)}
          error={errors.category}
        />

        {/* Dose + Frequency row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dose"
            placeholder="Ex: 200mg, 5g, 1 cápsula"
            value={form.dose}
            onChange={(e) => set('dose', e.target.value)}
          />
          <Input
            label="Frequência"
            placeholder="Ex: 1x/dia, E3D, PWO"
            value={form.frequency}
            onChange={(e) => set('frequency', e.target.value)}
          />
        </div>

        {/* Route + Start date row */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Via de administração"
            options={ROUTE_OPTIONS as unknown as Array<{ value: string; label: string }>}
            value={form.route}
            onChange={(v) => set('route', v)}
          />
          <Input
            label="Data de início"
            type="date"
            value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Observações"
          placeholder="Protocolo, propósito, interações, notas clínicas..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          resize="none"
        />
      </form>
    </Modal>
  );
}

export default MedicationForm;
