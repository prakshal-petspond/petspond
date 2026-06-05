import React, { useMemo, useState } from 'react';
import { Image } from 'react-native';
import { resolvePhotoUrl } from '@/lib/photoUrl';

type PetAvatarProps = {
  photoUrl: string | null | undefined;
  fallbackUri: string;
  style: React.ComponentProps<typeof Image>['style'];
};

export function PetAvatar({ photoUrl, fallbackUri, style }: PetAvatarProps) {
  const uri = useMemo(() => resolvePhotoUrl(photoUrl) ?? fallbackUri, [photoUrl, fallbackUri]);
  const [failed, setFailed] = useState(false);

  return (
    <Image
      source={{ uri: failed ? fallbackUri : uri }}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
