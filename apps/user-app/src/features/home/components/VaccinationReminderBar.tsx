import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Pet } from '@petspond/types';
import { useTheme } from '@/contexts';
import { H_PAD, REMINDER_CTA } from '../constants';

export type VaccinationReminderBarProps = {
  selectedPet: Pet | null;
};

export function VaccinationReminderBar({ selectedPet }: VaccinationReminderBarProps) {
  const router = useRouter();
  const t = useTheme();

  const message = selectedPet
    ? `${selectedPet.name}'s vaccinations — check due dates`
    : 'Add a pet to track vaccination reminders';

  return (
    <View style={[styles.notifBar, { paddingHorizontal: H_PAD }]}>
      <View
        style={[
          styles.notifInner,
          { backgroundColor: t.colors.grey_bg, borderRadius: t.borderRadius.full },
        ]}
      >
        <View style={[styles.notifIconWrap, { backgroundColor: t.colors.matte_red }]}>
          <Ionicons name="notifications" size={18} color="#fff" />
        </View>
        <Text style={[styles.notifText, { color: t.colors.text_primary }]} numberOfLines={1}>
          {message}
        </Text>
        <View style={styles.notifCtaWrap}>
          <TouchableOpacity
            style={[
              styles.notifCta,
              { backgroundColor: t.colors.info_blue, borderRadius: t.borderRadius.full },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push('/vaccination')}
          >
            <Text style={styles.notifCtaText}>{REMINDER_CTA}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notifBar: { marginBottom: 20 },
  notifInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
    gap: 10,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: { flex: 1, fontSize: 14 },
  notifCta: { paddingVertical: 8, paddingHorizontal: 14 },
  notifCtaText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  notifCtaWrap: { padding: 4 },
});
