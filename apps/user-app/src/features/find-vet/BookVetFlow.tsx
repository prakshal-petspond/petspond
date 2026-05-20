import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { Ionicons } from '@expo/vector-icons';
import type { Pet, PublicClinicDetail } from '@petspond/types';
import { startVetBookingCheckout } from '@/services/vetBookingPayment';
import { fetchClinicDetail } from '@/services/catalog';
import { createConsultationBooking, confirmConsultationPayment } from '@/services/userBookings';
import { TIME_SLOT_DEFS, scheduledAtFromDateAndSlot } from '@/lib/bookingTime';
import { slotsForDoctorOnDate } from '@/lib/vetAvailability';

const H_PAD = 16;

const REASONS: {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'checkup', label: 'General Check-up', icon: 'medical-outline' },
  { id: 'vax', label: 'Vaccination', icon: 'bandage-outline' },
  { id: 'illness', label: 'Illness/Symptoms', icon: 'pulse-outline' },
  { id: 'injury', label: 'Injury/Emergency', icon: 'warning-outline' },
  { id: 'followup', label: 'Follow-up Visit', icon: 'heart-outline' },
  { id: 'behavior', label: 'Behavioral Issues', icon: 'paw-outline' },
];

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

type PaymentMethod = 'card' | 'upi' | 'clinic';

type SlotDef = (typeof TIME_SLOT_DEFS)[number];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function BookVetFlow() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client, token } = useApi();
  const accent = t.colors.accent;

  const [detail, setDetail] = useState<PublicClinicDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [petId, setPetId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const dates = useMemo(() => buildDateStrip(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]!);
  const [selectedSlot, setSelectedSlot] = useState<SlotDef | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [payLoading, setPayLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paidStripeSession, setPaidStripeSession] = useState<string | undefined>();

  useEffect(() => {
    if (!clinicId) return;
    let c = false;
    fetchClinicDetail(client, String(clinicId))
      .then((d) => {
        if (!c) {
          setDetail(d);
          setSelectedVetId(d.doctors[0]?.id ?? null);
        }
      })
      .catch(() => {
        if (!c) setLoadErr(getNetworkErrorHelp());
      });
    return () => {
      c = true;
    };
  }, [client, clinicId]);

  useEffect(() => {
    if (!token) {
      setPets([]);
      return;
    }
    let c = false;
    client
      .get<Pet[]>('/user/pets')
      .then((list) => {
        if (!c) setPets(list);
      })
      .catch(() => {
        if (!c) setPets([]);
      });
    return () => {
      c = true;
    };
  }, [client, token]);

  const assignedDoctor = useMemo(() => {
    if (!detail?.doctors?.length) return undefined;
    return detail.doctors.find((d) => d.id === selectedVetId) ?? detail.doctors[0];
  }, [detail, selectedVetId]);

  const availableSlots = useMemo(
    () => slotsForDoctorOnDate(selectedDate, assignedDoctor?.weeklyAvailability, TIME_SLOT_DEFS),
    [selectedDate, assignedDoctor]
  );

  useEffect(() => {
    setSelectedSlot((prev) => {
      if (!prev) return null;
      const ok = availableSlots.some(
        (s) => s.hour === prev.hour && s.minute === prev.minute && s.label === prev.label
      );
      return ok ? prev : null;
    });
  }, [availableSlots]);

  const pet = pets.find((p) => p.id === petId);
  const petDetailLine = pet
    ? `${pet.species} · ${pet.breed}${pet.weight != null ? ` · ${pet.weight} kg` : ''}`
    : '';

  const subtotalInr = 0;
  const totalInr = Math.max(0, subtotalInr - promoDiscount);

  const toggleReason = useCallback((id: string) => {
    setReasons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const applyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'SAVE100') setPromoDiscount(100);
    else {
      Alert.alert('Promo code', 'Invalid or expired code. Try SAVE100.');
      return;
    }
    Alert.alert('Promo applied', '₹100 off applied.');
  }, [promoInput]);

  const reasonLabels = reasons
    .map((id) => REASONS.find((r) => r.id === id)?.label)
    .filter(Boolean) as string[];

  const goNext = () => {
    if (step === 0 && !petId) return;
    if (step === 1 && reasons.length === 0) return;
    if (step === 2 && !selectedSlot) return;
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) router.back();
    else if (bookingId) router.replace(`/find-vet/${clinicId ?? ''}`);
    else setStep((s) => s - 1);
  };

  const confirmPayment = async () => {
    if (!detail || !pet || !selectedSlot || !assignedDoctor || !clinicId) return;
    if (!token) {
      Alert.alert('Sign in required', 'Please complete onboarding and sign in to book.');
      return;
    }

    const discountPaise = Math.round(promoDiscount * 100);
    const scheduledAt = scheduledAtFromDateAndSlot(selectedDate, selectedSlot);

    setPayLoading(true);
    try {
      const booking = await createConsultationBooking(client, {
        clinicId: String(clinicId),
        vetId: assignedDoctor.id,
        petId: pet.id,
        reasonIds: reasons,
        notes: notes || undefined,
        scheduledAt,
        promoCode: promoInput.trim() || undefined,
        paymentMethodLabel: paymentMethod,
        discountPaise: discountPaise > 0 ? discountPaise : undefined,
      });

      if (paymentMethod === 'clinic') {
        await confirmConsultationPayment(client, booking.id);
        setBookingId(booking.id);
        setStep(5);
        return;
      }

      const amountPaise = booking.totalPaise;
      const description = `${detail.name} — ${pet.name} — ${reasonLabels.join(', ') || 'Visit'} (#${booking.id})`;

      const result = await startVetBookingCheckout(client, {
        amountPaise,
        vetId: assignedDoctor.id,
        description,
      });

      if (result.status === 'cancelled') {
        Alert.alert('Payment', 'Checkout was cancelled.');
        return;
      }
      if (result.status === 'error') {
        Alert.alert('Payment', result.message);
        return;
      }

      if (result.status === 'paid' || result.status === 'mock_ok') {
        const stripeSessionId = result.status === 'paid' ? result.stripeSessionId : undefined;
        if (stripeSessionId) setPaidStripeSession(stripeSessionId);
        await confirmConsultationPayment(client, booking.id, stripeSessionId);
        setBookingId(booking.id);
        setStep(5);
      }
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Booking failed';
      Alert.alert('Booking', msg);
    } finally {
      setPayLoading(false);
    }
  };

  if (loadErr || !detail || !assignedDoctor) {
    return (
      <View
        style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.solid_white }]}
      >
        <Text style={{ padding: H_PAD, color: t.colors.text_secondary }}>
          {loadErr ?? 'Unable to load clinic.'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerSubtitle = bookingId ? 'Confirmed' : `Step ${Math.min(step + 1, 5)} of 5`;

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.solid_white }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: t.colors.inactive_bg_alpha },
        ]}
      >
        <TouchableOpacity style={styles.backRound} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerStep, { color: t.colors.text_secondary }]}>
          {headerSubtitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {step < 5 && (
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <>
              <Text style={[styles.title, { color: t.colors.text_primary }]}>Select Your Pet</Text>
              <Text style={[styles.subtitle, { color: t.colors.text_secondary }]}>
                Which pet needs care?
              </Text>
              {!token && (
                <Text style={[styles.subtitle, { color: t.colors.text_secondary, marginTop: 12 }]}>
                  Sign in (complete onboarding) to load your pets and book.
                </Text>
              )}
              {detail.doctors.length > 1 && (
                <>
                  <Text
                    style={[styles.notesLabel, { color: t.colors.text_primary, marginTop: 20 }]}
                  >
                    Veterinarian
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {detail.doctors.map((d) => {
                      const sel = selectedVetId === d.id;
                      return (
                        <TouchableOpacity
                          key={d.id}
                          style={[
                            styles.timeChip,
                            {
                              borderColor: sel ? accent : t.colors.inactive_bg_alpha,
                              backgroundColor: sel ? t.colors.primary_light : t.colors.solid_white,
                            },
                          ]}
                          onPress={() => setSelectedVetId(d.id)}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              { color: sel ? accent : t.colors.text_primary },
                            ]}
                          >
                            {d.fullName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
              <View style={{ marginTop: 20, gap: 12 }}>
                {pets.length === 0 ? (
                  <Text style={{ color: t.colors.text_secondary }}>
                    {token ? 'No pets yet. Add pets via your profile (API: POST /user/pets).' : '—'}
                  </Text>
                ) : (
                  pets.map((p) => {
                    const sel = petId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.petCard,
                          {
                            borderColor: sel ? accent : t.colors.inactive_bg_alpha,
                            backgroundColor: sel ? t.colors.primary_light : t.colors.solid_white,
                          },
                        ]}
                        onPress={() => setPetId(p.id)}
                        activeOpacity={0.85}
                      >
                        <View
                          style={[
                            styles.petAvatar,
                            { backgroundColor: t.colors.inactive_bg_alpha },
                          ]}
                        >
                          <Ionicons name="paw" size={28} color={t.colors.text_secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.petName, { color: t.colors.text_primary }]}>
                            {p.name}
                          </Text>
                          <Text style={[styles.petDetail, { color: t.colors.text_secondary }]}>
                            {p.species} · {p.breed}
                            {p.weight != null ? ` · ${p.weight} kg` : ''}
                          </Text>
                        </View>
                        {sel && <Ionicons name="checkmark-circle" size={26} color={accent} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={[styles.title, { color: t.colors.text_primary }]}>Reason for Visit</Text>
              <Text style={[styles.subtitle, { color: t.colors.text_secondary }]}>
                What&apos;s the reason for visit? Select all that apply.
              </Text>
              <View style={styles.reasonGrid}>
                {REASONS.map((r) => {
                  const sel = reasons.includes(r.id);
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reasonCell,
                        {
                          borderColor: sel ? accent : t.colors.inactive_bg_alpha,
                          backgroundColor: sel ? t.colors.primary_light : t.colors.solid_white,
                        },
                      ]}
                      onPress={() => toggleReason(r.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={r.icon}
                        size={26}
                        color={sel ? accent : t.colors.text_secondary}
                      />
                      <Text
                        style={[styles.reasonLabel, { color: t.colors.text_primary }]}
                        numberOfLines={2}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.notesLabel, { color: t.colors.text_primary }]}>
                Additional Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    color: t.colors.text_primary,
                    borderColor: t.colors.inactive_bg_alpha,
                    backgroundColor: t.colors.solid_white,
                  },
                ]}
                placeholder="Describe symptoms, behaviors, or other specific concerns..."
                placeholderTextColor={t.colors.text_secondary}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[styles.title, { color: t.colors.text_primary }]}>
                Select Date & Time
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateStrip}
              >
                {dates.map((d, i) => {
                  const sel = sameDay(d, selectedDate);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.dateChip,
                        {
                          borderColor: sel ? accent : t.colors.inactive_bg_alpha,
                          backgroundColor: sel ? accent : t.colors.solid_white,
                        },
                      ]}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dateChipTop,
                          { color: sel ? '#fff' : t.colors.text_secondary },
                        ]}
                      >
                        {d.toLocaleDateString(undefined, { weekday: 'short' })}
                      </Text>
                      <Text
                        style={[
                          styles.dateChipDay,
                          { color: sel ? '#fff' : t.colors.text_primary },
                        ]}
                      >
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {availableSlots.length === 0 ? (
                <Text style={{ color: t.colors.text_secondary, marginTop: 12 }}>
                  No bookable times on this day for {assignedDoctor.fullName}. Pick another date or
                  ask the clinic to widen hours in Vet CRM (Schedule).
                </Text>
              ) : (
                <View style={styles.timeGrid}>
                  {availableSlots.map((slot) => {
                    const sel =
                      selectedSlot?.label === slot.label &&
                      selectedSlot?.hour === slot.hour &&
                      selectedSlot?.minute === slot.minute;
                    return (
                      <TouchableOpacity
                        key={`${slot.hour}-${slot.minute}`}
                        style={[
                          styles.timeChip,
                          {
                            borderColor: sel ? accent : t.colors.inactive_bg_alpha,
                            backgroundColor: sel ? t.colors.primary_light : t.colors.solid_white,
                          },
                        ]}
                        onPress={() => setSelectedSlot(slot)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            { color: sel ? accent : t.colors.text_primary },
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={[styles.title, { color: t.colors.text_primary }]}>
                Review Appointment
              </Text>
              <Text style={[styles.summaryHead, { color: t.colors.text_secondary }]}>
                Appointment Summary
              </Text>
              <View style={[styles.summaryCard, { borderColor: t.colors.inactive_bg_alpha }]}>
                <Text style={[styles.summarySection, { color: t.colors.text_secondary }]}>Pet</Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="paw" size={22} color={accent} />
                  <View>
                    <Text style={[styles.summaryBold, { color: t.colors.text_primary }]}>
                      {pet?.name ?? '—'}
                    </Text>
                    <Text style={{ color: t.colors.text_secondary, fontSize: 14 }}>
                      {petDetailLine}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.summarySection, { color: t.colors.text_secondary, marginTop: 14 }]}
                >
                  Veterinarian
                </Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="person-circle-outline" size={40} color={accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryBold, { color: t.colors.text_primary }]}>
                      {assignedDoctor.fullName}
                    </Text>
                    <Text style={{ color: t.colors.text_secondary, fontSize: 14 }}>
                      {assignedDoctor.displayTitle} ·{' '}
                      {assignedDoctor.specializations.join(', ') || 'Vet'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.summarySection, { color: t.colors.text_secondary, marginTop: 14 }]}
                >
                  Reason for Visit
                </Text>
                <View style={styles.tagRow}>
                  {reasonLabels.map((label) => (
                    <View
                      key={label}
                      style={[styles.tag, { backgroundColor: t.colors.primary_light }]}
                    >
                      <Text style={[styles.tagText, { color: accent }]}>{label}</Text>
                    </View>
                  ))}
                </View>
                <Text
                  style={[styles.summarySection, { color: t.colors.text_secondary, marginTop: 14 }]}
                >
                  Schedule
                </Text>
                <Text style={[styles.summaryBold, { color: t.colors.text_primary }]}>
                  {formatFullDate(selectedDate)} @ {selectedSlot?.label ?? '—'}
                </Text>
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={[styles.title, { color: t.colors.text_primary }]}>
                Review Appointment
              </Text>
              <Text style={[styles.subtitle, { color: t.colors.text_secondary }]}>Payment</Text>
              <View style={[styles.promoRow, { borderColor: t.colors.inactive_bg_alpha }]}>
                <TextInput
                  style={[styles.promoInput, { color: t.colors.text_primary }]}
                  placeholder="Promo code"
                  placeholderTextColor={t.colors.text_secondary}
                  value={promoInput}
                  onChangeText={setPromoInput}
                />
                <TouchableOpacity
                  style={[styles.applyBtn, { backgroundColor: accent }]}
                  onPress={applyPromo}
                >
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.paySection, { color: t.colors.text_primary }]}>
                Payment method
              </Text>
              {(
                [
                  ['card', 'Credit/Debit Card', 'card-outline'] as const,
                  ['upi', 'UPI Payment', 'phone-portrait-outline'] as const,
                  ['clinic', 'Pay At Clinic', 'business-outline'] as const,
                ] as const
              ).map(([id, label, icon]) => {
                const sel = paymentMethod === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.payRow,
                      { borderColor: sel ? accent : t.colors.inactive_bg_alpha },
                    ]}
                    onPress={() => setPaymentMethod(id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={sel ? accent : t.colors.text_secondary}
                    />
                    <Text style={[styles.payRowText, { color: t.colors.text_primary, flex: 1 }]}>
                      {label}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: sel ? accent : t.colors.text_secondary },
                      ]}
                    >
                      {sel && <View style={[styles.radioInner, { backgroundColor: accent }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {paymentMethod === 'upi' && (
                <Text style={{ color: t.colors.text_secondary, fontSize: 13, marginTop: 8 }}>
                  UPI is processed securely via Stripe Checkout when your API has STRIPE_SECRET_KEY
                  set.
                </Text>
              )}
              <View style={[styles.priceBox, { borderColor: t.colors.inactive_bg_alpha }]}>
                {promoDiscount > 0 && (
                  <View style={styles.priceLine}>
                    <Text style={{ color: t.colors.success }}>Discount</Text>
                    <Text style={{ color: t.colors.success, fontWeight: '600' }}>
                      -₹{promoDiscount}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.priceLine,
                    {
                      marginTop: promoDiscount > 0 ? 8 : 0,
                      paddingTop: promoDiscount > 0 ? 8 : 0,
                      borderTopWidth: promoDiscount > 0 ? 1 : 0,
                      borderTopColor: t.colors.inactive_bg_alpha,
                    },
                  ]}
                >
                  <Text style={{ color: t.colors.text_primary, fontWeight: '800' }}>Total</Text>
                  <Text style={{ color: accent, fontWeight: '800', fontSize: 18 }}>
                    ₹{totalInr}
                  </Text>
                </View>
                <Text style={{ color: t.colors.text_secondary, fontSize: 12, marginTop: 8 }}>
                  Consultation pricing is arranged with the clinic; no app fee is charged for this
                  booking flow.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {step === 5 && bookingId && (
        <ScrollView
          contentContainerStyle={[styles.scrollPad, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.successBanner, { backgroundColor: t.colors.success }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successId}>Booking ID: {bookingId}</Text>
          </View>
          <View
            style={[styles.summaryCard, { borderColor: t.colors.inactive_bg_alpha, marginTop: 16 }]}
          >
            <View style={styles.summaryRow}>
              <Ionicons name="person-circle-outline" size={44} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryBold, { color: t.colors.text_primary }]}>
                  {assignedDoctor.fullName}
                </Text>
                <Text style={{ color: t.colors.text_secondary, fontSize: 14 }}>
                  {assignedDoctor.displayTitle} ·{' '}
                  {assignedDoctor.specializations.join(', ') || 'Vet'}
                </Text>
              </View>
            </View>
            <Text style={{ color: t.colors.text_secondary, marginTop: 12, fontSize: 14 }}>
              {pet?.name} · {reasonLabels.join(', ') || 'Consultation'}
            </Text>
            <Text style={[styles.summaryBold, { color: t.colors.text_primary, marginTop: 8 }]}>
              {selectedDate.toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              at {selectedSlot?.label}
            </Text>
            <View style={[styles.locInline, { marginTop: 10 }]}>
              <Ionicons name="location" size={18} color={accent} />
              <Text style={{ color: t.colors.text_primary, flex: 1, marginLeft: 8 }}>
                {detail.name}
              </Text>
            </View>
            <Text style={{ color: t.colors.text_secondary, fontSize: 13, marginTop: 4 }}>
              {detail.address}
            </Text>
          </View>
          <View
            style={[styles.priceBox, { borderColor: t.colors.inactive_bg_alpha, marginTop: 14 }]}
          >
            <View style={styles.priceLine}>
              <Text style={{ color: t.colors.text_secondary }}>Consultation + platform</Text>
              <Text style={{ color: t.colors.text_primary }}>₹{subtotalInr}</Text>
            </View>
            {promoDiscount > 0 && (
              <View style={styles.priceLine}>
                <Text style={{ color: t.colors.success }}>Discount</Text>
                <Text style={{ color: t.colors.success }}>-₹{promoDiscount}</Text>
              </View>
            )}
            <View style={styles.priceLine}>
              <Text style={{ color: t.colors.text_secondary }}>Payment method</Text>
              <Text style={{ color: t.colors.text_primary }}>
                {paymentMethod === 'clinic'
                  ? 'Pay at clinic'
                  : paymentMethod === 'upi'
                    ? 'UPI (Stripe)'
                    : 'Card (Stripe)'}
              </Text>
            </View>
            {paidStripeSession && (
              <Text
                style={{ fontSize: 11, color: t.colors.text_secondary, marginTop: 6 }}
                numberOfLines={1}
              >
                Stripe session: {paidStripeSession}
              </Text>
            )}
            <View style={[styles.priceLine, { marginTop: 8 }]}>
              <Text style={{ fontWeight: '800', color: t.colors.text_primary }}>Total paid</Text>
              <Text style={{ fontWeight: '800', color: accent, fontSize: 18 }}>
                ₹{paymentMethod === 'clinic' ? 0 : totalInr}
              </Text>
            </View>
          </View>
          <Text style={[styles.notesLabel, { color: t.colors.text_primary, marginTop: 20 }]}>
            Important
          </Text>
          <Text style={{ color: t.colors.text_secondary, lineHeight: 22, fontSize: 14 }}>
            • Arrive 10 minutes early with your pet&apos;s medical records{'\n'}• Cancel or
            reschedule up to 2 hours before
            {'\n'}
            {paymentMethod === 'clinic' ? '• Pay consultation fee at the clinic front desk\n' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryRow, { marginTop: 16 }]}
            onPress={() => router.replace('/')}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={20} color={accent} />
            <Text style={{ color: accent, fontWeight: '700', marginLeft: 8 }}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step < 5 && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: t.colors.solid_white,
              borderTopColor: t.colors.inactive_bg_alpha,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueBtn,
              { backgroundColor: accent },
              (step === 0 && !petId) ||
              (step === 1 && reasons.length === 0) ||
              (step === 2 && !selectedSlot) ||
              payLoading
                ? { opacity: 0.45 }
                : null,
            ]}
            disabled={
              (step === 0 && !petId) ||
              (step === 1 && reasons.length === 0) ||
              (step === 2 && !selectedSlot) ||
              payLoading
            }
            onPress={step === 4 ? confirmPayment : goNext}
            activeOpacity={0.9}
          >
            {payLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.continueText}>
                  {step === 4
                    ? `Confirm Appointment — ₹${paymentMethod === 'clinic' ? 0 : totalInr}`
                    : 'Continue'}
                </Text>
                {step < 4 && <Ionicons name="chevron-forward" size={22} color="#fff" />}
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
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
  headerStep: { fontSize: 14, fontWeight: '600' },
  scrollPad: { paddingHorizontal: H_PAD, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  petAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: { fontSize: 18, fontWeight: '700' },
  petDetail: { fontSize: 14, marginTop: 2 },
  petWeight: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  reasonCell: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
    minHeight: 100,
    justifyContent: 'center',
  },
  reasonLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  notesLabel: { fontSize: 15, fontWeight: '700', marginTop: 24 },
  notesInput: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
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
  summaryHead: { fontSize: 14, fontWeight: '600', marginTop: 8, letterSpacing: 0.3 },
  summaryCard: { marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  summarySection: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryBold: { fontSize: 17, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  tagText: { fontSize: 13, fontWeight: '600' },
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
  paySection: { fontSize: 17, fontWeight: '700', marginTop: 24 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 10,
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
  priceBox: { marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  successBanner: { borderRadius: 16, padding: 28, alignItems: 'center' },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  successId: { color: 'rgba(255,255,255,0.95)', fontSize: 15, marginTop: 8, fontWeight: '600' },
  locInline: { flexDirection: 'row', alignItems: 'center' },
  secondaryRow: { flexDirection: 'row', alignItems: 'center' },
});
