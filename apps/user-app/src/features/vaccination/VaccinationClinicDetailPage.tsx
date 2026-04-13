import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { Ionicons } from '@expo/vector-icons';
import type { PublicClinicDetail } from '@petspond/types';
import { fetchClinicDetail } from '@/services/catalog';

const H_PAD = 16;
const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=480&fit=crop';

export function VaccinationClinicDetailPage() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const t = useTheme();
  const { client } = useApi();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const [detail, setDetail] = useState<PublicClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    let c = false;
    setLoading(true);
    fetchClinicDetail(client, String(clinicId))
      .then((d) => {
        if (!c) setDetail(d);
      })
      .catch(() => {
        if (!c) setErr(getNetworkErrorHelp());
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [client, clinicId]);

  if (loading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (err || !detail) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.background }]}>
        <Text style={{ padding: H_PAD, color: t.colors.muted }}>{err ?? 'Clinic not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroUri = detail.heroImage ?? detail.listingImage ?? FALLBACK_HERO;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`;

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: heroUri }} style={styles.heroImage} />
          <View style={[styles.heroOverlay, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: H_PAD, paddingTop: 16, paddingBottom: 120 }}>
          <Text style={[styles.title, { color: t.colors.foreground }]}>{detail.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#eab308" />
            <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>
              {detail.rating} ({detail.reviewCount} reviews)
            </Text>
          </View>
          <Text style={{ color: t.colors.muted, marginTop: 10, lineHeight: 22 }}>{detail.address}</Text>

          <Text style={[styles.section, { color: t.colors.foreground }]}>Vaccines offered</Text>
          {(detail.vaccinesOffered ?? []).length === 0 ? (
            <Text style={{ color: t.colors.muted }}>No vaccines listed yet.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {detail.vaccinesOffered.map((v) => (
                <View
                  key={v.id}
                  style={[styles.vaxRow, { borderColor: t.colors.border, backgroundColor: t.colors.background }]}
                >
                  <Ionicons name="bandage-outline" size={22} color={accent} />
                  <Text style={{ flex: 1, color: t.colors.foreground, fontWeight: '600' }}>{v.name}</Text>
                  <Text style={{ color: accent, fontWeight: '700' }}>₹{v.pricePaise / 100}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: t.colors.accentLight }]}
              onPress={() => Linking.openURL(mapsUrl)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate-outline" size={18} color={accent} />
              <Text style={{ color: accent, fontWeight: '700' }}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: t.colors.border }]}>
        <TouchableOpacity
          style={[styles.bookCta, { backgroundColor: accent }]}
          onPress={() =>
            router.push({
              pathname: '/vaccination/[clinicId]/book',
              params: { clinicId: String(detail.id) },
            } as Href)
          }
          activeOpacity={0.9}
        >
          <Ionicons name="calendar" size={22} color="#fff" />
          <Text style={styles.bookCtaText}>Book Vaccination</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heroWrap: { height: 200, position: 'relative' },
  heroImage: { width: '100%', height: 200 },
  heroOverlay: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: H_PAD },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  section: { fontSize: 17, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  vaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBar: { flexDirection: 'row', marginTop: 20, gap: 10 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#fff',
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
