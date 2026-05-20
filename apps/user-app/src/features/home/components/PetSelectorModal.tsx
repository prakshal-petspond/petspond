import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Pet } from '@petspond/types';
import { useTheme } from '@/contexts';
import { FALLBACK_PET_IMG, SCREEN_WIDTH } from '../constants';
import type { PetPillLayout } from '../types';

export type PetSelectorModalProps = {
  visible: boolean;
  pillLayout: PetPillLayout | null;
  pets: Pet[];
  petsLoading: boolean;
  selectedPetId: string | null;
  onSelectPet: (petId: string) => void;
  onClose: () => void;
};

export function PetSelectorModal({
  visible,
  pillLayout,
  pets,
  petsLoading,
  selectedPetId,
  onSelectPet,
  onClose,
}: PetSelectorModalProps) {
  const router = useRouter();
  const t = useTheme();
  const accent = t.colors.accent;
  const accentLight = t.colors.primary_light;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        {pillLayout && (
          <Pressable
            style={[
              styles.petModal,
              { backgroundColor: t.colors.solid_white },
              {
                position: 'absolute',
                top: pillLayout.y + pillLayout.height + 8,
                right: SCREEN_WIDTH - (pillLayout.x + pillLayout.width),
              },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.petModalTitle, { color: accent }]}>Select Pet</Text>
            {petsLoading ? (
              <Text style={[styles.petModalEmpty, { color: t.colors.text_secondary }]}>
                Loading pets…
              </Text>
            ) : pets.length === 0 ? (
              <Text
                style={[
                  styles.petModalEmpty,
                  { color: t.colors.text_secondary, paddingHorizontal: 16 },
                ]}
              >
                No pets yet. Add one to personalize reminders and booking.
              </Text>
            ) : (
              pets.map((pet) => {
                const isSelected = pet.id === selectedPetId;
                const img = pet.photoUrl ?? FALLBACK_PET_IMG;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petModalRow, isSelected && { backgroundColor: accentLight }]}
                    onPress={() => {
                      onSelectPet(pet.id);
                      onClose();
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: img }} style={styles.petModalAvatar} />
                    <View style={styles.petModalTextWrap}>
                      <Text style={[styles.petModalName, { color: t.colors.text_primary }]}>
                        {pet.name}
                      </Text>
                      <Text style={[styles.petModalBreed, { color: t.colors.text_secondary }]}>
                        {pet.breed}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={accent} />}
                  </TouchableOpacity>
                );
              })
            )}
            <View
              style={[styles.petModalDivider, { backgroundColor: t.colors.inactive_bg_alpha }]}
            />
            <TouchableOpacity
              style={styles.petModalAdd}
              onPress={() => {
                onClose();
                router.push('/add-pet');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={accent} />
              <Text style={[styles.petModalAddText, { color: accent }]}>+ Add New Pet</Text>
            </TouchableOpacity>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  petModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  petModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  petModalEmpty: {
    fontSize: 14,
    paddingVertical: 16,
    textAlign: 'center',
  },
  petModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  petModalAvatar: { width: 44, height: 44, borderRadius: 22 },
  petModalTextWrap: { flex: 1 },
  petModalName: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  petModalBreed: { fontSize: 13, marginTop: 2 },
  petModalDivider: { height: 1, marginVertical: 8, marginHorizontal: 16 },
  petModalAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  petModalAddText: { fontSize: 15, fontWeight: '600' },
});
