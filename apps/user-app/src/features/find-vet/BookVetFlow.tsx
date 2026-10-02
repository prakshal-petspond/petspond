import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  ConsultationBooking,
  Pet,
  PublicClinicDetail,
  PublicClinicDoctorPreview,
  VaccinationBooking,
} from '@petspond/types';
import { useApi, useTheme } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import { fetchClinicDetail } from '@/services/catalog';
import { fetchUserPets } from '@/services/pets';
import {
  confirmConsultationPayment,
  confirmVaccinationPayment,
  createConsultationBooking,
  createVaccinationBooking,
} from '@/services/userBookings';
import { slotsForDoctorOnDate } from '@/lib/vetAvailability';
import {
  TIME_SLOT_DEFS,
  formatPaise,
  petAgeLabel,
  scheduledAtFromDateAndSlot,
} from '@/lib/bookingTime';
import { resolvePhotoUrl } from '@/lib/photoUrl';

const H_PAD = 16;
const ANY_DOCTOR_ID = '__any__';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 'confirmed';
type SlotDef = (typeof TIME_SLOT_DEFS)[number];

function clinicPhotoUri(clinic: PublicClinicDetail): string | null {
  const candidates = [
    clinic.listingImage,
    clinic.heroImage,
    clinic.photoGallery?.[0],
    clinic.primaryDoctor.photoUrl,
  ];
  for (const c of candidates) {
    const url = resolvePhotoUrl(c);
    if (url) return url;
  }
  return null;
}

function clinicSpecialtyLabel(clinic: PublicClinicDetail): string | null {
  const spec = clinic.primaryDoctor.specializations?.[0];
  if (spec) return spec;
  return clinic.primaryDoctor.displayTitle ?? null;
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

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSlotInPast(date: Date, slot: SlotDef): boolean {
  const now = new Date();
  if (!sameDay(date, now)) return false;
  const t = new Date(date);
  t.setHours(slot.hour, slot.minute, 0, 0);
  return t.getTime() <= now.getTime();
}

function resolveVetId(
  doctors: PublicClinicDoctorPreview[],
  selectedDoctorId: string | null,
): string | null {
  if (!doctors.length) return null;
  if (selectedDoctorId && selectedDoctorId !== ANY_DOCTOR_ID) {
    return selectedDoctorId;
  }
  const withAvail = doctors.find((d) => d.weeklyAvailability?.length);
  return (withAvail ?? doctors[0]).id;
}

function doctorForAvailability(
  doctors: PublicClinicDoctorPreview[],
  selectedDoctorId: string | null,
): PublicClinicDoctorPreview | undefined {
  if (!doctors.length) return undefined;
  if (selectedDoctorId && selectedDoctorId !== ANY_DOCTOR_ID) {
    return doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0];
  }
  return doctors.find((d) => d.weeklyAvailability?.length) ?? doctors[0];
}

function formatVisitDateTime(date: Date, slot: SlotDef): string {
  const day = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `${day} · ${slot.label}`;
}

function ProgressBar({ step, primary }: { step: WizardStep; primary: string }) {
  const n = step === 'confirmed' ? 6 : step;
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: i <= n ? primary : '#E8EAED' },
          ]}
        />
      ))}
    </View>
  );
}

function ClinicSummaryCard({
  clinic,
  primary,
  textPrimary,
  textSecondary,
  border,
  white,
}: {
  clinic: PublicClinicDetail;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  white: string;
}) {
  const photo = clinicPhotoUri(clinic);
  const specialty = clinicSpecialtyLabel(clinic);
  return (
    <View style={[styles.clinicCard, { backgroundColor: white, borderColor: border }]}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.clinicThumb} />
      ) : (
        <View style={[styles.clinicThumb, styles.clinicThumbPlaceholder, { backgroundColor: border }]}>
          <MaterialCommunityIcons name="hospital-building" size={28} color={textSecondary} />
        </View>
      )}
      <View style={styles.clinicCardBody}>
        <Text style={[styles.clinicCardName, { color: textPrimary }]} numberOfLines={2}>
          {clinic.name}
        </Text>
        {specialty ? (
          <Text style={[styles.clinicCardMeta, { color: primary }]} numberOfLines={1}>
            {specialty}
          </Text>
        ) : null}
        <View style={styles.clinicCardFooter}>
          {clinic.distanceLabel ? (
            <Text style={[styles.clinicCardMeta, { color: textSecondary }]}>
              {clinic.distanceLabel}
            </Text>
          ) : null}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#EAB308" />
            <Text style={[styles.clinicCardMeta, { color: textPrimary, fontWeight: '600' }]}>
              {clinic.rating}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function BookVetFlow({ clinicId }: { clinicId: string }) {
  const t = useTheme();
  const { client, token } = useApi();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const primary = t.colors.primary;

  const [step, setStep] = useState<WizardStep>(1);
  const [clinic, setClinic] = useState<PublicClinicDetail | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [petId, setPetId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedVaccineIds, setSelectedVaccineIds] = useState<string[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(ANY_DOCTOR_ID);

  const dates = useMemo(() => buildDateStrip(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => dates[0]!);
  const [selectedSlot, setSelectedSlot] = useState<SlotDef | null>(null);

  const [remindMe, setRemindMe] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [consultationBooking, setConsultationBooking] = useState<ConsultationBooking | null>(null);
  const [vaccinationBooking, setVaccinationBooking] = useState<VaccinationBooking | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      setLoadError('Clinic not found.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([fetchClinicDetail(client, clinicId), fetchUserPets(client)])
      .then(([detail, petList]) => {
        if (cancelled) return;
        setClinic(detail);
        setPets(petList);
      })
      .catch(() => {
        if (!cancelled) setLoadError(getNetworkErrorHelp());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, clinicId]);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === petId) ?? null,
    [pets, petId],
  );

  const doctors = clinic?.doctors ?? [];
  const availabilityDoctor = useMemo(
    () => doctorForAvailability(doctors, selectedDoctorId),
    [doctors, selectedDoctorId],
  );

  const availableSlots = useMemo(() => {
    if (!availabilityDoctor) return [];
    return slotsForDoctorOnDate(selectedDate, availabilityDoctor.weeklyAvailability);
  }, [selectedDate, availabilityDoctor]);

  const bookableSlots = useMemo(
    () => availableSlots.filter((s) => !isSlotInPast(selectedDate, s)),
    [availableSlots, selectedDate],
  );

  useEffect(() => {
    setSelectedSlot((prev) => {
      if (!prev) return null;
      const ok = bookableSlots.some(
        (s) => s.hour === prev.hour && s.minute === prev.minute,
      );
      return ok ? prev : null;
    });
  }, [bookableSlots]);

  const servicesOffered = clinic?.servicesOffered ?? [];
  const vaccinesOffered = clinic?.vaccinesOffered ?? [];

  const vaccineTotalPaise = useMemo(() => {
    return vaccinesOffered
      .filter((v) => selectedVaccineIds.includes(v.id))
      .reduce((sum, v) => sum + v.pricePaise, 0);
  }, [vaccinesOffered, selectedVaccineIds]);

  const selectedServiceNames = useMemo(
    () =>
      servicesOffered.filter((s) => selectedServiceIds.includes(s.id)).map((s) => s.name),
    [servicesOffered, selectedServiceIds],
  );

  const selectedVaccineLines = useMemo(
    () => vaccinesOffered.filter((v) => selectedVaccineIds.includes(v.id)),
    [vaccinesOffered, selectedVaccineIds],
  );

  const resolvedVetId = useMemo(
    () => resolveVetId(doctors, selectedDoctorId),
    [doctors, selectedDoctorId],
  );

  const doctorDisplayName = useMemo(() => {
    if (selectedDoctorId === ANY_DOCTOR_ID) return 'Any available doctor';
    const d = doctors.find((doc) => doc.id === selectedDoctorId);
    return d?.fullName ?? availabilityDoctor?.fullName ?? '—';
  }, [selectedDoctorId, doctors, availabilityDoctor]);

  const closeFlow = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(`/find-vet/${clinicId}`);
  }, [router, clinicId]);

  const goBack = useCallback(() => {
    if (step === 1) closeFlow();
    else if (step === 'confirmed') router.replace('/');
    else setStep((s) => (typeof s === 'number' ? ((s - 1) as WizardStep) : s));
  }, [step, closeFlow, router]);

  const toggleService = useCallback((id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleVaccine = useCallback((id: string) => {
    setSelectedVaccineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return petId != null;
      case 2:
        return selectedServiceIds.length > 0 || selectedVaccineIds.length > 0;
      case 3:
        return doctors.length > 0 && resolvedVetId != null;
      case 4:
        return selectedSlot != null;
      case 5:
      case 6:
        return true;
      default:
        return false;
    }
  }, [step, petId, selectedServiceIds, selectedVaccineIds, doctors, resolvedVetId, selectedSlot]);

  const goNext = useCallback(() => {
    if (!canContinue) return;
    if (step === 6) return;
    setStep((s) => (typeof s === 'number' ? ((s + 1) as WizardStep) : s));
  }, [canContinue, step]);

  const confirmBooking = useCallback(async () => {
    if (!clinic || !selectedPet || !selectedSlot || !resolvedVetId) return;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to book a visit.');
      return;
    }

    setConfirmLoading(true);
    setConfirmError(null);
    const scheduledAt = scheduledAtFromDateAndSlot(selectedDate, selectedSlot);

    try {
      let consultation: ConsultationBooking | null = null;
      let vaccination: VaccinationBooking | null = null;

      if (selectedServiceIds.length > 0) {
        consultation = await createConsultationBooking(client, {
          clinicId,
          vetId: resolvedVetId,
          petId: selectedPet.id,
          reasonIds: selectedServiceIds,
          scheduledAt,
        });
        consultation = await confirmConsultationPayment(client, consultation.id);
      }

      if (selectedVaccineIds.length > 0) {
        vaccination = await createVaccinationBooking(client, {
          clinicId,
          petId: selectedPet.id,
          vaccineIds: selectedVaccineIds,
          scheduledAt,
        });
        vaccination = await confirmVaccinationPayment(client, vaccination.id);
      }

      setConsultationBooking(consultation);
      setVaccinationBooking(vaccination);
      setStep('confirmed');
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Booking failed. Please try again.';
      setConfirmError(msg);
      Alert.alert('Booking', msg);
    } finally {
      setConfirmLoading(false);
    }
  }, [
    clinic,
    selectedPet,
    selectedSlot,
    resolvedVetId,
    token,
    selectedDate,
    client,
    clinicId,
    selectedServiceIds,
    selectedVaccineIds,
  ]);

  const confirmedTotalPaise = useMemo(() => {
    if (vaccinationBooking) return vaccinationBooking.totalPaise;
    if (consultationBooking) return consultationBooking.totalPaise;
    return vaccineTotalPaise;
  }, [vaccinationBooking, consultationBooking, vaccineTotalPaise]);

  const displayBookingId =
    consultationBooking?.id ?? vaccinationBooking?.id ?? '—';

  const confirmedDoctorName =
    consultationBooking?.vetName ??
    (selectedDoctorId === ANY_DOCTOR_ID
      ? availabilityDoctor?.fullName
      : doctorDisplayName) ??
    '—';

  if (loading) {
    return (
      <View
        style={[
          styles.fill,
          styles.centered,
          { paddingTop: insets.top, backgroundColor: t.colors.grey_bg },
        ]}
      >
        <ActivityIndicator size="large" color={primary} />
        <Text style={[styles.muted, { color: t.colors.text_secondary, marginTop: 12 }]}>
          Loading booking…
        </Text>
      </View>
    );
  }

  if (loadError || !clinic) {
    return (
      <View
        style={[
          styles.fill,
          { paddingTop: insets.top + 16, paddingHorizontal: H_PAD, backgroundColor: t.colors.grey_bg },
        ]}
      >
        <Pressable onPress={closeFlow} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
        </Pressable>
        <Text style={[styles.muted, { color: t.colors.text_secondary }]}>
          {loadError ?? 'Unable to load clinic.'}
        </Text>
      </View>
    );
  }

  if (step === 'confirmed') {
    const visitWhen =
      consultationBooking?.scheduledAt ??
      vaccinationBooking?.scheduledAt ??
      (selectedSlot ? scheduledAtFromDateAndSlot(selectedDate, selectedSlot) : null);

    const visitLabel = visitWhen
      ? new Date(visitWhen).toLocaleString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : formatVisitDateTime(selectedDate, selectedSlot!);

    return (
      <View style={[styles.fill, { backgroundColor: t.colors.grey_bg }]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingHorizontal: H_PAD,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View style={[styles.successBanner, { backgroundColor: t.colors.success_alpha }]}>
            <Ionicons name="checkmark-circle" size={48} color={t.colors.success} />
            <Text style={[styles.successTitle, { color: t.colors.text_primary }]}>
              Booking confirmed
            </Text>
            <Text style={[styles.successSubtitle, { color: t.colors.text_secondary }]}>
              {selectedPet?.name ?? consultationBooking?.petName ?? vaccinationBooking?.petName}{' '}
              with {confirmedDoctorName}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border }]}>
            <Text style={[styles.cardLabel, { color: t.colors.text_secondary }]}>Booking ID</Text>
            <Text style={[styles.bookingId, { color: primary }]}>{displayBookingId}</Text>
            <Text style={[styles.hint, { color: t.colors.text_secondary, marginTop: 8 }]}>
              Show your Booking ID at the front desk
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Visit details</Text>
            <DetailRow label="When" value={visitLabel} textPrimary={t.colors.text_primary} textSecondary={t.colors.text_secondary} />
            <DetailRow label="Clinic" value={clinic.name} textPrimary={t.colors.text_primary} textSecondary={t.colors.text_secondary} />
            <DetailRow label="Address" value={clinic.address} textPrimary={t.colors.text_primary} textSecondary={t.colors.text_secondary} />
            {selectedServiceNames.length > 0 ? (
              <DetailRow
                label="Services"
                value={selectedServiceNames.join(', ')}
                textPrimary={t.colors.text_primary}
                textSecondary={t.colors.text_secondary}
              />
            ) : null}
            {selectedVaccineLines.length > 0 ? (
              <DetailRow
                label="Vaccines"
                value={selectedVaccineLines.map((v) => v.name).join(', ')}
                textPrimary={t.colors.text_primary}
                textSecondary={t.colors.text_secondary}
              />
            ) : null}
            {(confirmedTotalPaise > 0 || selectedVaccineLines.length > 0) && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: t.colors.text_primary }]}>Estimate</Text>
                <Text style={[styles.totalValue, { color: primary }]}>
                  {formatPaise(confirmedTotalPaise)}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: primary, marginTop: 8 }]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const stepNum = step;
  const footerLabel =
    step === 1
      ? petId
        ? '1 pet selected'
        : 'Select a pet'
      : step === 2 && vaccineTotalPaise > 0
        ? `Total ${formatPaise(vaccineTotalPaise)}`
        : step === 6
          ? vaccineTotalPaise > 0
            ? `Total ${formatPaise(vaccineTotalPaise)}`
            : undefined
          : undefined;

  const footerCta = step === 6 ? 'Confirm booking' : 'Continue';

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.grey_bg }]}>
      <View
        style={[
          styles.topChrome,
          {
            paddingTop: insets.top + 8,
            backgroundColor: t.colors.solid_white,
            borderBottomColor: t.colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Pressable onPress={goBack} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={t.colors.text_primary} />
          </Pressable>
          <Pressable onPress={closeFlow} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color={t.colors.text_primary} />
          </Pressable>
        </View>
        <Text style={[styles.flowTitle, { color: t.colors.text_primary }]}>Book a visit</Text>
        <Text style={[styles.stepLabel, { color: t.colors.text_secondary }]}>
          Step {stepNum} of 6
        </Text>
        <ProgressBar step={stepNum} primary={primary} />
        <View style={{ paddingHorizontal: H_PAD, paddingBottom: 12 }}>
          <ClinicSummaryCard
            clinic={clinic}
            primary={primary}
            textPrimary={t.colors.text_primary}
            textSecondary={t.colors.text_secondary}
            border={t.colors.border}
            white={t.colors.solid_white}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: H_PAD,
          paddingTop: 16,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Select pet</Text>
            <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
              Which pet is this visit for?
            </Text>
            {!token ? (
              <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary, marginTop: 8 }]}>
                Sign in to load your pets.
              </Text>
            ) : null}
            {pets.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: t.colors.border, backgroundColor: t.colors.solid_white }]}>
                <Ionicons name="paw-outline" size={32} color={t.colors.text_secondary} />
                <Text style={[styles.emptyText, { color: t.colors.text_secondary }]}>
                  No pets yet. Add a pet from your profile to book a visit.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                {pets.map((p) => {
                  const sel = petId === p.id;
                  const age = petAgeLabel(p.dateOfBirth);
                  const photo = resolvePhotoUrl(p.photoUrl);
                  return (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.selectCard,
                        {
                          borderColor: sel ? primary : t.colors.border,
                          backgroundColor: sel ? t.colors.primary_bg : t.colors.solid_white,
                        },
                      ]}
                      onPress={() => setPetId(p.id)}
                    >
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.petThumb} />
                      ) : (
                        <View style={[styles.petThumb, styles.petThumbPlaceholder, { backgroundColor: t.colors.border }]}>
                          <Ionicons name="paw" size={22} color={t.colors.text_secondary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.petName, { color: t.colors.text_primary }]}>{p.name}</Text>
                        <Text style={[styles.petMeta, { color: t.colors.text_secondary }]}>
                          {[p.breed, age].filter(Boolean).join(' · ')}
                        </Text>
                        {p.medicalNotes?.trim() ? (
                          <View style={[styles.warnBadge, { backgroundColor: '#FFF4E5' }]}>
                            <Ionicons name="alert-circle" size={14} color="#B45309" />
                            <Text style={styles.warnBadgeText} numberOfLines={2}>
                              {p.medicalNotes.trim()}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {sel ? <Ionicons name="checkmark-circle" size={26} color={primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Select services</Text>
            <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
              Choose consultation services and/or vaccines for this visit.
            </Text>

            {servicesOffered.length > 0 ? (
              <>
                <Text style={[styles.groupLabel, { color: t.colors.text_secondary }]}>CONSULTATION</Text>
                <View style={{ gap: 8 }}>
                  {servicesOffered.map((s) => {
                    const sel = selectedServiceIds.includes(s.id);
                    return (
                      <Pressable
                        key={s.id}
                        style={[
                          styles.serviceRow,
                          {
                            borderColor: sel ? primary : t.colors.border,
                            backgroundColor: sel ? t.colors.primary_bg : t.colors.solid_white,
                          },
                        ]}
                        onPress={() => toggleService(s.id)}
                      >
                        <View style={[styles.serviceIcon, { backgroundColor: t.colors.primary_bg }]}>
                          <MaterialCommunityIcons name="medical-bag" size={20} color={primary} />
                        </View>
                        <Text style={[styles.serviceName, { color: t.colors.text_primary, flex: 1 }]}>
                          {s.name}
                        </Text>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: sel ? primary : t.colors.border,
                              backgroundColor: sel ? primary : 'transparent',
                            },
                          ]}
                        >
                          {sel ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {vaccinesOffered.length > 0 ? (
              <>
                <Text style={[styles.groupLabel, { color: t.colors.text_secondary, marginTop: 20 }]}>
                  VACCINATION
                </Text>
                <View style={{ gap: 8 }}>
                  {vaccinesOffered.map((v) => {
                    const sel = selectedVaccineIds.includes(v.id);
                    return (
                      <Pressable
                        key={v.id}
                        style={[
                          styles.serviceRow,
                          {
                            borderColor: sel ? primary : t.colors.border,
                            backgroundColor: sel ? t.colors.primary_bg : t.colors.solid_white,
                          },
                        ]}
                        onPress={() => toggleVaccine(v.id)}
                      >
                        <View style={[styles.serviceIcon, { backgroundColor: t.colors.vaccination_bg }]}>
                          <MaterialCommunityIcons name="needle" size={20} color={t.colors.vaccination_fg} />
                        </View>
                        <Text style={[styles.serviceName, { color: t.colors.text_primary, flex: 1 }]}>
                          {v.name}
                        </Text>
                        <Text style={[styles.priceText, { color: t.colors.text_primary }]}>
                          {formatPaise(v.pricePaise)}
                        </Text>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: sel ? primary : t.colors.border,
                              backgroundColor: sel ? primary : 'transparent',
                            },
                          ]}
                        >
                          {sel ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {servicesOffered.length === 0 && vaccinesOffered.length === 0 ? (
              <Text style={[styles.muted, { color: t.colors.text_secondary, marginTop: 12 }]}>
                This clinic has not listed bookable services yet.
              </Text>
            ) : (
              <View style={[styles.infoBox, { backgroundColor: t.colors.primary_bg, marginTop: 16 }]}>
                <Ionicons name="information-circle-outline" size={20} color={primary} />
                <Text style={[styles.infoText, { color: t.colors.text_primary }]}>
                  Consultation and vaccination can be booked for the same visit.
                </Text>
              </View>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Choose doctor</Text>
            <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
              For {selectedPet?.name ?? 'your pet'}
            </Text>

            {doctors.length === 0 ? (
              <Text style={[styles.muted, { color: t.colors.text_secondary, marginTop: 12 }]}>
                No doctors listed for this clinic.
              </Text>
            ) : (
              <View style={{ gap: 10, marginTop: 12 }}>
                <Pressable
                  style={[
                    styles.doctorCard,
                    {
                      borderColor: selectedDoctorId === ANY_DOCTOR_ID ? primary : t.colors.border,
                      backgroundColor:
                        selectedDoctorId === ANY_DOCTOR_ID ? t.colors.primary_bg : t.colors.solid_white,
                    },
                  ]}
                  onPress={() => setSelectedDoctorId(ANY_DOCTOR_ID)}
                >
                  <View style={[styles.doctorAvatar, { backgroundColor: t.colors.primary_bg }]}>
                    <Ionicons name="people" size={24} color={primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.doctorName, { color: t.colors.text_primary }]}>
                      Any available doctor
                    </Text>
                    <Text style={[styles.petMeta, { color: t.colors.text_secondary }]}>
                      We&apos;ll assign the first available vet
                    </Text>
                  </View>
                  {selectedDoctorId === ANY_DOCTOR_ID ? (
                    <Ionicons name="checkmark-circle" size={26} color={primary} />
                  ) : null}
                </Pressable>

                {doctors.map((d) => {
                  const sel = selectedDoctorId === d.id;
                  const photo = resolvePhotoUrl(d.photoUrl);
                  const ratingLabel =
                    d.specializations.length > 0
                      ? d.specializations.join(', ')
                      : clinic.primaryDoctor.displayTitle;
                  return (
                    <Pressable
                      key={d.id}
                      style={[
                        styles.doctorCard,
                        {
                          borderColor: sel ? primary : t.colors.border,
                          backgroundColor: sel ? t.colors.primary_bg : t.colors.solid_white,
                        },
                      ]}
                      onPress={() => setSelectedDoctorId(d.id)}
                    >
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.doctorAvatar} />
                      ) : (
                        <View
                          style={[
                            styles.doctorAvatar,
                            styles.petThumbPlaceholder,
                            { backgroundColor: t.colors.border },
                          ]}
                        >
                          <Ionicons name="person" size={24} color={t.colors.text_secondary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.doctorName, { color: t.colors.text_primary }]}>
                          {d.fullName}
                        </Text>
                        {ratingLabel ? (
                          <Text style={[styles.petMeta, { color: t.colors.text_secondary }]} numberOfLines={2}>
                            {ratingLabel}
                          </Text>
                        ) : null}
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#EAB308" />
                          <Text style={[styles.petMeta, { color: t.colors.text_primary }]}>
                            {clinic.rating}
                          </Text>
                        </View>
                      </View>
                      {sel ? <Ionicons name="checkmark-circle" size={26} color={primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Date & time</Text>
            <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
              Pick a slot with {doctorDisplayName}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStrip}
              style={{ marginHorizontal: -H_PAD, marginTop: 12 }}
            >
              {dates.map((d, i) => {
                const sel = sameDay(d, selectedDate);
                return (
                  <Pressable
                    key={i}
                    style={[
                      styles.dateChip,
                      {
                        borderColor: sel ? primary : t.colors.border,
                        backgroundColor: sel ? primary : t.colors.solid_white,
                      },
                    ]}
                    onPress={() => setSelectedDate(d)}
                  >
                    <Text
                      style={[
                        styles.dateChipWeek,
                        { color: sel ? '#fff' : t.colors.text_secondary },
                      ]}
                    >
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                    <Text
                      style={[styles.dateChipDay, { color: sel ? '#fff' : t.colors.text_primary }]}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {bookableSlots.length === 0 ? (
              <Text style={[styles.muted, { color: t.colors.text_secondary, marginTop: 16 }]}>
                No available times on this day. Try another date.
              </Text>
            ) : (
              <View style={styles.slotGrid}>
                {bookableSlots.map((slot) => {
                  const sel =
                    selectedSlot?.hour === slot.hour && selectedSlot?.minute === slot.minute;
                  return (
                    <Pressable
                      key={`${slot.hour}-${slot.minute}`}
                      style={[
                        styles.slotChip,
                        {
                          borderColor: sel ? primary : t.colors.border,
                          backgroundColor: sel ? primary : t.colors.solid_white,
                        },
                      ]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text
                        style={[
                          styles.slotChipText,
                          { color: sel ? '#fff' : t.colors.text_primary },
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {step === 5 && selectedPet && selectedSlot && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Review</Text>
            <Text style={[styles.sectionSubtitle, { color: t.colors.text_secondary }]}>
              Check details before you continue
            </Text>
            <View style={[styles.card, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border, marginTop: 12 }]}>
              <ReviewBlock title="Pet" textSecondary={t.colors.text_secondary}>
                <Text style={[styles.reviewValue, { color: t.colors.text_primary }]}>
                  {selectedPet.name}
                </Text>
                <Text style={[styles.petMeta, { color: t.colors.text_secondary }]}>
                  {[selectedPet.breed, petAgeLabel(selectedPet.dateOfBirth)].filter(Boolean).join(' · ')}
                </Text>
              </ReviewBlock>
              {(selectedServiceNames.length > 0 || selectedVaccineLines.length > 0) && (
                <ReviewBlock title="Services" textSecondary={t.colors.text_secondary}>
                  {selectedServiceNames.map((name) => (
                    <Text key={name} style={[styles.reviewLine, { color: t.colors.text_primary }]}>
                      {name}
                    </Text>
                  ))}
                  {selectedVaccineLines.map((v) => (
                    <View key={v.id} style={styles.reviewPriceRow}>
                      <Text style={[styles.reviewLine, { color: t.colors.text_primary, flex: 1 }]}>
                        {v.name}
                      </Text>
                      <Text style={[styles.reviewLine, { color: t.colors.text_primary }]}>
                        {formatPaise(v.pricePaise)}
                      </Text>
                    </View>
                  ))}
                </ReviewBlock>
              )}
              <ReviewBlock title="Doctor" textSecondary={t.colors.text_secondary}>
                <Text style={[styles.reviewValue, { color: t.colors.text_primary }]}>
                  {doctorDisplayName}
                </Text>
              </ReviewBlock>
              <ReviewBlock title="Date & time" textSecondary={t.colors.text_secondary}>
                <Text style={[styles.reviewValue, { color: t.colors.text_primary }]}>
                  {formatVisitDateTime(selectedDate, selectedSlot)}
                </Text>
              </ReviewBlock>
              <ReviewBlock title="Clinic" textSecondary={t.colors.text_secondary}>
                <Text style={[styles.reviewValue, { color: t.colors.text_primary }]}>
                  {clinic.name}
                </Text>
                <Text style={[styles.petMeta, { color: t.colors.text_secondary }]}>{clinic.address}</Text>
              </ReviewBlock>
              {vaccineTotalPaise > 0 ? (
                <View style={[styles.totalRow, { borderTopColor: t.colors.border, marginTop: 8, paddingTop: 12 }]}>
                  <Text style={[styles.totalLabel, { color: t.colors.text_primary }]}>Total estimate</Text>
                  <Text style={[styles.totalValue, { color: primary }]}>
                    {formatPaise(vaccineTotalPaise)}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}

        {step === 6 && selectedPet && selectedSlot && (
          <>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Confirm</Text>
            <View style={[styles.infoBox, { backgroundColor: t.colors.primary_bg }]}>
              <Ionicons name="wallet-outline" size={22} color={primary} />
              <Text style={[styles.infoText, { color: t.colors.text_primary }]}>
                You pay at the clinic. No online payment is required to confirm this booking.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border, marginTop: 16 }]}>
              <Text style={[styles.cardLabel, { color: t.colors.text_secondary }]}>Estimate</Text>
              {selectedServiceNames.map((name) => (
                <Text key={name} style={[styles.reviewLine, { color: t.colors.text_primary }]}>
                  {name}
                </Text>
              ))}
              {selectedVaccineLines.map((v) => (
                <View key={v.id} style={styles.reviewPriceRow}>
                  <Text style={[styles.reviewLine, { color: t.colors.text_primary, flex: 1 }]}>
                    {v.name}
                  </Text>
                  <Text style={[styles.reviewLine, { color: t.colors.text_primary }]}>
                    {formatPaise(v.pricePaise)}
                  </Text>
                </View>
              ))}
              {vaccineTotalPaise > 0 ? (
                <View style={[styles.totalRow, { marginTop: 8 }]}>
                  <Text style={[styles.totalLabel, { color: t.colors.text_primary }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: primary }]}>
                    {formatPaise(vaccineTotalPaise)}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.petMeta, { color: t.colors.text_secondary, marginTop: 4 }]}>
                  Consultation fees are collected at the clinic.
                </Text>
              )}
            </View>

            <View
              style={[
                styles.remindRow,
                { backgroundColor: t.colors.solid_white, borderColor: t.colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.remindTitle, { color: t.colors.text_primary }]}>Remind me</Text>
                <Text style={[styles.petMeta, { color: t.colors.text_secondary }]}>
                  Get a reminder before your visit (on this device only)
                </Text>
              </View>
              <Switch
                value={remindMe}
                onValueChange={setRemindMe}
                trackColor={{ false: t.colors.inactive_bg_alpha, true: primary }}
                thumbColor="#fff"
              />
            </View>

            {confirmError ? (
              <Text style={[styles.errorInline, { color: t.colors.warning }]}>{confirmError}</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: t.colors.solid_white,
            borderTopColor: t.colors.border,
          },
        ]}
      >
        {footerLabel ? (
          <Text style={[styles.footerMeta, { color: t.colors.text_secondary }]}>{footerLabel}</Text>
        ) : null}
        <Pressable
          style={[
            styles.primaryBtn,
            {
              backgroundColor: primary,
              opacity: canContinue && !confirmLoading ? 1 : 0.45,
            },
          ]}
          disabled={!canContinue || confirmLoading}
          onPress={step === 6 ? confirmBooking : goNext}
        >
          {confirmLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{footerCta}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  textPrimary,
  textSecondary,
}: {
  label: string;
  value: string;
  textPrimary: string;
  textSecondary: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textPrimary }]}>{value}</Text>
    </View>
  );
}

function ReviewBlock({
  title,
  textSecondary,
  children,
}: {
  title: string;
  textSecondary: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.reviewBlock}>
      <Text style={[styles.cardLabel, { color: textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: 14, lineHeight: 20 },
  topChrome: { borderBottomWidth: StyleSheet.hairlineWidth },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
  },
  iconBtn: { padding: 4 },
  flowTitle: {
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: H_PAD,
    marginTop: 4,
  },
  stepLabel: { fontSize: 13, paddingHorizontal: H_PAD, marginTop: 4, marginBottom: 10 },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: H_PAD,
    marginBottom: 12,
  },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  clinicCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  clinicThumb: { width: 56, height: 56, borderRadius: 12 },
  clinicThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  clinicCardBody: { flex: 1 },
  clinicCardName: { fontSize: 16, fontWeight: '700' },
  clinicCardMeta: { fontSize: 13, marginTop: 2 },
  clinicCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 16, marginBottom: 8 },
  emptyBox: {
    marginTop: 16,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  petThumb: { width: 52, height: 52, borderRadius: 26 },
  petThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  petName: { fontSize: 16, fontWeight: '700' },
  petMeta: { fontSize: 13, marginTop: 2 },
  warnBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '100%',
  },
  warnBadgeText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 16 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: 15, fontWeight: '600' },
  priceText: { fontSize: 14, fontWeight: '600', marginRight: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  doctorAvatar: { width: 56, height: 56, borderRadius: 12 },
  doctorName: { fontSize: 16, fontWeight: '700' },
  dateStrip: { paddingHorizontal: H_PAD, gap: 8 },
  dateChip: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dateChipWeek: { fontSize: 12, fontWeight: '600' },
  dateChipDay: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: '30%',
    alignItems: 'center',
  },
  slotChipText: { fontSize: 14, fontWeight: '600' },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  reviewBlock: { marginBottom: 14 },
  reviewValue: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  reviewLine: { fontSize: 14, marginTop: 4 },
  reviewPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  remindTitle: { fontSize: 15, fontWeight: '600' },
  errorInline: { marginTop: 12, fontSize: 14 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerMeta: { fontSize: 13, marginBottom: 8, textAlign: 'center' },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  successBanner: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  successSubtitle: { fontSize: 15, marginTop: 6, textAlign: 'center' },
  bookingId: { fontSize: 20, fontWeight: '800', marginTop: 6, letterSpacing: 0.5 },
  hint: { fontSize: 13, lineHeight: 18 },
  detailRow: { marginTop: 12 },
  detailLabel: { fontSize: 12, fontWeight: '600' },
  detailValue: { fontSize: 15, marginTop: 4, lineHeight: 21 },
});
