import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ClinicOwnerActivityItem,
  ClinicOwnerAppStatus,
  ClinicOwnerDirectoryItem,
  ClinicOwnerPaymentItem,
  ClinicOwnerProfilePet,
  ClinicOwnerProfileResponse,
  ClinicOwnersBoardResponse,
  ClinicPetAppStatus,
  ClinicPetDirectoryItem,
  ClinicPetHealthStatus,
  ClinicPetsBoardResponse,
  Vet,
} from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

function ageLabelFromDob(dateOfBirth?: string | null): string | undefined {
  if (!dateOfBirth?.trim()) return undefined;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return undefined;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
  if (years < 0) return undefined;
  if (years === 0) {
    const months = Math.max(
      0,
      (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth(),
    );
    return months <= 1 ? '~1 mo' : `${months} mo`;
  }
  return `${years} yr${years === 1 ? '' : 's'}`;
}

function normalizeSpecies(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return 'other';
  if (s.includes('dog') || s === 'canine') return 'dog';
  if (s.includes('cat') || s === 'feline') return 'cat';
  if (s.includes('bird') || s.includes('parrot') || s.includes('avian')) return 'bird';
  return 'other';
}

function petKey(row: {
  petId: string | null;
  petName: string;
  userId: string | null;
  ownerMobileSnapshot: string | null;
}): string {
  if (row.petId) return `pet:${row.petId}`;
  const owner =
    row.userId ||
    (row.ownerMobileSnapshot ? `m:${row.ownerMobileSnapshot.replace(/\D/g, '').slice(-10)}` : 'anon');
  return `snap:${owner}:${row.petName.trim().toLowerCase()}`;
}

function shortDisplayId(key: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const n = (hash % 9000) + 1000 + (index % 97);
  return `PET-${String(n).padStart(4, '0')}`;
}

@Injectable()
export class ClinicDirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  private assertClinic(vet: Vet): string {
    if (!vet.clinicId || vet.approvalStatus !== 'approved') {
      throw new ForbiddenException('Clinic access required');
    }
    return vet.clinicId;
  }

  async listPets(vet: Vet): Promise<ClinicPetsBoardResponse> {
    const clinicId = this.assertClinic(vet);

    const [consultations, vaccinations] = await Promise.all([
      this.prisma.consultationBooking.findMany({
        where: { clinicId, status: { not: 'cancelled' } },
        orderBy: { scheduledAt: 'desc' },
        take: 2000,
      }),
      this.prisma.vaccinationBooking.findMany({
        where: { clinicId, status: { not: 'cancelled' } },
        orderBy: { scheduledAt: 'desc' },
        take: 1000,
      }),
    ]);

    type Agg = {
      key: string;
      petId?: string;
      name: string;
      species: string;
      breed: string;
      userId?: string;
      ownerName?: string;
      ownerMobile?: string;
      isWalkIn: boolean;
      lastVisitAt: Date;
      visitCount: number;
      inClinicNow: boolean;
      hadVaccination: boolean;
      incomplete: boolean;
    };

    const map = new Map<string, Agg>();

    const upsert = (input: {
      key: string;
      petId?: string | null;
      name: string;
      species: string;
      breed: string;
      userId?: string | null;
      ownerName?: string | null;
      ownerMobile?: string | null;
      isWalkIn?: boolean;
      visitAt: Date;
      inClinicNow?: boolean;
      hadVaccination?: boolean;
    }) => {
      const existing = map.get(input.key);
      const incomplete =
        !input.breed?.trim() ||
        input.breed.trim().toLowerCase() === 'unknown' ||
        (!input.userId && Boolean(input.isWalkIn));

      if (!existing) {
        map.set(input.key, {
          key: input.key,
          petId: input.petId ?? undefined,
          name: input.name,
          species: input.species,
          breed: input.breed,
          userId: input.userId ?? undefined,
          ownerName: input.ownerName ?? undefined,
          ownerMobile: input.ownerMobile ?? undefined,
          isWalkIn: Boolean(input.isWalkIn),
          lastVisitAt: input.visitAt,
          visitCount: 1,
          inClinicNow: Boolean(input.inClinicNow),
          hadVaccination: Boolean(input.hadVaccination),
          incomplete,
        });
        return;
      }

      existing.visitCount += 1;
      if (input.visitAt.getTime() > existing.lastVisitAt.getTime()) {
        existing.lastVisitAt = input.visitAt;
        existing.name = input.name || existing.name;
        existing.species = input.species || existing.species;
        existing.breed = input.breed || existing.breed;
      }
      if (input.petId) existing.petId = input.petId;
      if (input.userId) {
        existing.userId = input.userId;
        existing.isWalkIn = false;
      }
      if (input.ownerName && !existing.ownerName) existing.ownerName = input.ownerName;
      if (input.ownerMobile && !existing.ownerMobile) existing.ownerMobile = input.ownerMobile;
      if (input.inClinicNow) existing.inClinicNow = true;
      if (input.hadVaccination) existing.hadVaccination = true;
      existing.incomplete =
        existing.incomplete ||
        !existing.breed?.trim() ||
        existing.breed.trim().toLowerCase() === 'unknown' ||
        (!existing.userId && existing.isWalkIn);
    };

    for (const row of consultations) {
      upsert({
        key: petKey(row),
        petId: row.petId,
        name: row.petName,
        species: row.petSpecies,
        breed: row.petBreed,
        userId: row.userId,
        ownerName: row.ownerNameSnapshot,
        ownerMobile: row.ownerMobileSnapshot,
        isWalkIn: row.isWalkIn,
        visitAt: row.checkedInAt ?? row.scheduledAt,
        inClinicNow:
          row.queueStatus === 'waiting' ||
          row.queueStatus === 'in_consultation' ||
          row.queueStatus === 'ready_checkout',
        hadVaccination: (row.reasonIds ?? []).some((r) => r.toLowerCase().includes('vaccin')),
      });
    }

    for (const row of vaccinations) {
      upsert({
        key: row.petId
          ? `pet:${row.petId}`
          : petKey({
              petId: row.petId,
              petName: row.petName,
              userId: row.userId,
              ownerMobileSnapshot: null,
            }),
        petId: row.petId,
        name: row.petName,
        species: row.petSpecies,
        breed: row.petBreed,
        userId: row.userId,
        visitAt: row.scheduledAt,
        hadVaccination: true,
      });
    }

    const userIds = [...new Set([...map.values()].map((p) => p.userId).filter(Boolean))] as string[];
    const petIds = [...new Set([...map.values()].map((p) => p.petId).filter(Boolean))] as string[];

    const [users, pets] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, mobile: true },
          })
        : Promise.resolve([]),
      petIds.length
        ? this.prisma.pet.findMany({
            where: { id: { in: petIds } },
            select: { id: true, name: true, species: true, breed: true, dateOfBirth: true },
          })
        : Promise.resolve([]),
    ]);

    const userById = new Map(users.map((u) => [u.id, u]));
    const petById = new Map(pets.map((p) => [p.id, p]));

    const sorted = [...map.values()].sort(
      (a, b) => b.lastVisitAt.getTime() - a.lastVisitAt.getTime(),
    );

    const items: ClinicPetDirectoryItem[] = sorted.map((agg, index) => {
      const user = agg.userId ? userById.get(agg.userId) : undefined;
      const pet = agg.petId ? petById.get(agg.petId) : undefined;
      const name = pet?.name || agg.name;
      const species = normalizeSpecies(pet?.species || agg.species);
      const breed = pet?.breed || agg.breed || 'Unknown';
      const ownerName =
        user?.name?.trim() ||
        agg.ownerName?.trim() ||
        (agg.isWalkIn ? 'Walk-in' : 'Owner');
      const ownerMobile = user?.mobile || agg.ownerMobile || undefined;

      let appStatus: ClinicPetAppStatus = 'none';
      if (agg.userId) appStatus = 'on_app';
      else if (!agg.isWalkIn && ownerMobile) appStatus = 'invited';

      let status: ClinicPetHealthStatus = 'healthy';
      if (agg.incomplete || (!agg.userId && agg.isWalkIn)) status = 'incomplete';
      else if (agg.inClinicNow) status = 'under_treatment';
      else if (agg.hadVaccination) {
        const monthsSince =
          (Date.now() - agg.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsSince >= 6) status = 'vaccination_due';
      }

      return {
        id: agg.key,
        displayId: shortDisplayId(agg.key, index),
        petId: agg.petId,
        name,
        species,
        breed,
        ageLabel: ageLabelFromDob(pet?.dateOfBirth),
        ownerName,
        ownerMobile,
        userId: agg.userId,
        isWalkIn: agg.isWalkIn && !agg.userId,
        lastVisitAt: agg.lastVisitAt.toISOString(),
        appStatus,
        status,
        visitCount: agg.visitCount,
      };
    });

    return {
      pets: items,
      summary: {
        total: items.length,
        incompleteProfiles: items.filter((p) => p.status === 'incomplete').length,
      },
    };
  }

  async listOwners(vet: Vet): Promise<ClinicOwnersBoardResponse> {
    const clinicId = this.assertClinic(vet);

    const [consultations, vaccinations] = await Promise.all([
      this.prisma.consultationBooking.findMany({
        where: { clinicId, status: { not: 'cancelled' } },
        orderBy: { scheduledAt: 'desc' },
        take: 2000,
      }),
      this.prisma.vaccinationBooking.findMany({
        where: { clinicId, status: { not: 'cancelled' } },
        orderBy: { scheduledAt: 'desc' },
        take: 1000,
      }),
    ]);

    type PetSnap = { key: string; name: string; breed: string };
    type Agg = {
      key: string;
      userId?: string;
      name?: string;
      mobile?: string;
      isWalkIn: boolean;
      lastVisitAt: Date;
      firstVisitAt: Date;
      visitCount: number;
      amountDuePaise: number;
      pets: Map<string, PetSnap>;
    };

    const map = new Map<string, Agg>();

    const ownerKey = (input: {
      userId?: string | null;
      mobile?: string | null;
      name?: string | null;
    }): string | null => {
      if (input.userId) return `user:${input.userId}`;
      const digits = (input.mobile ?? '').replace(/\D/g, '').slice(-10);
      if (digits.length >= 10) return `m:${digits}`;
      const name = (input.name ?? '').trim().toLowerCase();
      if (name) return `name:${name}`;
      return null;
    };

    const upsert = (input: {
      userId?: string | null;
      name?: string | null;
      mobile?: string | null;
      isWalkIn?: boolean;
      visitAt: Date;
      amountDuePaise?: number;
      petName?: string;
      petBreed?: string;
      petId?: string | null;
    }) => {
      const key = ownerKey(input);
      if (!key) return;

      const petKeyStr = input.petId
        ? `pet:${input.petId}`
        : input.petName
          ? `snap:${input.petName.trim().toLowerCase()}`
          : null;

      const existing = map.get(key);
      if (!existing) {
        const pets = new Map<string, PetSnap>();
        if (petKeyStr && input.petName) {
          pets.set(petKeyStr, {
            key: petKeyStr,
            name: input.petName,
            breed: input.petBreed?.trim() || 'Unknown',
          });
        }
        map.set(key, {
          key,
          userId: input.userId ?? undefined,
          name: input.name?.trim() || undefined,
          mobile: input.mobile?.replace(/\D/g, '').slice(-10) || undefined,
          isWalkIn: Boolean(input.isWalkIn) && !input.userId,
          lastVisitAt: input.visitAt,
          firstVisitAt: input.visitAt,
          visitCount: 1,
          amountDuePaise: input.amountDuePaise ?? 0,
          pets,
        });
        return;
      }

      existing.visitCount += 1;
      existing.amountDuePaise += input.amountDuePaise ?? 0;
      if (input.visitAt.getTime() > existing.lastVisitAt.getTime()) {
        existing.lastVisitAt = input.visitAt;
      }
      if (input.visitAt.getTime() < existing.firstVisitAt.getTime()) {
        existing.firstVisitAt = input.visitAt;
      }
      if (input.userId) {
        existing.userId = input.userId;
        existing.isWalkIn = false;
      }
      if (input.name?.trim() && !existing.name) existing.name = input.name.trim();
      if (input.mobile) {
        const digits = input.mobile.replace(/\D/g, '').slice(-10);
        if (digits && !existing.mobile) existing.mobile = digits;
      }
      if (petKeyStr && input.petName && !existing.pets.has(petKeyStr)) {
        existing.pets.set(petKeyStr, {
          key: petKeyStr,
          name: input.petName,
          breed: input.petBreed?.trim() || 'Unknown',
        });
      }
    };

    for (const row of consultations) {
      const due =
        row.paymentStatus === 'pending' && row.totalPaise > 0 ? row.totalPaise : 0;
      upsert({
        userId: row.userId,
        name: row.ownerNameSnapshot,
        mobile: row.ownerMobileSnapshot,
        isWalkIn: row.isWalkIn,
        visitAt: row.checkedInAt ?? row.scheduledAt,
        amountDuePaise: due,
        petName: row.petName,
        petBreed: row.petBreed,
        petId: row.petId,
      });
    }

    for (const row of vaccinations) {
      const due =
        row.paymentStatus === 'pending' && row.totalPaise > 0 ? row.totalPaise : 0;
      upsert({
        userId: row.userId,
        visitAt: row.scheduledAt,
        amountDuePaise: due,
        petName: row.petName,
        petBreed: row.petBreed,
        petId: row.petId,
      });
    }

    const userIds = [...new Set([...map.values()].map((o) => o.userId).filter(Boolean))] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, mobile: true, createdAt: true },
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const sorted = [...map.values()].sort(
      (a, b) => b.lastVisitAt.getTime() - a.lastVisitAt.getTime(),
    );

    const owners: ClinicOwnerDirectoryItem[] = sorted.map((agg) => {
      const user = agg.userId ? userById.get(agg.userId) : undefined;
      const name =
        user?.name?.trim() ||
        agg.name?.trim() ||
        (agg.isWalkIn ? 'Walk-in owner' : 'Owner');
      const mobile = user?.mobile || agg.mobile || undefined;

      let appStatus: ClinicOwnerAppStatus = 'none';
      if (agg.userId) appStatus = 'on_app';
      else if (mobile) appStatus = 'invited';

      return {
        id: agg.key,
        name,
        mobile,
        userId: agg.userId,
        isWalkIn: agg.isWalkIn && !agg.userId,
        appStatus,
        lastVisitAt: agg.lastVisitAt.toISOString(),
        isFirstVisit: agg.visitCount <= 1,
        visitCount: agg.visitCount,
        pets: [...agg.pets.values()].map((p) => ({ name: p.name, breed: p.breed })),
        amountDuePaise: agg.amountDuePaise,
        invitedAt:
          appStatus === 'invited' ? agg.firstVisitAt.toISOString() : undefined,
      };
    });

    const onAppCount = owners.filter((o) => o.appStatus === 'on_app').length;
    const invitedCount = owners.filter((o) => o.appStatus === 'invited').length;
    const paymentDueCount = owners.filter((o) => o.amountDuePaise > 0).length;

    return {
      owners,
      summary: {
        total: owners.length,
        onAppCount,
        invitedCount,
        paymentDueCount,
      },
    };
  }

  async getOwnerProfile(vet: Vet, ownerId: string): Promise<ClinicOwnerProfileResponse> {
    const clinicId = this.assertClinic(vet);
    const decoded = decodeURIComponent(ownerId);
    const board = await this.listOwners(vet);
    const ownerSummary = board.owners.find((o) => o.id === decoded);
    if (!ownerSummary) throw new NotFoundException('Owner not found');

    const consultWhere = this.ownerConsultWhere(clinicId, ownerSummary);
    const vaxWhere = this.ownerVaxWhere(clinicId, ownerSummary);

    const [consultations, vaccinations, user] = await Promise.all([
      this.prisma.consultationBooking.findMany({
        where: consultWhere,
        orderBy: { scheduledAt: 'desc' },
        take: 100,
      }),
      this.prisma.vaccinationBooking.findMany({
        where: vaxWhere,
        orderBy: { scheduledAt: 'desc' },
        take: 50,
      }),
      ownerSummary.userId
        ? this.prisma.user.findUnique({
            where: { id: ownerSummary.userId },
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
              city: true,
              pincode: true,
              createdAt: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const petIds = [
      ...new Set(
        [...consultations, ...vaccinations]
          .map((r) => r.petId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const petsDb = petIds.length
      ? await this.prisma.pet.findMany({
          where: { id: { in: petIds } },
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            dateOfBirth: true,
            weight: true,
          },
        })
      : [];
    const petById = new Map(petsDb.map((p) => [p.id, p]));

    const vetIds = [
      ...new Set(consultations.map((c) => c.vetId).filter(Boolean)),
    ];
    const vets = vetIds.length
      ? await this.prisma.vet.findMany({
          where: { id: { in: vetIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const vetById = new Map(vets.map((v) => [v.id, v]));

    type PetAgg = {
      id: string;
      petId?: string;
      name: string;
      species: string;
      breed: string;
      weightLabel?: string;
      lastVisitAt?: Date;
      hadVaccination: boolean;
      inClinicNow: boolean;
      incomplete: boolean;
      nextDueLabel?: string;
    };
    const petMap = new Map<string, PetAgg>();

    const upsertPet = (input: {
      petId?: string | null;
      name: string;
      species: string;
      breed: string;
      weightLabel?: string;
      visitAt: Date;
      hadVaccination?: boolean;
      inClinicNow?: boolean;
      nextDueLabel?: string;
    }) => {
      const key = input.petId
        ? `pet:${input.petId}`
        : `snap:${input.name.trim().toLowerCase()}`;
      const dbPet = input.petId ? petById.get(input.petId) : undefined;
      const existing = petMap.get(key);
      const incomplete =
        !input.breed?.trim() || input.breed.trim().toLowerCase() === 'unknown';
      if (!existing) {
        petMap.set(key, {
          id: key,
          petId: input.petId ?? undefined,
          name: dbPet?.name || input.name,
          species: normalizeSpecies(dbPet?.species || input.species),
          breed: dbPet?.breed || input.breed || 'Unknown',
          weightLabel:
            input.weightLabel ||
            (dbPet?.weight != null ? `${dbPet.weight} kg` : undefined),
          lastVisitAt: input.visitAt,
          hadVaccination: Boolean(input.hadVaccination),
          inClinicNow: Boolean(input.inClinicNow),
          incomplete,
          nextDueLabel: input.nextDueLabel,
        });
        return;
      }
      if (!existing.lastVisitAt || input.visitAt > existing.lastVisitAt) {
        existing.lastVisitAt = input.visitAt;
      }
      if (input.hadVaccination) existing.hadVaccination = true;
      if (input.inClinicNow) existing.inClinicNow = true;
      if (input.nextDueLabel && !existing.nextDueLabel) {
        existing.nextDueLabel = input.nextDueLabel;
      }
      if (input.weightLabel && !existing.weightLabel) {
        existing.weightLabel = input.weightLabel;
      }
      existing.incomplete = existing.incomplete || incomplete;
    };

    for (const row of consultations) {
      upsertPet({
        petId: row.petId,
        name: row.petName,
        species: row.petSpecies,
        breed: row.petBreed,
        weightLabel: row.petWeightLabel ?? undefined,
        visitAt: row.checkedInAt ?? row.scheduledAt,
        hadVaccination: (row.reasonIds ?? []).some((r) => r.toLowerCase().includes('vaccin')),
        inClinicNow:
          row.queueStatus === 'waiting' ||
          row.queueStatus === 'in_consultation' ||
          row.queueStatus === 'ready_checkout',
      });
    }

    for (const row of vaccinations) {
      const due = new Date(row.scheduledAt);
      due.setMonth(due.getMonth() + 12);
      const dueLabel = `Vac · ${due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
      upsertPet({
        petId: row.petId,
        name: row.petName,
        species: row.petSpecies,
        breed: row.petBreed,
        visitAt: row.scheduledAt,
        hadVaccination: true,
        nextDueLabel: dueLabel,
      });
    }

    const pets: ClinicOwnerProfilePet[] = [...petMap.values()]
      .sort(
        (a, b) =>
          (b.lastVisitAt?.getTime() ?? 0) - (a.lastVisitAt?.getTime() ?? 0),
      )
      .map((p) => {
        const dbPet = p.petId ? petById.get(p.petId) : undefined;
        let status: ClinicPetHealthStatus = 'healthy';
        if (p.incomplete) status = 'incomplete';
        else if (p.inClinicNow) status = 'under_treatment';
        else if (p.hadVaccination) {
          const monthsSince = p.lastVisitAt
            ? (Date.now() - p.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
            : 0;
          if (monthsSince >= 6) status = 'vaccination_due';
        }
        return {
          id: p.id,
          petId: p.petId,
          name: p.name,
          species: p.species,
          breed: p.breed,
          ageLabel: ageLabelFromDob(dbPet?.dateOfBirth),
          weightLabel: p.weightLabel,
          lastVisitAt: p.lastVisitAt?.toISOString(),
          nextDueLabel: p.nextDueLabel,
          status,
        };
      });

    const payments: ClinicOwnerPaymentItem[] = [
      ...consultations.map((row) => ({
        id: row.id,
        date: (row.collectedAt ?? row.scheduledAt).toISOString(),
        petName: row.petName,
        serviceLabel: this.serviceLabel(row.reasonIds),
        amountPaise: row.totalPaise,
        methodLabel: row.paymentMethodLabel || (row.stripeCheckoutSessionId ? 'App' : '—'),
        paymentStatus: row.paymentStatus as ClinicOwnerPaymentItem['paymentStatus'],
      })),
      ...vaccinations.map((row) => ({
        id: row.id,
        date: row.scheduledAt.toISOString(),
        petName: row.petName,
        serviceLabel: 'Vaccination',
        amountPaise: row.totalPaise,
        methodLabel: row.paymentMethodLabel || (row.stripeCheckoutSessionId ? 'App' : '—'),
        paymentStatus: row.paymentStatus as ClinicOwnerPaymentItem['paymentStatus'],
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    const lifetimeSpendPaise = payments
      .filter((p) => p.paymentStatus === 'paid')
      .reduce((s, p) => s + p.amountPaise, 0);
    const amountDuePaise = payments
      .filter((p) => p.paymentStatus === 'pending')
      .reduce((s, p) => s + p.amountPaise, 0);
    const allPaid = amountDuePaise <= 0;

    const activity: ClinicOwnerActivityItem[] = [];
    for (const row of consultations.slice(0, 30)) {
      const vetName = vetById.get(row.vetId)?.fullName;
      const doctor = vetName ? `Dr. ${vetName.replace(/^Dr\.?\s*/i, '')}` : 'Doctor';
      const via = row.isWalkIn ? 'Walk-in' : row.userId ? 'Via app booking' : 'Booking';
      const paidBit =
        row.paymentStatus === 'paid'
          ? `₹${Math.round(row.totalPaise / 100).toLocaleString('en-IN')} paid${
              row.paymentMethodLabel ? ` by ${row.paymentMethodLabel}` : ''
            }`
          : row.paymentStatus === 'pending' && row.totalPaise > 0
            ? `₹${Math.round(row.totalPaise / 100).toLocaleString('en-IN')} pending`
            : '';
      const service = this.serviceLabel(row.reasonIds);
      if (row.checkedInAt || row.queueStatus !== 'expected') {
        activity.push({
          id: `ci-${row.id}`,
          kind: 'checked_in',
          at: (row.checkedInAt ?? row.scheduledAt).toISOString(),
          title: `${row.petName} checked in`,
          detail: [via, doctor, service, paidBit].filter(Boolean).join(' — '),
        });
      } else {
        activity.push({
          id: `bk-${row.id}`,
          kind: 'booked',
          at: row.createdAt.toISOString(),
          title: row.userId ? 'Booked via app' : 'Booking created',
          detail: `${row.petName} · ${service}`,
        });
      }
    }
    for (const row of vaccinations.slice(0, 15)) {
      activity.push({
        id: `vx-${row.id}`,
        kind: 'booked',
        at: row.createdAt.toISOString(),
        title: 'Booked via app',
        detail: `${row.petName} · Vaccination`,
      });
    }
    activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const addressParts = [user?.city, user?.pincode].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : undefined;

    return {
      owner: {
        ...ownerSummary,
        name: user?.name?.trim() || ownerSummary.name,
        mobile: user?.mobile || ownerSummary.mobile,
        email: user?.email ?? undefined,
        address,
        memberSinceYear: user?.createdAt
          ? user.createdAt.getFullYear()
          : new Date(ownerSummary.lastVisitAt).getFullYear(),
        lifetimeSpendPaise,
        amountDuePaise,
        visitCount: consultations.length + vaccinations.length || ownerSummary.visitCount || 0,
        pets: pets.map((p) => ({ name: p.name, breed: p.breed })),
      },
      payments,
      pets,
      activity: activity.slice(0, 20),
      allPaid,
    };
  }

  private ownerConsultWhere(
    clinicId: string,
    owner: ClinicOwnerDirectoryItem,
  ): Prisma.ConsultationBookingWhereInput {
    const base: Prisma.ConsultationBookingWhereInput = {
      clinicId,
      status: { not: 'cancelled' },
    };
    if (owner.userId) return { ...base, userId: owner.userId };
    if (owner.mobile) {
      return {
        ...base,
        OR: [
          { ownerMobileSnapshot: owner.mobile },
          { ownerMobileSnapshot: { endsWith: owner.mobile } },
        ],
      };
    }
    return {
      ...base,
      ownerNameSnapshot: { equals: owner.name, mode: 'insensitive' },
      userId: null,
    };
  }

  private ownerVaxWhere(
    clinicId: string,
    owner: ClinicOwnerDirectoryItem,
  ): Prisma.VaccinationBookingWhereInput {
    const base: Prisma.VaccinationBookingWhereInput = {
      clinicId,
      status: { not: 'cancelled' },
    };
    if (owner.userId) return { ...base, userId: owner.userId };
    // Vaccinations always have userId in schema; no walk-in match without user
    return { ...base, id: '__none__' };
  }

  private serviceLabel(reasonIds?: string[] | null): string {
    const raw = reasonIds?.[0]?.replace(/-/g, ' ') ?? 'Consultation';
    return raw.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
