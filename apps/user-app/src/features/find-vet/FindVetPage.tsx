import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { PublicClinicListItem } from '@petspond/types';
import { useApi, useTheme } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { fetchConsultationClinics } from '@/services/catalog';
import { formatDistanceKm, haversineKm } from '@/lib/geo';
import { resolvePhotoUrl } from '@/lib/photoUrl';

const H_PAD = 16;

type CategoryId = 'all' | 'consultation' | 'vaccination';
type SubFilterId = 'all' | 'nearest' | 'topRated' | 'available24_7';

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'All Services' },
  { id: 'consultation', label: 'Consultation' },
  { id: 'vaccination', label: 'Vaccination' },
];

const SUB_FILTERS: { id: SubFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'topRated', label: 'Top Rated' },
  { id: 'available24_7', label: '24/7' },
];

function clinicPhotoUri(c: PublicClinicListItem): string | null {
  return resolvePhotoUrl(c.primaryDoctor.photoUrl);
}

function matchesSearch(c: PublicClinicListItem, q: string): boolean {
  const hay = [
    c.name,
    c.primaryDoctor.fullName,
    c.address,
    c.city ?? '',
    ...c.primaryDoctor.specializations,
    c.primaryDoctor.displayTitle ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function openStatusLabel(c: PublicClinicListItem): { open: string; closing: string } {
  if (c.is24_7) return { open: 'Open 24/7', closing: '' };
  return { open: 'Open', closing: c.closingTimeLabel ?? 'See hours' };
}

export function FindVetPage() {
  const t = useTheme();
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { client } = useApi();
  const insets = useSafeAreaInsets();
  const primary = t.colors.primary;

  const userCoords = useMemo(() => {
    if (!lat || !lng) return null;
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }, [lat, lng]);

  const [category, setCategory] = useState<CategoryId>('all');
  const [subFilter, setSubFilter] = useState<SubFilterId>('all');
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

  const locationLine = useMemo(() => {
    const first = clinics[0];
    if (!first) return 'Near you';
    if (first.city?.trim()) return first.city.trim();
    if (first.address?.trim()) return first.address.trim();
    return 'Near you';
  }, [clinics]);

  const filtered = useMemo(() => {
    let list = [...clinics];

    if (category === 'consultation') {
      list = list.filter((c) => c.acceptsConsultations);
    } else if (category === 'vaccination') {
      list = list.filter((c) => c.acceptsVaccinations);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((c) => matchesSearch(c, q));

    if (subFilter === 'available24_7') list = list.filter((c) => c.is24_7);
    if (subFilter === 'topRated') list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    if (subFilter === 'nearest' && userCoords) {
      list.sort((a, b) => {
        const da =
          a.latitude != null && a.longitude != null
            ? haversineKm(userCoords, { latitude: a.latitude, longitude: a.longitude })
            : Number.POSITIVE_INFINITY;
        const db =
          b.latitude != null && b.longitude != null
            ? haversineKm(userCoords, { latitude: b.latitude, longitude: b.longitude })
            : Number.POSITIVE_INFINITY;
        return da - db;
      });
    } else if (subFilter === 'nearest') {
      list.sort((a, b) => (a.distanceLabel ?? '').localeCompare(b.distanceLabel ?? ''));
    }

    return list;
  }, [clinics, category, searchQuery, subFilter, userCoords]);

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.grey_bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: t.colors.solid_white, paddingTop: insets.top + 8 },
        ]}
      >
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <Pressable
            style={[styles.iconCircle, { backgroundColor: t.colors.grey_bg }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: t.colors.text_primary }]}>
              Veterinary Care
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={primary} />
              <Text style={[styles.locationText, { color: t.colors.text_secondary }]} numberOfLines={1}>
                {locationLine}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.iconCircle, { backgroundColor: t.colors.grey_bg }]}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <Ionicons name="options-outline" size={22} color={t.colors.text_primary} />
          </Pressable>
        </View>

        <View style={[styles.searchWrap, { marginHorizontal: H_PAD, backgroundColor: t.colors.grey_bg }]}>
          <Ionicons name="search" size={20} color={t.colors.text_secondary} />
          <TextInput
            style={[styles.searchInput, { color: t.colors.text_primary }]}
            placeholder="Search vets, clinics, specialty…"
            placeholderTextColor={t.colors.text_secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillRow, { paddingHorizontal: H_PAD }]}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: active ? primary : t.colors.grey_bg,
                    borderColor: active ? primary : t.colors.border,
                  },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: active ? t.colors.solid_white : t.colors.text_primary },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillRow, { paddingHorizontal: H_PAD, paddingBottom: 12 }]}
        >
          {SUB_FILTERS.map((f) => {
            const active = subFilter === f.id;
            return (
              <Pressable
                key={f.id}
                style={[
                  styles.subPill,
                  {
                    backgroundColor: active ? t.colors.primary_bg : t.colors.solid_white,
                    borderColor: active ? primary : t.colors.border,
                  },
                ]}
                onPress={() => setSubFilter(f.id)}
              >
                <Text
                  style={[
                    styles.subPillText,
                    { color: active ? primary : t.colors.text_secondary },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: H_PAD }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        <Text style={[styles.foundLabel, { color: t.colors.text_secondary }]}>
          Found {filtered.length} provider{filtered.length === 1 ? '' : 's'} near you
        </Text>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        )}

        {listErr && !loading && (
          <Text style={[styles.emptyText, { color: t.colors.text_secondary }]}>{listErr}</Text>
        )}

        {!loading && !listErr && filtered.length === 0 && (
          <Text style={[styles.emptyText, { color: t.colors.text_secondary }]}>
            No veterinary providers match your search. Pull down to refresh.
          </Text>
        )}

        {filtered.map((c) => {
          const photo = clinicPhotoUri(c);
          const spec = c.primaryDoctor.specializations[0] ?? c.primaryDoctor.displayTitle;
          const status = openStatusLabel(c);
          const distLabel =
            userCoords && c.latitude != null && c.longitude != null
              ? formatDistanceKm(
                  haversineKm(userCoords, { latitude: c.latitude, longitude: c.longitude }),
                )
              : c.distanceLabel?.trim() || null;

          return (
            <View
              key={c.id}
              style={[
                styles.card,
                { backgroundColor: t.colors.solid_white, borderColor: t.colors.border },
              ]}
            >
              <Pressable
                style={styles.cardMain}
                onPress={() => router.push(`/find-vet/${c.id}`)}
              >
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.imagePlaceholder, { backgroundColor: t.colors.grey_bg }]}>
                    <MaterialCommunityIcons name="hospital-building" size={32} color={t.colors.text_secondary} />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardName, { color: t.colors.text_primary }]} numberOfLines={2}>
                      {c.name}
                    </Text>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: c.is24_7 ? t.colors.success_alpha : t.colors.primary_bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: c.is24_7 ? t.colors.success : primary },
                        ]}
                      >
                        {c.is24_7 ? '24/7' : 'Vet'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.doctorLine, { color: t.colors.text_secondary }]} numberOfLines={1}>
                    {c.primaryDoctor.fullName}
                  </Text>

                  {spec ? (
                    <View style={[styles.specTag, { backgroundColor: t.colors.grey_bg }]}>
                      <Text style={[styles.specTagText, { color: primary }]} numberOfLines={1}>
                        {spec}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Ionicons name="star" size={14} color="#EAB308" />
                    <Text style={[styles.ratingText, { color: t.colors.text_primary }]}>
                      {c.rating} ({c.reviewCount})
                    </Text>
                    {distLabel ? (
                      <>
                        <Text style={[styles.metaDot, { color: t.colors.text_secondary }]}>·</Text>
                        <Ionicons name="navigate-outline" size={13} color={primary} />
                        <Text style={[styles.distText, { color: t.colors.text_secondary }]}>
                          {distLabel}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  <Text style={styles.statusLine} numberOfLines={1}>
                    <Text style={{ color: t.colors.success, fontWeight: '600' }}>{status.open}</Text>
                    {status.closing ? (
                      <Text style={{ color: t.colors.text_secondary }}> · {status.closing}</Text>
                    ) : null}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.bookBtn, { backgroundColor: primary }]}
                onPress={() => router.push(`/find-vet/${c.id}`)}
              >
                <Text style={styles.bookBtnText}>Book Visit</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </Pressable>
            </View>
          );
        })}

        <View style={{ height: Math.max(insets.bottom, 16) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF0F3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 13, flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  pillRow: { gap: 8, paddingBottom: 8 },
  categoryPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 4,
  },
  categoryPillText: { fontSize: 14, fontWeight: '600' },
  subPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 4,
  },
  subPillText: { fontSize: 13, fontWeight: '600' },
  scrollContent: { paddingTop: 16 },
  foundLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  centered: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', padding: 14, gap: 12 },
  cardImage: { width: 88, height: 88, borderRadius: 12 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardName: { flex: 1, fontSize: 16, fontWeight: '700' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  doctorLine: { fontSize: 13, marginTop: 4 },
  specTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specTagText: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingText: { fontSize: 13, fontWeight: '600' },
  metaDot: { marginHorizontal: 2 },
  distText: { fontSize: 12 },
  statusLine: { fontSize: 12, marginTop: 4 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
