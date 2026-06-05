import React, { useEffect, useState } from 'react';
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
import { useTheme, useApi, useLocation } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import {
  getWalkerProfile,
  getWalkerStartingPrice,
  type WalkerCertification,
  type WalkerProfile,
} from './walkersData';
import { fetchPublicVendorDetail } from '@/services/vendors';
import { vendorDetailToWalkerProfile } from '@/lib/vendorMappers';

const H_PAD = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 8;
const GALLERY_CELL = (SCREEN_W - H_PAD * 2 - GAP * 2) / 3;

type TabId = 'about' | 'services' | 'reviews' | 'gallery';

function CertIcon({ c }: { c: WalkerCertification }) {
  return <Ionicons name={c.icon} size={16} color="#166534" />;
}

export function WalkerTrainerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent;
  const { client } = useApi();
  const { coords } = useLocation();
  const [tab, setTab] = useState<TabId>('about');
  const [profile, setProfile] = useState<WalkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const vendorId = String(id);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const detail = await fetchPublicVendorDetail(client, vendorId, {
          lat: coords?.latitude,
          lng: coords?.longitude,
        });
        if (!cancelled) setProfile(vendorDetailToWalkerProfile(detail));
      } catch {
        const fallback = getWalkerProfile(vendorId);
        if (!cancelled) setProfile(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, client, coords?.latitude, coords?.longitude]);

  if (loading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.solid_white }]}>
        <Text style={{ padding: H_PAD, color: t.colors.text_secondary }}>Loading…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.solid_white }]}
      >
        <Text style={{ padding: H_PAD, color: t.colors.text_secondary }}>
          Professional not found.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const starting = getWalkerStartingPrice(profile);
  const showWalk = profile.walkPriceInr != null;
  const showTrain = profile.trainingPriceInr != null;
  const availToday = profile.availabilityLabel === 'today';

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.solid_white }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.heroWrap}>
          <Image source={{ uri: profile.heroImage }} style={styles.heroImage} />
          <View style={[styles.heroOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
            <View style={styles.heroTopRow}>
              <TouchableOpacity
                style={styles.heroCircleBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
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
            <View style={styles.heroBadgeWrap}>
              <View style={[styles.availBadge, { backgroundColor: t.colors.success }]}>
                <View style={styles.availDot} />
                <Text style={styles.availBadgeText}>
                  {availToday ? 'Available Today' : 'Available Tomorrow'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: H_PAD, paddingTop: 18 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: t.colors.text_primary }]}>{profile.name}</Text>
            <Ionicons name="checkmark-circle" size={22} color="#2563eb" style={{ marginLeft: 8 }} />
          </View>
          <Text style={[styles.headline, { color: t.colors.text_secondary }]}>
            {profile.headlineTitle}
          </Text>

          <View style={styles.statsBlock}>
            <View style={styles.statLine}>
              <Ionicons name="star" size={18} color="#eab308" />
              <Text style={[styles.statText, { color: t.colors.text_primary }]}>
                {profile.rating} ({profile.reviewCount} reviews)
              </Text>
            </View>
            <View style={styles.statLine}>
              <Ionicons name="location" size={18} color={accent} />
              <Text style={[styles.statText, { color: t.colors.text_primary }]}>
                {profile.distance} away
              </Text>
            </View>
            <View style={styles.statLine}>
              <Ionicons name="person-outline" size={18} color={t.colors.text_secondary} />
              <Text style={[styles.statText, { color: t.colors.text_primary }]}>
                {profile.yearsExp} years experience
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.certScroll}
          >
            {profile.certifications.map((c) => (
              <View key={c.label} style={[styles.certPill, { backgroundColor: '#dcfce7' }]}>
                <CertIcon c={c} />
                <Text style={[styles.certText, { color: '#166534' }]}>{c.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.priceRow}>
            {showWalk && (
              <View style={[styles.priceCard, { backgroundColor: t.colors.primary_light }]}>
                <Text style={[styles.priceCardLabel, { color: accent }]}>Walking from</Text>
                <Text style={[styles.priceCardAmt, { color: accent }]}>
                  ₹{profile.walkPriceInr}
                </Text>
                <Text style={[styles.priceCardSub, { color: accent }]}>per walk</Text>
              </View>
            )}
            {showTrain && (
              <View style={[styles.priceCard, { backgroundColor: t.colors.primary_light }]}>
                <Text style={[styles.priceCardLabel, { color: accent }]}>Training from</Text>
                <Text style={[styles.priceCardAmt, { color: accent }]}>
                  ₹{profile.trainingPriceInr}
                </Text>
                <Text style={[styles.priceCardSub, { color: accent }]}>per session</Text>
              </View>
            )}
          </View>

          <View style={styles.callMsgRow}>
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: accent }]}
              onPress={() => Linking.openURL('tel:+911800000000')}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={20} color={accent} />
              <Text style={[styles.outlineBtnText, { color: accent }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: accent }]}
              onPress={() => Linking.openURL('sms:+911800000000')}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={20} color={accent} />
              <Text style={[styles.outlineBtnText, { color: accent }]}>Message</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tabsWrap, { backgroundColor: '#f1f5f9' }]}>
            {(
              [
                ['about', 'About'],
                ['services', 'Services'],
                ['reviews', 'Reviews'],
                ['gallery', 'Gallery'],
              ] as const
            ).map(([tid, label]) => {
              const active = tab === tid;
              return (
                <TouchableOpacity
                  key={tid}
                  style={[
                    styles.tabPill,
                    active && {
                      backgroundColor: '#fff',
                      shadowColor: '#000',
                      shadowOpacity: 0.06,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ]}
                  onPress={() => setTab(tid)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      { color: active ? accent : t.colors.text_secondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === 'about' && (
            <View style={{ paddingBottom: 12 }}>
              <Text style={[styles.blockTitle, { color: t.colors.text_primary }]}>About Me</Text>
              <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                {profile.about}
              </Text>
              <View style={styles.langRow}>
                {profile.languages.map((lang) => (
                  <View
                    key={lang}
                    style={[styles.langPill, { backgroundColor: t.colors.inactive_bg_alpha }]}
                  >
                    <Text style={[styles.langText, { color: t.colors.text_primary }]}>{lang}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.blockTitle, { color: t.colors.text_primary, marginTop: 22 }]}>
                Weekly Schedule
              </Text>
              {profile.weeklySchedule.map((row) => (
                <View
                  key={row.day}
                  style={[styles.scheduleRow, { borderBottomColor: t.colors.inactive_bg_alpha }]}
                >
                  <Text style={[styles.scheduleDay, { color: t.colors.text_primary }]}>
                    {row.day}
                  </Text>
                  <View style={styles.scheduleSlots}>
                    {row.slots.map((slot) => (
                      <View
                        key={slot}
                        style={[styles.slotPill, { backgroundColor: t.colors.primary_light }]}
                      >
                        <Text style={[styles.slotText, { color: accent }]}>{slot}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'services' && (
            <View style={{ gap: 14, paddingBottom: 12 }}>
              {profile.services.map((s) => (
                <View
                  key={s.title}
                  style={[styles.serviceBlock, { borderColor: t.colors.inactive_bg_alpha }]}
                >
                  <Text style={[styles.serviceTitle, { color: t.colors.text_primary }]}>
                    {s.title}
                  </Text>
                  <Text style={[styles.serviceDesc, { color: t.colors.text_secondary }]}>
                    {s.description}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'reviews' && (
            <View style={{ gap: 14, paddingBottom: 12 }}>
              {profile.reviews.map((r, i) => (
                <View
                  key={i}
                  style={[styles.reviewCard, { borderColor: t.colors.inactive_bg_alpha }]}
                >
                  <Text style={[styles.reviewName, { color: t.colors.text_primary }]}>
                    {r.name}
                  </Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <Ionicons key={j} name="star" size={14} color="#eab308" />
                    ))}
                  </View>
                  <Text style={[styles.reviewText, { color: t.colors.text_secondary }]}>
                    {r.text}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'gallery' && (
            <View style={[styles.galleryGrid, { paddingBottom: 12 }]}>
              {profile.gallery.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.galleryCell, { width: GALLERY_CELL, height: GALLERY_CELL }]}
                />
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
            backgroundColor: t.colors.solid_white,
            borderTopColor: t.colors.inactive_bg_alpha,
          },
        ]}
      >
        <View style={styles.footerLeft}>
          <Text style={[styles.footerSmall, { color: t.colors.text_secondary }]}>
            Starting from
          </Text>
          <Text style={[styles.footerPrice, { color: t.colors.text_primary }]}>₹{starting}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: accent }]}
          onPress={() =>
            router.push({
              pathname: '/walkers-trainers/[id]/book',
              params: { id: String(profile.id) },
            } as Href)
          }
          activeOpacity={0.9}
        >
          <Ionicons name="calendar" size={22} color="#fff" />
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heroWrap: { height: 240, position: 'relative' },
  heroImage: { width: '100%', height: 240 },
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
  heroBadgeWrap: { alignItems: 'flex-end', paddingRight: H_PAD, marginBottom: 14 },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  availBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '800' },
  headline: { fontSize: 15, marginTop: 6 },
  statsBlock: { marginTop: 14, gap: 8 },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontSize: 15, fontWeight: '600' },
  certScroll: { gap: 10, paddingVertical: 16 },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9999,
    marginRight: 8,
  },
  certText: { fontSize: 13, fontWeight: '700' },
  priceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  priceCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  priceCardLabel: { fontSize: 12, fontWeight: '600' },
  priceCardAmt: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  priceCardSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  callMsgRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 18,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabPillText: { fontSize: 12, fontWeight: '700' },
  blockTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  bodyText: { fontSize: 15, lineHeight: 24 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  langPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999 },
  langText: { fontSize: 13, fontWeight: '600' },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    alignItems: 'flex-start',
  },
  scheduleDay: { width: 100, fontSize: 14, fontWeight: '700', paddingTop: 4 },
  scheduleSlots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 },
  slotText: { fontSize: 12, fontWeight: '700' },
  serviceBlock: { padding: 14, borderRadius: 12, borderWidth: 1 },
  serviceTitle: { fontSize: 16, fontWeight: '800' },
  serviceDesc: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  reviewCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  reviewName: { fontSize: 15, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewText: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  galleryCell: { borderRadius: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  footerLeft: { flex: 1 },
  footerSmall: { fontSize: 12, fontWeight: '600' },
  footerPrice: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
