import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';

const H_PAD = 16;

const ITEMS: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  href: '/find-vet' | '/vaccination' | '/walkers-trainers';
}[] = [
  {
    id: 'vet',
    title: 'Find a Vet',
    subtitle: 'Book a consultation near you',
    icon: 'medkit-outline',
    href: '/find-vet',
  },
  {
    id: 'vax',
    title: 'Vaccination',
    subtitle: 'Clinics and vaccine bookings',
    icon: 'medical-outline',
    href: '/vaccination',
  },
  {
    id: 'walk',
    title: 'Walkers & Trainers',
    subtitle: 'Exercise and training',
    icon: 'paw-outline',
    href: '/walkers-trainers',
  },
];

export function FindHubPage() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent;
  const cream = t.colors.primary_bg;

  return (
    <View style={[styles.fill, { backgroundColor: cream, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
        <Text style={[styles.title, { color: t.colors.text_primary }]}>Find</Text>
        <Text style={[styles.sub, { color: t.colors.text_secondary }]}>Services for your pet</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: H_PAD, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: t.colors.solid_white, borderColor: t.colors.inactive_bg_alpha },
            ]}
            onPress={() => router.push(item.href)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: t.colors.primary_light }]}>
              <Ionicons name={item.icon} size={26} color={accent} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: t.colors.text_primary }]}>{item.title}</Text>
              <Text style={[styles.cardSub, { color: t.colors.text_secondary }]}>
                {item.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={t.colors.text_secondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 14, marginTop: 2 },
});
