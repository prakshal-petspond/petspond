import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  Alert,
  Platform,
  ActionSheetIOS,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { PetGender } from '@petspond/types';
import { useTheme } from '@/contexts';
import { useAddPetDraft, type AddPetSpecies } from './AddPetDraftContext';
import { breedsForSpecies } from './breeds';
import { PrimaryButton } from '@/components/ui';

const SPECIES: { id: AddPetSpecies; label: string }[] = [
  { id: 'dog', label: 'Dog' },
  { id: 'cat', label: 'Cat' },
];

const GENDERS: { id: PetGender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

export function AddPetStep1Screen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setDraft } = useAddPetDraft();
  const [typeOpen, setTypeOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);
  const [breedQuery, setBreedQuery] = useState('');

  const breeds = breedsForSpecies(draft.species);
  const filteredBreeds = useMemo(() => {
    const q = breedQuery.trim().toLowerCase();
    if (!q) return breeds;
    return breeds.filter((b) => b.toLowerCase().includes(q));
  }, [breedQuery, breeds]);

  const canContinue =
    draft.name.trim().length > 0 && !!draft.species && draft.breed.trim().length > 0 && !!draft.gender;

  async function pick(from: 'camera' | 'library') {
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to add a pet photo.');
      return;
    }
    const result =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
          });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setDraft({ photoUri: asset.uri, photoMime: asset.mimeType });
  }

  function choosePhoto() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take photo', 'Choose from gallery'], cancelButtonIndex: 0 },
        (i) => {
          if (i === 1) void pick('camera');
          if (i === 2) void pick('library');
        },
      );
      return;
    }
    Alert.alert('Pet photo', 'Choose a source', [
      { text: 'Camera', onPress: () => void pick('camera') },
      { text: 'Gallery', onPress: () => void pick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
          <Text style={[styles.title, { color: t.colors.text_primary }]}>Add a pet</Text>
          <Text style={[styles.step, { color: t.colors.text_secondary }]}>Step 1 of 2</Text>
        </View>
        <View style={styles.roundBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={choosePhoto} style={[styles.photoCard, { backgroundColor: t.colors.solid_white }]}>
          {draft.photoUri ? (
            <Image source={{ uri: draft.photoUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: t.colors.primary_bg }]}>
              <Ionicons name="camera" size={28} color={t.colors.primary} />
            </View>
          )}
          <Text style={[styles.photoLabel, { color: t.colors.primary }]}>
            {draft.photoUri ? 'Change photo' : 'Add photo'}
          </Text>
          <Text style={[styles.photoHint, { color: t.colors.text_secondary }]}>
            Camera or gallery
          </Text>
        </Pressable>

        <Field label="Pet name">
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft({ name })}
            placeholder="e.g. Luna"
            placeholderTextColor={t.colors.text_secondary}
            style={[styles.input, { color: t.colors.text_primary, backgroundColor: t.colors.solid_white }]}
          />
        </Field>

        <Field label="Pet type">
          <Pressable
            onPress={() => setTypeOpen(true)}
            style={[styles.input, styles.rowInput, { backgroundColor: t.colors.solid_white }]}
          >
            <Text style={{ color: draft.species ? t.colors.text_primary : t.colors.text_secondary }}>
              {draft.species ? SPECIES.find((s) => s.id === draft.species)?.label : 'Select type'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={t.colors.text_secondary} />
          </Pressable>
        </Field>

        <Field label="Pet breed">
          <Pressable
            disabled={!draft.species}
            onPress={() => {
              setBreedQuery('');
              setBreedOpen(true);
            }}
            style={[
              styles.input,
              styles.rowInput,
              {
                backgroundColor: draft.species ? t.colors.solid_white : t.colors.inactive_bg_alpha,
              },
            ]}
          >
            <Text
              style={{
                color: draft.breed ? t.colors.text_primary : t.colors.text_secondary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {!draft.species ? 'Select pet type first' : draft.breed || 'Search breed'}
            </Text>
            <Ionicons name="search" size={18} color={t.colors.text_secondary} />
          </Pressable>
        </Field>

        <Field label="Gender">
          <View style={styles.pills}>
            {GENDERS.map((g) => {
              const on = draft.gender === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setDraft({ gender: g.id })}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: on ? t.colors.primary : t.colors.solid_white,
                      borderColor: on ? t.colors.primary : t.colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: on ? '#fff' : t.colors.text_primary, fontWeight: '600' }}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Color / marking">
          <TextInput
            value={draft.color}
            onChangeText={(color) => setDraft({ color })}
            placeholder="e.g. Golden with white chest"
            placeholderTextColor={t.colors.text_secondary}
            style={[styles.input, { color: t.colors.text_primary, backgroundColor: t.colors.solid_white }]}
          />
        </Field>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton title="Continue" disabled={!canContinue} onPress={() => router.push('/add-pet/details')} />
      </View>

      <SelectModal
        visible={typeOpen}
        title="Pet type"
        onClose={() => setTypeOpen(false)}
      >
        {SPECIES.map((s) => (
          <Pressable
            key={s.id}
            style={styles.option}
            onPress={() => {
              setDraft({ species: s.id, breed: '' });
              setTypeOpen(false);
            }}
          >
            <Text style={[styles.optionText, { color: t.colors.text_primary }]}>{s.label}</Text>
            {draft.species === s.id ? (
              <Ionicons name="checkmark-circle" size={20} color={t.colors.primary} />
            ) : null}
          </Pressable>
        ))}
      </SelectModal>

      <SelectModal
        visible={breedOpen}
        title="Pet breed"
        onClose={() => setBreedOpen(false)}
        search={{ value: breedQuery, onChange: setBreedQuery, placeholder: 'Search breed' }}
      >
        <FlatList
          data={filteredBreeds as string[]}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.option}
              onPress={() => {
                setDraft({ breed: item });
                setBreedOpen(false);
              }}
            >
              <Text style={[styles.optionText, { color: t.colors.text_primary }]}>{item}</Text>
              {draft.breed === item ? (
                <Ionicons name="checkmark-circle" size={20} color={t.colors.primary} />
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: t.colors.text_secondary, padding: 16 }}>No matching breeds</Text>
          }
        />
      </SelectModal>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.colors.text_primary }]}>{label}</Text>
      {children}
    </View>
  );
}

function SelectModal({
  visible,
  title,
  onClose,
  search,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  search?: { value: string; onChange: (v: string) => void; placeholder: string };
  children: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: t.colors.solid_white, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.sheetHandle} />
        <Text style={[styles.sheetTitle, { color: t.colors.text_primary }]}>{title}</Text>
        {search ? (
          <TextInput
            value={search.value}
            onChangeText={search.onChange}
            placeholder={search.placeholder}
            placeholderTextColor={t.colors.text_secondary}
            autoFocus
            style={[
              styles.input,
              { color: t.colors.text_primary, backgroundColor: t.colors.grey_bg, marginHorizontal: 16 },
            ]}
          />
        ) : null}
        <View style={{ maxHeight: 360 }}>{children}</View>
      </View>
    </Modal>
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
  photoCard: {
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  photo: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { marginTop: 10, fontWeight: '700', fontSize: 15 },
  photoHint: { marginTop: 2, fontSize: 12 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    fontSize: 15,
  },
  rowInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pills: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: 20, paddingTop: 8, backgroundColor: 'transparent' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionText: { fontSize: 16 },
});
