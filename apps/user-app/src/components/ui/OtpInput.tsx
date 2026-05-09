import React, { useRef, useState, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts';

type OtpCellRef = { focus: () => void; blur: () => void } | null;

export interface OtpInputProps {
  digitCount?: number;
  value: string;
  onChangeValue: (value: string) => void;
  onComplete?: (value: string) => void;
}

export function OtpInput({ digitCount = 6, value, onChangeValue, onComplete }: OtpInputProps) {
  const t = useTheme();
  const inputsRef = useRef<OtpCellRef[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = value.split('').concat(Array(Math.max(0, digitCount - value.length)).fill(''));

  const handleChange = useCallback(
    (index: number, text: string) => {
      const num = text.replace(/\D/g, '');
      if (num.length > 1) {
        const combined = (value + num).replace(/\D/g, '').slice(0, digitCount);
        onChangeValue(combined);
        if (combined.length === digitCount) {
          onComplete?.(combined);
          inputsRef.current[digitCount - 1]?.blur();
        } else {
          inputsRef.current[Math.min(combined.length, digitCount - 1)]?.focus();
        }
        return;
      }
      const next = value.split('');
      next[index] = num;
      const combined = next.join('').replace(/\D/g, '').slice(0, digitCount);
      onChangeValue(combined);
      if (combined.length === digitCount) onComplete?.(combined);
      if (num && index < digitCount - 1) inputsRef.current[index + 1]?.focus();
    },
    [value, digitCount, onChangeValue, onComplete]
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !digits[index] && index > 0) {
        const next = value.split('').slice(0, index).join('');
        onChangeValue(next);
        inputsRef.current[index - 1]?.focus();
      }
    },
    [value, digits, onChangeValue]
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: digitCount }).map((_, i) => (
        <TextInput
          key={i}
          ref={(el: OtpCellRef) => {
            inputsRef.current[i] = el;
          }}
          style={[
            styles.cell,
            {
              borderColor: focusedIndex === i ? t.colors.primary : 'white',
              color: t.colors.foreground,
              backgroundColor: t.colors.slate,
            },
          ]}
          value={digits[i] || ''}
          onChangeText={(text: string) => handleChange(i, text)}
          onKeyPress={({ nativeEvent }: { nativeEvent: { key: string } }) =>
            handleKeyPress(i, nativeEvent.key)
          }
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex(null)}
          keyboardType="number-pad"
          maxLength={i === 0 ? digitCount : 1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  cell: {
    width: 48,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});
