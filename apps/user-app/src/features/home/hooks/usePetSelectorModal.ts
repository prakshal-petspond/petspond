import { useRef, useState } from 'react';
import type { PetPillAnchorRef, PetPillLayout } from '../types';

export function usePetSelectorModal() {
  const [visible, setVisible] = useState(false);
  const [pillLayout, setPillLayout] = useState<PetPillLayout | null>(null);
  const pillRef = useRef<PetPillAnchorRef | null>(null);

  const open = () => {
    pillRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setPillLayout({ x, y, width, height });
      setVisible(true);
    });
  };

  const close = () => setVisible(false);

  return { pillRef, visible, pillLayout, open, close };
}
