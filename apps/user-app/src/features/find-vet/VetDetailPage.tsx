import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { PublicClinicDetail } from '@petspond/types';
import { useApi, useTheme } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { fetchClinicDetail } from '@/services/catalog';
import { resolvePhotoUrl } from '@/lib/photoUrl';

const H_PAD = 16;

type TabId = 'overview' | 'services' | 'doctors';

type VetDetailPageProps = {
  clinicId: string;
};

function heroUri(detail: PublicClinicDetail): string | null {
  const candidates = [
    detail.heroImage,
    detail.listingImage,
    detail.photoGallery?.[0],
    detail.primaryDoctor.photoUrl,
  ];
  for (const c of candidates) {
    const url = resolvePhotoUrl(c);
    if (url) return url;
  }
  return null;
}

function mapsQueryUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function VetDetailPage({ clinicId }: VetDetailPageProps) {
  const t = useTheme();
  const { client } = useApi();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const primary = t.colors.primary;

  const [tab, setTab] = useState<TabId>('overview');
  const [detail, setDetail] = useState<PublicClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      setError('Clinic not found.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchClinicDetail(client, clinicId)
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

  const onShare = useCallback(async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `${detail.name}\n${detail.address}`,
        title: detail.name,
      });
    } catch {
      Alert.alert('Share', `${detail.name}\n${detail.address}`);
    }
  }, [detail]);

  const openLabel = useMemo(() => {
    if (!detail) return '';
    if (detail.is24_7) return 'OPEN NOW · 24/7';
    if (detail.closingTimeLabel) return `OPEN NOW · Closes ${detail.closingTimeLabel}`;
    return 'See hours below';
  }, [detail]);

  if (loading) {
    return (
      <View
        style={[
          styles.fill,
          styles.centered,
          { paddingTop: insets.top, backgroundColor: t.colors.grey_bg },
        ]}
      >
        <ActivityIndicator size="large" color={primary} />
        <Text style={[styles.loadingText, { color: t.colors.text_secondary }]}>
          Loading clinic…
        </Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View
        style={[
          styles.fill,
          { paddingTop: insets.top + 16, paddingHorizontal: H_PAD, backgroundColor: t.colors.grey_bg },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
        </Pressable>
        <Text style={[styles.errorText, { color: t.colors.text_secondary }]}>
          {error ?? 'Clinic not found.'}
        </Text>
      </View>
    );
  }

  const hero = heroUri(detail);
  const mapsUrl = mapsQueryUrl(detail.address);

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.grey_bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.heroWrap}>
          {hero ? (
            <Image source={{ uri: hero }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: t.colors.border }]}>
              <MaterialCommunityIcons name="hospital-building" size={48} color={t.colors.text_secondary} />
            </View>
          )}
          <View style={[styles.heroOverlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
            <View style={styles.heroTopRow}>
              <Pressable
                style={[styles.heroBtn, { backgroundColor: t.colors.solid_white }]}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
              </Pressable>
              <Pressable
                style={[styles.heroBtn, { backgroundColor: t.colors.solid_white }]}
                onPress={onShare}
              >
                <Ionicons name="share-outline" size={20} color={t.colors.text_primary} />
              </Pressable>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: t.colors.solid_white, borderColor: t.colors.border },
          ]}
        >
          <Text style={[styles.clinicName, { color: t.colors.text_primary }]}>{detail.name}</Text>
          {detail.tagline ? (
            <Text style={[styles.tagline, { color: primary }]}>{detail.tagline}</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="star" size={16} color="#EAB308" />
              <Text style={[styles.statText, { color: t.colors.text_primary }]}>
                {detail.rating} ({detail.reviewCount})
              </Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="people-outline" size={16} color={t.colors.text_secondary} />
              <Text style={[styles.statText, { color: t.colors.text_primary }]}>
                {detail.totalDoctors} Doctors
              </Text>
            </View>
            {detail.establishedYear != null ? (
              <View style={styles.statChip}>
                <Ionicons name="ribbon-outline" size={16} color={t.colors.text_secondary} />
                <Text style={[styles.statText, { color: t.colors.text_primary }]}>
                  Est. {detail.establishedYear}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={primary} />
            <Text style={[styles.addressText, { color: t.colors.text_primary }]}>{detail.address}</Text>
          </View>

          <View style={styles.hoursBanner}>
            <View style={[styles.openDot, { backgroundColor: t.colors.success }]} />
            <Text style={[styles.hoursBannerText, { color: t.colors.text_primary }]}>{openLabel}</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: t.colors.grey_bg, opacity: 0.5 }]}
              disabled
            >
              <Ionicons name="call" size={18} color={primary} />
              <Text style={[styles.actionBtnText, { color: primary }]}>Call</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: t.colors.grey_bg, opacity: 0.5 }]}
              disabled
            >
              <Ionicons name="chatbubble-outline" size={18} color={primary} />
              <Text style={[styles.actionBtnText, { color: primary }]}>Message</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: t.colors.primary_bg }]}
              onPress={() => Linking.openURL(mapsUrl)}
            >
              <Ionicons name="navigate-outline" size={18} color={primary} />
              <Text style={[styles.actionBtnText, { color: primary }]}>Direction</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.tabsCard, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border }]}>
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
                <Pressable key={id} style={styles.tabBtn} onPress={() => setTab(id)}>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: active ? primary : t.colors.text_secondary },
                    ]}
                  >
                    {label}
                  </Text>
                  {active ? <View style={[styles.tabUnderline, { backgroundColor: primary }]} /> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.tabContent}>
            {tab === 'overview' && (
              <>
                <Text style={[styles.blockTitle, { color: t.colors.text_primary }]}>About</Text>
                {detail.tagline ? (
                  <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                    {detail.tagline}
                  </Text>
                ) : (
                  <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                    No description available.
                  </Text>
                )}

                <Text style={[styles.blockTitle, { color: t.colors.text_primary, marginTop: 20 }]}>
                  Facilities
                </Text>
                {(detail.facilities ?? []).length === 0 ? (
                  <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                    No facilities listed.
                  </Text>
                ) : (
                  <View style={styles.facilityGrid}>
                    {detail.facilities.map((f) => (
                      <View key={f} style={styles.facilityCell}>
                        <Ionicons name="checkmark-circle" size={18} color={t.colors.success} />
                        <Text style={[styles.facilityText, { color: t.colors.text_primary }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={[styles.blockTitle, { color: t.colors.text_primary, marginTop: 20 }]}>
                  Hours
                </Text>
                {(detail.hours ?? []).length === 0 ? (
                  <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                    {detail.is24_7 ? 'Open 24 hours, 7 days a week.' : 'Hours not published.'}
                  </Text>
                ) : (
                  detail.hours.map((h) => (
                    <View key={h.day} style={styles.hourRow}>
                      <Text style={[styles.hourDay, { color: t.colors.text_secondary }]}>{h.day}</Text>
                      <Text style={[styles.hourTime, { color: t.colors.text_primary }]}>{h.hours}</Text>
                    </View>
                  ))
                )}
              </>
            )}

            {tab === 'services' && (
              <>
                {(detail.servicesOffered ?? []).length === 0 ? (
                  <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                    No services listed yet.
                  </Text>
                ) : (
                  detail.servicesOffered.map((s) => (
                    <View
                      key={s.id}
                      style={[styles.serviceRow, { borderColor: t.colors.border, backgroundColor: t.colors.grey_bg }]}
                    >
                      <View style={[styles.serviceIcon, { backgroundColor: t.colors.primary_bg }]}>
                        <MaterialCommunityIcons name="medical-bag" size={22} color={primary} />
                      </View>
                      <Text style={[styles.serviceName, { color: t.colors.text_primary }]}>{s.name}</Text>
                    </View>
                  ))
                )}
              </>
            )}

            {tab === 'doctors' && (
              <>
                {(detail.doctors ?? []).length === 0 ? (
                  <Text style={[styles.bodyText, { color: t.colors.text_secondary }]}>
                    No doctors listed yet.
                  </Text>
                ) : (
                  detail.doctors.map((d) => {
                    const docPhoto = resolvePhotoUrl(d.photoUrl);
                    return (
                      <View
                        key={d.id}
                        style={[styles.doctorCard, { borderColor: t.colors.border, backgroundColor: t.colors.grey_bg }]}
                      >
                        {docPhoto ? (
                          <Image source={{ uri: docPhoto }} style={styles.doctorImg} />
                        ) : (
                          <View
                            style={[
                              styles.doctorImg,
                              styles.doctorImgPlaceholder,
                              { backgroundColor: t.colors.border },
                            ]}
                          >
                            <Ionicons name="person" size={28} color={t.colors.text_secondary} />
                          </View>
                        )}
                        <View style={styles.doctorBody}>
                          <Text style={[styles.doctorName, { color: t.colors.text_primary }]}>
                            {d.fullName}
                          </Text>
                          {d.displayTitle ? (
                            <Text style={[styles.doctorMeta, { color: t.colors.text_secondary }]}>
                              {d.displayTitle}
                            </Text>
                          ) : null}
                          {d.specializations.length > 0 ? (
                            <Text style={[styles.doctorSpec, { color: primary }]}>
                              {d.specializations.join(', ')}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: t.colors.solid_white,
            borderTopColor: t.colors.border,
          },
        ]}
      >
        <Pressable
          style={[styles.bookCta, { backgroundColor: primary }]}
          onPress={() => router.push(`/find-vet/${clinicId}/book`)}
        >
          <Ionicons name="calendar-outline" size={22} color="#fff" />
          <Text style={styles.bookCtaText}>Book Appointment</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  backLink: { marginBottom: 16 },
  errorText: { fontSize: 15, lineHeight: 22 },
  heroWrap: { height: 240, position: 'relative' },
  heroImage: { width: '100%', height: 240 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start' },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginHorizontal: H_PAD,
    marginTop: -28,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  clinicName: { fontSize: 22, fontWeight: '800' },
  tagline: { fontSize: 15, fontWeight: '600', marginTop: 6 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '600' },
  addressRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' },
  addressText: { flex: 1, fontSize: 14, lineHeight: 20 },
  hoursBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  openDot: { width: 8, height: 8, borderRadius: 4 },
  hoursBannerText: { fontSize: 13, fontWeight: '700', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  tabsCard: {
    marginHorizontal: H_PAD,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabsRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabLabel: { fontSize: 14, fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '50%',
    borderRadius: 2,
  },
  tabContent: { padding: 16 },
  blockTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 21 },
  facilityGrid: { gap: 10 },
  facilityCell: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  facilityText: { flex: 1, fontSize: 14, lineHeight: 20 },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  hourDay: { fontSize: 14, fontWeight: '600' },
  hourTime: { fontSize: 14, fontWeight: '500' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: 15, fontWeight: '600', flex: 1 },
  doctorCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  doctorImg: { width: 64, height: 64, borderRadius: 12 },
  doctorImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  doctorBody: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '700' },
  doctorMeta: { fontSize: 13, marginTop: 2 },
  doctorSpec: { fontSize: 13, fontWeight: '600', marginTop: 4 },
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
