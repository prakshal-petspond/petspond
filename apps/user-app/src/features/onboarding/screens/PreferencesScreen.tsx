import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useOnboarding } from '@/contexts';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { ScreenHeader, PrimaryButton } from '@/components/ui';

const STEP = 5;
const TOTAL_STEPS = 5;

type Option = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const OPTIONS: Option[] = [
  {
    id: 'veterinary',
    title: 'Veterinary Care',
    description: 'Find vets and book consultations',
    icon: 'medical',
  },
  {
    id: 'vaccinations',
    title: 'Vaccinations',
    description: 'Track shots and reminders',
    icon: 'bandage',
  },
  {
    id: 'grooming',
    title: 'Grooming',
    description: 'Salon and spa appointments',
    icon: 'cut',
  },
  {
    id: 'training',
    title: 'Training',
    description: 'Trainers and behaviour support',
    icon: 'fitness',
  },
  {
    id: 'boarding',
    title: 'Boarding & daycare',
    description: 'Safe stays when you are away',
    icon: 'home',
  },
];

export type PreferencesScreenProps = {
  onFinish: () => void | Promise<void>;
  onBack: () => void;
  submitting?: boolean;
};

export function PreferencesScreen({ onFinish, onBack, submitting }: PreferencesScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, setPreferences } = useOnboarding();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(state.preferences));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const count = selected.size;
  const statusLine = useMemo(() => {
    if (count === 0) return 'No services selected';
    if (count === 1) return '1 service selected';
    return `${count} services selected`;
  }, [count]);

  const complete = useCallback(async () => {
    setPreferences([...selected]);
    await Promise.resolve(onFinish());
  }, [onFinish, selected, setPreferences]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top > 0 ? 0 : 12, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingStepHeader currentStep={STEP} totalSteps={TOTAL_STEPS} onBack={onBack} />
        <ScreenHeader
          title="Select Preferences"
          description="Choose services you'd like to use frequently. You can change this anytime."
        />
        <View style={styles.list}>
          {OPTIONS.map((opt) => {
            const on = selected.has(opt.id);
            return (
              <Pressable
                key={opt.id}
                onPress={() => toggle(opt.id)}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.card,
                  {
                    borderColor: on ? t.colors.accent : t.colors.border,
                    backgroundColor: t.colors.background,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={[styles.iconBubble, { backgroundColor: t.colors.accent }]}>
                  <Ionicons name={opt.icon} size={22} color="#fff" />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: t.colors.foreground }]}>{opt.title}</Text>
                  <Text style={[styles.cardDesc, { color: t.colors.muted }]}>{opt.description}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: on ? t.colors.accent : t.colors.border,
                      backgroundColor: on ? t.colors.accent : 'transparent',
                    },
                  ]}
                >
                  {on ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.status, { color: t.colors.muted }]}>{statusLine}</Text>
        <PrimaryButton
          tone="accent"
          title="Complete Setup ›"
          onPress={complete}
          loading={submitting}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  list: {
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
});
