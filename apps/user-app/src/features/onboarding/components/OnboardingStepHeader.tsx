import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from '@/contexts';

const TOTAL_STEPS_DEFAULT = 5;

export type OnboardingStepHeaderProps = {
  /** 1-based step index shown as "Step currentStep/totalSteps". */
  currentStep: number;
  totalSteps?: number;
  onBack: () => void;
};

/**
 * Shared top chrome for onboarding steps 1–5: back control, step label, and progress track.
 * Adjust styles here to update every data step at once.
 */
export function OnboardingStepHeader({
  currentStep,
  totalSteps = TOTAL_STEPS_DEFAULT,
  onBack,
}: OnboardingStepHeaderProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const progress = Math.min(1, Math.max(0, currentStep / totalSteps));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }: { pressed: boolean }) => [
          styles.backWrap,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <View style={[styles.backCircle, { backgroundColor: t.colors.inactive_bg_alpha }]}>
          <AntDesign name="arrowleft" size={24} color={t.colors.text_primary} />
        </View>
      </Pressable>
      <Text style={[styles.stepLabel, { color: t.colors.text_secondary }]}>
        Step {currentStep}/{totalSteps}
      </Text>
      <View style={[styles.track, { backgroundColor: t.colors.inactive_bg_alpha }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: t.colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 20,
  },
  backWrap: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 10,
    marginTop: 20,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
