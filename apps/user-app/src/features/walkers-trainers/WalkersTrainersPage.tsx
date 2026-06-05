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
import { type WalkerProfessional, type WalkerRole } from './walkersData';
import { fetchPublicVendors } from '@/services/vendors';
import { vendorToWalkerProfessional } from '@/lib/vendorMappers';

const H_PAD = 16;

type FilterId = 'all' | WalkerRole;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'walking', label: 'Walkers' },
  { id: 'training', label: 'Trainers' },
  { id: 'both', label: 'Both' },
];

function roleBadgeStyle(role: WalkerRole): { bg: string; text: string; label: string } {
  switch (role) {
    case 'walking':
      return { bg: '#dbeafe', text: '#1d4ed8', label: 'Walking' };
    case 'training':
      return { bg: '#ffedd5', text: '#c2410c', label: 'Training' };
    case 'both':
      return { bg: '#ede9fe', text: '#6d28d9', label: 'Both' };
  }
}

export function WalkersTrainersPage() {
  const t = useTheme();
  const router = useRouter();
  const { client } = useApi();
  const {
    addressLine: locationAddress,
    loading: locationLoading,
    refresh: refreshLocation,
    coords,
  } = useLocation();
  const [professionals, setProfessionals] = useState<WalkerProfessional[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const loadVendors = useCallback(async () => {
    if (!coords) {
      setProfessionals([]);
      return;
    }
    setListLoading(true);
    try {
      const list = await fetchPublicVendors(client, {
        lat: coords.latitude,
        lng: coords.longitude,
      });
      setProfessionals(
        list
          .filter((v) => v.serviceTypes.includes('walking') || v.serviceTypes.includes('training'))
          .map(vendorToWalkerProfessional),
      );
    } catch {
      setProfessionals([]);
    } finally {
      setListLoading(false);
    }
  }, [client, coords]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent;
  const headerBg = '#f5f0e8';

  const [filter, setFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const locationDisplay = locationLoading
    ? 'Getting location…'
    : (locationAddress ?? 'Your location').split(',').slice(0, 2).join(',').trim() ||
      'Vasundhara sec 5';

  const filtered = useMemo(() => {
    let list = professionals;
    if (filter !== 'all') {
      list = list.filter((p) => p.role === filter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [professionals, filter, searchQuery]);

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.solid_white }]}>
      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top }]}>
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.colors.text_primary }]}>
            Walkers & Trainers
          </Text>
        </View>

        <View style={[styles.inputsWrap, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.searchWrap, { backgroundColor: t.colors.solid_white }]}>
            <Ionicons name="search" size={20} color={t.colors.text_secondary} />
            <TextInput
              style={[styles.searchInput, { color: t.colors.text_primary }]}
              placeholder="Search by name or service..."
              placeholderTextColor={t.colors.text_secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.locationWrap, { backgroundColor: t.colors.solid_white }]}
            onPress={() => {
              refreshLocation().then(() => loadVendors());
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={18} color={accent} />
            <Text style={[styles.locationText, { color: t.colors.text_primary }]} numberOfLines={1}>
              {locationDisplay}
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
            const selected = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  { backgroundColor: selected ? accent : t.colors.solid_white },
                ]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: selected ? '#fff' : t.colors.text_secondary },
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
      >
        <View style={[styles.resultsLine, { paddingHorizontal: H_PAD }]}>
          <Text style={[styles.resultsText, { color: t.colors.text_secondary }]}>
            Found{' '}
            <Text style={{ fontWeight: '800', color: t.colors.text_primary }}>
              {filtered.length}
            </Text>{' '}
            <Text style={{ fontWeight: '800', color: t.colors.text_primary }}>professionals</Text>{' '}
            near you
          </Text>
        </View>

        <View style={{ paddingHorizontal: H_PAD, gap: 14 }}>
          {listLoading ? (
            <Text style={{ color: t.colors.text_secondary }}>Loading professionals…</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: t.colors.text_secondary }}>
              No walkers or trainers in your area yet. Try again after vendors go live nearby.
            </Text>
          ) : null}
          {filtered.map((p) => {
            const badge = roleBadgeStyle(p.role);
            return (
              <View
                key={p.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: t.colors.solid_white,
                    borderColor: t.colors.inactive_bg_alpha,
                  },
                ]}
              >
                <View style={styles.cardInner}>
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: p.image }} style={styles.cardImage} />
                    <View style={[styles.verifiedBadge, { backgroundColor: t.colors.success }]}>
                      <Ionicons name="medal" size={14} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={[styles.rolePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.rolePillText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text style={[styles.proName, { color: t.colors.text_primary }]}>{p.name}</Text>
                    <Text style={[styles.proTitle, { color: t.colors.text_secondary }]}>
                      {p.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="star" size={14} color={accent} />
                      <Text style={[styles.metaText, { color: t.colors.text_primary }]}>
                        {p.rating} ({p.reviewCount})
                      </Text>
                      <Ionicons
                        name="location"
                        size={14}
                        color={accent}
                        style={{ marginLeft: 10 }}
                      />
                      <Text style={[styles.metaText, { color: t.colors.text_secondary }]}>
                        {p.distance}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="person-outline" size={14} color={t.colors.text_secondary} />
                      <Text style={[styles.metaSmall, { color: t.colors.text_secondary }]}>
                        {p.yearsExp} years exp
                      </Text>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={t.colors.success}
                        style={{ marginLeft: 12 }}
                      />
                      <Text style={[styles.metaSmall, { color: t.colors.success }]}>
                        {p.availabilityLabel === 'today' ? 'Available Today' : 'Available Tomorrow'}
                      </Text>
                    </View>
                    <View style={styles.tagRow}>
                      {p.tags.map((tag) => (
                        <View
                          key={tag}
                          style={[styles.tag, { backgroundColor: t.colors.primary_light }]}
                        >
                          <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
                        </View>
                      ))}
                      {p.extraTagCount > 0 && (
                        <View style={[styles.tag, { backgroundColor: t.colors.primary_light }]}>
                          <Text style={[styles.tagText, { color: t.colors.text_secondary }]}>
                            +{p.extraTagCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.ctaBar, { backgroundColor: accent }]}
                  onPress={() =>
                    router.push({
                      pathname: '/walkers-trainers/[id]',
                      params: { id: p.id },
                    } as Href)
                  }
                  activeOpacity={0.9}
                >
                  <Ionicons name="paw" size={20} color="#fff" />
                  <Text style={styles.ctaLabel}>{p.ctaLabel}</Text>
                  <Text style={styles.ctaPrice}>{p.priceLine}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', flex: 1 },
  inputsWrap: { gap: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 9999,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 9999,
    paddingHorizontal: 16,
    gap: 8,
  },
  locationText: { flex: 1, fontSize: 15, fontWeight: '600' },
  filtersScroll: { gap: 10, paddingBottom: 4 },
  filtersScrollWrap: { maxHeight: 44 },
  filterPill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
    marginRight: 8,
  },
  filterPillText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingTop: 14 },
  resultsLine: { marginBottom: 14 },
  resultsText: { fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: { flexDirection: 'row', padding: 14, gap: 12 },
  imageWrap: { position: 'relative' },
  cardImage: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#e2e8f0' },
  verifiedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  rolePillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  proName: { fontSize: 17, fontWeight: '800' },
  proTitle: { fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  metaText: { fontSize: 13, fontWeight: '600' },
  metaSmall: { fontSize: 12, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '600' },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  ctaLabel: { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1 },
  ctaPrice: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
