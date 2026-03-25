import { Stack } from 'expo-router';

/** Same pattern as `find-vet/_layout` so `/vaccination`, `/vaccination/[vetId]`, and `/vaccination/[vetId]/book` register correctly. */
export default function VaccinationLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
