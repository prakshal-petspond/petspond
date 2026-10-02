import { useLocalSearchParams } from 'expo-router';
import { BookVetFlow } from '@/features/find-vet/BookVetFlow';

export default function BookVetRoute() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  return <BookVetFlow clinicId={String(clinicId)} />;
}
