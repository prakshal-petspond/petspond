import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useApi } from '@/contexts';
import type { User } from '@petspond/types';
import { authApi } from '@/services/auth.service';

const H_PAD = 16;

export function ProfilePage() {
  const t = useTheme();
  const { client, setToken } = useApi();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent ?? t.colors.primary;
  const cream = t.colors.cardBg ?? '#f5f0e8';

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    authApi
      .me(client)
      .then((u) => {
        if (!c) setUser(u);
      })
      .catch(() => {
        if (!c) setUser(null);
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [client]);

  const signOut = () => {
    setToken(null);
    router.replace('/onboarding');
  };

  return (
    <View style={[styles.fill, { backgroundColor: cream, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
        <Text style={[styles.title, { color: t.colors.foreground }]}>Profile</Text>
      </View>

      <View style={{ paddingHorizontal: H_PAD, paddingTop: 8 }}>
        {loading ? (
          <ActivityIndicator size="large" color={accent} style={{ marginTop: 24 }} />
        ) : user ? (
          <View style={[styles.card, { backgroundColor: t.colors.background, borderColor: t.colors.border }]}>
            {user.name ? (
              <Text style={[styles.name, { color: t.colors.foreground }]}>{user.name}</Text>
            ) : null}
            <Text style={[styles.meta, { color: t.colors.muted }]}>{user.mobile}</Text>
            {user.email ? <Text style={[styles.meta, { color: t.colors.muted, marginTop: 4 }]}>{user.email}</Text> : null}
          </View>
        ) : (
          <Text style={{ color: t.colors.muted }}>Could not load profile.</Text>
        )}

        <TouchableOpacity
          style={[styles.signOut, { borderColor: t.colors.border }]}
          onPress={signOut}
          activeOpacity={0.85}
        >
          <Text style={[styles.signOutText, { color: t.colors.error }]}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  name: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 15 },
  signOut: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '700' },
});
