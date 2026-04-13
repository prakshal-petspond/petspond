import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  ConsultationBooking,
  CreateConsultationBookingDto,
  CreateVaccinationBookingDto,
  VaccinationBooking,
  Vet,
} from '@petspond/types';
import { ConsultationBookingDocument } from './consultation-booking.schema';
import { VaccinationBookingDocument } from './vaccination-booking.schema';
import { PetsService } from '@/pets/pets.service';
import { ClinicsService } from '@/clinics/clinics.service';
import { VetsService } from '@/vets/vets.service';
import { UsersService } from '@/users/users.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(ConsultationBookingDocument.name)
    private readonly consultationModel: Model<ConsultationBookingDocument>,
    @InjectModel(VaccinationBookingDocument.name)
    private readonly vaccinationModel: Model<VaccinationBookingDocument>,
    private readonly petsService: PetsService,
    private readonly clinicsService: ClinicsService,
    private readonly vetsService: VetsService,
    private readonly usersService: UsersService,
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

    const doc = await this.consultationModel.create({
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
    });

    return this.enrichConsultation(doc);
  }

  async confirmConsultationPayment(
    userId: string,
    bookingId: string,
    stripeSessionId?: string,
  ): Promise<ConsultationBooking> {
    const doc = await this.consultationModel.findById(bookingId).exec();
    if (!doc || doc.userId !== userId) throw new NotFoundException('Booking not found');
    doc.paymentStatus = 'paid';
    doc.status = 'scheduled';
    if (stripeSessionId) doc.stripeCheckoutSessionId = stripeSessionId;
    await doc.save();
    return this.enrichConsultation(doc);
  }

  async listConsultationsForUser(userId: string): Promise<ConsultationBooking[]> {
    const docs = await this.consultationModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return Promise.all(docs.map((d) => this.enrichConsultation(d)));
  }

  async listConsultationsForVet(vet: Vet): Promise<ConsultationBooking[]> {
    if (!vet.clinicId) return [];
    this.assertVetClinic(vet, vet.clinicId);
    const docs = await this.consultationModel
      .find({ clinicId: vet.clinicId })
      .sort({ scheduledAt: 1 })
      .exec();
    return Promise.all(docs.map((d) => this.enrichConsultation(d)));
  }

  async updateConsultationStatus(
    vet: Vet,
    bookingId: string,
    status: ConsultationBooking['status'],
  ): Promise<ConsultationBooking> {
    if (!vet.clinicId) throw new ForbiddenException('No clinic');
    this.assertVetClinic(vet, vet.clinicId);
    const doc = await this.consultationModel.findById(bookingId).exec();
    if (!doc || doc.clinicId !== vet.clinicId) throw new NotFoundException('Booking not found');
    doc.status = status;
    await doc.save();
    return this.enrichConsultation(doc);
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

    const doc = await this.vaccinationModel.create({
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
    });

    return this.enrichVaccination(doc);
  }

  async confirmVaccinationPayment(
    userId: string,
    bookingId: string,
    stripeSessionId?: string,
  ): Promise<VaccinationBooking> {
    const doc = await this.vaccinationModel.findById(bookingId).exec();
    if (!doc || doc.userId !== userId) throw new NotFoundException('Booking not found');
    doc.paymentStatus = 'paid';
    doc.status = 'scheduled';
    if (stripeSessionId) doc.stripeCheckoutSessionId = stripeSessionId;
    await doc.save();
    return this.enrichVaccination(doc);
  }

  async listVaccinationsForUser(userId: string): Promise<VaccinationBooking[]> {
    const docs = await this.vaccinationModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return Promise.all(docs.map((d) => this.enrichVaccination(d)));
  }

  async listVaccinationsForVet(vet: Vet): Promise<VaccinationBooking[]> {
    if (!vet.clinicId) return [];
    this.assertVetClinic(vet, vet.clinicId);
    const docs = await this.vaccinationModel
      .find({ clinicId: vet.clinicId })
      .sort({ scheduledAt: 1 })
      .exec();
    return Promise.all(docs.map((d) => this.enrichVaccination(d)));
  }

  async updateVaccinationStatus(
    vet: Vet,
    bookingId: string,
    status: VaccinationBooking['status'],
  ): Promise<VaccinationBooking> {
    if (!vet.clinicId) throw new ForbiddenException('No clinic');
    this.assertVetClinic(vet, vet.clinicId);
    const doc = await this.vaccinationModel.findById(bookingId).exec();
    if (!doc || doc.clinicId !== vet.clinicId) throw new NotFoundException('Booking not found');
    doc.status = status;
    await doc.save();
    return this.enrichVaccination(doc);
  }

  private async enrichConsultation(doc: ConsultationBookingDocument): Promise<ConsultationBooking> {
    const [user, clinic, v] = await Promise.all([
      this.usersService.findById(doc.userId),
      this.clinicsService.findById(doc.clinicId),
      this.vetsService.findById(doc.vetId),
    ]);
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      clinicId: doc.clinicId,
      vetId: doc.vetId,
      petId: doc.petId,
      petName: doc.petName,
      petSpecies: doc.petSpecies,
      petBreed: doc.petBreed,
      petWeightLabel: doc.petWeightLabel,
      reasonIds: doc.reasonIds ?? [],
      notes: doc.notes,
      scheduledAt: doc.scheduledAt.toISOString(),
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      consultationFeePaise: doc.consultationFeePaise,
      platformFeePaise: doc.platformFeePaise,
      discountPaise: doc.discountPaise ?? 0,
      totalPaise: doc.totalPaise,
      promoCode: doc.promoCode,
      paymentMethodLabel: doc.paymentMethodLabel,
      stripeCheckoutSessionId: doc.stripeCheckoutSessionId,
      userName: user?.name,
      userMobile: user?.mobile,
      clinicName: clinic?.name,
      vetName: v?.fullName,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private async enrichVaccination(doc: VaccinationBookingDocument): Promise<VaccinationBooking> {
    const [user, clinic] = await Promise.all([
      this.usersService.findById(doc.userId),
      this.clinicsService.findById(doc.clinicId),
    ]);
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      clinicId: doc.clinicId,
      petId: doc.petId,
      petName: doc.petName,
      petSpecies: doc.petSpecies,
      petBreed: doc.petBreed,
      vaccines: doc.vaccines ?? [],
      notes: doc.notes,
      scheduledAt: doc.scheduledAt.toISOString(),
      status: doc.status,
      paymentStatus: doc.paymentStatus,
      platformFeePaise: doc.platformFeePaise,
      discountPaise: doc.discountPaise ?? 0,
      vaccinesSubtotalPaise: doc.vaccinesSubtotalPaise,
      totalPaise: doc.totalPaise,
      promoCode: doc.promoCode,
      paymentMethodLabel: doc.paymentMethodLabel,
      stripeCheckoutSessionId: doc.stripeCheckoutSessionId,
      userName: user?.name,
      userMobile: user?.mobile,
      clinicName: clinic?.name,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
