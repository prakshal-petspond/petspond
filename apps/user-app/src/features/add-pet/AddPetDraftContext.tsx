import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AddPetDraft } from './addPetDraft';
import { createInitialDraft } from './addPetDraft';

type Ctx = {
  draft: AddPetDraft;
  setDraft: React.Dispatch<React.SetStateAction<AddPetDraft>>;
  updateDraft: (patch: Partial<AddPetDraft>) => void;
  resetDraft: () => void;
};

const AddPetDraftContext = createContext<Ctx | null>(null);

export function AddPetDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<AddPetDraft>(() => createInitialDraft());

  const updateDraft = useCallback((patch: Partial<AddPetDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createInitialDraft());
  }, []);

  const value = useMemo(
    () => ({ draft, setDraft, updateDraft, resetDraft }),
    [draft, updateDraft, resetDraft],
  );

  return <AddPetDraftContext.Provider value={value}>{children}</AddPetDraftContext.Provider>;
}

export function useAddPetDraft() {
  const ctx = useContext(AddPetDraftContext);
  if (!ctx) {
    throw new Error('useAddPetDraft must be used within AddPetDraftProvider');
  }
  return ctx;
}
