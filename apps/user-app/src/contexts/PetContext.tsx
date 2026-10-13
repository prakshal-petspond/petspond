import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import type { Pet } from '@petspond/types';
import { useApi } from './ApiContext';
import { fetchUserPets } from '@/services/pets';

const ACTIVE_PET_KEY = 'petspond_active_pet_id';

const PetContext = createContext<{
  pets: Pet[];
  activePet: Pet | null;
  loading: boolean;
  setActivePetId: (id: string) => void;
  refreshPets: (preferredId?: string) => Promise<Pet[]>;
} | null>(null);

export function PetProvider({ children }: { children: ReactNode }) {
  const { client, token } = useApi();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const persistActive = useCallback((id: string | null) => {
    setActivePetIdState(id);
    if (id) SecureStore.setItemAsync(ACTIVE_PET_KEY, id);
    else SecureStore.deleteItemAsync(ACTIVE_PET_KEY);
  }, []);

  const refreshPets = useCallback(async (preferredId?: string) => {
    if (!token) {
      setPets([]);
      persistActive(null);
      return [];
    }
    setLoading(true);
    try {
      const list = await fetchUserPets(client);
      setPets(list);
      const stored = preferredId ?? (await SecureStore.getItemAsync(ACTIVE_PET_KEY));
      const nextId =
        (stored && list.some((p) => p.id === stored) ? stored : null) ?? list[0]?.id ?? null;
      persistActive(nextId);
      return list;
    } catch {
      setPets([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client, persistActive, token]);

  useEffect(() => {
    void refreshPets();
  }, [refreshPets]);

  const setActivePetId = useCallback(
    (id: string) => {
      persistActive(id);
    },
    [persistActive],
  );

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) ?? pets[0] ?? null,
    [activePetId, pets],
  );

  const value = useMemo(
    () => ({ pets, activePet, loading, setActivePetId, refreshPets }),
    [pets, activePet, loading, setActivePetId, refreshPets],
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error('usePets must be used within PetProvider');
  return ctx;
}
