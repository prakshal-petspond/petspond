import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts';
import { H_PAD } from '../constants';
import type { ServiceListingItem } from '../types';
import { ServiceCard } from './ServiceCard';

export type ServiceListingSectionProps = {
  eyebrow: string;
  title: string;
  items: ServiceListingItem[];
  onHeaderPress?: () => void;
  onItemPress?: (item: ServiceListingItem) => void;
};

export function ServiceListingSection({
  eyebrow,
  title,
  items,
  onHeaderPress,
  onItemPress,
}: ServiceListingSectionProps) {
  const t = useTheme();
  const accent = t.colors.accent;

  const header = (
    <>
      <Text style={[styles.sectionLabelSmall, { color: t.colors.icon_brown }]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>{title}</Text>
    </>
  );

  return (
    <View style={styles.section}>
      {onHeaderPress ? (
        <TouchableOpacity
          style={[styles.sectionHeader, { paddingHorizontal: H_PAD }]}
          onPress={onHeaderPress}
          activeOpacity={0.85}
        >
          {header}
        </TouchableOpacity>
      ) : (
        <View style={[styles.sectionHeader, { paddingHorizontal: H_PAD }]}>{header}</View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.hScrollContent, { paddingLeft: H_PAD }]}
      >
        {items.map((item) => (
          <View style={styles.serviceCardWrap} key={item.id}>
            <ServiceCard item={item} onPress={onItemPress ? () => onItemPress(item) : undefined} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionLabelSmall: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  hScrollContent: { paddingRight: H_PAD, gap: 0 },
  serviceCardWrap: { padding: 2 },
});
