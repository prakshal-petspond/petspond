import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { Ionicons } from '@expo/vector-icons';
import type { Pet, PublicClinicListItem } from '@petspond/types';
import { fetchVaccinationClinics } from '@/services/catalog';
import { fetchUserPets } from '@/services/pets';

const FALLBACK_V_IMG =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop';

const H_PAD = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const PET_CARD_W = Math.min(200, SCREEN_W * 0.42);

type VaccinationTab = 'history' | 'book';

export function VaccinationPage() {
  const t = useTheme();
  const router = useRouter();
  const { client, token } = useApi();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const cream = t.colors.cardBg ?? '#f5f0e8';

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [tab, setTab] = useState<VaccinationTab>('book');
  const [vClinics, setVClinics] = useState<PublicClinicListItem[]>([]);
  const [vLoading, setVLoading] = useState(true);
  const [vErr, setVErr] = useState<string | null>(null);

  const loadPets = useCallback(() => {
    if (!token) {
      setPets([]);
      setSelectedPetId(null);
      setPetsLoading(false);
      return;
    }
    setPetsLoading(true);
    fetchUserPets(client)
      .then((list) => {
        setPets(list);
        setSelectedPetId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      })
      .catch(() => {
        setPets([]);
        setSelectedPetId(null);
      })
      .finally(() => setPetsLoading(false));
  }, [client, token]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets]),
  );

  useEffect(() => {
    let c = false;
    setVLoading(true);
    fetchVaccinationClinics(client)
      .then((list) => {
        if (!c) setVClinics(list);
      })
      .catch(() => {
        if (!c) setVErr(getNetworkErrorHelp());
      })
      .finally(() => {
        if (!c) setVLoading(false);
      });
    return () => {
      c = true;
    };
  }, [client]);

  return (
    <View style={[styles.fill, { backgroundColor: cream }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: cream }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={t.colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.foreground }]}>Vaccination</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.fill}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.petStrip, { paddingHorizontal: H_PAD }]}
        >
          {petsLoading ? (
            <View style={{ paddingVertical: 20, paddingHorizontal: 8 }}>
              <ActivityIndicator size="small" color={accent} />
            </View>
          ) : pets.length === 0 ? (
            <TouchableOpacity
              style={[
                styles.petCard,
                {
                  width: PET_CARD_W,
                  backgroundColor: '#fff',
                  borderColor: t.colors.border,
                },
              ]}
              onPress={() => router.push('/add-pet')}
              activeOpacity={0.9}
            >
              <View style={[styles.petPhoto, { alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="add-circle-outline" size={28} color={accent} />
              </View>
              <Text style={[styles.petName, { color: t.colors.foreground }]}>Add pet</Text>
              <Text style={[styles.petBreed, { color: t.colors.muted }]} numberOfLines={2}>
                Add a pet to book vaccinations
              </Text>
            </TouchableOpacity>
          ) : (
            pets.map((pet) => {
              const selected = pet.id === selectedPetId;
              const img = pet.photoUrl ?? FALLBACK_V_IMG;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petCard,
                    {
                      width: PET_CARD_W,
                      backgroundColor: selected ? accent : '#fff',
                      borderColor: selected ? accent : t.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPetId(pet.id)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: img }} style={styles.petPhoto} />
                  <Text style={[styles.petName, { color: selected ? '#fff' : t.colors.foreground }]}>{pet.name}</Text>
                  <Text
                    style={[styles.petBreed, { color: selected ? 'rgba(255,255,255,0.9)' : t.colors.muted }]}
                    numberOfLines={1}
                  >
                    {pet.breed}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.summaryRow, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-circle" size={26} color="#16a34a" />
            <Text style={[styles.summaryLine, { color: '#166534' }]}>0 Vaccines done</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time-outline" size={26} color="#d97706" />
            <Text style={[styles.summaryLine, { color: '#92400e' }]}>4 Due this year</Text>
          </View>
        </View>

        <View style={[styles.tabShell, { backgroundColor: '#e7e5e4', marginHorizontal: H_PAD }]}>
          <TouchableOpacity
            style={[styles.tabHalf, tab === 'history' && styles.tabHalfActive]}
            onPress={() => setTab('history')}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, { color: tab === 'history' ? accent : t.colors.muted }]}>Vaccination History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabHalf, tab === 'book' && styles.tabHalfActive]}
            onPress={() => setTab('book')}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, { color: tab === 'book' ? accent : t.colors.muted }]}>Book Vaccination</Text>
          </TouchableOpacity>
        </View>

        {tab === 'history' && (
          <View style={[styles.emptyHistory, { paddingHorizontal: H_PAD }]}>
            <Ionicons name="document-text-outline" size={48} color={t.colors.muted} />
            <Text style={[styles.emptyTitle, { color: t.colors.foreground }]}>No records yet</Text>
            <Text style={[styles.emptySub, { color: t.colors.muted }]}>
              Completed vaccinations will appear here after your visits.
            </Text>
          </View>
        )}

        {tab === 'book' && (
          <>
            <Text style={[styles.sectionHeading, { color: t.colors.foreground, paddingHorizontal: H_PAD }]}>
              Available Services Near You
            </Text>
            <View style={{ paddingHorizontal: H_PAD, gap: 16 }}>
              {vLoading && (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={accent} />
                </View>
              )}
              {vErr && !vLoading && <Text style={{ color: t.colors.muted }}>{vErr}</Text>}
              {!vLoading && !vErr && vClinics.length === 0 && (
                <Text style={{ color: t.colors.muted }}>
                  No vaccination clinics yet. Add vaccines to your clinic profile in Vet CRM.
                </Text>
              )}
              {vClinics.map((clinic) => {
                const img = clinic.primaryDoctor.photoUrl ?? FALLBACK_V_IMG;
                const vax = clinic.vaccinesOffered.slice(0, 3).map((v) => v.name);
                const extra = Math.max(0, clinic.vaccinesOffered.length - 3);
                const priceInr =
                  clinic.lowestVaccinationPricePaise != null
                    ? Math.round(clinic.lowestVaccinationPricePaise / 100)
                    : '—';
                return (
                  <View
                    key={clinic.id}
                    style={[styles.clinicCard, { backgroundColor: '#fff', borderColor: t.colors.border }]}
                  >
                    <View style={styles.clinicTop}>
                      <Image source={{ uri: img }} style={styles.clinicImage} />
                      <View style={styles.clinicBody}>
                        <Text style={[styles.clinicName, { color: t.colors.foreground }]}>{clinic.name}</Text>
                        <View style={styles.clinicMeta}>
                          <Ionicons name="star" size={14} color="#eab308" />
                          <Text style={[styles.clinicRating, { color: t.colors.foreground }]}>
                            {clinic.rating} ({clinic.reviewCount})
                          </Text>
                        </View>
                        <View style={styles.clinicMeta}>
                          <Ionicons name="location-outline" size={14} color={accent} />
                          <Text style={[styles.clinicDistance, { color: t.colors.muted }]} numberOfLines={1}>
                            {clinic.city ?? clinic.pincode}
                          </Text>
                        </View>
                        <View style={styles.tagRow}>
                          {vax.map((v) => (
                            <View key={v} style={[styles.tag, { backgroundColor: cream }]}>
                              <Text style={[styles.tagText, { color: t.colors.foreground }]}>{v}</Text>
                            </View>
                          ))}
                          {extra > 0 && (
                            <View style={[styles.tag, { backgroundColor: cream }]}>
                              <Text style={[styles.tagText, { color: t.colors.muted }]}>+{extra}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.bookBtn, { backgroundColor: accent }]}
                      onPress={() =>
                        router.push({
                          pathname: '/vaccination/[clinicId]',
                          params: { clinicId: String(clinic.id) },
                        } as Href)
                      }
                      activeOpacity={0.9}
                    >
                      <Ionicons name="add" size={22} color="#fff" />
                      <Text style={styles.bookBtnText}>Book Vaccination</Text>
                      <Text style={styles.bookBtnPrice}>{typeof priceInr === 'number' ? `₹${priceInr}` : priceInr}</Text>
                      <Ionicons name="chevron-forward" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  petStrip: { gap: 12, paddingVertical: 8 },
  petCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginRight: 4,
  },
  petPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },
  petName: { fontSize: 17, fontWeight: '800' },
  petBreed: { fontSize: 13, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLine: { fontSize: 14, fontWeight: '700', flex: 1 },
  tabShell: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabHalf: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabHalfActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  sectionHeading: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  clinicCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clinicTop: { flexDirection: 'row', padding: 14, gap: 12 },
  clinicImage: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#e2e8f0' },
  clinicBody: { flex: 1, minWidth: 0 },
  clinicName: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  clinicMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  clinicRating: { fontSize: 13, fontWeight: '600' },
  clinicDistance: { fontSize: 13 },
  clinicSlots: { fontSize: 13, flex: 1, fontWeight: '500' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  tagText: { fontSize: 12, fontWeight: '600' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  bookBtnPrice: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
});
