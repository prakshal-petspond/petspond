import React, { type RefObject } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { PetPillAnchorRef } from '../types';
import { Ionicons } from '@expo/vector-icons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Entypo from '@expo/vector-icons/Entypo';
import type { Pet } from '@petspond/types';
import { useTheme } from '@/contexts';
import { FALLBACK_PET_IMG, H_PAD } from '../constants';

export type LandingHeaderProps = {
  locationAddress: string | null;
  locationLoading: boolean;
  onRefreshLocation: () => void;
  petsLoading: boolean;
  selectedPet: Pet | null;
  pillRef: RefObject<PetPillAnchorRef | null>;
  onPetPillPress: () => void;
};

export function LandingHeader({
  locationAddress,
  locationLoading,
  onRefreshLocation,
  petsLoading,
  selectedPet,
  pillRef,
  onPetPillPress,
}: LandingHeaderProps) {
  const t = useTheme();
  const accent = t.colors.accent;
  const accentLight = t.colors.primary_light;

  return (
    <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
      <TouchableOpacity style={styles.headerLeft} activeOpacity={0.8} onPress={onRefreshLocation}>
        <View style={[styles.locationIconWrap, { backgroundColor: t.colors.primary_bg }]}>
          <EvilIcons name="location" size={24} color={t.colors.icon_brown} />
        </View>
        <View>
          <Text style={[styles.deliverTo, { color: accent }]}>DELIVER TO</Text>
          <View style={styles.locationRow}>
            <Text style={[styles.locationText, { color: t.colors.text_primary }]} numberOfLines={1}>
              {locationLoading ? 'Getting location…' : (locationAddress ?? 'Your location')}
            </Text>
            <Entypo name="triangle-down" size={24} color="black" />
          </View>
        </View>
      </TouchableOpacity>
      <View ref={pillRef} collapsable={false}>
        <TouchableOpacity
          style={[styles.petPill, { backgroundColor: t.colors.primary_bg }]}
          onPress={onPetPillPress}
          activeOpacity={0.8}
        >
          {petsLoading ? (
            <Text style={[styles.petName, { color: t.colors.text_primary }]}>…</Text>
          ) : selectedPet ? (
            <>
              <Text style={[styles.petName, { color: t.colors.text_primary }]} numberOfLines={1}>
                {selectedPet.name.toUpperCase()}
              </Text>
              <Entypo name="triangle-down" size={16} color={t.colors.primary} />
              <Image
                source={{ uri: selectedPet.photoUrl ?? FALLBACK_PET_IMG }}
                style={styles.petAvatar}
              />
            </>
          ) : (
            <>
              <Text style={[styles.petName, { color: t.colors.text_primary }]}>Add pet</Text>
              <Ionicons name="chevron-down" size={14} color={t.colors.text_primary} />
              <View
                style={[
                  styles.petAvatar,
                  {
                    backgroundColor: t.colors.inactive_bg_alpha,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Ionicons name="paw" size={16} color={t.colors.text_secondary} />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliverTo: { fontSize: 12, fontWeight: '700', letterSpacing: 0 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '60%',
  },
  locationText: { fontSize: 15, fontWeight: '600' },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 9999,
    gap: 4,
    height: 48,
  },
  petName: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  petAvatar: { width: 28, height: 28, borderRadius: 14 },
});
