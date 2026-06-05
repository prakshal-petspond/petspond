import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { Vendor } from '@petspond/types';
import { useTheme, useApi } from '@/contexts';
import { formatScheduleSummary } from '@/lib/schedule';
import { fetchVendorMe } from '@/services/vendorAuth';

export function VendorHomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { client, setToken } = useApi();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const v = await fetchVendorMe(client);
      setVendor(v);
      if (!v.onboardingCompleted) router.replace('/onboarding');
    } catch {
      setVendor(null);
    }
  }, [client, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const signOut = () => {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          setToken(null);
          router.replace('/login');
        },
      },
    ]);
  };

  if (!vendor) {
    return (
      <View style={[styles.fill, { backgroundColor: t.colors.secondary_bg, paddingTop: insets.top }]}>
        <Text style={{ padding: 20, color: t.colors.text_secondary }}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: t.colors.secondary_bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.accent} />}
    >
      <Text style={[styles.title, { color: t.colors.text_primary }]}>{vendor.businessName}</Text>
      {vendor.displayTitle ? (
        <Text style={[styles.sub, { color: t.colors.text_secondary }]}>{vendor.displayTitle}</Text>
      ) : null}

      <View style={[styles.card, { backgroundColor: t.colors.solid_white }]}>
        <Text style={[styles.cardTitle, { color: t.colors.accent }]}>Services</Text>
        <Text style={{ color: t.colors.text_primary }}>{vendor.serviceTypes.join(' · ')}</Text>
        <Text style={[styles.meta, { color: t.colors.text_secondary, marginTop: 8 }]}>
          Modes: {vendor.serviceModes.join(', ')}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: t.colors.solid_white }]}>
        <Text style={[styles.cardTitle, { color: t.colors.accent }]}>Service area</Text>
        <Text style={{ color: t.colors.text_primary }} numberOfLines={3}>
          {vendor.address}
        </Text>
        <Text style={[styles.meta, { color: t.colors.text_secondary, marginTop: 8 }]}>
          Radius: {vendor.serviceRadiusKm} km
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: t.colors.solid_white }]}>
        <Text style={[styles.cardTitle, { color: t.colors.accent }]}>Weekly slots</Text>
        <Text style={{ color: t.colors.text_primary }}>{formatScheduleSummary(vendor.weeklyAvailability)}</Text>
        <Text style={[styles.meta, { color: t.colors.text_secondary, marginTop: 8 }]}>
          Status: {vendor.isActive ? 'Active' : 'Paused'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.editBtn, { borderColor: t.colors.accent }]}
        onPress={() => router.push('/onboarding?edit=1')}
      >
        <Text style={{ color: t.colors.accent, fontWeight: '700' }}>Edit profile & services</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signOut} style={styles.signOut}>
        <Text style={{ color: t.colors.warning, fontWeight: '600' }}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 15, marginBottom: 20 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  meta: { fontSize: 13 },
  editBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  signOut: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
});
