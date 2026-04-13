import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useApi } from '@/contexts';
import { getNetworkErrorHelp } from '@/contexts/ApiContext';
import type { ConsultationBooking, VaccinationBooking } from '@petspond/types';
import { listUserConsultations, listUserVaccinations } from '@/services/userBookings';

const H_PAD = 16;

type Row =
  | { kind: 'consult'; at: string; b: ConsultationBooking }
  | { kind: 'vax'; at: string; b: VaccinationBooking };

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function BookingsPage() {
  const t = useTheme();
  const { client } = useApi();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const cream = t.colors.cardBg ?? '#f5f0e8';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(() => {
    setErr(null);
    return Promise.all([listUserConsultations(client), listUserVaccinations(client)])
      .then(([cons, vax]) => {
        const merged: Row[] = [
          ...cons.map((b) => ({ kind: 'consult' as const, at: b.scheduledAt, b })),
          ...vax.map((b) => ({ kind: 'vax' as const, at: b.scheduledAt, b })),
        ];
        merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        setRows(merged);
      })
      .catch(() => setErr(getNetworkErrorHelp()));
  }, [client]);

  useEffect(() => {
    let c = false;
    setLoading(true);
    load().finally(() => {
      if (!c) setLoading(false);
    });
    return () => {
      c = true;
    };
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  return (
    <View style={[styles.fill, { backgroundColor: cream, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
        <Text style={[styles.title, { color: t.colors.foreground }]}>Bookings</Text>
        <Text style={[styles.sub, { color: t.colors.muted }]}>Consultations and vaccinations</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: H_PAD, paddingBottom: insets.bottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        >
          {err && <Text style={{ color: t.colors.muted, marginBottom: 12 }}>{err}</Text>}
          {rows.length === 0 && !err ? (
            <Text style={{ color: t.colors.muted }}>No bookings yet. Book from Find or Home.</Text>
          ) : (
            rows.map((row) => {
              if (row.kind === 'consult') {
                const b = row.b;
                return (
                  <View
                    key={`c-${b.id}`}
                    style={[styles.card, { backgroundColor: t.colors.background, borderColor: t.colors.border }]}
                  >
                    <Text style={[styles.badge, { color: accent }]}>Consultation</Text>
                    <Text style={[styles.cardTitle, { color: t.colors.foreground }]}>{b.clinicName ?? 'Clinic'}</Text>
                    <Text style={[styles.meta, { color: t.colors.muted }]}>
                      {b.petName} · {formatWhen(b.scheduledAt)}
                    </Text>
                    <Text style={[styles.status, { color: t.colors.foreground }]}>Status: {b.status}</Text>
                  </View>
                );
              }
              const b = row.b;
              return (
                <View
                  key={`v-${b.id}`}
                  style={[styles.card, { backgroundColor: t.colors.background, borderColor: t.colors.border }]}
                >
                  <Text style={[styles.badge, { color: accent }]}>Vaccination</Text>
                  <Text style={[styles.cardTitle, { color: t.colors.foreground }]}>{b.clinicName ?? 'Clinic'}</Text>
                  <Text style={[styles.meta, { color: t.colors.muted }]}>
                    {b.petName} · {formatWhen(b.scheduledAt)}
                  </Text>
                  <Text style={[styles.status, { color: t.colors.foreground }]}>Status: {b.status}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  sub: { fontSize: 15, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  badge: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 14, marginTop: 4 },
  status: { fontSize: 13, marginTop: 8, fontWeight: '600' },
});
