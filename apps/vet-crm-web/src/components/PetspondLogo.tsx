import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import petspondLogo from '@/assets/petspond_logo.png';

type PetspondLogoProps = {
  /** Show "FOR CLINICIANS" subtitle (onboarding sidebar). */
  showClinicianSubtitle?: boolean;
  href?: string;
  className?: string;
  imageClassName?: string;
};

export function PetspondLogo({
  showClinicianSubtitle = false,
  href,
  className = '',
  imageClassName = 'h-9 w-auto',
}: PetspondLogoProps) {
  const image = (
    <Image
      src={petspondLogo}
      alt="Petspond"
      priority
      className={imageClassName}
    />
  );

  return (
    <div className={className}>
      {href ? (
        <Link href={href} className="inline-block">
          {image}
        </Link>
      ) : (
        image
      )}
      {showClinicianSubtitle ? (
        <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">
          For clinicians
        </p>
      ) : null}
    </div>
  );
}
