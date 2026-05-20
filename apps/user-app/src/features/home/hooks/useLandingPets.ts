import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Pet } from '@petspond/types';
import { useApi } from '@/contexts';
import { fetchUserPets } from '@/services/pets';

export function useLandingPets() {
  const { client } = useApi();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const loadPets = useCallback(() => {
    setLoading(true);
    fetchUserPets(client)
      .then((list) => {
        setPets(list);
        setSelectedPetId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      })
      .catch(() => setPets([]))
      .finally(() => setLoading(false));
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets])
  );

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;

  return {
    pets,
    loading,
    selectedPetId,
    selectedPet,
    setSelectedPetId,
    reload: loadPets,
  };
}
