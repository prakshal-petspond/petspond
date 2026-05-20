import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';

function TabLabel({
  focused,
  color,
  children,
}: {
  focused: boolean;
  color: string;
  children: string;
}) {
  return (
    <View style={styles.labelWrap}>
      <Text style={[styles.labelText, { color, fontWeight: focused ? '700' : '500' }]}>
        {children}
      </Text>
      {focused ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : (
        <View style={styles.dotPlaceholder} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const accent = t.colors.accent;
  const inactive = '#9ca3af';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.colors.inactive_bg_alpha,
          backgroundColor: t.colors.solid_white,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 56 + Math.max(insets.bottom, 10),
        },
        tabBarShowLabel: true,
        tabBarLabel: ({ focused, color, children }) => (
          <TabLabel focused={focused} color={color}>
            {typeof children === 'string' ? children : String(children ?? '')}
          </TabLabel>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: 'Find',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-pet"
        options={{
          title: 'Add pet',
          href: null,
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelWrap: { alignItems: 'center', minHeight: 32, justifyContent: 'flex-start' },
  labelText: { fontSize: 11, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },
  dotPlaceholder: { height: 5, marginTop: 4 },
});
