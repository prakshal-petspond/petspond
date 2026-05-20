import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts';
import { PrimaryButton } from '@/components/ui';

export type CarouselScreenProps = {
  onComplete: () => void;
};

type Slide = {
  id: string;
  emoji: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🐕',
    title: 'Complete Pet Care',
    body: 'Find trusted vets, groomers, trainers and pet care services all in one place',
  },
  {
    id: '2',
    emoji: '📅',
    title: 'Easy Booking',
    body: 'Book appointments, track vaccinations, and manage your pet’s health records effortlessly',
  },
  {
    id: '3',
    emoji: '⭐',
    title: 'Trusted Providers',
    body: 'All our service providers are verified and rated by pet parents like you',
  },
];

export function CarouselScreen({ onComplete }: CarouselScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<{
    scrollToIndex: (o: { index: number; animated?: boolean }) => void;
  } | null>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / width);
      if (i >= 0 && i < SLIDES.length) setIndex(i);
    },
    [width]
  );

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }, [index, isLast, onComplete]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const renderItem = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconRing, { backgroundColor: t.colors.primary_light }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={[styles.title, { color: t.colors.text_primary }]}>{item.title}</Text>
        <Text style={[styles.body, { color: t.colors.text_secondary }]}>{item.body}</Text>
      </View>
    ),
    [t.colors.primary_light, t.colors.text_primary, t.colors.text_secondary, width]
  );

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: t.colors.solid_white, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        keyExtractor={(item: Slide) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScrollToIndexFailed={({ index }: { index: number }) => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index, animated: true });
          });
        }}
        getItemLayout={(_: unknown, i: number) => ({ length: width, offset: width * i, index: i })}
        keyboardShouldPersistTaps="handled"
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={SLIDES[i].id}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? t.colors.accent : t.colors.inactive_bg_alpha,
                width: i === index ? 22 : 8,
                borderRadius: i === index ? 4 : 4,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          tone="accent"
          title={isLast ? "Let's Get Started ›" : 'Next ›'}
          onPress={goNext}
        />
        {!isLast ? (
          <Pressable onPress={skip} hitSlop={12} style={styles.skipHit}>
            <Text style={[styles.skip, { color: t.colors.text_secondary }]}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 24,
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  skipHit: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  skip: {
    fontSize: 15,
    fontWeight: '500',
  },
});
