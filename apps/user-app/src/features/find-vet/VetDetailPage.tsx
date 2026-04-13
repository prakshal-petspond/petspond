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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { Ionicons } from '@expo/vector-icons';
import type { PublicClinicDetail } from '@petspond/types';
import { fetchClinicDetail } from '@/services/catalog';

const H_PAD = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_GAP = 8;
const PHOTO_CELL = (SCREEN_W - H_PAD * 2 - PHOTO_GAP * 2) / 3;
const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=480&fit=crop';

type TabId = 'overview' | 'services' | 'doctors';

export function VetDetailPage() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const t = useTheme();
  const { client } = useApi();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const [tab, setTab] = useState<TabId>('overview');
  const [detail, setDetail] = useState<PublicClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchClinicDetail(client, String(clinicId))
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setError(getNetworkErrorHelp());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, clinicId]);

  if (loading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={{ marginTop: 12, color: t.colors.muted }}>Loading clinic…</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.background }]}>
        <Text style={{ padding: H_PAD, color: t.colors.muted }}>{error ?? 'Clinic not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const vet = detail;
  const heroUri = vet.heroImage ?? vet.listingImage ?? vet.primaryDoctor.photoUrl ?? FALLBACK_HERO;
  const photos = vet.photoGallery?.length ? vet.photoGallery : [heroUri];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vet.address)}`;
  const statusOpen = vet.is24_7 ? 'Open 24/7' : 'Open';
  const closing = vet.closingTimeLabel ?? 'See hours';

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.heroWrap}>
          <Image source={{ uri: heroUri }} style={styles.heroImage} />
          <View style={[styles.heroOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
            <View style={styles.heroTopRow}>
              <TouchableOpacity style={styles.heroCircleBtn} onPress={() => router.back()} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={22} color="#0f172a" />
              </TouchableOpacity>
              <View style={styles.heroRightBtns}>
                <TouchableOpacity style={styles.heroCircleBtn} onPress={() => {}} activeOpacity={0.85}>
                  <Ionicons name="share-outline" size={20} color="#0f172a" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroCircleBtn} onPress={() => {}} activeOpacity={0.85}>
                  <Ionicons name="heart-outline" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.openBadgeWrap}>
              <View style={[styles.openBadge, { backgroundColor: t.colors.success }]}>
                <Text style={styles.openBadgeText}>{statusOpen}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: H_PAD, paddingTop: 16 }}>
          <Text style={[styles.clinicTitle, { color: t.colors.foreground }]}>{vet.name}</Text>
          <Text style={[styles.tagline, { color: accent }]}>{vet.tagline ?? vet.primaryDoctor.displayTitle ?? ''}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={18} color="#eab308" />
              <Text style={[styles.statText, { color: t.colors.foreground }]}>
                {vet.rating} ({vet.reviewCount})
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={18} color={t.colors.muted} />
              <Text style={[styles.statText, { color: t.colors.foreground }]}>{vet.totalDoctors} Doctors</Text>
            </View>
            {vet.establishedYear != null && (
              <View style={styles.statItem}>
                <Ionicons name="ribbon-outline" size={18} color={t.colors.muted} />
                <Text style={[styles.statText, { color: t.colors.foreground }]}>Est. {vet.establishedYear}</Text>
              </View>
            )}
          </View>

          <View style={styles.locRow}>
            <Ionicons name="location" size={20} color={accent} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.address, { color: t.colors.foreground }]}>{vet.address}</Text>
              {vet.city != null && vet.pincode != null && (
                <Text style={[styles.distance, { color: accent }]}>
                  {vet.city}, {vet.pincode}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={20} color={t.colors.muted} />
            <Text style={[styles.hoursText, { color: t.colors.foreground }]}>
              <Text style={{ color: t.colors.success, fontWeight: '700' }}>{statusOpen}</Text>
              {vet.is24_7 ? '' : ` — ${closing}`}
            </Text>
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
              <Text style={[styles.actionPillText, { color: accent }]}>Direction</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photosHeader}>
            <Text style={[styles.sectionTitle, { color: t.colors.foreground }]}>Clinic Photos</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text style={[styles.viewAll, { color: accent }]}>View All ({photos.length})</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoGrid}>
            {photos.slice(0, 6).map((uri, i) => (
              <Image key={i} source={{ uri }} style={[styles.photoCell, { width: PHOTO_CELL, height: PHOTO_CELL }]} />
            ))}
          </View>

          <View style={[styles.tabsRow, { borderBottomColor: t.colors.border }]}>
            {(
              [
                ['overview', 'Overview'],
                ['services', 'Services'],
                ['doctors', 'Our Doctors'],
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

          {tab === 'overview' && (
            <>
              <Text style={[styles.blockTitle, { color: t.colors.foreground }]}>Facilities & Equipment</Text>
              <View style={styles.facilityGrid}>
                {(vet.facilities ?? []).map((f) => (
                  <View key={f} style={styles.facilityCell}>
                    <Ionicons name="checkmark-circle" size={18} color={t.colors.success} />
                    <Text style={[styles.facilityText, { color: t.colors.foreground }]} numberOfLines={2}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.blockTitle, { color: t.colors.foreground, marginTop: 8 }]}>Operating Hours</Text>
              {(vet.hours ?? []).map((h) => (
                <View key={h.day} style={styles.hourLine}>
                  <Text style={[styles.hourDay, { color: t.colors.muted }]}>{h.day}</Text>
                  <Text style={[styles.hourTime, { color: t.colors.foreground }]}>{h.hours}</Text>
                </View>
              ))}
            </>
          )}

          {tab === 'services' && (
            <View style={{ gap: 12, paddingBottom: 8 }}>
              {(vet.servicesOffered ?? []).map((s) => (
                <View
                  key={s.id}
                  style={[styles.serviceRow, { borderColor: t.colors.border, backgroundColor: t.colors.background }]}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: t.colors.accentLight }]}>
                    <Ionicons
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      name={(s.icon as any) ?? 'medical'}
                      size={22}
                      color={accent}
                    />
                  </View>
                  <Text style={[styles.serviceName, { color: t.colors.foreground }]}>{s.name}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'doctors' && (
            <View style={{ gap: 14, paddingBottom: 8 }}>
              {(vet.doctors ?? []).map((d) => (
                <View key={d.id} style={[styles.doctorCard, { borderColor: t.colors.border }]}>
                  {d.photoUrl ? (
                    <Image source={{ uri: d.photoUrl }} style={styles.doctorImg} />
                  ) : (
                    <View style={[styles.doctorImg, { backgroundColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={28} color={t.colors.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.doctorName, { color: t.colors.foreground }]}>{d.fullName}</Text>
                    <Text style={[styles.doctorMeta, { color: t.colors.muted }]}>{d.displayTitle}</Text>
                    <Text style={[styles.doctorExp, { color: accent }]}>{d.specializations.join(', ') || 'Veterinarian'}</Text>
                  </View>
                </View>
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
        <TouchableOpacity
          style={[styles.bookCta, { backgroundColor: accent }]}
          onPress={() => router.push(`/find-vet/${vet.id}/book`)}
          activeOpacity={0.9}
        >
          <Ionicons name="calendar" size={22} color="#fff" />
          <Text style={styles.bookCtaText}>Book Appointment</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heroWrap: { height: 220, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: 220 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  openBadgeWrap: { alignItems: 'center', marginBottom: 12 },
  openBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999 },
  openBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  clinicTitle: { fontSize: 22, fontWeight: '800' },
  tagline: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '600' },
  locRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  address: { fontSize: 15, lineHeight: 22 },
  distance: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  hoursText: { fontSize: 15, flex: 1 },
  actionBar: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionPillText: { fontSize: 14, fontWeight: '700' },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  viewAll: { fontSize: 14, fontWeight: '700' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GAP },
  photoCell: { borderRadius: 10 },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 22,
    borderBottomWidth: 1,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 15, fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, height: 3, width: '60%', borderRadius: 2 },
  blockTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facilityCell: { width: '48%', flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  facilityText: { fontSize: 13, flex: 1, lineHeight: 18 },
  hourLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  hourDay: { fontSize: 14, fontWeight: '600' },
  hourTime: { fontSize: 14, fontWeight: '500' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 16, fontWeight: '600' },
  doctorCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  doctorImg: { width: 64, height: 64, borderRadius: 12 },
  doctorName: { fontSize: 16, fontWeight: '700' },
  doctorMeta: { fontSize: 14, marginTop: 2 },
  doctorExp: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bookCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  bookCtaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
