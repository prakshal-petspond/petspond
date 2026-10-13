import { Stack } from 'expo-router';
import { AddPetDraftProvider } from '@/features/add-pet/AddPetDraftContext';

export default function AddPetLayout() {
  return (
    <AddPetDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AddPetDraftProvider>
  );
}
