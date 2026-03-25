import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import { getVetDetail } from '@/features/find-vet/vetData';
import { startVetBookingCheckout } from '@/services/vetBookingPayment';
import {
  VACCINE_CATALOG,
  VACCINE_FLOW_PETS,
  VACCINE_REMINDERS,
  NOTES_PLACEHOLDER,
  PLATFORM_FEE_INR,
  type VaccineCatalogItem,
} from './vaccineBookingData';

const H_PAD = 16;
const STEPS = 6;

function formatFullDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildDateStrip(): Date[] {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    out.push(x);
  }
  return out;
}

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 17; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m > 0) break;
      const d = new Date();
      d.setHours(h, m, 0, 0);
      slots.push(d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }));
    }
  }
  return slots;
})();

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function StepProgress({ step, accent }: { step: number; accent: string }) {
  return (
    <View style={styles.progressWrap}>
      {Array.from({ length: STEPS }).map((_, i) => (
        <View
          key={i}
          style={[styles.progressSeg, { backgroundColor: i <= step ? accent : '#e2e8f0' }]}
        />
      ))}
    </View>
  );
}

export function VaccineBookFlow() {
  const { vetId } = useLocalSearchParams<{ vetId: string }>();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client } = useApi();
  const accent = t.colors.accent ?? t.colors.primary;

  const vet = vetId ? getVetDetail(String(vetId)) : undefined;

  const [step, setStep] = useState(0);
  const [petId, setPetId] = useState<string | null>(null);
  const [vaccineIds, setVaccineIds] = useState<string[]>(() => ['rabies']);
  const dates = useMemo(() => buildDateStrip(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]!);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [payLoading, setPayLoading] = useState(false);

  const pet = VACCINE_FLOW_PETS.find((p) => p.id === petId);
  const selectedVaccines = VACCINE_CATALOG.filter((v) => vaccineIds.includes(v.id));
  const vaccinesSubtotal = selectedVaccines.reduce((s, v) => s + v.priceInr, 0);
  const totalInr = Math.max(0, vaccinesSubtotal + PLATFORM_FEE_INR - promoDiscount);

  const toggleVaccine = useCallback((v: VaccineCatalogItem) => {
    if (v.mandatory) return;
    setVaccineIds((prev) => (prev.includes(v.id) ? prev.filter((x) => x !== v.id) : [...prev, v.id]));
  }, []);

  const applyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'VACC100') {
      setPromoDiscount(100);
      Alert.alert('Promo applied', '₹100 off applied with VACC100.');
    } else {
      Alert.alert('Promo code', 'Try VACC100 for ₹100 off.');
    }
  }, [promoInput]);

  const goBack = () => {
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const canContinue = () => {
    if (step === 0) return !!petId;
    if (step === 1) return vaccineIds.includes('rabies') && vaccineIds.length > 0;
    if (step === 2) return !!selectedTime;
    if (step === 3) return true;
    if (step === 4) return true;
    return false;
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (step < STEPS - 1) setStep((s) => s + 1);
  };

  const confirmPay = async () => {
    if (!vet || !pet) return;
    setPayLoading(true);
    try {
      const amountPaise = Math.round(totalInr * 100);
      const desc = `Vaccination — ${vet.clinic} — ${pet.name} — ${selectedVaccines.map((v) => v.name).join(', ')}`;
      const result = await startVetBookingCheckout(client, {
        amountPaise,
        vetId: vet.id,
        description: desc,
      });
      if (result.status === 'cancelled') {
        Alert.alert('Payment', 'Checkout was cancelled.');
        return;
      }
      if (result.status === 'error') {
        Alert.alert('Payment', result.message);
        return;
      }
      const bid = `VAC${Math.floor(100000 + Math.random() * 900000)}`;
      Alert.alert('Booking confirmed', `Reference: ${bid}\nThank you — we will see you at the clinic.`, [
        { text: 'OK', onPress: () => router.replace('/vaccination') },
      ]);
    } finally {
      setPayLoading(false);
    }
  };

  if (!vet) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.background }]}>
        <Text style={{ padding: H_PAD, color: t.colors.muted }}>Clinic not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: t.colors.border }]}>
        <TouchableOpacity style={styles.backRound} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={t.colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.stepLabel, { color: t.colors.muted }]}>
          Step {step + 1} of {STEPS}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: H_PAD, paddingTop: 12 }}>
        <StepProgress step={step} accent={accent} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollPad, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Select Your Pet</Text>
            <Text style={[styles.subtitle, { color: t.colors.muted }]}>Choose which pet needs vaccination</Text>
            <View style={{ marginTop: 20, gap: 12 }}>
              {VACCINE_FLOW_PETS.map((p) => {
                const sel = petId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.petRow,
                      {
                        borderColor: sel ? accent : t.colors.border,
                        backgroundColor: sel ? t.colors.accentLight : t.colors.background,
                      },
                    ]}
                    onPress={() => setPetId(p.id)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: p.image }} style={styles.petAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.petName, { color: t.colors.foreground }]}>{p.name}</Text>
                      <Text style={[styles.petMeta, { color: t.colors.muted }]}>
                        {p.breed} · {p.age} · {p.weight}
                      </Text>
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={28} color={accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Select Vaccines</Text>
            <Text style={[styles.subtitle, { color: t.colors.muted }]}>Choose one or more vaccines for your pet</Text>
            <View style={{ marginTop: 20, gap: 12 }}>
              {VACCINE_CATALOG.map((v) => {
                const checked = vaccineIds.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vaccineCard, { borderColor: checked ? accent : t.colors.border }]}
                    onPress={v.mandatory ? undefined : () => toggleVaccine(v)}
                    activeOpacity={v.mandatory ? 1 : 0.9}
                  >
                    <View style={[styles.checkbox, { borderColor: checked ? accent : t.colors.muted }]}>
                      {checked && <Ionicons name="checkmark" size={16} color={accent} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vaccineCardTitle, { color: t.colors.foreground }]}>
                        {v.name}
                        {v.subtitle ? <Text style={{ color: accent }}> ({v.subtitle})</Text> : null}
                      </Text>
                      <Text style={[styles.petMeta, { color: t.colors.muted }]}>
                        {v.durationMins} mins · Valid {v.validityLabel}
                      </Text>
                    </View>
                    <Text style={[styles.vaccineCardPrice, { color: accent }]}>₹{v.priceInr}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Select Date & Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
              {dates.map((d, i) => {
                const sel = sameDay(d, selectedDate);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dateChip,
                      {
                        borderColor: sel ? accent : t.colors.border,
                        backgroundColor: sel ? accent : t.colors.background,
                      },
                    ]}
                    onPress={() => setSelectedDate(d)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dateChipTop, { color: sel ? '#fff' : t.colors.muted }]}>
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dateChipDay, { color: sel ? '#fff' : t.colors.foreground }]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const sel = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeChip,
                      {
                        borderColor: sel ? accent : t.colors.border,
                        backgroundColor: sel ? t.colors.accentLight : t.colors.background,
                      },
                    ]}
                    onPress={() => setSelectedTime(slot)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.timeChipText, { color: sel ? accent : t.colors.foreground }]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedTime && (
              <View style={[styles.confirmBanner, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#166534" />
                <Text style={[styles.confirmBannerText, { color: '#166534' }]}>
                  Appointment on {formatFullDate(selectedDate)} at {selectedTime}
                </Text>
              </View>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Additional Information</Text>
            <Text style={[styles.subtitle, { color: t.colors.muted }]}>
              Any specific instructions or concerns? (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                { color: t.colors.foreground, borderColor: t.colors.border, backgroundColor: t.colors.background },
              ]}
              placeholder={NOTES_PLACEHOLDER}
              placeholderTextColor={t.colors.muted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            <View style={[styles.reminderBox, { backgroundColor: t.colors.accentLight }]}>
              <Text style={[styles.reminderTitle, { color: accent }]}>Important reminders</Text>
              {VACCINE_REMINDERS.map((line, i) => (
                <Text key={i} style={[styles.reminderBullet, { color: t.colors.foreground }]}>
                  • {line}
                </Text>
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Review booking</Text>
            <Text style={[styles.subtitle, { color: t.colors.muted }]}>Confirm details before payment</Text>
            <View style={[styles.summaryCard, { borderColor: t.colors.border }]}>
              <Row label="Pet" value={pet ? `${pet.name} · ${pet.breed}` : '—'} muted={t.colors.muted} foreground={t.colors.foreground} />
              <Row
                label="Vaccines"
                value={selectedVaccines.map((v) => v.name).join(', ') || '—'}
                muted={t.colors.muted}
                foreground={t.colors.foreground}
              />
              <Row
                label="Schedule"
                value={selectedTime ? `${formatFullDate(selectedDate)} @ ${selectedTime}` : '—'}
                muted={t.colors.muted}
                foreground={t.colors.foreground}
              />
              <Row label="Clinic" value={vet.clinic} muted={t.colors.muted} foreground={t.colors.foreground} />
              <Text style={[styles.summaryAddr, { color: t.colors.muted }]}>{vet.address}</Text>
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Payment</Text>
            <View style={[styles.summaryCard, { borderColor: t.colors.border, marginBottom: 16 }]}>
              <Row label="Pet" value={pet?.name ?? '—'} muted={t.colors.muted} foreground={t.colors.foreground} />
              <Row label="Vaccines" value={selectedVaccines.map((v) => v.name).join(', ')} muted={t.colors.muted} foreground={t.colors.foreground} />
              <Row label="Date & time" value={selectedTime ? `${formatFullDate(selectedDate)} · ${selectedTime}` : '—'} muted={t.colors.muted} foreground={t.colors.foreground} />
              <Text style={[styles.summaryAddr, { color: t.colors.muted, marginTop: 8 }]}>{vet.address}</Text>
            </View>
            <Text style={[styles.sectionSmall, { color: t.colors.foreground }]}>Payment method</Text>
            {(
              [
                ['upi', 'UPI Payment', 'phone-portrait-outline'] as const,
                ['card', 'Credit/Debit Card', 'card-outline'] as const,
              ] as const
            ).map(([id, label, icon]) => {
              const sel = paymentMethod === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.payRow, { borderColor: sel ? accent : t.colors.border }]}
                  onPress={() => setPaymentMethod(id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={icon} size={22} color={sel ? accent : t.colors.muted} />
                  <Text style={[styles.payRowText, { color: t.colors.foreground, flex: 1 }]}>{label}</Text>
                  <View style={[styles.radio, { borderColor: sel ? accent : t.colors.muted }]}>
                    {sel && <View style={[styles.radioInner, { backgroundColor: accent }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={[styles.promoRow, { borderColor: t.colors.border }]}>
              <TextInput
                style={[styles.promoInput, { color: t.colors.foreground }]}
                placeholder="Promo code"
                placeholderTextColor={t.colors.muted}
                value={promoInput}
                onChangeText={setPromoInput}
              />
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: accent }]} onPress={applyPromo}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.promoHint, { color: t.colors.muted }]}>Try VACC100 for ₹100 off.</Text>
            <View style={[styles.priceBox, { borderColor: t.colors.border }]}>
              <View style={styles.priceLine}>
                <Text style={{ color: t.colors.muted }}>
                  Vaccination fee ({selectedVaccines.length} vaccine{selectedVaccines.length !== 1 ? 's' : ''})
                </Text>
                <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>₹{vaccinesSubtotal}</Text>
              </View>
              <View style={styles.priceLine}>
                <Text style={{ color: t.colors.muted }}>Platform fee</Text>
                <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>₹{PLATFORM_FEE_INR}</Text>
              </View>
              {promoDiscount > 0 && (
                <View style={styles.priceLine}>
                  <Text style={{ color: t.colors.success }}>Discount</Text>
                  <Text style={{ color: t.colors.success, fontWeight: '600' }}>-₹{promoDiscount}</Text>
                </View>
              )}
              <View style={[styles.priceLine, styles.priceTotalRow, { borderTopColor: t.colors.border }]}>
                <Text style={{ color: t.colors.foreground, fontWeight: '800' }}>Total amount</Text>
                <Text style={{ color: accent, fontWeight: '800', fontSize: 18 }}>₹{totalInr}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: t.colors.background,
            borderTopColor: t.colors.border,
          },
        ]}
      >
        {step < STEPS - 1 ? (
          <View style={styles.footerRow}>
            {step > 0 && (
              <TouchableOpacity
                style={[styles.backFooterBtn, { borderColor: t.colors.border }]}
                onPress={goBack}
                activeOpacity={0.85}
              >
                <Text style={[styles.backFooterText, { color: t.colors.foreground }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.continueBtn,
                { backgroundColor: accent },
                (step === 0 && !petId) || !canContinue() ? { opacity: 0.45 } : null,
                step === 0 ? { flex: 1 } : { flex: 1 },
              ]}
              disabled={(step === 0 && !petId) || !canContinue()}
              onPress={goNext}
              activeOpacity={0.9}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.backFooterBtn, { borderColor: t.colors.border }]}
              onPress={goBack}
              activeOpacity={0.85}
            >
              <Text style={[styles.backFooterText, { color: t.colors.foreground }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: accent, flex: 1 }, payLoading ? { opacity: 0.7 } : null]}
              onPress={confirmPay}
              disabled={payLoading}
              activeOpacity={0.9}
            >
              {payLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.continueText}>Pay ₹{totalInr}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function Row({ label, value, muted, foreground }: { label: string; value: string; muted: string; foreground: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: muted, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: foreground, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backRound: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 14, fontWeight: '600' },
  progressWrap: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  scrollPad: { paddingHorizontal: H_PAD, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  petAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e2e8f0' },
  petName: { fontSize: 18, fontWeight: '800' },
  petMeta: { fontSize: 14, marginTop: 4 },
  vaccineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineCardTitle: { fontSize: 16, fontWeight: '700' },
  vaccineCardPrice: { fontSize: 17, fontWeight: '800' },
  dateStrip: { gap: 10, paddingVertical: 20 },
  dateChip: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  dateChipTop: { fontSize: 12, fontWeight: '600' },
  dateChipDay: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  timeChipText: { fontSize: 14, fontWeight: '600' },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  confirmBannerText: { fontSize: 14, fontWeight: '700', flex: 1 },
  notesInput: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  reminderBox: { marginTop: 20, padding: 16, borderRadius: 14 },
  reminderTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  reminderBullet: { fontSize: 14, lineHeight: 22, marginBottom: 6 },
  summaryCard: { marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  summaryAddr: { fontSize: 14, lineHeight: 20 },
  sectionSmall: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
  },
  payRowText: { fontSize: 16, fontWeight: '600' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  promoRow: {
    flexDirection: 'row',
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  promoInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  applyBtn: { paddingHorizontal: 20, justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700' },
  promoHint: { fontSize: 13, marginTop: 8 },
  priceBox: { marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceTotalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  backFooterBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  backFooterText: { fontSize: 16, fontWeight: '700' },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
