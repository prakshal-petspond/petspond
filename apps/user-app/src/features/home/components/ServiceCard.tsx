import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { CARD_GAP, SERVICE_CARD_WIDTH } from '../constants';
import type { ServiceListingItem } from '../types';

export type ServiceCardProps = {
  item: ServiceListingItem;
  onPress?: () => void;
};

const CARD_RADIUS = 12;
const IMAGE_HEIGHT = 120;

/** Splits promo into a highlighted lead (e.g. "50% Off") and trailing copy. */
function splitPromoText(promo: string): { highlight: string; rest: string } {
  const onIndex = promo.toLowerCase().indexOf(' on ');
  if (onIndex > 0) {
    return { highlight: promo.slice(0, onIndex), rest: promo.slice(onIndex) };
  }
  return { highlight: promo, rest: '' };
}

export function ServiceCard({ item, onPress }: ServiceCardProps) {
  const t = useTheme();
  const promoParts = useMemo(() => splitPromoText(item.promo), [item.promo]);

  return (
    <TouchableOpacity style={styles.shadowWrap} activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.card, { backgroundColor: t.colors.solid_white }]}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          <View style={[styles.promoBanner, { backgroundColor: `${t.colors.grey_bg}E6` }]}>
            <Text style={styles.promoText} numberOfLines={1}>
              <Text style={[styles.promoHighlight, { color: t.colors.icon_mustard }]}>
                {promoParts.highlight}
              </Text>
              {promoParts.rest ? (
                <Text style={{ color: t.colors.text_primary }}>{promoParts.rest}</Text>
              ) : null}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, { color: t.colors.text_primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingWrap}>
              <Ionicons name="star" size={14} color={t.colors.icon_mustard} />
              <Text style={[styles.rating, { color: t.colors.text_secondary }]}>{item.rating}</Text>
            </View>
            <Text style={[styles.distance, { color: t.colors.inactive_bg }]}>{item.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Figma drop shadow: X 0, Y 1, blur 4, spread 0, #000 @ 15% */
const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  android: { elevation: 2 },
  default: {},
});

const styles = StyleSheet.create({
  shadowWrap: {
    width: SERVICE_CARD_WIDTH,
    marginRight: CARD_GAP,
    ...CARD_SHADOW,
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    padding: 8,
  },
  imageWrap: {
    width: SERVICE_CARD_WIDTH - 16,
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#e8e8e8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  promoBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: {
    fontSize: 11,
    textAlign: 'center',
  },
  promoHighlight: {
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '500',
  },
  distance: {
    fontSize: 12,
    fontWeight: '400',
  },
});
