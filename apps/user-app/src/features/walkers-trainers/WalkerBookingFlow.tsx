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
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import { getWalkerProfile } from './walkersData';
import { startVetBookingCheckout } from '@/services/vetBookingPayment';
import {
  WALKER_BOOKING_PETS,
  WALKER_BOOKING_PLATFORM_FEE_INR,
  servicesForCategory,
  WALKER_DEFAULT_ADDRESSES,
  WALKER_TIME_SLOTS,
  type WalkerServiceCategory,
  type WalkerServiceOption,
} from './walkerBookingData';

const H_PAD = 16;
const STEPS = 6;
const { width: SCREEN_W } = Dimensions.get('window');
const PET_CELL = (SCREEN_W - H_PAD * 2 - 12) / 2;

function buildMonthDateStrip(): Date[] {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    out.push(x);
  }
  return out;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatReviewDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function WalkerBookingFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client } = useApi();
  const accent = t.colors.accent ?? t.colors.primary;

  const profile = id ? getWalkerProfile(String(id)) : null;

  const [step, setStep] = useState(0);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(['p4']);
  const [serviceCategory, setServiceCategory] = useState<WalkerServiceCategory>('walking');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>('w30');
  const dates = useMemo(() => buildMonthDateStrip(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]!);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>('a1');
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cash'>('card');
  const [payLoading, setPayLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paidTotal, setPaidTotal] = useState(0);

  const serviceOptions = servicesForCategory(serviceCategory);
  const selectedService = serviceOptions.find((s) => s.id === selectedServiceId) ?? null;
  const selectedPets = WALKER_BOOKING_PETS.filter((p) => selectedPetIds.includes(p.id));
  const selectedAddress = WALKER_DEFAULT_ADDRESSES.find((a) => a.id === addressId) ?? null;

  const serviceUnits = Math.max(1, selectedPetIds.length);
  const serviceSubtotal = selectedService ? selectedService.priceInr * serviceUnits : 0;
  const totalBeforePromo = serviceSubtotal + WALKER_BOOKING_PLATFORM_FEE_INR;
  const totalInr = Math.max(0, totalBeforePromo - promoDiscount);

  const togglePet = useCallback((petId: string) => {
    setSelectedPetIds((prev) => (prev.includes(petId) ? prev.filter((x) => x !== petId) : [...prev, petId]));
  }, []);

  const applyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'WALK50') {
      setPromoDiscount(50);
      Alert.alert('Promo applied', '₹50 off with WALK50.');
    } else {
      Alert.alert('Promo', 'Try WALK50 for ₹50 off.');
    }
  }, [promoInput]);

  const goBack = () => {
    if (step === 0) router.back();
    else if (step === 6) router.replace('/');
    else setStep((s) => s - 1);
  };

  const canContinue = () => {
    if (step === 0) return selectedPetIds.length > 0;
    if (step === 1) return !!selectedServiceId;
    if (step === 2) return !!selectedTime;
    if (step === 3) return !!addressId;
    if (step === 4) return true;
    return false;
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (step < STEPS - 1) setStep((s) => s + 1);
  };

  const completePayment = async () => {
    if (!profile || !selectedService || !selectedAddress) return;

    if (paymentMethod === 'cash') {
      setPaidTotal(totalInr);
      setBookingId(`BK${Math.floor(100000 + Math.random() * 900000)}`);
      setStep(6);
      return;
    }

    setPayLoading(true);
    try {
      const amountPaise = Math.round(totalInr * 100);
      const desc = `Walker — ${profile.name} — ${selectedService.label} — ${selectedPets.map((p) => p.name).join(', ')}`;
      const result = await startVetBookingCheckout(client, {
        amountPaise,
        vetId: `walker-${profile.id}`,
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
      setPaidTotal(totalInr);
      setBookingId(`BK${Math.floor(100000 + Math.random() * 900000)}`);
      setStep(6);
    } finally {
      setPayLoading(false);
    }
  };

  if (!profile) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: t.colors.background }]}>
        <Text style={{ padding: H_PAD, color: t.colors.muted }}>Provider not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: H_PAD }}>
          <Text style={{ color: accent, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const providerBar = (
    <View style={[styles.providerBar, { backgroundColor: t.colors.cardBg, borderBottomColor: t.colors.border }]}>
      <Image source={{ uri: profile.image }} style={styles.providerAvatar} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.providerName, { color: t.colors.foreground }]} numberOfLines={1}>
          {profile.name}
        </Text>
        <Text style={[styles.providerTitle, { color: t.colors.muted }]} numberOfLines={1}>
          {profile.headlineTitle}
        </Text>
      </View>
      <View style={styles.providerRating}>
        <Ionicons name="star" size={14} color="#eab308" />
        <Text style={[styles.providerRatingText, { color: t.colors.foreground }]}>{profile.rating}</Text>
      </View>
    </View>
  );

  if (step === 6 && bookingId) {
    return (
      <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
        <View style={[styles.successBanner, { backgroundColor: t.colors.success, paddingTop: insets.top + 16 }]}>
          <View style={styles.successIconRing}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>Booking ID: {bookingId}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: H_PAD, paddingBottom: insets.bottom + 24 }}>
          <View style={[styles.card, { borderColor: t.colors.border }]}>
            <View style={styles.successProRow}>
              <Image source={{ uri: profile.image }} style={styles.providerAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.providerName, { color: t.colors.foreground }]}>{profile.name}</Text>
                <Text style={[styles.providerTitle, { color: t.colors.muted }]}>{profile.headlineTitle}</Text>
              </View>
            </View>
            <Text style={[styles.successRow, { color: t.colors.muted }]}>
              Pet: <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>{selectedPets.map((p) => p.name).join(', ')}</Text>
            </Text>
            <Text style={[styles.successRow, { color: t.colors.muted }]}>
              Service:{' '}
              <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>{selectedService?.label}</Text>
            </Text>
            <Text style={[styles.successRow, { color: t.colors.muted }]}>
              When:{' '}
              <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>
                {formatLongDate(selectedDate)} at {selectedTime}
              </Text>
            </Text>
            <View style={[styles.successLoc, { marginTop: 10 }]}>
              <Ionicons name="location" size={18} color={accent} />
              <Text style={[styles.successLocText, { color: t.colors.foreground }]}>
                {selectedAddress?.label} · {selectedAddress?.line1}, {selectedAddress?.line2}
              </Text>
            </View>
          </View>

          <Text style={[styles.blockLabel, { color: t.colors.foreground, marginTop: 20 }]}>Payment summary</Text>
          <View style={[styles.card, { borderColor: t.colors.border, marginTop: 8 }]}>
            <View style={styles.priceRow2}>
              <Text style={{ color: t.colors.muted }}>Total paid</Text>
              <Text style={{ color: accent, fontWeight: '800', fontSize: 18 }}>₹{paidTotal}</Text>
            </View>
            <Text style={{ color: t.colors.muted, fontSize: 13, marginTop: 6 }}>Status: Paid</Text>
            <Text style={{ color: t.colors.muted, fontSize: 13 }}>
              Method:{' '}
              {paymentMethod === 'cash' ? 'Cash on service' : paymentMethod === 'upi' ? 'UPI' : 'Card'}
            </Text>
          </View>

          <Text style={[styles.blockLabel, { color: t.colors.foreground, marginTop: 20 }]}>Important</Text>
          <Text style={[styles.notesText, { color: t.colors.muted }]}>
            • Please be ready 10 minutes before the scheduled time{'\n'}• The provider may call you from a private
            number{'\n'}• Cancel or reschedule up to 3 hours before for a full fee credit
          </Text>

          <View style={styles.successActions}>
            <TouchableOpacity style={[styles.outlineBtn2, { borderColor: t.colors.border }]}>
              <Ionicons name="download-outline" size={20} color={t.colors.foreground} />
              <Text style={[styles.outlineBtn2Text, { color: t.colors.foreground }]}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn2, { borderColor: t.colors.border }]}>
              <Ionicons name="share-outline" size={20} color={t.colors.foreground} />
              <Text style={[styles.outlineBtn2Text, { color: t.colors.foreground }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: accent }]}
            onPress={() => Linking.openURL('tel:+911800000000')}
            activeOpacity={0.9}
          >
            <Text style={styles.contactBtnText}>Contact Provider</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Ionicons name="home-outline" size={20} color={accent} />
            <Text style={[styles.homeLinkText, { color: accent }]}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: t.colors.border }]}>
        <TouchableOpacity style={styles.backRound} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={t.colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: t.colors.foreground }]}>Walker</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={[styles.stepText, { color: t.colors.muted, paddingHorizontal: H_PAD }]}>
        Step {step + 1} of {STEPS}
      </Text>
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8 }}>
        <View style={styles.progressWrap}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, { backgroundColor: i <= step ? accent : '#e2e8f0' }]} />
          ))}
        </View>
      </View>
      {providerBar}

      <ScrollView
        contentContainerStyle={[styles.scrollPad, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Select Your Pet(s)</Text>
            <View style={styles.petGrid}>
              {WALKER_BOOKING_PETS.map((pet) => {
                const sel = selectedPetIds.includes(pet.id);
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petCell,
                      {
                        width: PET_CELL,
                        borderColor: sel ? accent : t.colors.border,
                        backgroundColor: sel ? t.colors.accentLight : t.colors.background,
                      },
                    ]}
                    onPress={() => togglePet(pet.id)}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: pet.image }} style={styles.petImg} />
                    <Text style={[styles.petName, { color: t.colors.foreground }]}>{pet.name}</Text>
                    <Text style={[styles.petBreed, { color: t.colors.muted }]} numberOfLines={1}>
                      {pet.breed}
                    </Text>
                    {sel && <Ionicons name="checkmark-circle" size={24} color={accent} style={styles.petCheck} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Select Service(s)</Text>
            <View style={[styles.tabShell, { backgroundColor: '#e7e5e4' }]}>
              {(
                [
                  ['walking', 'Walking'],
                  ['training', 'Training'],
                  ['grooming', 'Grooming'],
                ] as const
              ).map(([cid, label]) => {
                const active = serviceCategory === cid;
                return (
                  <TouchableOpacity
                    key={cid}
                    style={[styles.tabHalf, active && { backgroundColor: '#fff' }]}
                    onPress={() => {
                      setServiceCategory(cid);
                      const next = servicesForCategory(cid);
                      setSelectedServiceId(next[0]?.id ?? null);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.tabHalfText, { color: active ? accent : t.colors.muted }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ marginTop: 16, gap: 12 }}>
              {serviceOptions.map((s: WalkerServiceOption) => {
                const sel = selectedServiceId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.serviceRow,
                      { borderColor: sel ? accent : t.colors.border, backgroundColor: sel ? t.colors.accentLight : t.colors.background },
                    ]}
                    onPress={() => setSelectedServiceId(s.id)}
                    activeOpacity={0.9}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceLabel, { color: t.colors.foreground }]}>{s.label}</Text>
                    </View>
                    <Text style={[styles.servicePrice, { color: accent }]}>₹{s.priceInr}</Text>
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
                      {d.toLocaleDateString(undefined, { month: 'short' })}
                    </Text>
                    <Text style={[styles.dateChipDay, { color: sel ? '#fff' : t.colors.foreground }]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.timeGrid}>
              {WALKER_TIME_SLOTS.map((slot) => {
                const sel = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeCell,
                      {
                        width: (SCREEN_W - H_PAD * 2 - 16) / 3,
                        borderColor: sel ? accent : t.colors.border,
                        backgroundColor: sel ? t.colors.accentLight : t.colors.background,
                      },
                    ]}
                    onPress={() => setSelectedTime(slot)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.timeCellText, { color: sel ? accent : t.colors.foreground }]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.addrHeader}>
              <Text style={[styles.title, { color: t.colors.foreground, marginBottom: 0 }]}>Service Address</Text>
              <TouchableOpacity onPress={() => Alert.alert('Add address', 'Saved addresses coming soon.')}>
                <Text style={{ color: accent, fontWeight: '700' }}>Add New</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16, gap: 12 }}>
              {WALKER_DEFAULT_ADDRESSES.map((a) => {
                const sel = addressId === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.addrCard,
                      { borderColor: sel ? accent : t.colors.border, backgroundColor: sel ? t.colors.accentLight : t.colors.background },
                    ]}
                    onPress={() => setAddressId(a.id)}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="location" size={22} color={accent} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.addrLabel, { color: t.colors.foreground }]}>{a.label}</Text>
                      <Text style={[styles.addrLine, { color: t.colors.muted }]}>
                        {a.line1}, {a.line2}
                      </Text>
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={24} color={accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Review Booking</Text>
            <View style={[styles.reviewCard, { borderColor: t.colors.border }]}>
              <Text style={[styles.reviewKey, { color: t.colors.muted }]}>Selected Pet(s)</Text>
              <Text style={[styles.reviewVal, { color: t.colors.foreground }]}>{selectedPets.map((p) => p.name).join(', ')}</Text>
              <Text style={[styles.reviewKey, { color: t.colors.muted, marginTop: 14 }]}>Selected Service(s)</Text>
              <Text style={[styles.reviewVal, { color: t.colors.foreground }]}>
                {selectedService?.label} — ₹{selectedService?.priceInr}
                {serviceUnits > 1 ? ` × ${serviceUnits}` : ''}
              </Text>
              <Text style={[styles.reviewKey, { color: t.colors.muted, marginTop: 14 }]}>Date & Time</Text>
              <Text style={[styles.reviewVal, { color: t.colors.foreground }]}>
                {formatReviewDate(selectedDate)} | {selectedTime ?? '—'}
              </Text>
              <Text style={[styles.reviewKey, { color: t.colors.muted, marginTop: 14 }]}>Service Address</Text>
              <Text style={[styles.reviewVal, { color: t.colors.foreground }]}>
                {selectedAddress?.label} | {selectedAddress?.line1}, {selectedAddress?.line2}
              </Text>
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Text style={[styles.title, { color: t.colors.foreground }]}>Payment & Checkout</Text>
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
            <Text style={[styles.paySection, { color: t.colors.foreground }]}>Payment method</Text>
            {(
              [
                ['card', 'Credit/Debit Card', 'card-outline'] as const,
                ['upi', 'UPI (Paytm/GPay)', 'phone-portrait-outline'] as const,
                ['cash', 'Cash on Service', 'wallet-outline'] as const,
              ] as const
            ).map(([mid, label, icon]) => {
              const sel = paymentMethod === mid;
              return (
                <TouchableOpacity
                  key={mid}
                  style={[styles.payRow, { borderColor: sel ? accent : t.colors.border }]}
                  onPress={() => setPaymentMethod(mid)}
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
            <View style={[styles.priceBox, { borderColor: t.colors.border }]}>
              <View style={styles.priceRow2}>
                <Text style={{ color: t.colors.muted }}>
                  Service charge ({serviceUnits} unit{serviceUnits !== 1 ? 's' : ''})
                </Text>
                <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>₹{serviceSubtotal}</Text>
              </View>
              <View style={styles.priceRow2}>
                <Text style={{ color: t.colors.muted }}>Platform fee</Text>
                <Text style={{ color: t.colors.foreground, fontWeight: '600' }}>₹{WALKER_BOOKING_PLATFORM_FEE_INR}</Text>
              </View>
              {promoDiscount > 0 && (
                <View style={styles.priceRow2}>
                  <Text style={{ color: t.colors.success }}>Discount</Text>
                  <Text style={{ color: t.colors.success, fontWeight: '600' }}>-₹{promoDiscount}</Text>
                </View>
              )}
              <View style={[styles.priceRow2, { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.colors.border }]}>
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
        {step < 5 ? (
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: accent }, !canContinue() ? { opacity: 0.45 } : null]}
            disabled={!canContinue()}
            onPress={goNext}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: accent }, payLoading ? { opacity: 0.7 } : null]}
            onPress={completePayment}
            disabled={payLoading}
            activeOpacity={0.9}
          >
            {payLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.continueText}>Pay ₹{totalInr}</Text>
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    paddingBottom: 8,
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
  screenTitle: { fontSize: 18, fontWeight: '800' },
  stepText: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  progressWrap: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  providerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  providerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e2e8f0' },
  providerName: { fontSize: 16, fontWeight: '800' },
  providerTitle: { fontSize: 13, marginTop: 2 },
  providerRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  providerRatingText: { fontSize: 15, fontWeight: '700' },
  scrollPad: { paddingHorizontal: H_PAD, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  petGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  petCell: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  petImg: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  petName: { fontSize: 16, fontWeight: '800' },
  petBreed: { fontSize: 13, marginTop: 2 },
  petCheck: { position: 'absolute', top: 8, right: 8 },
  tabShell: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  tabHalf: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabHalfText: { fontSize: 13, fontWeight: '700' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  serviceLabel: { fontSize: 16, fontWeight: '700' },
  servicePrice: { fontSize: 17, fontWeight: '800' },
  dateStrip: { gap: 10, paddingVertical: 8 },
  dateChip: {
    width: 56,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  dateChipTop: { fontSize: 11, fontWeight: '600' },
  dateChipDay: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  timeCell: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeCellText: { fontSize: 13, fontWeight: '700' },
  addrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  addrLabel: { fontSize: 16, fontWeight: '800' },
  addrLine: { fontSize: 14, marginTop: 4 },
  reviewCard: { marginTop: 8, padding: 16, borderRadius: 14, borderWidth: 1 },
  reviewKey: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  reviewVal: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  promoRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  promoInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  applyBtn: { paddingHorizontal: 20, justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700' },
  paySection: { fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 10 },
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
  priceBox: { marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  priceRow2: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
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
  successBanner: { alignItems: 'center', paddingBottom: 28 },
  successIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  successSub: { color: 'rgba(255,255,255,0.95)', fontSize: 15, marginTop: 8, fontWeight: '600' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  successProRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  successRow: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  successLoc: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  successLocText: { flex: 1, fontSize: 14, lineHeight: 20 },
  blockLabel: { fontSize: 16, fontWeight: '800' },
  notesText: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  outlineBtn2: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  outlineBtn2Text: { fontSize: 15, fontWeight: '700' },
  contactBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  contactBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  homeLinkText: { fontSize: 16, fontWeight: '700' },
});
