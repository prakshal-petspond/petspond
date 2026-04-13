import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { AddPetFlowHeader } from './AddPetFlowHeader';
import { useAddPetDraft } from './AddPetDraftContext';
import { PET_TYPE_OPTIONS } from './addPetDraft';
import { breedsForDogOrCat } from './breeds';
import { BreedPickerField } from './BreedPickerField';
import type { PetGender } from '@petspond/types';

const H_PAD = 20;
const TOTAL_STEPS = 2;

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  const t = useTheme();
  return (
    <Text style={[styles.fieldLabel, { color: t.colors.foreground }]}>
      {children}
      {required ? <Text style={{ color: t.colors.error }}> *</Text> : null}
    </Text>
  );
}

type AddPetStep1Props = {
  onContinue: () => void;
};

export function AddPetStep1Screen({ onContinue }: AddPetStep1Props) {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useAddPetDraft();
  const accent = t.colors.accent ?? t.colors.primary;
  const accentLight = t.colors.accentLight ?? '#fed7aa';

  const [errors, setErrors] = useState<{
    name?: string;
    petType?: string;
    breed?: string;
    gender?: string;
  }>({});

  const pickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add a pet picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      updateDraft({ localPhotoUri: res.assets[0].uri });
    }
  }, [updateDraft]);

  const validate = useCallback(() => {
    const next: typeof errors = {};
    const name = draft.name.trim();
    if (!name) next.name = 'Pet name is required';
    if (!draft.petTypeKey || !draft.species) next.petType = 'Select a pet type';
    if (!draft.breed.trim()) next.breed = 'Breed is required';
    if (!draft.gender) next.gender = 'Select gender';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [draft.breed, draft.gender, draft.name, draft.petTypeKey, draft.species]);

  const handleContinue = useCallback(() => {
    if (!validate()) return;
    onContinue();
  }, [onContinue, validate]);

  const petNameForCopy = draft.name.trim() || 'your pet';

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <AddPetFlowHeader step={1} totalSteps={TOTAL_STEPS} onBack={() => router.back()} paddingTop={insets.top} />

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
          <Text style={[styles.sectionTitle, { color: t.colors.foreground }]}>Basic Information</Text>
          <Text style={[styles.sectionSubtitle, { color: t.colors.muted }]}>
            Let&apos;s start with the basics about your pet
          </Text>

          <View style={styles.photoBlock}>
            <TouchableOpacity style={styles.photoCircle} onPress={pickPhoto} activeOpacity={0.85}>
              {draft.localPhotoUri ? (
                <Image source={{ uri: draft.localPhotoUri }} style={styles.photoImage} />
              ) : (
                <View style={[styles.photoPlaceholder, { borderColor: t.colors.border }]}>
                  <Ionicons name="camera-outline" size={40} color={t.colors.muted} />
                  <Text style={[styles.photoHint, { color: t.colors.muted }]}>Add Photo</Text>
                </View>
              )}
              <View style={[styles.photoFab, { backgroundColor: accent }]}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <FieldLabel required>Pet name</FieldLabel>
          <TextInput
            style={[
              styles.input,
              {
                color: t.colors.foreground,
                borderColor: errors.name ? t.colors.error : t.colors.border,
                backgroundColor: t.colors.background,
              },
            ]}
            placeholder="e.g., Luna, Max, Bella"
            placeholderTextColor={t.colors.muted}
            value={draft.name}
            onChangeText={(name: string) => updateDraft({ name })}
          />
          {errors.name ? <Text style={[styles.errorText, { color: t.colors.error }]}>{errors.name}</Text> : null}

          <FieldLabel required>Pet type</FieldLabel>
          <View style={styles.typeGrid}>
            {PET_TYPE_OPTIONS.map((opt) => {
              const selected = draft.petTypeKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.typeChip,
                    {
                      borderColor: errors.petType ? t.colors.error : selected ? accent : t.colors.border,
                      backgroundColor: selected ? accentLight : t.colors.background,
                    },
                  ]}
                  onPress={() =>
                    updateDraft({ petTypeKey: opt.key, species: opt.species, breed: '' })
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: selected ? accent : t.colors.foreground, fontWeight: selected ? '700' : '500' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.petType ? <Text style={[styles.errorText, { color: t.colors.error }]}>{errors.petType}</Text> : null}

          <View style={styles.sectionSpacer} />

          <Text style={[styles.sectionTitle, { color: t.colors.foreground }]}>Breed &amp; gender</Text>
          <Text style={[styles.sectionSubtitle, { color: t.colors.muted }]}>
            Tell us more about {petNameForCopy}
          </Text>

          <FieldLabel required>Breed</FieldLabel>
          {!draft.species ? (
            <BreedPickerField
              breeds={[]}
              value=""
              onChange={() => {}}
              disabled
              disabledPlaceholder="Select pet type first"
              error={!!errors.breed}
              errorText={errors.breed}
            />
          ) : (
            <BreedPickerField
              breeds={breedsForDogOrCat(draft.species)}
              value={draft.breed}
              onChange={(breed: string) => updateDraft({ breed })}
              error={!!errors.breed}
              errorText={errors.breed}
            />
          )}

          <FieldLabel required>Gender</FieldLabel>
          <View style={styles.genderRow}>
            {(['male', 'female'] as PetGender[]).map((g) => {
              const selected = draft.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    {
                      borderColor: errors.gender ? t.colors.error : selected ? accent : t.colors.border,
                      backgroundColor: selected ? accentLight : t.colors.background,
                    },
                  ]}
                  onPress={() => updateDraft({ gender: g })}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.genderBtnText,
                      { color: selected ? accent : t.colors.foreground, fontWeight: selected ? '700' : '600' },
                    ]}
                  >
                    {g === 'male' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.gender ? <Text style={[styles.errorText, { color: t.colors.error }]}>{errors.gender}</Text> : null}

          <FieldLabel>Color / markings</FieldLabel>
          <TextInput
            style={[
              styles.input,
              { color: t.colors.foreground, borderColor: t.colors.border, backgroundColor: t.colors.background },
            ]}
            placeholder="Optional"
            placeholderTextColor={t.colors.muted}
            value={draft.colorMarkings}
            onChangeText={(colorMarkings: string) => updateDraft({ colorMarkings })}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: t.colors.background }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: accentLight }]}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={[styles.confirmBtnText, { color: accent }]}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  sectionSpacer: {
    height: 28,
  },
  photoBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  photoCircle: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  photoHint: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoFab: {
    position: 'absolute',
    right: -4,
    bottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  typeChip: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeChipText: {
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderBtnText: {
    fontSize: 16,
  },
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
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
