import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, useLocation } from '@/contexts';
import { useHomeVendorListings } from '@/hooks/useHomeVendorListings';
import { useLandingPets } from './hooks/useLandingPets';
import { usePetSelectorModal } from './hooks/usePetSelectorModal';
import {
  CategoryGrid,
  LandingHeader,
  PetSelectorModal,
  PromoBanner,
  ServiceListingSection,
  VaccinationReminderBar,
} from './components';

export function LandingPage() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const {
    addressLine: locationAddress,
    loading: locationLoading,
    refresh: refreshLocation,
    coords,
  } = useLocation();
  const { walkers, groomers } = useHomeVendorListings(coords);
  const {
    pets,
    loading: petsLoading,
    selectedPetId,
    selectedPet,
    setSelectedPetId,
  } = useLandingPets();
  const {
    pillRef,
    visible: petModalVisible,
    pillLayout,
    open: openPetModal,
    close,
  } = usePetSelectorModal();

  return (
    <View style={[styles.fill, { backgroundColor: t.colors.solid_white }]}>
      <PetSelectorModal
        visible={petModalVisible}
        pillLayout={pillLayout}
        pets={pets}
        petsLoading={petsLoading}
        selectedPetId={selectedPetId}
        onSelectPet={setSelectedPetId}
        onClose={close}
      />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LandingHeader
          locationAddress={locationAddress}
          locationLoading={locationLoading}
          onRefreshLocation={refreshLocation}
          petsLoading={petsLoading}
          selectedPet={selectedPet}
          pillRef={pillRef}
          onPetPillPress={openPetModal}
        />
        <PromoBanner />
        <VaccinationReminderBar selectedPet={selectedPet} />
        <CategoryGrid />
        <ServiceListingSection
          eyebrow="Top Rated"
          title="Walkers & Trainers"
          items={walkers}
          onHeaderPress={() => router.push('/walkers-trainers')}
          onItemPress={(item) => router.push(`/walkers-trainers/${item.id}` as const)}
        />
        <ServiceListingSection
          eyebrow="Top Rated"
          title="Groomers"
          items={groomers}
          onHeaderPress={() => router.push('/groomers')}
          onItemPress={(item) => router.push(`/groomers/${item.id}` as const)}
        />
        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 24, flexGrow: 1 },
  footerSpacer: { height: 40 },
});
