import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ConsultationBooking as ConsultationRow,
  VaccinationBooking as VaccinationRow,
} from '@prisma/client';
import type {
  ConsultationBooking,
  CreateConsultationBookingDto,
  CreateVaccinationBookingDto,
  VaccinationBooking,
  Vet,
} from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';
import { PetsService } from '@/pets/pets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { VetsService } from '@/vets/vets.service';

type VaccineLine = { vaccineId: string; name: string; pricePaise: number };

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petsService: PetsService,
    private readonly clinicsService: ClinicsService,
    private readonly vetsService: VetsService,
  ) {}

  private assertVetClinic(vet: Vet, clinicId: string) {
    if (vet.approvalStatus !== 'approved' || vet.clinicId !== clinicId) {
      throw new ForbiddenException('No access to this clinic');
    }
  }

  /** Matches pet parent app slot step (30 minutes). */
  private assertConsultationSlotMatchesVetAvailability(scheduledAt: Date, vet: Vet) {
    const blocks = vet.weeklyAvailability ?? [];
    if (!blocks.length) return;
    const dow = scheduledAt.getDay();
    const sm = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
    const slotMins = 30;
    const ok = blocks.some(
      (b) => b.dayOfWeek === dow && sm >= b.startMinute && sm + slotMins <= b.endMinute,
    );
    if (!ok) {
      throw new BadRequestException("That time is outside this veterinarian's scheduled hours");
    }
  }

  private async assertVaccinationSlotMatchesClinicAvailability(scheduledAt: Date, clinicId: string) {
    const vets = await this.vetsService.findApprovedByClinicId(clinicId);
    if (!vets.length) return;
    const hasCustom = vets.some((v) => v.weeklyAvailability.length > 0);
    if (!hasCustom) return;
    const dow = scheduledAt.getDay();
    const sm = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
    const slotMins = 30;
    const ok = vets.some(
      (v) =>
        !v.weeklyAvailability.length ||
        v.weeklyAvailability.some(
          (b) => b.dayOfWeek === dow && sm >= b.startMinute && sm + slotMins <= b.endMinute,
        ),
    );
    if (!ok) {
      throw new BadRequestException('No veterinarian at this clinic is available at that time');
    }
  }

  async createConsultation(userId: string, dto: CreateConsultationBookingDto): Promise<ConsultationBooking> {
    const pet = await this.petsService.assertPetOwnedByUser(dto.petId, userId);
    const clinic = await this.clinicsService.findById(dto.clinicId);
    if (!clinic) throw new NotFoundException('Clinic not found');
    if (!clinic.acceptsConsultations) {
      throw new BadRequestException('This clinic is not accepting consultation bookings');
    }
    const vet = await this.vetsService.findById(dto.vetId);
    if (!vet || vet.clinicId !== dto.clinicId || vet.approvalStatus !== 'approved') {
      throw new BadRequestException('Choose a doctor at this clinic');
    }
    this.assertConsultationSlotMatchesVetAvailability(new Date(dto.scheduledAt), vet);
    const consultationFeePaise = 0;
    const platformFeePaise = 0;
    const discountPaise = dto.discountPaise ?? 0;
    const totalPaise = Math.max(0, consultationFeePaise + platformFeePaise - discountPaise);

    const row = await this.prisma.consultationBooking.create({
      data: {
        userId,
        clinicId: dto.clinicId,
        vetId: dto.vetId,
        petId: pet.id,
        petName: pet.name,
        petSpecies: pet.species,
        petBreed: pet.breed,
        petWeightLabel: pet.weight != null ? `${pet.weight} kg` : undefined,
        reasonIds: dto.reasonIds ?? [],
        notes: dto.notes,
        scheduledAt: new Date(dto.scheduledAt),
        status: 'pending_payment',
        paymentStatus: 'pending',
        consultationFeePaise,
        platformFeePaise,
        discountPaise,
        totalPaise,
        promoCode: dto.promoCode,
        paymentMethodLabel: dto.paymentMethodLabel,
      },
    });

    return this.enrichConsultation(row);
  }

  async confirmConsultationPayment(
    userId: string,
    bookingId: string,
    stripeSessionId?: string,
  ): Promise<ConsultationBooking> {
    const existing = await this.prisma.consultationBooking.findUnique({ where: { id: bookingId } });
    if (!existing || existing.userId !== userId) throw new NotFoundException('Booking not found');
    const row = await this.prisma.consultationBooking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'paid',
        status: 'scheduled',
        ...(stripeSessionId && { stripeCheckoutSessionId: stripeSessionId }),
      },
    });
    return this.enrichConsultation(row);
  }

  async listConsultationsForUser(userId: string): Promise<ConsultationBooking[]> {
    const rows = await this.prisma.consultationBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return this.enrichConsultationsBatch(rows);
  }

  async listConsultationsForVet(vet: Vet): Promise<ConsultationBooking[]> {
    if (!vet.clinicId) return [];
    this.assertVetClinic(vet, vet.clinicId);
    const rows = await this.prisma.consultationBooking.findMany({
      where: { clinicId: vet.clinicId },
      orderBy: { scheduledAt: 'asc' },
      take: 200,
    });
    return this.enrichConsultationsBatch(rows);
  }

  async updateConsultationStatus(
    vet: Vet,
    bookingId: string,
    status: ConsultationBooking['status'],
  ): Promise<ConsultationBooking> {
    if (!vet.clinicId) throw new ForbiddenException('No clinic');
    this.assertVetClinic(vet, vet.clinicId);
    const existing = await this.prisma.consultationBooking.findUnique({ where: { id: bookingId } });
    if (!existing || existing.clinicId !== vet.clinicId) throw new NotFoundException('Booking not found');
    const row = await this.prisma.consultationBooking.update({
      where: { id: bookingId },
      data: { status },
    });
    return this.enrichConsultation(row);
  }

  async createVaccination(userId: string, dto: CreateVaccinationBookingDto): Promise<VaccinationBooking> {
    const pet = await this.petsService.assertPetOwnedByUser(dto.petId, userId);
    const clinic = await this.clinicsService.findById(dto.clinicId);
    if (!clinic) throw new NotFoundException('Clinic not found');
    if (!clinic.acceptsVaccinations) {
      throw new BadRequestException('This clinic is not accepting vaccination bookings');
    }
    const offered = clinic.vaccinesOffered ?? [];
    const vaccines = offered.filter((v) => dto.vaccineIds.includes(v.id));
    if (vaccines.length === 0) {
      throw new BadRequestException('Select at least one vaccine this clinic offers');
    }
    const vaccinesSubtotalPaise = vaccines.reduce((s, v) => s + v.pricePaise, 0);
    const platformFeePaise = 0;
    const discountPaise = dto.discountPaise ?? 0;
    const totalPaise = Math.max(0, vaccinesSubtotalPaise + platformFeePaise - discountPaise);

    await this.assertVaccinationSlotMatchesClinicAvailability(new Date(dto.scheduledAt), dto.clinicId);

    const row = await this.prisma.vaccinationBooking.create({
      data: {
        userId,
        clinicId: dto.clinicId,
        petId: pet.id,
        petName: pet.name,
        petSpecies: pet.species,
        petBreed: pet.breed,
        vaccines: vaccines.map((v) => ({ vaccineId: v.id, name: v.name, pricePaise: v.pricePaise })),
        notes: dto.notes,
        scheduledAt: new Date(dto.scheduledAt),
        status: 'pending_payment',
        paymentStatus: 'pending',
        platformFeePaise,
        discountPaise,
        vaccinesSubtotalPaise,
        totalPaise,
        promoCode: dto.promoCode,
        paymentMethodLabel: dto.paymentMethodLabel,
      },
    });

    return this.enrichVaccination(row);
  }

  async confirmVaccinationPayment(
    userId: string,
    bookingId: string,
    stripeSessionId?: string,
  ): Promise<VaccinationBooking> {
    const existing = await this.prisma.vaccinationBooking.findUnique({ where: { id: bookingId } });
    if (!existing || existing.userId !== userId) throw new NotFoundException('Booking not found');
    const row = await this.prisma.vaccinationBooking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'paid',
        status: 'scheduled',
        ...(stripeSessionId && { stripeCheckoutSessionId: stripeSessionId }),
      },
    });
    return this.enrichVaccination(row);
  }

  async listVaccinationsForUser(userId: string): Promise<VaccinationBooking[]> {
    const rows = await this.prisma.vaccinationBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return this.enrichVaccinationsBatch(rows);
  }

  async listVaccinationsForVet(vet: Vet): Promise<VaccinationBooking[]> {
    if (!vet.clinicId) return [];
    this.assertVetClinic(vet, vet.clinicId);
    const rows = await this.prisma.vaccinationBooking.findMany({
      where: { clinicId: vet.clinicId },
      orderBy: { scheduledAt: 'asc' },
      take: 200,
    });
    return this.enrichVaccinationsBatch(rows);
  }

  async updateVaccinationStatus(
    vet: Vet,
    bookingId: string,
    status: VaccinationBooking['status'],
  ): Promise<VaccinationBooking> {
    if (!vet.clinicId) throw new ForbiddenException('No clinic');
    this.assertVetClinic(vet, vet.clinicId);
    const existing = await this.prisma.vaccinationBooking.findUnique({ where: { id: bookingId } });
    if (!existing || existing.clinicId !== vet.clinicId) throw new NotFoundException('Booking not found');
    const row = await this.prisma.vaccinationBooking.update({
      where: { id: bookingId },
      data: { status },
    });
    return this.enrichVaccination(row);
  }

  async enrichConsultationPublic(row: ConsultationRow): Promise<ConsultationBooking> {
    return this.enrichConsultation(row);
  }

  async enrichConsultationsBatch(rows: ConsultationRow[]): Promise<ConsultationBooking[]> {
    if (!rows.length) return [];
    const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))];
    const clinicIds = [...new Set(rows.map((r) => r.clinicId))];
    const vetIds = [...new Set(rows.map((r) => r.vetId))];

    const [users, clinics, vets] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({ where: { id: { in: userIds } } })
        : Promise.resolve([]),
      this.prisma.clinic.findMany({ where: { id: { in: clinicIds } } }),
      this.prisma.vet.findMany({ where: { id: { in: vetIds } } }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const clinicMap = new Map(clinics.map((c) => [c.id, c]));
    const vetMap = new Map(vets.map((v) => [v.id, v]));

    return rows.map((row) => {
      const user = row.userId ? userMap.get(row.userId) : undefined;
      const clinic = clinicMap.get(row.clinicId);
      const v = vetMap.get(row.vetId);
      return this.mapConsultation(row, user?.name, user?.mobile, clinic?.name, v?.fullName);
    });
  }

  private async enrichConsultation(row: ConsultationRow): Promise<ConsultationBooking> {
    const [batch] = await this.enrichConsultationsBatch([row]);
    return batch!;
  }

  private mapConsultation(
    row: ConsultationRow,
    userName?: string,
    userMobile?: string,
    clinicName?: string,
    vetName?: string,
  ): ConsultationBooking {
    return {
      id: row.id,
      ...(row.userId && { userId: row.userId }),
      clinicId: row.clinicId,
      vetId: row.vetId,
      ...(row.petId && { petId: row.petId }),
      petName: row.petName,
      petSpecies: row.petSpecies,
      petBreed: row.petBreed,
      petWeightLabel: row.petWeightLabel ?? undefined,
      reasonIds: row.reasonIds ?? [],
      notes: row.notes ?? undefined,
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status as ConsultationBooking['status'],
      paymentStatus: row.paymentStatus as ConsultationBooking['paymentStatus'],
      consultationFeePaise: row.consultationFeePaise,
      platformFeePaise: row.platformFeePaise,
      discountPaise: row.discountPaise ?? 0,
      totalPaise: row.totalPaise,
      promoCode: row.promoCode ?? undefined,
      paymentMethodLabel: row.paymentMethodLabel ?? undefined,
      stripeCheckoutSessionId: row.stripeCheckoutSessionId ?? undefined,
      userName: userName ?? row.ownerNameSnapshot ?? undefined,
      userMobile: userMobile ?? row.ownerMobileSnapshot ?? undefined,
      clinicName,
      vetName,
      queueStatus: (row.queueStatus as ConsultationBooking['queueStatus']) ?? 'expected',
      isWalkIn: row.isWalkIn ?? false,
      ...(row.ownerNameSnapshot && { ownerNameSnapshot: row.ownerNameSnapshot }),
      ...(row.ownerMobileSnapshot && { ownerMobileSnapshot: row.ownerMobileSnapshot }),
      ...(row.checkedInAt && { checkedInAt: row.checkedInAt.toISOString() }),
      ...(row.consultationStartedAt && {
        consultationStartedAt: row.consultationStartedAt.toISOString(),
      }),
      ...(row.checkoutReadyAt && { checkoutReadyAt: row.checkoutReadyAt.toISOString() }),
      ...(row.roomLabel && { roomLabel: row.roomLabel }),
      ...(row.invoiceNumber && { invoiceNumber: row.invoiceNumber }),
      ...(row.collectedAt && { collectedAt: row.collectedAt.toISOString() }),
      ...(row.collectedByVetId && { collectedByVetId: row.collectedByVetId }),
      ...(row.refundedAt && { refundedAt: row.refundedAt.toISOString() }),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async enrichVaccinationsBatch(rows: VaccinationRow[]): Promise<VaccinationBooking[]> {
    if (!rows.length) return [];
    const userIds = [...new Set(rows.map((r) => r.userId))];
    const clinicIds = [...new Set(rows.map((r) => r.clinicId))];
    const [users, clinics] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: userIds } } }),
      this.prisma.clinic.findMany({ where: { id: { in: clinicIds } } }),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const clinicMap = new Map(clinics.map((c) => [c.id, c]));
    return rows.map((row) => {
      const user = userMap.get(row.userId);
      const clinic = clinicMap.get(row.clinicId);
      return {
        id: row.id,
        userId: row.userId,
        clinicId: row.clinicId,
        petId: row.petId,
        petName: row.petName,
        petSpecies: row.petSpecies,
        petBreed: row.petBreed,
        vaccines: ((row.vaccines as VaccineLine[] | null) ?? []),
        notes: row.notes ?? undefined,
        scheduledAt: row.scheduledAt.toISOString(),
        status: row.status as VaccinationBooking['status'],
        paymentStatus: row.paymentStatus as VaccinationBooking['paymentStatus'],
        platformFeePaise: row.platformFeePaise,
        discountPaise: row.discountPaise ?? 0,
        vaccinesSubtotalPaise: row.vaccinesSubtotalPaise,
        totalPaise: row.totalPaise,
        promoCode: row.promoCode ?? undefined,
        paymentMethodLabel: row.paymentMethodLabel ?? undefined,
        stripeCheckoutSessionId: row.stripeCheckoutSessionId ?? undefined,
        userName: user?.name,
        userMobile: user?.mobile,
        clinicName: clinic?.name,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  private async enrichVaccination(row: VaccinationRow): Promise<VaccinationBooking> {
    const [batch] = await this.enrichVaccinationsBatch([row]);
    return batch!;
  }
}
