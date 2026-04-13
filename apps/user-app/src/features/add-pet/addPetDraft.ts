import type { PetGender, PetSpecies } from '@petspond/types';

export type WeightUnit = 'kg' | 'lbs';

export type AddPetDraft = {
  name: string;
  species: PetSpecies | null;
  /** Which type chip is selected (`dog` | `cat`). */
  petTypeKey: string | null;
  breed: string;
  gender: PetGender | null;
  colorMarkings: string;
  localPhotoUri: string | null;
  /** `YYYY-MM-DD` in local calendar, or null until set */
  birthDateIso: string | null;
  weightValue: string;
  weightUnit: WeightUnit;
  microchipId: string;
  medicalNotes: string;
};

export function createInitialDraft(): AddPetDraft {
  return {
    name: '',
    species: null,
    petTypeKey: null,
    breed: '',
    gender: null,
    colorMarkings: '',
    localPhotoUri: null,
    birthDateIso: null,
    weightValue: '',
    weightUnit: 'kg',
    microchipId: '',
    medicalNotes: '',
  };
}

export const PET_TYPE_OPTIONS = [
  { key: 'dog', label: 'Dog', species: 'dog' as const },
  { key: 'cat', label: 'Cat', species: 'cat' as const },
] as const;
