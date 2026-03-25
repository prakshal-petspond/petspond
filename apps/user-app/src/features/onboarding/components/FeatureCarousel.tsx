import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '@/contexts';

export interface FeatureSlide {
  id: string;
  title?: string;
  description: string;
}

export interface FeatureCarouselProps {
  slides: FeatureSlide[];
}

export function FeatureCarousel({ slides }: FeatureCarouselProps) {
  const t = useTheme();
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const slide = slides[index] ?? slides[0];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: t.colors.border }]}>
        {slide?.title ? (
          <Text style={[styles.title, { color: t.colors.foreground }]}>{slide.title}</Text>
        ) : null}
        <Text style={[styles.description, { color: t.colors.muted }]}>
          {slide?.description ?? ''}
        </Text>
      </View>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            onTouchEnd={() => setIndex(i)}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? t.colors.primary : t.colors.border,
                width: i === index ? 16 : 8,
                borderRadius: 4,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 120,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
