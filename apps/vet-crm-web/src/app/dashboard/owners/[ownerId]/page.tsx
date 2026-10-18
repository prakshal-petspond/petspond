'use client';

import { use } from 'react';
import { OwnerProfilePage } from '@/features/directory/owners/OwnerProfilePage';

export default function DashboardOwnerProfilePage({
  params,
}: {
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = use(params);
  return <OwnerProfilePage ownerId={ownerId} />;
}
