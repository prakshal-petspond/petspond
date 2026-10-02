import { useLocalSearchParams } from 'expo-router';
import { VetDetailPage } from '@/features/find-vet/VetDetailPage';

export default function VetDetailRoute() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  return <VetDetailPage clinicId={String(clinicId)} />;
}
