import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme, useLocation, useApi } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import type { Pet } from '@petspond/types';
import { fetchUserPets } from '@/services/pets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CATEGORY_SIZE = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP * 3) / 4;
const SERVICE_CARD_WIDTH = SCREEN_WIDTH * 0.45;

// Dummy data (location comes from device via useLocation)

const PROMO_BANNER = {
  title: 'PAWS & WHISKERS VET CLINIC',
  subtitle: 'COMPASSIONATE CARE FOR YOUR PETS',
  contact: 'OPEN | 555-0123 | www.pwvetclinic.com',
};

const REMINDER_CTA = 'Book now';

const CATEGORIES = [
  { id: '1', label: 'Grooming', icon: 'cut-outline' as const },
  { id: '2', label: 'Walker & Trainer', icon: 'paw-outline' as const },
  { id: '3', label: 'Find A Vet', icon: 'medkit-outline' as const },
  { id: '4', label: 'Vaccine', icon: 'medical-outline' as const },
];

const WALKERS = [
  { id: '1', name: 'Happy paws studio', rating: 4.7, distance: '1.2 kms', promo: '50% Off on your first booking', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop' },
  { id: '2', name: 'Pawfect walks', rating: 4.9, distance: '2.1 kms', promo: 'First walk free', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop' },
  { id: '3', name: 'Tail wagers', rating: 4.5, distance: '0.8 kms', promo: '20% Off', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop' },
];

const GROOMERS = [
  { id: '1', name: 'Happy paws studio', rating: 4.7, distance: '1.2 kms', promo: '50% Off on your first booking', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop' },
  { id: '2', name: 'Fluffy & clean', rating: 4.8, distance: '1.5 kms', promo: 'Free nail trim', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop' },
];

const FALLBACK_PET_IMG =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop';

export function LandingPage() {
  const router = useRouter();
  const t = useTheme();
  const { client } = useApi();
  const { addressLine: locationAddress, loading: locationLoading, refresh: refreshLocation } = useLocation();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const accentLight = t.colors.accentLight ?? '#fed7aa';
  const cardBg = t.colors.cardBg ?? '#f5f0e8';

  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [petModalVisible, setPetModalVisible] = useState(false);

  const loadPets = useCallback(() => {
    setPetsLoading(true);
    fetchUserPets(client)
      .then((list) => {
        setPets(list);
        setSelectedPetId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      })
      .catch(() => setPets([]))
      .finally(() => setPetsLoading(false));
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets]),
  );
  const [pillLayout, setPillLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const pillRef = useRef<{ measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null>(null);

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;

  const openPetModal = () => {
    pillRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setPillLayout({ x, y, width, height });
      setPetModalVisible(true);
    });
  };

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <Modal
        visible={petModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPetModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPetModalVisible(false)}>
          {pillLayout && (
            <Pressable
              style={[
                styles.petModal,
                { backgroundColor: t.colors.background },
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
              <Text style={[styles.petModalEmpty, { color: t.colors.muted }]}>Loading pets…</Text>
            ) : pets.length === 0 ? (
              <Text style={[styles.petModalEmpty, { color: t.colors.muted, paddingHorizontal: 16 }]}>
                No pets yet. Add one to personalize reminders and booking.
              </Text>
            ) : (
              pets.map((pet) => {
                const isSelected = pet.id === selectedPetId;
                const img = pet.photoUrl ?? FALLBACK_PET_IMG;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petModalRow,
                      isSelected && { backgroundColor: accentLight },
                    ]}
                    onPress={() => {
                      setSelectedPetId(pet.id);
                      setPetModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: img }} style={styles.petModalAvatar} />
                    <View style={styles.petModalTextWrap}>
                      <Text style={[styles.petModalName, { color: t.colors.foreground }]}>{pet.name}</Text>
                      <Text style={[styles.petModalBreed, { color: t.colors.muted }]}>{pet.breed}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={accent} />}
                  </TouchableOpacity>
                );
              })
            )}
            <View style={[styles.petModalDivider, { backgroundColor: t.colors.border }]} />
            <TouchableOpacity
              style={styles.petModalAdd}
              onPress={() => {
                setPetModalVisible(false);
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
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
        <TouchableOpacity style={styles.headerLeft} activeOpacity={0.8} onPress={() => refreshLocation()}>
          <View style={[styles.locationIconWrap, { backgroundColor: accentLight }]}>
            <Ionicons name="location" size={18} color={accent} />
          </View>
          <View>
            <Text style={[styles.deliverTo, { color: accent }]}>DELIVER TO</Text>
            <View style={styles.locationRow}>
              <Text style={[styles.locationText, { color: t.colors.foreground }]} numberOfLines={1}>
                {locationLoading ? 'Getting location…' : (locationAddress ?? 'Your location')}
              </Text>
              <Ionicons name="chevron-down" size={16} color={t.colors.foreground} />
            </View>
          </View>
        </TouchableOpacity>
        <View ref={pillRef} collapsable={false}>
          <TouchableOpacity
            style={[styles.petPill, { backgroundColor: accentLight }]}
            onPress={openPetModal}
            activeOpacity={0.8}
          >
            {petsLoading ? (
              <Text style={[styles.petName, { color: t.colors.muted }]}>…</Text>
            ) : selectedPet ? (
              <>
                <Text style={[styles.petName, { color: t.colors.foreground }]} numberOfLines={1}>
                  {selectedPet.name.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={14} color={t.colors.foreground} />
                <Image
                  source={{ uri: selectedPet.photoUrl ?? FALLBACK_PET_IMG }}
                  style={styles.petAvatar}
                />
              </>
            ) : (
              <>
                <Text style={[styles.petName, { color: t.colors.foreground }]}>Add pet</Text>
                <Ionicons name="chevron-down" size={14} color={t.colors.foreground} />
                <View style={[styles.petAvatar, { backgroundColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="paw" size={16} color={t.colors.muted} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Promo Banner */}
      <View style={[styles.bannerWrap, { paddingHorizontal: H_PAD }]}>
        <View style={[styles.banner, { backgroundColor: cardBg, borderRadius: t.borderRadius.lg }]}>
          <View style={[styles.bannerOverlay, { borderRadius: t.borderRadius.lg }]}>
            <View style={[styles.bannerLogo, { backgroundColor: t.colors.primary }]}>
              <Ionicons name="paw" size={28} color="#fff" />
              <View style={styles.bannerLogoCross} />
            </View>
            <Text style={[styles.bannerTitle, { color: t.colors.foreground }]}>{PROMO_BANNER.title}</Text>
            <Text style={[styles.bannerSubtitle, { color: t.colors.muted }]}>{PROMO_BANNER.subtitle}</Text>
            <Text style={[styles.bannerContact, { color: t.colors.muted }]}>{PROMO_BANNER.contact}</Text>
          </View>
        </View>
      </View>

      {/* Notification bar */}
      <View style={[styles.notifBar, { paddingHorizontal: H_PAD }]}>
        <View style={[styles.notifInner, { backgroundColor: t.colors.border, borderRadius: t.borderRadius.lg }]}>
          <View style={[styles.notifIconWrap, { backgroundColor: t.colors.error }]}>
            <Ionicons name="notifications" size={18} color="#fff" />
          </View>
          <Text style={[styles.notifText, { color: t.colors.foreground }]} numberOfLines={1}>
            {selectedPet
              ? `${selectedPet.name}'s vaccinations — check due dates`
              : 'Add a pet to track vaccination reminders'}
          </Text>
          <TouchableOpacity
            style={[styles.notifCta, { backgroundColor: t.colors.primary, borderRadius: t.borderRadius.md }]}
            activeOpacity={0.8}
            onPress={() => router.push('/vaccination')}
          >
            <Text style={styles.notifCtaText}>{REMINDER_CTA}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category grid — single Pressable/TouchableOpacity per tile so the full card receives taps */}
      <View style={[styles.categoriesWrap, { paddingHorizontal: H_PAD }]}>
        {CATEGORIES.map((cat) => {
          const isWalkerTrainer = cat.id === '2';
          const isFindVet = cat.id === '3';
          const isVaccine = cat.id === '4';
          const cardStyle = [
            styles.categoryCard,
            {
              backgroundColor: cardBg,
              borderRadius: t.borderRadius.lg,
              width: CATEGORY_SIZE,
              minHeight: CATEGORY_SIZE + 24,
            },
          ];
          const cardContent = (
            <>
              <View style={[styles.categoryIconCircle, { backgroundColor: t.colors.background }]}>
                <Ionicons name={cat.icon} size={24} color="#78350f" />
              </View>
              <Text style={[styles.categoryLabel, { color: t.colors.foreground }]} numberOfLines={2}>
                {cat.label}
              </Text>
            </>
          );
          const onPress =
            isWalkerTrainer ? () => router.push('/walkers-trainers' as const)
            : isFindVet ? () => router.push('/find-vet' as const)
            : isVaccine ? () => router.push('/vaccination' as const)
            : undefined;
          return (
            <TouchableOpacity
              key={cat.id}
              style={cardStyle}
              onPress={onPress}
              activeOpacity={onPress ? 0.8 : 1}
              disabled={!onPress}
            >
              {cardContent}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Top Rated Walkers & Trainers */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.sectionHeader, { paddingHorizontal: H_PAD }]}
          onPress={() => router.push('/walkers-trainers')}
          activeOpacity={0.85}
        >
          <Text style={[styles.sectionLabelSmall, { color: accent }]}>Top Rated</Text>
          <Text style={[styles.sectionTitle, { color: t.colors.foreground }]}>Walkers & Trainers</Text>
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.hScrollContent, { paddingLeft: H_PAD }]}
        >
          {WALKERS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.serviceCard, { marginRight: CARD_GAP, borderRadius: t.borderRadius.lg }]}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.image }} style={[styles.serviceCardImage, { borderRadius: t.borderRadius.lg }]} />
              <View style={[styles.serviceCardPromo, { backgroundColor: accentLight }]}>
                <Text style={[styles.serviceCardPromoText, { color: accent }]} numberOfLines={1}>{item.promo}</Text>
              </View>
              <View style={styles.serviceCardBody}>
                <Text style={[styles.serviceCardName, { color: t.colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.serviceCardMeta}>
                  <Ionicons name="star" size={14} color="#eab308" />
                  <Text style={[styles.serviceCardRating, { color: t.colors.foreground }]}>{item.rating}</Text>
                  <Text style={[styles.serviceCardDistance, { color: t.colors.muted }]}>{item.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Top Rated Groomers */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { paddingHorizontal: H_PAD }]}>
          <Text style={[styles.sectionLabelSmall, { color: accent }]}>Top Rated</Text>
          <Text style={[styles.sectionTitle, { color: t.colors.foreground }]}>Groomers</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.hScrollContent, { paddingLeft: H_PAD }]}
        >
          {GROOMERS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.serviceCard, { marginRight: CARD_GAP, borderRadius: t.borderRadius.lg }]}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.image }} style={[styles.serviceCardImage, { borderRadius: t.borderRadius.lg }]} />
              <View style={[styles.serviceCardPromo, { backgroundColor: accentLight }]}>
                <Text style={[styles.serviceCardPromoText, { color: accent }]} numberOfLines={1}>{item.promo}</Text>
              </View>
              <View style={styles.serviceCardBody}>
                <Text style={[styles.serviceCardName, { color: t.colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.serviceCardMeta}>
                  <Ionicons name="star" size={14} color="#eab308" />
                  <Text style={[styles.serviceCardRating, { color: t.colors.foreground }]}>{item.rating}</Text>
                  <Text style={[styles.serviceCardDistance, { color: t.colors.muted }]}>{item.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
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
  deliverTo: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 15, fontWeight: '600' },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 9999,
    gap: 4,
  },
  petName: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  petAvatar: { width: 28, height: 28, borderRadius: 14 },
  bannerWrap: { marginBottom: 12 },
  banner: { overflow: 'hidden', minHeight: 140 },
  bannerOverlay: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    minHeight: 140,
  },
  bannerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bannerLogoCross: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  bannerSubtitle: { fontSize: 12, marginBottom: 4 },
  bannerContact: { fontSize: 11 },
  notifBar: { marginBottom: 20 },
  notifInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionLabelSmall: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  hScrollContent: { paddingRight: H_PAD },
  serviceCard: { width: SERVICE_CARD_WIDTH, overflow: 'hidden' },
  serviceCardImage: { width: SERVICE_CARD_WIDTH, height: 120, backgroundColor: '#e2e8f0' },
  serviceCardPromo: { paddingVertical: 6, paddingHorizontal: 8 },
  serviceCardPromoText: { fontSize: 11, fontWeight: '600' },
  serviceCardBody: { paddingTop: 8, paddingHorizontal: 4 },
  serviceCardName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  serviceCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceCardRating: { fontSize: 13, fontWeight: '600' },
  serviceCardDistance: { fontSize: 12, marginLeft: 'auto' },
});
