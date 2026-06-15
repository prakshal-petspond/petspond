import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { ConsultationBookingDocument } from '@/bookings/consultation-booking.schema';
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
    @InjectModel(ConsultationBookingDocument.name)
    private readonly consultationModel: Model<ConsultationBookingDocument>,
    private readonly bookingsService: BookingsService,
    private readonly vetsService: VetsService,
  ) {}

  private assertClinic(vet: Vet): string {
    if (!vet.clinicId || vet.approvalStatus !== 'approved') {
      throw new ForbiddenException('Clinic access required');
    }
    return vet.clinicId;
  }

  private async getClinicBooking(vet: Vet, bookingId: string): Promise<ConsultationBookingDocument> {
    const clinicId = this.assertClinic(vet);
    const doc = await this.consultationModel.findById(bookingId).exec();
    if (!doc || doc.clinicId !== clinicId) throw new NotFoundException('Booking not found');
    return doc;
  }

  private async todayBookings(clinicId: string): Promise<ConsultationBookingDocument[]> {
    const start = startOfLocalDay();
    const end = endOfLocalDay();
    return this.consultationModel
      .find({
        clinicId,
        scheduledAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled'] },
      })
      .sort({ scheduledAt: 1 })
      .exec();
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

    return {
      expectedArrivals: await Promise.all(
        expectedArrivals.map((d) => this.bookingsService.enrichConsultationPublic(d)),
      ),
      summary: {
        bookedToday: docs.length,
        waitingToCheckIn: expectedArrivals.length,
        arrived: arrived.length,
        inWaitingRoom: inWaitingRoom.length,
        noShow: noShow.length,
      },
      recentlyCheckedIn: await Promise.all(
        recentlyCheckedIn.map((d) => this.bookingsService.enrichConsultationPublic(d)),
      ),
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
    doc.queueStatus = 'waiting';
    doc.checkedInAt = new Date();
    if (doc.status === 'pending_payment') {
      doc.status = 'scheduled';
    }
    if (!doc.invoiceNumber) {
      doc.invoiceNumber = this.nextInvoiceNumber(doc.clinicId);
    }
    await doc.save();
    return this.bookingsService.enrichConsultationPublic(doc);
  }

  async createWalkIn(vet: Vet, dto: CreateWalkInDto): Promise<ConsultationBooking> {
    const clinicId = this.assertClinic(vet);
    let vetId = dto.vetId ?? vet.id;
    const assigned = await this.vetsService.findById(vetId);
    if (!assigned || assigned.clinicId !== clinicId) {
      vetId = vet.id;
    }

    const totalPaise = dto.totalPaise ?? 0;
    const doc = await this.consultationModel.create({
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
    });
    return this.bookingsService.enrichConsultationPublic(doc);
  }

  async search(vet: Vet, query: string): Promise<ConsultationBooking[]> {
    const clinicId = this.assertClinic(vet);
    const q = query.trim();
    if (!q) return [];

    const start = startOfLocalDay();
    const end = endOfLocalDay();
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const digits = q.replace(/\D/g, '').slice(-10);

    const docs = await this.consultationModel
      .find({
        clinicId,
        scheduledAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled'] },
        $or: [
          { petName: regex },
          { ownerNameSnapshot: regex },
          { petBreed: regex },
          ...(digits.length >= 4 ? [{ ownerMobileSnapshot: { $regex: digits } }] : []),
          ...(q.startsWith('INV') ? [{ invoiceNumber: regex }] : []),
        ],
      })
      .sort({ scheduledAt: 1 })
      .limit(20)
      .exec();

    return Promise.all(docs.map((d) => this.bookingsService.enrichConsultationPublic(d)));
  }

  async getQueue(vet: Vet): Promise<QueueBoardResponse> {
    const clinicId = this.assertClinic(vet);
    const start = startOfLocalDay();
    const docs = await this.consultationModel
      .find({
        clinicId,
        queueStatus: { $in: ['waiting', 'in_consultation', 'ready_checkout'] },
        $or: [
          { scheduledAt: { $gte: start } },
          { checkedInAt: { $gte: start } },
        ],
      })
      .sort({ checkedInAt: 1, scheduledAt: 1 })
      .exec();

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

    return {
      waiting: await Promise.all(waiting.map((d) => this.bookingsService.enrichConsultationPublic(d))),
      inConsultation: await Promise.all(
        inConsultation.map((d) => this.bookingsService.enrichConsultationPublic(d)),
      ),
      readyCheckout: await Promise.all(
        readyCheckout.map((d) => this.bookingsService.enrichConsultationPublic(d)),
      ),
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

    if (queueStatus === 'waiting' && doc.queueStatus !== 'expected') {
      throw new BadRequestException('Invalid queue transition');
    }
    if (queueStatus === 'in_consultation') {
      if (doc.queueStatus !== 'waiting') {
        throw new BadRequestException('Pet must be waiting before consultation');
      }
      doc.consultationStartedAt = now;
      if (vetId) {
        const assigned = await this.vetsService.findById(vetId);
        if (assigned?.clinicId === doc.clinicId) doc.vetId = vetId;
      }
      if (roomLabel) doc.roomLabel = roomLabel;
    }
    if (queueStatus === 'ready_checkout') {
      if (doc.queueStatus !== 'in_consultation') {
        throw new BadRequestException('Pet must be in consultation first');
      }
      doc.checkoutReadyAt = now;
      doc.status = 'completed';
    }

    doc.queueStatus = queueStatus;
    await doc.save();
    return this.bookingsService.enrichConsultationPublic(doc);
  }

  async getPayments(
    vet: Vet,
    filter: 'all' | 'pending' | 'paid' | 'refunded' = 'all',
  ): Promise<PaymentsBoardResponse> {
    const clinicId = this.assertClinic(vet);
    const start = startOfLocalDay();
    const end = endOfLocalDay();

    const docs = await this.consultationModel
      .find({
        clinicId,
        scheduledAt: { $gte: start, $lte: end },
        status: { $nin: ['cancelled'] },
      })
      .sort({ scheduledAt: -1 })
      .exec();

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
      invoices: await Promise.all(invoices.map((d) => this.bookingsService.enrichConsultationPublic(d))),
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
    doc.paymentStatus = 'paid';
    doc.collectedAt = new Date();
    doc.collectedByVetId = vet.id;
    if (dto.paymentMethodLabel) doc.paymentMethodLabel = dto.paymentMethodLabel;
    if (!doc.invoiceNumber) doc.invoiceNumber = this.nextInvoiceNumber(doc.clinicId);
    if (doc.queueStatus === 'ready_checkout') {
      // stay on ready_checkout until manually cleared or end of day
    }
    await doc.save();
    return this.bookingsService.enrichConsultationPublic(doc);
  }

  async markNoShow(vet: Vet, bookingId: string): Promise<ConsultationBooking> {
    const doc = await this.getClinicBooking(vet, bookingId);
    doc.status = 'no_show';
    doc.queueStatus = 'expected';
    await doc.save();
    return this.bookingsService.enrichConsultationPublic(doc);
  }
}
