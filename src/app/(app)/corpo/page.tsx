import React from 'react';
import { createClient } from '@/lib/supabase/server';
import corpoService from '@/services/corpo.service';
import { BodyProfileForm } from './components/BodyProfileForm';
import type { AthleteProfilesRow, BodySegmentsRow } from '@/types/database.types';
import type { ActivityLevel } from '@/types/domain.types';

// ── Server Action ─────────────────────────────────────────────

async function saveBodyProfile(
  data: Record<string, unknown>,
): Promise<{ error?: string }> {
  'use server';

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

    const {
      full_name,
      goal_period_weeks: _gp,
      sleep_quality: _sq,
      waist: _waist,
      hip: _hip,
      seg_right_arm_lean,
      seg_right_arm_fat,
      seg_left_arm_lean,
      seg_left_arm_fat,
      seg_trunk_lean,
      seg_trunk_fat,
      seg_right_leg_lean,
      seg_right_leg_fat,
      seg_left_leg_lean,
      seg_left_leg_fat,
      ...profileData
    } = data as Record<string, unknown>;

    // Persist full_name back to profiles table
    if (full_name) {
      await supabase
        .from('profiles')
        .update({ full_name: full_name as string })
        .eq('user_id', user.id);
    }

    // Save the athlete profile
    const saved = await corpoService.saveAthleteProfile(user.id, {
      weight: profileData.weight as number | null,
      height: profileData.height as number | null,
      age: profileData.age as number | null,
      sex: profileData.sex as 'M' | 'F' | null,
      body_fat_percentage: profileData.body_fat_percentage as number | null,
      fat_mass: profileData.fat_mass as number | null,
      skeletal_muscle_mass: profileData.skeletal_muscle_mass as number | null,
      lean_mass: profileData.lean_mass as number | null,
      body_water: profileData.body_water as number | null,
      protein_mass: profileData.protein_mass as number | null,
      minerals_mass: profileData.minerals_mass as number | null,
      visceral_fat: profileData.visceral_fat as number | null,
      inbody_score: profileData.inbody_score as number | null,
      goal: profileData.goal as string | null,
      activity_level: profileData.activity_level as ActivityLevel | null,
      water_per_day: profileData.water_per_day as number | null,
      sleep_hours: profileData.sleep_hours as number | null,
      notes: profileData.notes as string | null,
    });

    // Save segments
    const segments = [
      { segment: 'right_arm' as const, lean_mass: seg_right_arm_lean as number | null, fat_mass: seg_right_arm_fat as number | null },
      { segment: 'left_arm' as const, lean_mass: seg_left_arm_lean as number | null, fat_mass: seg_left_arm_fat as number | null },
      { segment: 'trunk' as const, lean_mass: seg_trunk_lean as number | null, fat_mass: seg_trunk_fat as number | null },
      { segment: 'right_leg' as const, lean_mass: seg_right_leg_lean as number | null, fat_mass: seg_right_leg_fat as number | null },
      { segment: 'left_leg' as const, lean_mass: seg_left_leg_lean as number | null, fat_mass: seg_left_leg_fat as number | null },
    ].filter((s) => s.lean_mass !== null || s.fat_mass !== null);

    if (segments.length > 0) {
      await corpoService.saveBodySegments(saved.id, segments);
    }

    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao salvar perfil.' };
  }
}

// ── Page ──────────────────────────────────────────────────────

export default async function CorpoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: AthleteProfilesRow | null = null;
  let segments: BodySegmentsRow[] = [];
  let fullName: string | null = null;

  if (user) {
    try {
      // Fetch name from profiles table
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      fullName = profileRow?.full_name ?? null;

      profile = await corpoService.getAthleteProfile(user.id);
      if (profile) {
        segments = await corpoService.getBodySegments(profile.id);
      }
    } catch {
      // Non-critical: form will render empty
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-background-card px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-text-title uppercase tracking-widest font-display">
              CORPO &amp; OBJETIVO
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Perfil corporal, composição e metas
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                Perfil salvo
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <BodyProfileForm
          initialProfile={profile}
          initialSegments={segments}
          initialFullName={fullName}
          onSave={saveBodyProfile}
        />
      </div>
    </div>
  );
}
