import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PetGender, PetSpecies } from '@petspond/types';

export type AddPetSpecies = Extract<PetSpecies, 'dog' | 'cat'>;

export interface AddPetDraft {
  photoUri: string | null;
  photoMime?: string;
  name: string;
  species: AddPetSpecies | null;
  breed: string;
  gender: PetGender | null;
  color: string;
  dateOfBirth: Date | null;
  weight: string;
  microchipId: string;
  specialNeeds: string;
}

const emptyDraft: AddPetDraft = {
  photoUri: null,
  name: '',
  species: null,
  breed: '',
  gender: null,
  color: '',
  dateOfBirth: null,
  weight: '',
  microchipId: '',
  specialNeeds: '',
};

const AddPetDraftContext = createContext<{
  draft: AddPetDraft;
  setDraft: (patch: Partial<AddPetDraft>) => void;
  reset: () => void;
} | null>(null);

export function AddPetDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<AddPetDraft>(emptyDraft);
  const value = useMemo(
    () => ({
      draft,
      setDraft: (patch: Partial<AddPetDraft>) => setDraftState((d) => ({ ...d, ...patch })),
      reset: () => setDraftState(emptyDraft),
    }),
    [draft],
  );
  return <AddPetDraftContext.Provider value={value}>{children}</AddPetDraftContext.Provider>;
}

export function useAddPetDraft() {
  const ctx = useContext(AddPetDraftContext);
  if (!ctx) throw new Error('useAddPetDraft must be used within AddPetDraftProvider');
  return ctx;
}
