import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { VendorServiceMode, VendorServiceType, VendorWeeklyAvailabilityBlock } from '@petspond/types';
import { useTheme, useApi } from '@/contexts';
import { PrimaryButton } from '@/components/ui';
import { WeeklyScheduleEditor } from '@/components';
import { DEFAULT_WEEKLY_SCHEDULE } from '@/lib/schedule';
import { completeVendorOnboarding, fetchVendorMe, updateVendorProfile } from '@/services/vendorAuth';

const SERVICE_OPTIONS: { id: VendorServiceType; label: string }[] = [
  { id: 'grooming', label: 'Grooming' },
  { id: 'training', label: 'Training' },
  { id: 'walking', label: 'Walking' },
];

export function VendorOnboardingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { client } = useApi();

  const [businessName, setBusinessName] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [serviceTypes, setServiceTypes] = useState<VendorServiceType[]>([]);
  const [onSite, setOnSite] = useState(true);
  const [doorstep, setDoorstep] = useState(true);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState('10');
  const [promo, setPromo] = useState('');
  const [loading, setLoading] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] =
    useState<VendorWeeklyAvailabilityBlock[]>(DEFAULT_WEEKLY_SCHEDULE);
  const [isEdit, setIsEdit] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const showBack = isEdit || router.canGoBack();

  useEffect(() => {
    let cancelled = false;
    fetchVendorMe(client)
      .then((v) => {
        if (cancelled) return;
        if (v.onboardingCompleted) {
          setIsEdit(true);
          setBusinessName(v.businessName);
          setDisplayTitle(v.displayTitle ?? '');
          setServiceTypes(v.serviceTypes);
          setOnSite(v.serviceModes.includes('on_site'));
          setDoorstep(v.serviceModes.includes('doorstep'));
          setAddress(v.address);
          setCity(v.city ?? '');
          setLatitude(v.latitude);
          setLongitude(v.longitude);
          setRadiusKm(String(v.serviceRadiusKm));
          setPromo(v.promo ?? '');
          setWeeklyAvailability(
            v.weeklyAvailability?.length ? v.weeklyAvailability : DEFAULT_WEEKLY_SCHEDULE,
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const hasGrooming = serviceTypes.includes('grooming');
  const hasWalkTrain =
    serviceTypes.includes('walking') || serviceTypes.includes('training');

  const serviceModes = useMemo((): VendorServiceMode[] => {
    if (hasGrooming && !hasWalkTrain) {
      const modes: VendorServiceMode[] = [];
      if (onSite) modes.push('on_site');
      if (doorstep) modes.push('doorstep');
      return modes.length ? modes : ['doorstep'];
    }
    if (hasWalkTrain && !hasGrooming) return ['doorstep'];
    const modes: VendorServiceMode[] = ['doorstep'];
    if (hasGrooming && onSite) modes.push('on_site');
    if (hasGrooming && doorstep && !modes.includes('doorstep')) modes.push('doorstep');
    return modes;
  }, [hasGrooming, hasWalkTrain, onSite, doorstep]);

  const toggleService = (id: VendorServiceType) => {
    setServiceTypes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const useCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow location to set your service area.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setLatitude(pos.coords.latitude);
    setLongitude(pos.coords.longitude);
    const places = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    const p = places[0];
    if (p) {
      const line = [p.name, p.street, p.district, p.city].filter(Boolean).join(', ');
      setAddress(line || address);
      if (p.city) setCity(p.city);
    }
  }, [address]);

  const submit = async () => {
    if (!businessName.trim()) {
      Alert.alert('Business name required');
      return;
    }
    if (serviceTypes.length === 0) {
      Alert.alert('Select services', 'Choose at least one service you provide.');
      return;
    }
    if (latitude == null || longitude == null || !address.trim()) {
      Alert.alert('Location required', 'Use current location or enter your address.');
      return;
    }
    const r = parseFloat(radiusKm);
    if (!Number.isFinite(r) || r < 1) {
      Alert.alert('Invalid radius', 'Service radius must be at least 1 km.');
      return;
    }
    if (weeklyAvailability.length === 0) {
      Alert.alert('Add availability', 'Enable at least one day with valid working hours.');
      return;
    }

    const payload = {
      businessName: businessName.trim(),
      displayTitle: displayTitle.trim() || undefined,
      serviceTypes,
      serviceModes,
      latitude,
      longitude,
      address: address.trim(),
      city: city.trim() || undefined,
      serviceRadiusKm: r,
      weeklyAvailability,
      promo: promo.trim() || undefined,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await updateVendorProfile(client, payload);
        router.back();
      } else {
        await completeVendorOnboarding(client, payload);
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save profile';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.solid_white, paddingTop: insets.top }]}>
      {showBack && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={t.colors.text_primary} />
        </TouchableOpacity>
      )}
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={[styles.title, { color: t.colors.text_primary }]}>
          {isEdit ? 'Edit services' : 'Set up your services'}
        </Text>
        <Text style={[styles.sub, { color: t.colors.text_secondary }]}>
          {isEdit
            ? 'Update what you offer and where pet parents can find you.'
            : 'Pet parents nearby will see your listing when you fall within your service area.'}
        </Text>

        {profileLoading && isEdit ? (
          <Text style={{ color: t.colors.text_secondary, marginBottom: 12 }}>Loading profile…</Text>
        ) : null}

        <Text style={styles.fieldLabel}>Business name *</Text>
        <TextInput
          style={[styles.input, { borderColor: t.colors.inactive_bg_alpha }]}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Happy paws studio"
          placeholderTextColor={t.colors.inactive_bg}
        />

        <Text style={styles.fieldLabel}>Headline</Text>
        <TextInput
          style={[styles.input, { borderColor: t.colors.inactive_bg_alpha }]}
          value={displayTitle}
          onChangeText={setDisplayTitle}
          placeholder="Certified dog walker"
          placeholderTextColor={t.colors.inactive_bg}
        />

        <Text style={styles.fieldLabel}>Services you offer *</Text>
        <View style={styles.chips}>
          {SERVICE_OPTIONS.map((opt) => {
            const on = serviceTypes.includes(opt.id);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? t.colors.primary_light : t.colors.grey_bg,
                    borderColor: on ? t.colors.accent : t.colors.inactive_bg_alpha,
                  },
                ]}
                onPress={() => toggleService(opt.id)}
              >
                <Text style={{ color: on ? t.colors.accent : t.colors.text_primary, fontWeight: '600' }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasGrooming && (
          <View style={styles.modeBlock}>
            <Text style={styles.fieldLabel}>Grooming delivery</Text>
            <View style={styles.switchRow}>
              <Text style={{ color: t.colors.text_primary }}>On-site (at your location)</Text>
              <Switch value={onSite} onValueChange={setOnSite} trackColor={{ true: t.colors.accent }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={{ color: t.colors.text_primary }}>Doorstep</Text>
              <Switch value={doorstep} onValueChange={setDoorstep} trackColor={{ true: t.colors.accent }} />
            </View>
          </View>
        )}

        {hasWalkTrain && !hasGrooming && (
          <Text style={[styles.hint, { color: t.colors.text_secondary }]}>
            Walking & training are offered at the customer&apos;s location (doorstep).
          </Text>
        )}

        <Text style={styles.fieldLabel}>Base location *</Text>
        <TouchableOpacity
          style={[styles.locBtn, { backgroundColor: t.colors.primary_bg }]}
          onPress={useCurrentLocation}
        >
          <Text style={{ color: t.colors.icon_brown, fontWeight: '700' }}>Use current location</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { borderColor: t.colors.inactive_bg_alpha, marginTop: 8 }]}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          placeholderTextColor={t.colors.inactive_bg}
          multiline
        />

        <Text style={styles.fieldLabel}>Service radius (km) *</Text>
        <TextInput
          style={[styles.input, { borderColor: t.colors.inactive_bg_alpha }]}
          value={radiusKm}
          onChangeText={setRadiusKm}
          keyboardType="decimal-pad"
          placeholder="10"
          placeholderTextColor={t.colors.inactive_bg}
        />

        <Text style={styles.fieldLabel}>Promo line (optional)</Text>
        <TextInput
          style={[styles.input, { borderColor: t.colors.inactive_bg_alpha }]}
          value={promo}
          onChangeText={setPromo}
          placeholder="50% Off on your first booking"
          placeholderTextColor={t.colors.inactive_bg}
        />

        <WeeklyScheduleEditor value={weeklyAvailability} onChange={setWeeklyAvailability} />

        <PrimaryButton
          title={isEdit ? 'Save changes' : 'Go live'}
          onPress={submit}
          loading={loading}
          disabled={profileLoading && isEdit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'flex-start' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  modeBlock: { marginTop: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  locBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  hint: { fontSize: 13, marginTop: 12, marginBottom: 16, lineHeight: 18 },
});
