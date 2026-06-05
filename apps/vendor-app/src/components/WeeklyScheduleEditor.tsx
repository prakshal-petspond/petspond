import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import type { VendorWeeklyAvailabilityBlock } from '@petspond/types';
import { useTheme } from '@/contexts';
import {
  DAY_LABELS,
  blocksToDayRows,
  buildTimeOptions,
  dayRowsToBlocks,
  formatMinute,
  type DayScheduleRow,
} from '@/lib/schedule';

type PickerTarget = { dayIndex: number; field: 'start' | 'end' } | null;

export type WeeklyScheduleEditorProps = {
  value: VendorWeeklyAvailabilityBlock[];
  onChange: (blocks: VendorWeeklyAvailabilityBlock[]) => void;
};

export function WeeklyScheduleEditor({ value, onChange }: WeeklyScheduleEditorProps) {
  const t = useTheme();
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const rows = useMemo(() => blocksToDayRows(value), [value]);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const updateRows = (next: DayScheduleRow[]) => {
    onChange(dayRowsToBlocks(next));
  };

  const setDayEnabled = (dayIndex: number, enabled: boolean) => {
    const next = rows.map((row, i) => (i === dayIndex ? { ...row, enabled } : row));
    updateRows(next);
  };

  const setDayTime = (dayIndex: number, field: 'start' | 'end', minute: number) => {
    const next = rows.map((row, i) => {
      if (i !== dayIndex) return row;
      if (field === 'start') {
        const endMinute = minute >= row.endMinute ? minute + 60 : row.endMinute;
        return { ...row, startMinute: minute, endMinute };
      }
      return { ...row, endMinute: minute };
    });
    updateRows(next);
    setPicker(null);
  };

  const applyPreset = (preset: 'weekdays' | 'all' | 'clear') => {
    if (preset === 'clear') {
      updateRows(rows.map((r) => ({ ...r, enabled: false })));
      return;
    }
    const days = preset === 'weekdays' ? [1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
    updateRows(
      rows.map((row, i) =>
        days.includes(i)
          ? { enabled: true, startMinute: 9 * 60, endMinute: 18 * 60 }
          : { ...row, enabled: false },
      ),
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.fieldLabel, { color: t.colors.text_primary }]}>Weekly availability *</Text>
      <Text style={[styles.hint, { color: t.colors.text_secondary }]}>
        Choose which days you accept bookings and your working hours.
      </Text>

      <View style={styles.presetRow}>
        <TouchableOpacity
          style={[styles.presetBtn, { backgroundColor: t.colors.grey_bg }]}
          onPress={() => applyPreset('weekdays')}
        >
          <Text style={{ color: t.colors.text_primary, fontSize: 12, fontWeight: '600' }}>Mon–Sat 9–6</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.presetBtn, { backgroundColor: t.colors.grey_bg }]}
          onPress={() => applyPreset('all')}
        >
          <Text style={{ color: t.colors.text_primary, fontSize: 12, fontWeight: '600' }}>Every day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.presetBtn, { backgroundColor: t.colors.grey_bg }]}
          onPress={() => applyPreset('clear')}
        >
          <Text style={{ color: t.colors.text_secondary, fontSize: 12, fontWeight: '600' }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {rows.map((row, dayIndex) => (
        <View
          key={DAY_LABELS[dayIndex]}
          style={[styles.dayRow, { borderColor: t.colors.inactive_bg_alpha }]}
        >
          <View style={styles.dayHead}>
            <Text style={[styles.dayLabel, { color: t.colors.text_primary }]}>{DAY_LABELS[dayIndex]}</Text>
            <Switch
              value={row.enabled}
              onValueChange={(v) => setDayEnabled(dayIndex, v)}
              trackColor={{ true: t.colors.accent }}
            />
          </View>
          {row.enabled && (
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.timeBtn, { borderColor: t.colors.inactive_bg_alpha }]}
                onPress={() => setPicker({ dayIndex, field: 'start' })}
              >
                <Text style={[styles.timeBtnLabel, { color: t.colors.text_secondary }]}>From</Text>
                <Text style={[styles.timeBtnValue, { color: t.colors.text_primary }]}>
                  {formatMinute(row.startMinute)}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: t.colors.text_secondary }}>–</Text>
              <TouchableOpacity
                style={[styles.timeBtn, { borderColor: t.colors.inactive_bg_alpha }]}
                onPress={() => setPicker({ dayIndex, field: 'end' })}
              >
                <Text style={[styles.timeBtnLabel, { color: t.colors.text_secondary }]}>To</Text>
                <Text style={[styles.timeBtnValue, { color: t.colors.text_primary }]}>
                  {formatMinute(row.endMinute)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <Modal visible={picker != null} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: t.colors.solid_white }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: t.colors.text_primary }]}>
              {picker ? `${DAY_LABELS[picker.dayIndex]} — ${picker.field === 'start' ? 'Start' : 'End'}` : ''}
            </Text>
            <ScrollView style={styles.timeList}>
              {timeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.timeOption, { borderBottomColor: t.colors.inactive_bg_alpha }]}
                  onPress={() => picker && setDayTime(picker.dayIndex, picker.field, opt.value)}
                >
                  <Text style={{ color: t.colors.text_primary, fontSize: 16 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPicker(null)}>
              <Text style={{ color: t.colors.accent, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  hint: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  dayRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { fontSize: 15, fontWeight: '700', width: 40 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  timeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  timeBtnLabel: { fontSize: 11, marginBottom: 2 },
  timeBtnValue: { fontSize: 15, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '55%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  timeList: { maxHeight: 320 },
  timeOption: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  modalClose: { alignItems: 'center', paddingTop: 12 },
});
