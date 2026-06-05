import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useTheme, useLocation, useApi } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import { vendorToWalkerProfessional } from '@/lib/vendorMappers';
import { fetchPublicVendors } from '@/services/vendors';
import type { WalkerProfessional } from '@/features/walkers-trainers/walkersData';

const H_PAD = 16;

export function GroomersPage() {
  const t = useTheme();
  const router = useRouter();
  const { client } = useApi();
  const {
    addressLine: locationAddress,
    loading: locationLoading,
    refresh: refreshLocation,
    coords,
  } = useLocation();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent;
  const headerBg = t.colors.primary_bg;

  const [groomers, setGroomers] = useState<WalkerProfessional[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);

  const load = useCallback(async () => {
    if (!coords) {
      setGroomers([]);
      return;
    }
    setListLoading(true);
    try {
      const list = await fetchPublicVendors(client, {
        type: 'grooming',
        lat: coords.latitude,
        lng: coords.longitude,
      });
      setGroomers(list.map(vendorToWalkerProfessional));
    } catch {
      setGroomers([]);
    } finally {
      setListLoading(false);
    }
  }, [client, coords]);

  useEffect(() => {
    load();
  }, [load]);

  const locationDisplay = locationLoading
    ? 'Getting location…'
    : (locationAddress ?? 'Your location').split(',').slice(0, 2).join(',').trim();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groomers;
    return groomers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [groomers, searchQuery]);

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.solid_white }]}>
      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top }]}>
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.colors.text_primary }]}>Groomers</Text>
        </View>
        <View style={[styles.inputsWrap, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.searchWrap, { backgroundColor: t.colors.solid_white }]}>
            <Ionicons name="search" size={20} color={t.colors.text_secondary} />
            <TextInput
              style={[styles.searchInput, { color: t.colors.text_primary }]}
              placeholder="Search groomers..."
              placeholderTextColor={t.colors.text_secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.locationWrap, { backgroundColor: t.colors.solid_white }]}
            onPress={() => refreshLocation().then(() => load())}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={18} color={accent} />
            <Text style={[styles.locationText, { color: t.colors.text_primary }]} numberOfLines={1}>
              {locationDisplay}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: H_PAD, paddingBottom: 32 }}>
        {listLoading ? (
          <Text style={{ color: t.colors.text_secondary }}>Loading groomers…</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ color: t.colors.text_secondary }}>
            No groomers in your area yet. Check back soon.
          </Text>
        ) : (
          filtered.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, { borderColor: t.colors.inactive_bg_alpha }]}
              onPress={() => router.push(`/groomers/${p.id}` as Href)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: p.image }} style={styles.avatar} />
              <View style={styles.cardBody}>
                <Text style={[styles.name, { color: t.colors.text_primary }]}>{p.name}</Text>
                <Text style={{ color: t.colors.text_secondary }}>{p.title}</Text>
                <Text style={{ color: t.colors.icon_mustard, marginTop: 4 }}>
                  ★ {p.rating} · {p.distance}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  inputsWrap: { gap: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  locationText: { flex: 1, fontSize: 14, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    backgroundColor: '#fff',
  },
  avatar: { width: 72, height: 72, borderRadius: 12 },
  cardBody: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
});
