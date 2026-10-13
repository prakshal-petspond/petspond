import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { CreatePetDto } from '@petspond/types';
import { useApi, usePets, useTheme } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { createPet } from '@/services/pets';
import { uploadPetPhoto } from '@/services/uploads';
import { useAddPetDraft } from './AddPetDraftContext';
import { PrimaryButton } from '@/components/ui';

export function AddPetStep2Screen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { client } = useApi();
  const { refreshPets } = usePets();
  const { draft, setDraft, reset } = useAddPetDraft();
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave =
    !!draft.dateOfBirth &&
    draft.weight.trim().length > 0 &&
    Number.isFinite(Number(draft.weight)) &&
    Number(draft.weight) > 0 &&
    !!draft.species &&
    draft.name.trim().length > 0 &&
    draft.breed.trim().length > 0;

  async function submit() {
    if (!canSave || !draft.species || !draft.dateOfBirth) return;
    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (draft.photoUri) {
        const uploaded = await uploadPetPhoto(client, draft.photoUri, draft.photoMime);
        photoUrl = uploaded.url;
      }
      const weight = Number(draft.weight);
      const body: CreatePetDto = {
        name: draft.name.trim(),
        species: draft.species,
        breed: draft.breed,
        dateOfBirth: draft.dateOfBirth.toISOString(),
        gender: draft.gender ?? undefined,
        servicesNeeded: [],
        weight,
        photoUrl,
        color: draft.color.trim() || undefined,
        microchipId: draft.microchipId.trim() || undefined,
        medicalNotes: draft.specialNeeds.trim() || undefined,
      };
      const pet = await createPet(client, body);
      await refreshPets(pet.id);
      reset();
      router.replace('/');
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : getNetworkErrorHelp();
      Alert.alert('Could not add pet', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: t.colors.grey_bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.roundBtn, { backgroundColor: t.colors.solid_white }]}
        >
          <Ionicons name="chevron-back" size={22} color={t.colors.text_primary} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { color: t.colors.text_primary }]}>Pet details</Text>
          <Text style={[styles.step, { color: t.colors.text_secondary }]}>Step 2 of 2</Text>
        </View>
        <View style={styles.roundBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.fieldLabel, { color: t.colors.text_primary }]}>Birth date</Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.input, styles.rowInput, { backgroundColor: t.colors.solid_white }]}
        >
          <Text style={{ color: draft.dateOfBirth ? t.colors.text_primary : t.colors.text_secondary }}>
            {draft.dateOfBirth
              ? draft.dateOfBirth.toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Select date'}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={t.colors.primary} />
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={draft.dateOfBirth ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            maximumDate={new Date()}
            onChange={(_, date) => {
              if (Platform.OS !== 'ios') setShowPicker(false);
              if (date) setDraft({ dateOfBirth: date });
            }}
          />
        ) : null}
        {Platform.OS === 'ios' && showPicker ? (
          <Pressable onPress={() => setShowPicker(false)}>
            <Text style={[styles.done, { color: t.colors.primary }]}>Done</Text>
          </Pressable>
        ) : null}

        <Text style={[styles.fieldLabel, { color: t.colors.text_primary, marginTop: 16 }]}>
          Current weight (kg)
        </Text>
        <TextInput
          value={draft.weight}
          onChangeText={(weight) => setDraft({ weight })}
          placeholder="e.g. 12.5"
          keyboardType="decimal-pad"
          placeholderTextColor={t.colors.text_secondary}
          style={[styles.input, { color: t.colors.text_primary, backgroundColor: t.colors.solid_white }]}
        />

        <Text style={[styles.fieldLabel, { color: t.colors.text_primary, marginTop: 16 }]}>
          Microchip ID <Text style={{ color: t.colors.text_secondary, fontWeight: '500' }}>(optional)</Text>
        </Text>
        <TextInput
          value={draft.microchipId}
          onChangeText={(microchipId) => setDraft({ microchipId })}
          placeholder="15-digit ID"
          placeholderTextColor={t.colors.text_secondary}
          autoCapitalize="characters"
          style={[styles.input, { color: t.colors.text_primary, backgroundColor: t.colors.solid_white }]}
        />

        <Text style={[styles.fieldLabel, { color: t.colors.text_primary, marginTop: 16 }]}>
          Special needs <Text style={{ color: t.colors.text_secondary, fontWeight: '500' }}>(optional)</Text>
        </Text>
        <TextInput
          value={draft.specialNeeds}
          onChangeText={(specialNeeds) => setDraft({ specialNeeds })}
          placeholder="Allergies, medications, behaviour…"
          placeholderTextColor={t.colors.text_secondary}
          multiline
          style={[
            styles.input,
            styles.multiline,
            { color: t.colors.text_primary, backgroundColor: t.colors.solid_white },
          ]}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton title="Add pet" loading={saving} disabled={!canSave || saving} onPress={() => void submit()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  step: { fontSize: 12, marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    fontSize: 15,
  },
  rowInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  multiline: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
  done: { textAlign: 'right', fontWeight: '700', marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});
