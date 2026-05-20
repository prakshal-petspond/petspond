import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { CARD_GAP, CATEGORIES, CATEGORY_SIZE, H_PAD } from '../constants';

export function CategoryGrid() {
  const router = useRouter();
  const t = useTheme();
  const cardBg = t.colors.primary_bg;

  return (
    <View style={[styles.categoriesWrap, { paddingHorizontal: H_PAD }]}>
      {CATEGORIES.map((cat) => {
        const cardStyle = [
          styles.categoryCard,
          {
            backgroundColor: cardBg,
            borderRadius: t.borderRadius.lg,
            width: CATEGORY_SIZE,
            minHeight: CATEGORY_SIZE,
          },
        ];
        const onPress = cat.route ? () => router.push(cat.route!) : undefined;

        return (
          <View style={styles.categoryCardWrap} key={cat.id}>
            <TouchableOpacity
              style={cardStyle}
              onPress={onPress}
              activeOpacity={onPress ? 0.8 : 1}
              disabled={!onPress}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: t.colors.secondary_bg }]}>
                <Ionicons name={cat.icon} size={24} color="#78350f" />
              </View>
            </TouchableOpacity>
            <Text
              style={[styles.categoryLabel, { color: t.colors.text_primary }]}
              numberOfLines={2}
            >
              {cat.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  categoryCardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 10, textAlign: 'center', fontWeight: '400', marginTop: 4 },
});
