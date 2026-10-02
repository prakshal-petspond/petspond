import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';

const TOP_RATED = [
  {
    id: '1',
    name: 'Happy Paws Studio',
    meta: 'Groomer · 4.9 · 0.5 kms',
    price: '₹1200 onwards',
    image:
      'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'Sarah Mitchell',
    meta: 'Dog walker · 4.8 · 1.2 kms',
    price: '₹400 / walk',
    image:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'PetCare Veterinary',
    meta: 'Clinic · 4.9 · 2.1 kms',
    price: '₹800 onwards',
    image:
      'https://images.unsplash.com/photo-1628009364671-b457d7fa9ce4?w=200&h=200&fit=crop',
  },
] as const;

export function LandingPage() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: t.colors.solid_white, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.header}>
            <Pressable style={styles.locationBlock} accessibilityRole="button">
              <Text style={[styles.deliverLabel, { color: t.colors.primary }]}>DELIVER TO</Text>
              <View style={styles.locationRow}>
                <Text style={[styles.locationText, { color: t.colors.text_primary }]} numberOfLines={1}>
                  Vasundhara sec 5
                </Text>
                <Ionicons name="chevron-down" size={16} color={t.colors.text_primary} />
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable
                style={[styles.iconBtn, { backgroundColor: t.colors.grey_bg }]}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={20} color={t.colors.text_primary} />
              </Pressable>
              <View style={[styles.avatar, { backgroundColor: t.colors.primary_bg }]}>
                <Ionicons name="person" size={18} color={t.colors.primary} />
              </View>
            </View>
          </View>

          <View style={[styles.searchBar, { backgroundColor: t.colors.grey_bg }]}>
            <Ionicons name="search" size={18} color={t.colors.text_secondary} />
            <TextInput
              placeholder="Search vets, groomers, walkers"
              placeholderTextColor={t.colors.text_secondary}
              style={[styles.searchInput, { color: t.colors.text_primary }]}
              editable={false}
            />
          </View>

          <View style={styles.servicesGrid}>
            <Pressable
              style={[styles.vetCard, { backgroundColor: t.colors.primary }]}
              onPress={() => router.push('/find-vet')}
            >
              <View style={styles.vetIconWrap}>
                <MaterialCommunityIcons name="stethoscope" size={22} color="#fff" />
              </View>
              <Text style={styles.vetTitle}>Book a{'\n'}vet visit</Text>
              <Text style={styles.vetSubtitle}>Consults, vaccines{'\n'}& check-ups</Text>
            </Pressable>

            <View style={styles.servicesRight}>
              <Pressable style={[styles.smallService, { backgroundColor: t.colors.vaccination_bg }]}>
                <MaterialCommunityIcons name="needle" size={22} color={t.colors.vaccination_fg} />
                <Text style={[styles.smallServiceText, { color: t.colors.vaccination_fg }]}>
                  Vaccination
                </Text>
              </Pressable>
              <Pressable style={[styles.smallService, { backgroundColor: t.colors.grooming_bg }]}>
                <MaterialCommunityIcons name="content-cut" size={22} color={t.colors.grooming_fg} />
                <Text style={[styles.smallServiceText, { color: t.colors.grooming_fg }]}>Grooming</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.rowCards}>
            <Pressable
              style={[styles.rowCard, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: t.colors.primary_bg }]}>
                <Ionicons name="paw" size={18} color={t.colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: t.colors.text_primary }]}>Walker & Trainer</Text>
                <Text style={[styles.rowMeta, { color: t.colors.text_secondary }]}>Walks · training</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.rowCard, { backgroundColor: t.colors.solid_white, borderColor: t.colors.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: t.colors.primary_bg }]}>
                <MaterialCommunityIcons name="dog-side" size={18} color={t.colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: t.colors.text_primary }]}>Daily care</Text>
                <Text style={[styles.rowMeta, { color: t.colors.text_secondary }]}>2 of 6 done today</Text>
              </View>
            </Pressable>
          </View>

          <Pressable style={[styles.appointmentCard, { backgroundColor: t.colors.primary_bg }]}>
            <View style={[styles.appointmentIcon, { backgroundColor: t.colors.solid_white }]}>
              <Ionicons name="calendar" size={20} color={t.colors.primary} />
            </View>
            <View style={styles.appointmentText}>
              <Text style={[styles.appointmentTitle, { color: t.colors.text_primary }]}>
                General Check-up · Luna
              </Text>
              <Text style={[styles.appointmentMeta, { color: t.colors.text_secondary }]}>
                Tomorrow 10:00 AM · Dr. Anita Sharma
              </Text>
            </View>
            <Text style={[styles.detailsLink, { color: t.colors.primary }]}>Details</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: t.colors.text_primary }]}>Top rated near you</Text>
            <Pressable>
              <Text style={[styles.seeAll, { color: t.colors.primary }]}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {TOP_RATED.map((item) => (
              <Pressable key={item.id} style={styles.listItem}>
                <Image source={{ uri: item.image }} style={styles.thumb} />
                <View style={styles.listBody}>
                  <Text style={[styles.listName, { color: t.colors.text_primary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.listMeta, { color: t.colors.text_secondary }]} numberOfLines={1}>
                    {item.meta}
                  </Text>
                </View>
                <Text style={[styles.listPrice, { color: t.colors.primary }]}>{item.price}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.tabBar,
            {
              borderTopColor: t.colors.border,
              backgroundColor: t.colors.solid_white,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          <TabItem icon="home" label="Home" active colors={t.colors} />
          <TabItem icon="search" label="Find" colors={t.colors} />
          <TabItem icon="calendar-outline" label="Bookings" colors={t.colors} />
          <TabItem icon="person-outline" label="Profile" colors={t.colors} />
        </View>
    </View>
  );
}

function TabItem({
  icon,
  label,
  active,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable style={styles.tabItem} accessibilityRole="button" accessibilityState={{ selected: !!active }}>
      <View
        style={[
          styles.tabIconWrap,
          active && { backgroundColor: colors.primary_light },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={active ? colors.primary : colors.inactive_bg}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: active ? colors.text_primary : colors.inactive_bg, fontWeight: active ? '700' : '500' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  locationBlock: { flex: 1, paddingRight: 12 },
  deliverLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 18, fontWeight: '700', maxWidth: '90%' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  servicesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  vetCard: {
    flex: 1.15,
    borderRadius: 22,
    padding: 16,
    minHeight: 168,
    justifyContent: 'space-between',
  },
  vetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: 18,
  },
  vetSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  servicesRight: { flex: 1, gap: 12 },
  smallService: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 78,
  },
  smallServiceText: { fontSize: 15, fontWeight: '700' },
  rowCards: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  rowCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowMeta: { fontSize: 11, marginTop: 2 },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentText: { flex: 1 },
  appointmentTitle: { fontSize: 14, fontWeight: '700' },
  appointmentMeta: { fontSize: 12, marginTop: 3 },
  detailsLink: { fontSize: 14, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  list: { gap: 14 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  listBody: { flex: 1 },
  listName: { fontSize: 15, fontWeight: '700' },
  listMeta: { fontSize: 12, marginTop: 3 },
  listPrice: { fontSize: 13, fontWeight: '700', maxWidth: 110, textAlign: 'right' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 11 },
});
