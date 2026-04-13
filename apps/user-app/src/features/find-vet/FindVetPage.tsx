import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useLocation, useApi } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { Ionicons } from '@expo/vector-icons';
import type { PublicClinicListItem } from '@petspond/types';
import { fetchConsultationClinics } from '@/services/catalog';
import { formatDistanceKm, haversineKm } from '@/lib/geo';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop';

const H_PAD = 16;

type FilterId = 'all' | 'nearest' | 'topRated' | 'available24_7';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'topRated', label: 'Top Rated' },
  { id: 'available24_7', label: '24/7 Available' },
];

export function FindVetPage() {
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
  const accent = t.colors.accent ?? t.colors.primary;
  const headerBg = '#f5f0e8';

  const [selectedFilter, setSelectedFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clinics, setClinics] = useState<PublicClinicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    setListErr(null);
    return fetchConsultationClinics(client)
      .then((list) => setClinics(list))
      .catch(() => setListErr(getNetworkErrorHelp()));
  }, [client]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchList().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchList().finally(() => setRefreshing(false));
  }, [fetchList]);

  const filtered = useMemo(() => {
    let list = [...clinics];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.primaryDoctor.fullName.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q),
      );
    }
    if (selectedFilter === 'topRated') list.sort((a, b) => b.rating - a.rating);
    if (selectedFilter === 'available24_7') list = list.filter((c) => c.is24_7);
    if (selectedFilter === 'nearest' && coords) {
      list.sort((a, b) => {
        const da =
          a.latitude != null && a.longitude != null
            ? haversineKm(coords, { latitude: a.latitude, longitude: a.longitude })
            : Number.POSITIVE_INFINITY;
        const db =
          b.latitude != null && b.longitude != null
            ? haversineKm(coords, { latitude: b.latitude, longitude: b.longitude })
            : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return list;
  }, [clinics, searchQuery, selectedFilter, coords]);

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      {/* Header with cream background */}
      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top }]}>
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={t.colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.colors.foreground }]}>Find a Vet</Text>
        </View>

        <View style={[styles.inputsWrap, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.searchWrap, { backgroundColor: t.colors.background }]}>
            <Ionicons name="search" size={20} color={t.colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: t.colors.foreground }]}
              placeholder="Search by name, clinic or specialty..."
              placeholderTextColor={t.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.locationWrap, { backgroundColor: t.colors.background }]}
            onPress={() => refreshLocation()}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={18} color={accent} />
            <Text style={[styles.locationText, { color: t.colors.foreground }]} numberOfLines={1}>
              {locationLoading ? 'Getting location…' : (locationAddress ?? 'Your location')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersScroll, { paddingHorizontal: H_PAD }]}
          style={styles.filtersScrollWrap}
        >
          {FILTERS.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? accent : t.colors.background,
                  },
                ]}
                onPress={() => setSelectedFilter(f.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#fff' : t.colors.muted },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <View style={[styles.sectionHeader, { paddingHorizontal: H_PAD }]}>
          <Text style={[styles.sectionLabel, { color: t.colors.muted }]}>Clinics near you</Text>
        </View>

        <View style={{ paddingHorizontal: H_PAD }}>
          {loading && (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={accent} />
            </View>
          )}
          {listErr && !loading && (
            <Text style={{ color: t.colors.muted, marginBottom: 12 }}>{listErr}</Text>
          )}
          {!loading && !listErr && filtered.length === 0 && (
            <Text style={{ color: t.colors.muted }}>
              No clinics yet. This list depends on onboarding and approval in Vet CRM (not your schedule). You need an
              approved vet linked to a clinic that accepts consultations. On a phone, set EXPO_PUBLIC_API_URL to your
              computer&apos;s IP if the API runs locally. Pull down to refresh.
            </Text>
          )}
          {filtered.map((c) => {
            const img = c.primaryDoctor.photoUrl ?? FALLBACK_IMG;
            const spec = c.primaryDoctor.specializations[0] ?? c.primaryDoctor.displayTitle ?? 'Veterinarian';
            const distLabel =
              coords && c.latitude != null && c.longitude != null
                ? formatDistanceKm(haversineKm(coords, { latitude: c.latitude, longitude: c.longitude }))
                : null;
            return (
              <View
                key={c.id}
                style={[styles.vetCard, { backgroundColor: t.colors.background, borderColor: t.colors.border }]}
              >
                {c.is24_7 && (
                  <View style={[styles.badge24_7, { backgroundColor: '#dcfce7' }]}>
                    <Text style={styles.badge24_7Text}>24/7</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.vetCardTop}
                  onPress={() => router.push(`/find-vet/${c.id}`)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: img }} style={styles.vetImage} />
                  <View style={styles.vetCardBody}>
                    <Text style={[styles.vetName, { color: t.colors.foreground }]}>{c.name}</Text>
                    <Text style={[styles.vetClinic, { color: t.colors.muted }]}>{c.primaryDoctor.fullName}</Text>
                    <Text style={[styles.vetSpecialty, { color: accent }]}>{spec}</Text>
                    <View style={styles.vetMeta}>
                      <Ionicons name="star" size={14} color="#eab308" />
                      <Text style={[styles.vetRating, { color: t.colors.foreground }]}>
                        {c.rating} ({c.reviewCount})
                      </Text>
                      <Ionicons name="location" size={14} color={accent} style={{ marginLeft: 12 }} />
                      <Text style={[styles.vetDistance, { color: t.colors.muted }]} numberOfLines={1}>
                        {distLabel ?? c.city ?? c.pincode}
                      </Text>
                    </View>
                    <View style={styles.vetStatusRow}>
                      <Text style={[styles.vetStatus, { color: t.colors.success }]}>Open</Text>
                      <Text style={[styles.vetClosing, { color: t.colors.muted }]}>
                        {' '}
                        • {c.closingTimeLabel ?? 'See profile'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={[styles.vetCardActions, { borderTopColor: t.colors.border }]}>
                  <TouchableOpacity style={styles.vetActionBtn} onPress={() => {}} activeOpacity={0.8}>
                    <Ionicons name="call" size={18} color={accent} />
                    <Text style={[styles.vetActionText, { color: accent }]}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.vetActionBtn} onPress={() => {}} activeOpacity={0.8}>
                    <Ionicons name="chatbubble" size={18} color={accent} />
                    <Text style={[styles.vetActionText, { color: accent }]}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.vetActionPrimary, { backgroundColor: accent }]}
                    onPress={() => router.push(`/find-vet/${c.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vetActionPrimaryText}>Book Visit</Text>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputsWrap: { gap: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  locationText: { fontSize: 15, fontWeight: '500' },
  filtersScroll: { gap: 10, paddingBottom: 4 },
  filtersScrollWrap: { maxHeight: 44 },
  filterPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    marginRight: 8,
  },
  filterPillText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingTop: 16 },
  sectionHeader: { marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  vetCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  badge24_7: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 1,
  },
  badge24_7Text: { fontSize: 11, fontWeight: '700', color: '#166534' },
  vetCardTop: { flexDirection: 'row', marginBottom: 12 },
  vetImage: { width: 80, height: 80, borderRadius: 10 },
  vetCardBody: { flex: 1, marginLeft: 12 },
  vetName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  vetClinic: { fontSize: 13, marginBottom: 2 },
  vetSpecialty: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  vetMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vetRating: { fontSize: 13, fontWeight: '600' },
  vetDistance: { fontSize: 13 },
  vetStatusRow: { flexDirection: 'row', marginTop: 4 },
  vetStatus: { fontSize: 13, fontWeight: '600' },
  vetClosing: { fontSize: 13 },
  vetCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  vetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  vetActionText: { fontSize: 14, fontWeight: '600' },
  vetActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  vetActionPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
