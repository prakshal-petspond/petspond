import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ConsultationBooking as ConsultationRow, Prisma } from '@prisma/client';
import type {
  CheckInBoardResponse,
  CollectPaymentDto,
  ConsultationBooking,
  ConsultationQueueStatus,
  CreateWalkInDto,
  PaymentsBoardResponse,
  QueueBoardResponse,
  Vet,
} from '@petspond/types';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingsService } from '@/bookings/bookings.service';
import { VetsService } from '@/vets/vets.service';

function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

@Injectable()
export class FrontDeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly vetsService: VetsService,
  ) {}

  private assertClinic(vet: Vet): string {
    if (!vet.clinicId || vet.approvalStatus !== 'approved') {
      throw new ForbiddenException('Clinic access required');
    }
    return vet.clinicId;
  }

  private async getClinicBooking(vet: Vet, bookingId: string): Promise<ConsultationRow> {
    const clinicId = this.assertClinic(vet);
    const row = await this.prisma.consultationBooking.findUnique({ where: { id: bookingId } });
    if (!row || row.clinicId !== clinicId) throw new NotFoundException('Booking not found');
    return row;
  }

  private async todayBookings(clinicId: string): Promise<ConsultationRow[]> {
    const start = startOfLocalDay();
    const end = endOfLocalDay();
    return this.prisma.consultationBooking.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: start, lte: end },
        status: { not: 'cancelled' },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  private nextInvoiceNumber(clinicId: string): string {
    const suffix = Date.now().toString().slice(-4);
    return `INV-${clinicId.slice(-4).toUpperCase()}-${suffix}`;
  }

  async getCheckInBoard(vet: Vet): Promise<CheckInBoardResponse> {
    const clinicId = this.assertClinic(vet);
    const docs = await this.todayBookings(clinicId);

    const expectedArrivals = docs.filter(
      (d) =>
        d.queueStatus === 'expected' &&
        (d.status === 'scheduled' || d.status === 'pending_payment'),
    );

    const arrived = docs.filter((d) => d.checkedInAt != null);
    const inWaitingRoom = docs.filter((d) => d.queueStatus === 'waiting');
    const noShow = docs.filter((d) => d.status === 'no_show');

    const recentlyCheckedIn = [...arrived]
      .sort((a, b) => (b.checkedInAt?.getTime() ?? 0) - (a.checkedInAt?.getTime() ?? 0))
      .slice(0, 8);

    const [expectedArrivalsEnriched, recentlyCheckedInEnriched] = await Promise.all([
      this.bookingsService.enrichConsultationsBatch(expectedArrivals),
      this.bookingsService.enrichConsultationsBatch(recentlyCheckedIn),
    ]);

    return {
      expectedArrivals: expectedArrivalsEnriched,
      summary: {
        bookedToday: docs.length,
        waitingToCheckIn: expectedArrivals.length,
        arrived: arrived.length,
        inWaitingRoom: inWaitingRoom.length,
        noShow: noShow.length,
      },
      recentlyCheckedIn: recentlyCheckedInEnriched,
    };
  }

  async checkIn(vet: Vet, bookingId: string): Promise<ConsultationBooking> {
    const doc = await this.getClinicBooking(vet, bookingId);
    if (doc.status === 'cancelled' || doc.status === 'no_show') {
      throw new BadRequestException('Cannot check in a cancelled or no-show booking');
    }
    if (doc.queueStatus !== 'expected') {
      throw new BadRequestException('Already checked in');
    }
    const row = await this.prisma.consultationBooking.update({
      where: { id: doc.id },
      data: {
        queueStatus: 'waiting',
        checkedInAt: new Date(),
        ...(doc.status === 'pending_payment' && { status: 'scheduled' }),
        ...(!doc.invoiceNumber && { invoiceNumber: this.nextInvoiceNumber(doc.clinicId) }),
      },
    });
    return this.bookingsService.enrichConsultationPublic(row);
  }

  async createWalkIn(vet: Vet, dto: CreateWalkInDto): Promise<ConsultationBooking> {
    const clinicId = this.assertClinic(vet);
    let vetId = dto.vetId ?? vet.id;
    const assigned = await this.vetsService.findById(vetId);
    if (!assigned || assigned.clinicId !== clinicId) {
      vetId = vet.id;
    }

    const totalPaise = dto.totalPaise ?? 0;
    const row = await this.prisma.consultationBooking.create({
      data: {
        clinicId,
        vetId,
        petName: dto.petName.trim(),
        petSpecies: dto.petSpecies?.trim() || 'dog',
        petBreed: dto.petBreed?.trim() || 'Unknown',
        ownerNameSnapshot: dto.ownerName.trim(),
        ownerMobileSnapshot: dto.ownerMobile?.replace(/\D/g, '').slice(-10),
        reasonIds: dto.reasonIds ?? ['walk-in'],
        notes: dto.notes,
        scheduledAt: new Date(),
        status: 'scheduled',
        paymentStatus: totalPaise > 0 ? 'pending' : 'paid',
        consultationFeePaise: totalPaise,
        platformFeePaise: 0,
        discountPaise: 0,
        totalPaise,
        isWalkIn: true,
        queueStatus: 'waiting',
        checkedInAt: new Date(),
        invoiceNumber: this.nextInvoiceNumber(clinicId),
      },
    });
    return this.bookingsService.enrichConsultationPublic(row);
  }

  async search(vet: Vet, query: string): Promise<ConsultationBooking[]> {
    const clinicId = this.assertClinic(vet);
    const q = query.trim();
    if (!q) return [];

    const start = startOfLocalDay();
    const end = endOfLocalDay();
    const digits = q.replace(/\D/g, '').slice(-10);

    const or: Prisma.ConsultationBookingWhereInput[] = [
      { petName: { contains: q, mode: 'insensitive' } },
      { ownerNameSnapshot: { contains: q, mode: 'insensitive' } },
      { petBreed: { contains: q, mode: 'insensitive' } },
    ];
    if (digits.length >= 4) {
      or.push({ ownerMobileSnapshot: { contains: digits } });
    }
    if (q.toUpperCase().startsWith('INV')) {
      or.push({ invoiceNumber: { contains: q, mode: 'insensitive' } });
    }

    const rows = await this.prisma.consultationBooking.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: start, lte: end },
        status: { not: 'cancelled' },
        OR: or,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });

    return this.bookingsService.enrichConsultationsBatch(rows);
  }

  async getQueue(vet: Vet): Promise<QueueBoardResponse> {
    const clinicId = this.assertClinic(vet);
    const start = startOfLocalDay();
    const docs = await this.prisma.consultationBooking.findMany({
      where: {
        clinicId,
        queueStatus: { in: ['waiting', 'in_consultation', 'ready_checkout'] },
        OR: [{ scheduledAt: { gte: start } }, { checkedInAt: { gte: start } }],
      },
      orderBy: [{ checkedInAt: 'asc' }, { scheduledAt: 'asc' }],
    });

    const waiting = docs.filter((d) => d.queueStatus === 'waiting');
    const inConsultation = docs.filter((d) => d.queueStatus === 'in_consultation');
    const readyCheckout = docs.filter((d) => d.queueStatus === 'ready_checkout');

    const now = Date.now();
    const waitMinutes = waiting.map((d) =>
      Math.max(0, Math.round((now - (d.checkedInAt?.getTime() ?? now)) / 60000)),
    );
    const avgWaitMinutes =
      waitMinutes.length > 0
        ? Math.round(waitMinutes.reduce((a, b) => a + b, 0) / waitMinutes.length)
        : 0;

    const [waitingE, inConsultationE, readyCheckoutE] = await Promise.all([
      this.bookingsService.enrichConsultationsBatch(waiting),
      this.bookingsService.enrichConsultationsBatch(inConsultation),
      this.bookingsService.enrichConsultationsBatch(readyCheckout),
    ]);

    return {
      waiting: waitingE,
      inConsultation: inConsultationE,
      readyCheckout: readyCheckoutE,
      stats: {
        petsInClinic: waiting.length + inConsultation.length + readyCheckout.length,
        avgWaitMinutes,
      },
    };
  }

  async updateQueueStatus(
    vet: Vet,
    bookingId: string,
    queueStatus: ConsultationQueueStatus,
    roomLabel?: string,
    vetId?: string,
  ): Promise<ConsultationBooking> {
    const doc = await this.getClinicBooking(vet, bookingId);
    const now = new Date();
    const data: Prisma.ConsultationBookingUpdateInput = { queueStatus };

    if (queueStatus === 'waiting' && doc.queueStatus !== 'expected') {
      throw new BadRequestException('Invalid queue transition');
    }
    if (queueStatus === 'in_consultation') {
      if (doc.queueStatus !== 'waiting') {
        throw new BadRequestException('Pet must be waiting before consultation');
      }
      data.consultationStartedAt = now;
      if (vetId) {
        const assigned = await this.vetsService.findById(vetId);
        if (assigned?.clinicId === doc.clinicId) data.vetId = vetId;
      }
      if (roomLabel) data.roomLabel = roomLabel;
    }
    if (queueStatus === 'ready_checkout') {
      if (doc.queueStatus !== 'in_consultation') {
        throw new BadRequestException('Pet must be in consultation first');
      }
      data.checkoutReadyAt = now;
      data.status = 'completed';
    }

    const row = await this.prisma.consultationBooking.update({
      where: { id: doc.id },
      data,
    });
    return this.bookingsService.enrichConsultationPublic(row);
  }

  async getPayments(
    vet: Vet,
    filter: 'all' | 'pending' | 'paid' | 'refunded' = 'all',
  ): Promise<PaymentsBoardResponse> {
    const clinicId = this.assertClinic(vet);
    const start = startOfLocalDay();
    const end = endOfLocalDay();

    const docs = await this.prisma.consultationBooking.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: start, lte: end },
        status: { not: 'cancelled' },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const collected = docs.filter((d) => d.paymentStatus === 'paid');
    const pending = docs.filter((d) => d.paymentStatus === 'pending');
    const refunded = docs.filter((d) => d.paymentStatus === 'refunded');

    const collectedTodayPaise = collected.reduce((s, d) => s + d.totalPaise, 0);
    const pendingPaise = pending.reduce((s, d) => s + d.totalPaise, 0);
    const refundsPaise = refunded.reduce((s, d) => s + d.totalPaise, 0);

    let invoices = docs;
    if (filter === 'pending') invoices = pending;
    else if (filter === 'paid') invoices = collected;
    else if (filter === 'refunded') invoices = refunded;

    return {
      summary: {
        collectedTodayPaise,
        collectedCount: collected.length,
        pendingPaise,
        pendingCount: pending.length,
        refundsPaise,
        refundsCount: refunded.length,
      },
      invoices: await this.bookingsService.enrichConsultationsBatch(invoices),
    };
  }

  async collectPayment(
    vet: Vet,
    bookingId: string,
    dto: CollectPaymentDto,
  ): Promise<ConsultationBooking> {
    const doc = await this.getClinicBooking(vet, bookingId);
    if (doc.paymentStatus === 'paid') {
      throw new BadRequestException('Already paid');
    }
    if (doc.paymentStatus === 'refunded') {
      throw new BadRequestException('Cannot collect on a refunded invoice');
    }
    const row = await this.prisma.consultationBooking.update({
      where: { id: doc.id },
      data: {
        paymentStatus: 'paid',
        collectedAt: new Date(),
        collectedByVetId: vet.id,
        ...(dto.paymentMethodLabel && { paymentMethodLabel: dto.paymentMethodLabel }),
        ...(!doc.invoiceNumber && { invoiceNumber: this.nextInvoiceNumber(doc.clinicId) }),
      },
    });
    return this.bookingsService.enrichConsultationPublic(row);
  }

  async markNoShow(vet: Vet, bookingId: string): Promise<ConsultationBooking> {
    const doc = await this.getClinicBooking(vet, bookingId);
    const row = await this.prisma.consultationBooking.update({
      where: { id: doc.id },
      data: { status: 'no_show', queueStatus: 'expected' },
    });
    return this.bookingsService.enrichConsultationPublic(row);
  }
}
