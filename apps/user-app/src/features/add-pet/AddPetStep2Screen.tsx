import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useApi, getNetworkErrorHelp } from '@/contexts';
import { AddPetFlowHeader } from './AddPetFlowHeader';
import { useAddPetDraft } from './AddPetDraftContext';
import { createPet } from '@/services/pets';
import type { CreatePetDto } from '@petspond/types';

const H_PAD = 20;
const TOTAL_STEPS = 2;
const LBS_TO_KG = 0.45359237;

function formatLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function defaultBirthDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  const t = useTheme();
  return (
    <Text style={[styles.fieldLabel, { color: t.colors.text_primary }]}>
      {children}
      {required ? <Text style={{ color: t.colors.warning }}> *</Text> : null}
    </Text>
  );
}

function buildMedicalNotesForApi(draft: {
  colorMarkings: string;
  medicalNotes: string;
}): string | undefined {
  const parts: string[] = [];
  if (draft.colorMarkings.trim()) {
    parts.push(`Color / markings: ${draft.colorMarkings.trim()}`);
  }
  if (draft.medicalNotes.trim()) {
    parts.push(draft.medicalNotes.trim());
  }
  return parts.length ? parts.join('\n\n') : undefined;
}

type AddPetStep2Props = {
  onBackToStep1: () => void;
};

export function AddPetStep2Screen({ onBackToStep1 }: AddPetStep2Props) {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { client } = useApi();
  const { draft, updateDraft, resetDraft } = useAddPetDraft();
  const accent = t.colors.accent;
  const accentLight = t.colors.primary_light;

  const [errors, setErrors] = useState<{ birth?: string; weight?: string }>({});
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [iosTempDate, setIosTempDate] = useState(() => defaultBirthDate());
  const [submitting, setSubmitting] = useState(false);

  const openBirthPicker = useCallback(() => {
    const current = draft.birthDateIso ? parseIsoLocal(draft.birthDateIso) : defaultBirthDate();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: new Date(),
        minimumDate: new Date(1990, 0, 1),
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            updateDraft({ birthDateIso: formatLocalYMD(date) });
          }
        },
      });
    } else {
      setIosTempDate(current);
      setIosPickerOpen(true);
    }
  }, [draft.birthDateIso, updateDraft]);

  const confirmIosBirth = useCallback(() => {
    updateDraft({ birthDateIso: formatLocalYMD(iosTempDate) });
    setIosPickerOpen(false);
  }, [iosTempDate, updateDraft]);

  const monthDayLabel = useMemo(() => {
    if (!draft.birthDateIso) return { left: 'Select', right: 'date' };
    const d = parseIsoLocal(draft.birthDateIso);
    const left = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d);
    const right = String(d.getFullYear());
    return { left, right };
  }, [draft.birthDateIso]);

  const genderLabel = draft.gender === 'male' ? 'Male' : draft.gender === 'female' ? 'Female' : '—';

  const weightSummary = useMemo(() => {
    const v = draft.weightValue.trim();
    if (!v) return '—';
    return `${v} ${draft.weightUnit}`;
  }, [draft.weightValue, draft.weightUnit]);

  const validate = useCallback(() => {
    const next: { birth?: string; weight?: string } = {};
    if (!draft.birthDateIso) next.birth = 'Birth date is required';
    const raw = draft.weightValue.replace(',', '.').trim();
    const w = parseFloat(raw);
    if (!raw || !Number.isFinite(w) || w <= 0) {
      next.weight = 'Enter a valid weight';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [draft.birthDateIso, draft.weightValue]);

  const submit = useCallback(async () => {
    if (!draft.species || !draft.gender) {
      Alert.alert('Missing info', 'Please go back and complete pet type, breed, and gender.');
      return;
    }
    if (!validate()) return;

    const raw = draft.weightValue.replace(',', '.').trim();
    const w = parseFloat(raw);
    const weightKg = draft.weightUnit === 'kg' ? w : w * LBS_TO_KG;
    const roundedKg = Math.round(weightKg * 100) / 100;

    const body: CreatePetDto = {
      name: draft.name.trim(),
      species: draft.species,
      breed: draft.breed.trim(),
      gender: draft.gender,
      dateOfBirth: draft.birthDateIso ?? undefined,
      weight: roundedKg,
      servicesNeeded: [],
      microchipId: draft.microchipId.trim() || undefined,
      medicalNotes: buildMedicalNotesForApi(draft),
    };

    setSubmitting(true);
    try {
      await createPet(client, body);
      resetDraft();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : e instanceof Error
            ? e.message
            : 'Could not save pet';
      Alert.alert('Something went wrong', `${msg}\n\n${getNetworkErrorHelp()}`);
    } finally {
      setSubmitting(false);
    }
  }, [client, draft, resetDraft, router, validate]);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.solid_white }]}>
      <AddPetFlowHeader
        step={2}
        totalSteps={TOTAL_STEPS}
        onBack={onBackToStep1}
        paddingTop={insets.top}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>
            Age &amp; weight
          </Text>
          <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
            Help us track {draft.name.trim() || 'your pet'}&apos;s health
          </Text>

          <FieldLabel required>Birth date</FieldLabel>
          <TouchableOpacity
            style={[
              styles.dateRow,
              {
                borderColor: errors.birth ? t.colors.warning : t.colors.inactive_bg_alpha,
              },
            ]}
            onPress={openBirthPicker}
            activeOpacity={0.85}
          >
            <View style={[styles.dateCell, { borderColor: t.colors.inactive_bg_alpha }]}>
              <Text
                style={[
                  styles.dateCellText,
                  { color: draft.birthDateIso ? t.colors.text_primary : t.colors.text_secondary },
                ]}
              >
                {monthDayLabel.left}
              </Text>
            </View>
            <View style={[styles.dateCell, { borderColor: t.colors.inactive_bg_alpha }]}>
              <Text
                style={[
                  styles.dateCellText,
                  { color: draft.birthDateIso ? t.colors.text_primary : t.colors.text_secondary },
                ]}
              >
                {monthDayLabel.right}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.birth ? (
            <Text style={[styles.errorText, { color: t.colors.warning }]}>{errors.birth}</Text>
          ) : null}

          <FieldLabel required>Current weight</FieldLabel>
          <View style={styles.weightRow}>
            <TextInput
              style={[
                styles.weightInput,
                {
                  color: t.colors.text_primary,
                  borderColor: errors.weight ? t.colors.warning : t.colors.inactive_bg_alpha,
                  backgroundColor: t.colors.solid_white,
                },
              ]}
              placeholder="0"
              placeholderTextColor={t.colors.text_secondary}
              keyboardType="decimal-pad"
              value={draft.weightValue}
              onChangeText={(weightValue: string) => updateDraft({ weightValue })}
            />
            <View style={styles.unitRow}>
              {(['kg', 'lbs'] as const).map((u) => {
                const selected = draft.weightUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitChip,
                      {
                        borderColor: selected ? accent : t.colors.inactive_bg_alpha,
                        backgroundColor: selected ? accentLight : t.colors.solid_white,
                      },
                    ]}
                    onPress={() => updateDraft({ weightUnit: u })}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        {
                          color: selected ? accent : t.colors.text_primary,
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {errors.weight ? (
            <Text style={[styles.errorText, { color: t.colors.warning }]}>{errors.weight}</Text>
          ) : null}

          <View style={[styles.tipBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="bulb-outline" size={22} color="#0369a1" style={styles.tipIcon} />
            <Text style={[styles.tipText, { color: '#0c4a6e' }]}>
              Tip: Regular weight tracking helps monitor your pet&apos;s health and ensures proper
              nutrition.
            </Text>
          </View>

          <View style={styles.sectionSpacer} />

          <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>
            Additional details
          </Text>
          <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
            Optional information to complete the profile
          </Text>

          <FieldLabel>Microchip ID</FieldLabel>
          <TextInput
            style={[
              styles.input,
              {
                color: t.colors.text_primary,
                borderColor: t.colors.inactive_bg_alpha,
                backgroundColor: t.colors.solid_white,
              },
            ]}
            placeholder="Enter microchip number"
            placeholderTextColor={t.colors.text_secondary}
            value={draft.microchipId}
            onChangeText={(microchipId: string) => updateDraft({ microchipId })}
            autoCapitalize="characters"
          />

          <FieldLabel>Special needs or medical conditions</FieldLabel>
          <TextInput
            style={[
              styles.textArea,
              {
                color: t.colors.text_primary,
                borderColor: t.colors.inactive_bg_alpha,
                backgroundColor: t.colors.solid_white,
              },
            ]}
            placeholder="e.g., Allergies, medications, dietary restrictions…"
            placeholderTextColor={t.colors.text_secondary}
            value={draft.medicalNotes}
            onChangeText={(medicalNotes: string) => updateDraft({ medicalNotes })}
            multiline
            textAlignVertical="top"
          />

          <View
            style={[
              styles.reviewCard,
              { backgroundColor: t.colors.solid_white, borderColor: t.colors.inactive_bg_alpha },
            ]}
          >
            <Text style={[styles.reviewName, { color: t.colors.text_primary }]}>
              {draft.name.trim() || 'Your pet'}
            </Text>
            <Text style={[styles.reviewLine, { color: t.colors.text_secondary }]}>
              {draft.breed || '—'} • {genderLabel} • {weightSummary}
            </Text>
            <Text style={[styles.reviewHint, { color: t.colors.text_secondary }]}>
              Review your pet&apos;s information before submitting.
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: t.colors.solid_white },
          ]}
        >
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: accentLight }]}
            onPress={submit}
            activeOpacity={0.9}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={accent} />
            ) : (
              <Text style={[styles.confirmBtnText, { color: accent }]}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosPickerOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIosPickerOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIosPickerOpen(false)}>
            <Pressable
              style={[styles.iosSheet, { backgroundColor: t.colors.solid_white }]}
              onPress={() => {}}
            >
              <View
                style={[styles.iosSheetHeader, { borderBottomColor: t.colors.inactive_bg_alpha }]}
              >
                <TouchableOpacity onPress={() => setIosPickerOpen(false)}>
                  <Text style={{ color: t.colors.text_secondary, fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.iosSheetTitle, { color: t.colors.text_primary }]}>
                  Birth date
                </Text>
                <TouchableOpacity onPress={confirmIosBirth}>
                  <Text style={{ color: accent, fontSize: 16, fontWeight: '700' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosTempDate}
                mode="date"
                display="spinner"
                themeVariant="light"
                maximumDate={new Date()}
                minimumDate={new Date(1990, 0, 1)}
                onChange={(_, date) => {
                  if (date) setIosTempDate(date);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionSpacer: { height: 28 },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  dateCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateCellText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  weightRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    marginBottom: 4,
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  unitChip: {
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  unitChipText: {
    fontSize: 15,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  tipIcon: { marginRight: 10, marginTop: 2 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewName: { fontSize: 18, fontWeight: '700' },
  reviewLine: { fontSize: 15, marginTop: 8 },
  reviewHint: { fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  footer: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  confirmBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  iosSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
});
