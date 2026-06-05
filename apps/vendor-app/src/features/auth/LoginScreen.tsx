import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useApi, getNetworkErrorHelp } from '@/contexts';
import { PrimaryButton } from '@/components/ui';
import { sendVendorOtp, verifyVendorOtp } from '@/services/vendorAuth';

export function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { client, setToken } = useApi();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    const trimmed = mobile.replace(/\D/g, '');
    if (trimmed.length < 10) {
      Alert.alert('Invalid number', 'Enter a 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await sendVendorOtp(client, trimmed);
      setOtpSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send OTP';
      Alert.alert('Error', `${msg}\n\n${getNetworkErrorHelp()}`);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    const trimmed = mobile.replace(/\D/g, '');
    if (!otp.trim()) {
      Alert.alert('Enter OTP', 'Please enter the OTP you received.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyVendorOtp(client, trimmed, otp.trim());
      if (!res.verified || !res.token) {
        Alert.alert('Verification failed', res.message ?? 'Invalid OTP');
        return;
      }
      setToken(res.token);
      if (res.vendor?.onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Verification failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: t.colors.secondary_bg, paddingTop: insets.top + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: t.colors.text_primary }]}>Petspond Vendor</Text>
        <Text style={[styles.sub, { color: t.colors.text_secondary }]}>
          For groomers, walkers & trainers
        </Text>

        <Text style={[styles.label, { color: t.colors.text_primary }]}>Mobile number</Text>
        <TextInput
          style={[styles.input, { borderColor: t.colors.inactive_bg_alpha, color: t.colors.text_primary }]}
          keyboardType="phone-pad"
          placeholder="10-digit mobile"
          placeholderTextColor={t.colors.inactive_bg}
          value={mobile}
          onChangeText={setMobile}
          editable={!otpSent}
        />

        {otpSent && (
          <>
            <Text style={[styles.label, { color: t.colors.text_primary, marginTop: 16 }]}>OTP</Text>
            <TextInput
              style={[styles.input, { borderColor: t.colors.inactive_bg_alpha, color: t.colors.text_primary }]}
              keyboardType="number-pad"
              placeholder="Enter OTP"
              placeholderTextColor={t.colors.inactive_bg}
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
          </>
        )}

        <View style={styles.cta}>
          {!otpSent ? (
            <PrimaryButton title="Send OTP" onPress={sendOtp} loading={loading} />
          ) : (
            <PrimaryButton title="Verify & continue" onPress={verify} loading={loading} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  inner: { paddingHorizontal: 24, flex: 1 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 15, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cta: { marginTop: 28 },
});
