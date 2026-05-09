import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts';

export interface TextInputFieldProps extends Omit<React.ComponentProps<typeof TextInput>, 'style'> {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function TextInputField({
  label,
  error,
  rightIcon,
  onRightIconPress,
  ...rest
}: TextInputFieldProps) {
  const t = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: t.colors.muted }]}>{label}</Text> : null}
      <View
        style={[styles.inputRow, { borderColor: t.colors.border, backgroundColor: t.colors.slate }]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: t.colors.foreground,
              backgroundColor: t.colors.slate,
            },
          ]}
          placeholderTextColor={t.colors.muted}
          {...rest}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.iconSlot}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: t.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  iconSlot: {
    padding: 8,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
