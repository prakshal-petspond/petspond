import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';

type Props = {
  label?: React.ReactNode;
  breeds: string[];
  value: string;
  onChange: (breed: string) => void;
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
};

export function BreedPickerField({
  label,
  breeds,
  value,
  onChange,
  error,
  errorText,
  disabled,
  disabledPlaceholder = 'Select pet type first',
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return breeds;
    return breeds.filter((b) => b.toLowerCase().includes(q));
  }, [breeds, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const select = useCallback(
    (b: string) => {
      onChange(b);
      close();
    },
    [close, onChange],
  );

  return (
    <View style={styles.wrapper}>
      {label ? <View style={styles.labelSlot}>{label}</View> : null}
      <TouchableOpacity
        style={[
          styles.inputRow,
          {
            borderColor: error ? t.colors.error : t.colors.border,
            backgroundColor: t.colors.background,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text
          style={[styles.valueText, { color: value ? t.colors.foreground : t.colors.muted }]}
          numberOfLines={1}
        >
          {disabled ? disabledPlaceholder : value || 'Select breed'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={t.colors.muted} />
      </TouchableOpacity>
      {errorText ? <Text style={[styles.errorText, { color: t.colors.error }]}>{errorText}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.modalBackdrop} onPress={close}>
          <Pressable
            style={[styles.sheet, { backgroundColor: t.colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandleZone, { borderBottomColor: t.colors.border }]}>
              <Text style={[styles.sheetTitle, { color: t.colors.foreground }]}>Select breed</Text>
              <TouchableOpacity onPress={close} hitSlop={12} style={styles.sheetClose}>
                <Ionicons name="close" size={26} color={t.colors.foreground} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.search,
                {
                  color: t.colors.foreground,
                  borderColor: t.colors.border,
                  backgroundColor: t.colors.cardBg ?? t.colors.background,
                },
              ]}
              placeholder="Search breeds"
              placeholderTextColor={t.colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <FlatList<string>
              data={filtered}
              keyExtractor={(item: string) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }: { item: string }) => (
                <TouchableOpacity
                  style={[styles.row, item === value && { backgroundColor: t.colors.accentLight ?? '#fed7aa' }]}
                  onPress={() => select(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rowText, { color: t.colors.foreground }]}>{item}</Text>
                  {item === value ? <Ionicons name="checkmark-circle" size={22} color={accent} /> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: t.colors.muted }]}>No breeds match your search.</Text>
              }
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  labelSlot: { marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  valueText: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  sheetHandleZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetClose: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 8, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowText: { flex: 1, fontSize: 16, paddingRight: 8 },
  empty: { textAlign: 'center', paddingVertical: 24, fontSize: 15 },
});
