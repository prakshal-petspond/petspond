import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import { getVetDetail } from '@/features/find-vet/vetData';
import { VACCINE_CATALOG, getVaccinationStartingPriceInr } from './vaccineBookingData';

const H_PAD = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 8;
const GALLERY_CELL = (SCREEN_W - H_PAD * 2 - GAP * 2) / 3;

type ClinicTab = 'about' | 'vaccines' | 'reviews' | 'gallery';

export function VaccinationClinicDetailPage() {
  const { vetId } = useLocalSearchParams<{ vetId: string }>();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const [tab, setTab] = useState<ClinicTab>('about');

  const vet = vetId ? getVetDetail(String(vetId)) : undefined;
  const startingPrice = getVaccinationStartingPriceInr();

  if (!vet) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.background }]}>
        <Text style={{ padding: H_PAD, color: t.colors.muted }}>Clinic not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.address)}`;
  const reviewSnippet = [
    { name: 'A. Sharma', stars: 5, text: 'Professional vaccination service, very gentle with our pup.' },
    { name: 'R. Mehta', stars: 5, text: 'Clean facility and clear instructions for aftercare.' },
  ];

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.heroWrap}>
          <Image source={{ uri: vet.heroImage }} style={styles.heroImage} />
          <View style={[styles.heroOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
            <View style={styles.heroTopRow}>
              <TouchableOpacity style={styles.heroCircleBtn} onPress={() => router.back()} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={22} color="#0f172a" />
              </TouchableOpacity>
              <View style={styles.heroRightBtns}>
                <TouchableOpacity style={styles.heroCircleBtn} activeOpacity={0.85}>
                  <Ionicons name="share-outline" size={20} color="#0f172a" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroCircleBtn} activeOpacity={0.85}>
                  <Ionicons name="heart-outline" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.badgeRow}>
              {(['Verified', 'Licensed', 'Available Today'] as const).map((label) => (
                <View key={label} style={[styles.heroBadge, { backgroundColor: t.colors.success }]}>
                  <Text style={styles.heroBadgeText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: H_PAD, paddingTop: 16 }}>
          <Text style={[styles.clinicTitle, { color: t.colors.foreground }]}>{vet.clinic}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#eab308" />
            <Text style={[styles.ratingText, { color: t.colors.foreground }]}>
              {vet.rating} ({vet.reviewCount} reviews)
            </Text>
          </View>
          <View style={styles.tagRow}>
            {['Certified Vet', 'Licensed Clinic', '5000+ Vaccinations'].map((label) => (
              <View key={label} style={[styles.metaTag, { backgroundColor: t.colors.cardBg }]}>
                <Text style={[styles.metaTagText, { color: t.colors.foreground }]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: t.colors.accentLight }]}
              onPress={() => Linking.openURL('tel:+911800000000')}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={18} color={accent} />
              <Text style={[styles.actionPillText, { color: accent }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: t.colors.accentLight }]}
              onPress={() => Linking.openURL('sms:+911800000000')}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={18} color={accent} />
              <Text style={[styles.actionPillText, { color: accent }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: t.colors.accentLight }]}
              onPress={() => Linking.openURL(mapsUrl)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate-outline" size={18} color={accent} />
              <Text style={[styles.actionPillText, { color: accent }]}>Directions</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tabsRow, { borderBottomColor: t.colors.border }]}>
            {(
              [
                ['about', 'About'],
                ['vaccines', 'Vaccines'],
                ['reviews', 'Reviews'],
                ['gallery', 'Gallery'],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id;
              return (
                <TouchableOpacity key={id} style={styles.tabBtn} onPress={() => setTab(id)} activeOpacity={0.8}>
                  <Text style={[styles.tabLabel, { color: active ? accent : t.colors.muted }]}>{label}</Text>
                  {active && <View style={[styles.tabUnderline, { backgroundColor: accent }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === 'about' && (
            <View style={{ paddingBottom: 12 }}>
              <Text style={[styles.blockTitle, { color: t.colors.foreground }]}>About Clinic</Text>
              <Text style={[styles.bodyText, { color: t.colors.muted }]}>
                {vet.clinic} provides comprehensive pet vaccination programs, wellness checks, and preventive care. Our
                team follows national guidelines and maintains cold-chain storage for all vaccines.
              </Text>
              <Text style={[styles.blockTitle, { color: t.colors.foreground, marginTop: 16 }]}>Address</Text>
              <Text style={[styles.bodyText, { color: t.colors.foreground }]}>{vet.address}</Text>
              <Text style={[styles.blockTitle, { color: t.colors.foreground, marginTop: 16 }]}>Experience</Text>
              <Text style={[styles.bodyText, { color: t.colors.foreground }]}>15 years</Text>
              <Text style={[styles.blockTitle, { color: t.colors.foreground, marginTop: 16 }]}>Languages</Text>
              <Text style={[styles.bodyText, { color: t.colors.foreground }]}>English, Hindi</Text>
            </View>
          )}

          {tab === 'vaccines' && (
            <View style={{ gap: 12, paddingBottom: 12 }}>
              {VACCINE_CATALOG.map((v) => (
                <View key={v.id} style={[styles.vaccineRow, { borderColor: t.colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vaccineName, { color: t.colors.foreground }]}>
                      {v.name}
                      {v.mandatory ? (
                        <Text style={{ color: accent, fontWeight: '700' }}> · Mandatory</Text>
                      ) : null}
                    </Text>
                    <Text style={[styles.vaccineMeta, { color: t.colors.muted }]}>
                      {v.durationMins} mins · Valid {v.validityLabel}
                    </Text>
                  </View>
                  <Text style={[styles.vaccinePrice, { color: accent }]}>₹{v.priceInr}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'reviews' && (
            <View style={{ gap: 14, paddingBottom: 12 }}>
              {reviewSnippet.map((r, i) => (
                <View key={i} style={[styles.reviewCard, { borderColor: t.colors.border }]}>
                  <Text style={[styles.reviewName, { color: t.colors.foreground }]}>{r.name}</Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <Ionicons key={j} name="star" size={14} color="#eab308" />
                    ))}
                  </View>
                  <Text style={[styles.reviewText, { color: t.colors.muted }]}>{r.text}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'gallery' && (
            <View style={[styles.galleryGrid, { paddingBottom: 12 }]}>
              {vet.photos.slice(0, 6).map((uri, i) => (
                <Image key={i} source={{ uri }} style={[styles.galleryCell, { width: GALLERY_CELL, height: GALLERY_CELL }]} />
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopColor: t.colors.border,
            backgroundColor: t.colors.background,
          },
        ]}
      >
        <Text style={[styles.footerPrice, { color: t.colors.muted }]}>Starting from ₹{startingPrice}</Text>
        <TouchableOpacity
          style={[styles.bookCta, { backgroundColor: accent }]}
          onPress={() =>
            router.push({
              pathname: '/vaccination/[vetId]/book',
              params: { vetId: String(vet.id) },
            } as Href)
          }
          activeOpacity={0.9}
        >
          <Text style={styles.bookCtaText}>Book Vaccination</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heroWrap: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: 220 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
  },
  heroRightBtns: { flexDirection: 'row', gap: 10 },
  heroCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: H_PAD, marginBottom: 12 },
  heroBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  clinicTitle: { fontSize: 22, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingText: { fontSize: 15, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  metaTagText: { fontSize: 12, fontWeight: '600' },
  actionBar: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionPillText: { fontSize: 13, fontWeight: '700' },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, height: 3, width: '50%', borderRadius: 2 },
  blockTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  bodyText: { fontSize: 15, lineHeight: 22 },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  vaccineName: { fontSize: 15, fontWeight: '700' },
  vaccineMeta: { fontSize: 13, marginTop: 4 },
  vaccinePrice: { fontSize: 16, fontWeight: '800' },
  reviewCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  reviewName: { fontSize: 15, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewText: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  galleryCell: { borderRadius: 10 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerPrice: { fontSize: 13, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  bookCtaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
