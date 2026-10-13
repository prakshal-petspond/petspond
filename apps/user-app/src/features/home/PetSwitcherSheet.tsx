import React from 'react';
import { Modal, View, Text, Pressable, Image, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePets, useTheme } from '@/contexts';
import { resolvePhotoUrl } from '@/lib/photoUrl';

export function PetSwitcherSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pets, activePet, setActivePetId } = usePets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: t.colors.solid_white, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.handle} />
        <Text style={[styles.title, { color: t.colors.text_primary }]}>Your pets</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          {pets.map((pet) => {
            const uri = resolvePhotoUrl(pet.photoUrl);
            const active = activePet?.id === pet.id;
            return (
              <Pressable
                key={pet.id}
                style={styles.row}
                onPress={() => {
                  setActivePetId(pet.id);
                  onClose();
                }}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: t.colors.primary_bg }]}>
                    <Ionicons name="paw" size={18} color={t.colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: t.colors.text_primary }]}>{pet.name}</Text>
                  <Text style={[styles.meta, { color: t.colors.text_secondary }]}>
                    {pet.breed}
                  </Text>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={22} color={t.colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          style={[styles.addBtn, { backgroundColor: t.colors.primary_bg }]}
          onPress={() => {
            onClose();
            router.push('/add-pet');
          }}
        >
          <Ionicons name="add" size={20} color={t.colors.primary} />
          <Text style={[styles.addLabel, { color: t.colors.primary }]}>Add a new pet</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 16 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 2 },
  addBtn: {
    marginTop: 8,
    borderRadius: 16,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addLabel: { fontWeight: '700', fontSize: 15 },
});
