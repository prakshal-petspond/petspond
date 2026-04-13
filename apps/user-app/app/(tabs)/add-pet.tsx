import React, { useState } from 'react';
import { AddPetDraftProvider } from '@/features/add-pet/AddPetDraftContext';
import { AddPetStep1Screen } from '@/features/add-pet/AddPetStep1Screen';
import { AddPetStep2Screen } from '@/features/add-pet/AddPetStep2Screen';

/**
 * Single tab screen for /add-pet (hidden from tab bar). Nested add-pet/ folder + Stack
 * was unreliable with href:null tabs; two steps are handled in-process.
 */
export default function AddPetScreen() {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <AddPetDraftProvider>
      {step === 1 ? (
        <AddPetStep1Screen onContinue={() => setStep(2)} />
      ) : (
        <AddPetStep2Screen onBackToStep1={() => setStep(1)} />
      )}
    </AddPetDraftProvider>
  );
}
