import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { H_PAD, PROMO_BANNER } from '../constants';

export function PromoBanner() {
  const t = useTheme();
  const cardBg = t.colors.primary_bg;

  return (
    <View style={[styles.bannerWrap, { paddingHorizontal: H_PAD }]}>
      <View style={[styles.banner, { backgroundColor: cardBg, borderRadius: t.borderRadius.lg }]}>
        <View style={[styles.bannerOverlay, { borderRadius: t.borderRadius.lg }]}>
          <View style={[styles.bannerLogo, { backgroundColor: t.colors.primary }]}>
            <Ionicons name="paw" size={28} color="#fff" />
            <View style={styles.bannerLogoCross} />
          </View>
          <Text style={[styles.bannerTitle, { color: t.colors.text_primary }]}>
            {PROMO_BANNER.title}
          </Text>
          <Text style={[styles.bannerSubtitle, { color: t.colors.text_secondary }]}>
            {PROMO_BANNER.subtitle}
          </Text>
          <Text style={[styles.bannerContact, { color: t.colors.text_secondary }]}>
            {PROMO_BANNER.contact}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
